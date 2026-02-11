
import logging
from sqlalchemy.orm import Session
from linebot import LineBotApi
from linebot.models import TextSendMessage
from backend.core.config import settings
from backend.models import Profile, DeadlineEvent, Document, Project
from datetime import datetime, timezone

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class LineBotService:
    def __init__(self):
        if settings.LINE_CHANNEL_ACCESS_TOKEN:
            print("LINE_CHANNEL_ACCESS_TOKEN found (masked)")
            self.line_bot_api = LineBotApi(settings.LINE_CHANNEL_ACCESS_TOKEN)
        else:
            print("WARNING: LINE_CHANNEL_ACCESS_TOKEN not set!")
            self.line_bot_api = None

    def handle_follow(self, db: Session, event):
        """
        Handle Follow Event (User adds bot as friend).
        Check if user exists in DB. If not, ask to bind email.
        """
        print(f"Handling Follow Event for user: {event.source.user_id}")
        line_user_id = event.source.user_id
        profile = db.query(Profile).filter(Profile.line_user_id == line_user_id).first()
        
        reply_text = ""
        if profile:
            reply_text = f"歡迎回來，{profile.full_name}！您的帳號已綁定。"
        else:
            reply_text = "歡迎使用 Smart Doc Tracker！\n請回覆您的 Email 以綁定系統帳號。\n(例如: user@example.com)"
            
        self.reply_message(event.reply_token, reply_text)

    def handle_message(self, db: Session, event):
        """
        Handle Text Message.
        Mainly for Account Binding via Email.
        """
        text = event.message.text.strip()
        line_user_id = event.source.user_id
        print(f"Handling Message Event from {line_user_id}: {text}")
        
        # Check if already bound
        profile = db.query(Profile).filter(Profile.line_user_id == line_user_id).first()
        
        if profile:
            print(f"User already bound: {profile.email}")
            # Already bound -> Echo or simple command
            if text.lower() == "status":
                self.reply_message(event.reply_token, f"目前綁定帳號: {profile.email}")
            else:
                self.reply_message(event.reply_token, "您可以輸入 'status' 查看帳號狀態。")
            return

        # Not bound -> Try verification code first (6 digits)
        if text.isdigit() and len(text) == 6:
            print(f"Attempting verification code binding: {text}")
            # Find profile with matching verification code
            user_profile = db.query(Profile)\
                .filter(Profile.line_verification_code == text)\
                .filter(Profile.line_user_id == None)\
                .first()

            if user_profile:
                # Check if code is expired
                if user_profile.line_verification_expires_at and \
                   user_profile.line_verification_expires_at > datetime.now(timezone.utc):
                    # Valid code - bind account
                    user_profile.line_user_id = line_user_id
                    user_profile.line_verification_code = None  # Clear used code
                    user_profile.line_verification_expires_at = None
                    db.commit()
                    db.refresh(user_profile)
                    logger.info(f"Bound Line User {line_user_id} to {user_profile.email} via verification code")
                    print(f"Verification code binding successful for {user_profile.email}")
                    self.reply_message(
                        event.reply_token,
                        f"✅ 綁定成功！\n你好，{user_profile.full_name or user_profile.email}。\n您現在可以接收專案通知了。"
                    )
                    return
                else:
                    print(f"Verification code expired for code: {text}")
                    self.reply_message(event.reply_token, "❌ 驗證碼已過期，請重新產生新的驗證碼。")
                    return
            else:
                print(f"Invalid verification code: {text}")
                self.reply_message(event.reply_token, "❌ 無效的驗證碼，請確認您輸入的驗證碼正確。")
                return

        # Legacy: Email-based binding (deprecated for security)
        if "@" in text and "." in text:
            print(f"User attempted legacy email binding: {text}")
            self.reply_message(
                event.reply_token,
                "⚠️ 請使用安全的驗證碼綁定方式：\n" +
                "1. 登入網頁系統\n" +
                "2. 前往設定頁面\n" +
                "3. 產生 Line 綁定驗證碼\n" +
                "4. 在此輸入 6 位數驗證碼"
            )
            return

        # Unknown format
        print(f"Unknown message format: {text}")
        self.reply_message(
            event.reply_token,
            "請輸入 6 位數驗證碼來綁定帳號。\n\n" +
            "如何取得驗證碼：\n" +
            "1. 登入網頁系統\n" +
            "2. 前往設定頁面\n" +
            "3. 點擊「產生 Line 綁定驗證碼」\n" +
            "4. 輸入顯示的 6 位數驗證碼"
        )

    def handle_postback(self, db: Session, event):
        """
        Handle Postback Event (Button clicks).
        Format: action=complete&task_id=UUID
        """
        line_user_id = event.source.user_id
        data = event.postback.data

        try:
            params = dict(item.split("=") for item in data.split("&"))
        except ValueError:
            self.reply_message(event.reply_token, "無效的操作")
            return

        action = params.get("action")
        task_id = params.get("task_id")

        if action == "complete" and task_id:
            # Verify user ownership before marking complete
            task = db.query(DeadlineEvent).filter(DeadlineEvent.id == task_id).first()
            if not task:
                self.reply_message(event.reply_token, "找不到該任務，可能已被刪除。")
                return

            # Get the document and project to verify ownership
            document = db.query(Document).filter(Document.id == task.document_id).first()
            if not document:
                self.reply_message(event.reply_token, "找不到相關文件。")
                return

            project = db.query(Project).filter(Project.id == document.project_id).first()
            if not project:
                self.reply_message(event.reply_token, "找不到相關專案。")
                return

            # Verify that the Line user is the project owner
            profile = db.query(Profile).filter(Profile.line_user_id == line_user_id).first()
            if not profile or profile.id != project.owner_id:
                self.reply_message(event.reply_token, "⚠️ 您沒有權限操作此任務。")
                return

            # All checks passed - mark as complete
            task.status = "completed"
            db.commit()
            self.reply_message(event.reply_token, f"✅ 任務「{task.title}」已標記為完成！")
    
    def reply_message(self, reply_token, text):
        if self.line_bot_api:
            try:
                self.line_bot_api.reply_message(reply_token, TextSendMessage(text=text))
            except Exception as e:
                logger.error(f"Error replying message: {e}")
