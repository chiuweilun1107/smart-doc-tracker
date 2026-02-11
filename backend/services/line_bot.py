
import logging
from sqlalchemy.orm import Session
from linebot import LineBotApi
from linebot.models import TextSendMessage
from backend.core.config import settings
from backend.models import Profile, DeadlineEvent, Document, Project

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

        # Not bound -> Try to bind email
        # Simple email validation
        if "@" in text and "." in text:
            print(f"Attempting to bind email: {text}")
            # Find profile by email
            user_profile = db.query(Profile).filter(Profile.email == text).first()
            if user_profile:
                # Bind it!
                user_profile.line_user_id = line_user_id
                db.commit()
                db.refresh(user_profile)
                logger.info(f"Bound Line User {line_user_id} to Email {text}")
                print(f"Binding successful for {text}")
                self.reply_message(event.reply_token, f"綁定成功！\n你好，{user_profile.full_name or text}。\n您現在可以接收專案通知了。")
            else:
                print(f"Email not found in DB: {text}")
                self.reply_message(event.reply_token, "找不到此 Email 的帳號，請確認您已註冊系統。\n(請輸入完整 Email)")
        else:
            print(f"Invalid email format: {text}")
            self.reply_message(event.reply_token, "請輸入有效的 Email 以進行帳號綁定。")

    def handle_postback(self, db: Session, event):
        """
        Handle Postback Event (Button clicks).
        Format: action=complete&task_id=UUID
        """
        data = event.postback.data
        params = dict(item.split("=") for item in data.split("&"))
        
        action = params.get("action")
        task_id = params.get("task_id")
        
        if action == "complete" and task_id:
            # Mark task as completed
            task = db.query(DeadlineEvent).filter(DeadlineEvent.id == task_id).first()
            if task:
                task.status = "completed"
                db.commit()
                self.reply_message(event.reply_token, f"✅ 任務「{task.title}」已標記為完成！")
            else:
                self.reply_message(event.reply_token, "找不到該任務，可能已被刪除。")
    
    def reply_message(self, reply_token, text):
        if self.line_bot_api:
            try:
                self.line_bot_api.reply_message(reply_token, TextSendMessage(text=text))
            except Exception as e:
                logger.error(f"Error replying message: {e}")
