
import logging
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import create_engine
from backend.core.config import settings
from backend.models import DeadlineEvent, Project, Profile, Document, NotificationLog
from backend.core.database import SessionLocal
import uuid

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

        # Get event owner (Event -> Doc -> Project -> Owner)
        doc = db.query(Document).filter(Document.id == event.document_id).first()
        if not doc:
            return

        project = db.query(Project).filter(Project.id == doc.project_id).first()
        if not project:
            return

        owner_id = project.owner_id

        # Get owner's notification rules
        try:
            from backend.models import NotificationRule
            rules = db.query(NotificationRule)\
                .filter(NotificationRule.is_active == True)\
                .filter(NotificationRule.user_id == owner_id)\
                .all()
        except Exception as e:
            logger.error(f"Failed to fetch notification rules: {e}")
            rules = []

        notification_type = None

        # Check if delta matches any rule
        for rule in rules:
            if delta == rule.days_before:
                notification_type = rule.severity.upper() # INFO, WARNING, CRITICAL
                # Map standard types for clarity if needed, or just use severity
                if rule.days_before == 7: notification_type = "WEEK_AHEAD"
                elif rule.days_before == 3: notification_type = "3_DAYS_LEFT"
                elif rule.days_before == 1: notification_type = "TOMORROW"
                elif rule.days_before == 0: notification_type = "TODAY"

                break # Match found

        if delta < 0 and delta >= -3: # simple overdue logic
             notification_type = "OVERDUE"

        if notification_type:
            self.send_notification(db, event, notification_type, delta)

    def create_deadline_flex_message(self, project_name, task_title, due_date, days_left, event_id):
        from linebot.models import (
            FlexSendMessage, BubbleContainer, BoxComponent, TextComponent, 
            ButtonComponent, PostbackAction, SeparatorComponent
        )

        # Color logic based on urgency
        header_color = "#00B900" # Green (Default)
        if days_left <= 1:
            header_color = "#FF3333" # Red (Critical)
        elif days_left <= 3:
            header_color = "#FF9900" # Orange (Warning)

        bubble = BubbleContainer(
            header=BoxComponent(
                layout='vertical',
                background_color=header_color,
                contents=[
                    TextComponent(text="Task Deadline", weight='bold', color='#FFFFFF', size='sm')
                ]
            ),
            body=BoxComponent(
                layout='vertical',
                contents=[
                    TextComponent(text=task_title, weight='bold', size='xl'),
                    TextComponent(text=f"Project: {project_name}", size='sm', color='#666666', margin='md'),
                    SeparatorComponent(margin='md'),
                    BoxComponent(
                        layout='horizontal',
                        margin='md',
                        contents=[
                            TextComponent(text="Due Date", size='sm', color='#aaaaaa', flex=1),
                            TextComponent(text=due_date, size='sm', color='#666666', flex=2, align='end')
                        ]
                    ),
                    BoxComponent(
                        layout='horizontal',
                        margin='xs',
                        contents=[
                            TextComponent(text="Days Left", size='sm', color='#aaaaaa', flex=1),
                            TextComponent(text=str(days_left), size='sm', color=header_color, flex=2, align='end', weight='bold')
                        ]
                    )
                ]
            ),
            footer=BoxComponent(
                layout='vertical',
                contents=[
                    ButtonComponent(
                        style='primary',
                        height='sm',
                        action=PostbackAction(
                            label='Mark as Completed',
                            data=f"action=complete&task_id={event_id}",
                            display_text="Marking task as completed..."
                        )
                    )
                ]
            )
        )
        return FlexSendMessage(alt_text=f"Task Due: {task_title}", contents=bubble)

    def send_notification(self, db: Session, event: DeadlineEvent, type: str, days_left: int):
        # Get Owner info
        # Event -> Doc -> Project -> Owner
        doc = db.query(Document).filter(Document.id == event.document_id).first()
        if not doc: return

        project = db.query(Project).filter(Project.id == doc.project_id).first()
        if not project: return

        owner = db.query(Profile).filter(Profile.id == project.owner_id).first()
        if not owner: return

        logger.info(f"Sending notification to {owner.email} (Line: {owner.line_user_id}) for Task: {event.title}")

        message_content = f"Task: {event.title}\nProject: {project.name}\nDue: {event.due_date}\nDays Left: {days_left}"

        if owner.line_user_id and settings.LINE_CHANNEL_ACCESS_TOKEN:
            try:
                from linebot import LineBotApi

                line_bot_api = LineBotApi(settings.LINE_CHANNEL_ACCESS_TOKEN)

                # Create Flex Message
                flex_message = self.create_deadline_flex_message(
                    project_name=project.name,
                    task_title=event.title,
                    due_date=event.due_date,
                    days_left=days_left,
                    event_id=str(event.id)
                )

                line_bot_api.push_message(owner.line_user_id, flex_message)
                logger.info("Line Flex Message notification sent successfully")

                # Log successful send
                self._log_notification(
                    db=db,
                    user_id=owner.id,
                    event_id=event.id,
                    notification_type="line",
                    status="sent",
                    message=message_content
                )
            except Exception as e:
                logger.error(f"Failed to send Line notification: {e}")

                # Log failed send
                self._log_notification(
                    db=db,
                    user_id=owner.id,
                    event_id=event.id,
                    notification_type="line",
                    status="failed",
                    message=message_content,
                    error_message=str(e)
                )

    def _log_notification(self, db: Session, user_id, event_id, notification_type: str,
                         status: str, message: str, error_message: str = None):
        """Create a notification log entry."""
        try:
            log = NotificationLog(
                id=uuid.uuid4(),
                user_id=user_id,
                event_id=event_id,
                notification_type=notification_type,
                status=status,
                message=message,
                error_message=error_message
            )
            db.add(log)
            db.commit()
        except Exception as e:
            logger.error(f"Failed to log notification: {e}")
            db.rollback()

