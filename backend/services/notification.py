
import logging
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import create_engine
from backend.core.config import settings
from backend.models import DeadlineEvent, Project, Profile, Document
from backend.core.database import SessionLocal

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class NotificationService:
    def __init__(self):
        # We will integrate Line Bot API later in Task-BE-007
        # For now, we mock the sending part or just log it.
        pass

    def check_deadlines(self):
        """
        Check for upcoming deadlines and send notifications.
        Rules:
        - T-7 days (Warning)
        - T-3 days (Urgent)
        - T-1 day (Critical)
        - T-0 day (Due Today)
        - T < 0 (Overdue - Daily Reminder?) -> Let's limit to T-1, -3, -7
        """
        logger.info(f"Starting deadline check at {datetime.now()}")
        
        db = SessionLocal()
        try:
            # Fetch pending events
            # We need to join with Document -> Project -> Profile to get owner's Line ID
            events = db.query(DeadlineEvent).filter(DeadlineEvent.status != "completed").all()
            
            for event in events:
                try:
                    self.process_event(db, event)
                except Exception as e:
                    logger.error(f"Error processing event {event.id}: {e}")
                    
        except Exception as e:
            logger.error(f"Scheduler failed: {e}")
        finally:
            db.close()
            
    def process_event(self, db: Session, event: DeadlineEvent):
        if not event.due_date:
            return

        try:
            due_date = datetime.strptime(event.due_date, "%Y-%m-%d").date()
        except ValueError:
            logger.warning(f"Invalid date format for event {event.id}: {event.due_date}")
            return
            
        today = datetime.now().date()
        delta = (due_date - today).days
        
        notification_type = None
        
        if delta == 7:
            notification_type = "WEEK_AHEAD"
        elif delta == 3:
            notification_type = "3_DAYS_LEFT"
        elif delta == 1:
            notification_type = "TOMORROW"
        elif delta == 0:
            notification_type = "TODAY"
        elif delta < 0 :
            notification_type = "OVERDUE"
            
        if notification_type:
            self.send_notification(db, event, notification_type, delta)

    def send_notification(self, db: Session, event: DeadlineEvent, type: str, days_left: int):
        # Get Owner info
        # Event -> Doc -> Project -> Owner
        doc = db.query(Document).filter(Document.id == event.document_id).first()
        if not doc: return
        
        project = db.query(Project).filter(Project.id == doc.project_id).first()
        if not project: return
        
        owner = db.query(Profile).filter(Profile.id == project.owner_id).first()
        if not owner: return
        
        message_text = f"[{type}] Project: {project.name}\nTask: {event.title}\nDue: {event.due_date} ({days_left} days left)"
        
        logger.info(f"Sending notification to {owner.email} (Line: {owner.line_user_id}): {message_text}")
        
        if owner.line_user_id and settings.LINE_CHANNEL_ACCESS_TOKEN:
            try:
                from linebot import LineBotApi
                from linebot.models import TextSendMessage
                
                line_bot_api = LineBotApi(settings.LINE_CHANNEL_ACCESS_TOKEN)
                line_bot_api.push_message(owner.line_user_id, TextSendMessage(text=message_text))
                logger.info("Line notification sent successfully")
            except Exception as e:
                logger.error(f"Failed to send Line notification: {e}")

