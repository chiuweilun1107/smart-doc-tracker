
import logging
from datetime import datetime
from sqlalchemy.orm import Session
from backend.core.config import settings
from backend.models import (
    DeadlineEvent, Project, Profile, Document,
    NotificationLog, NotificationRule, ProjectMember,
)
from backend.core.database import SessionLocal
from backend.services.email import EmailService
import uuid

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class NotificationService:
    def __init__(self):
        self.email_service = EmailService()

    def check_deadlines(self):
        """
        Check all pending deadline events and notify relevant users.
        Notifies project owner + all accepted members.
        Overdue events are notified daily until completed.
        """
        logger.info(f"Starting deadline check at {datetime.now()}")

        db = SessionLocal()
        try:
            events = db.query(DeadlineEvent).filter(
                DeadlineEvent.status != "completed"
            ).all()

            for event in events:
                try:
                    self._process_event(db, event)
                except Exception as e:
                    logger.error(f"Error processing event {event.id}: {e}")

        except Exception as e:
            logger.error(f"Scheduler failed: {e}")
        finally:
            db.close()

    def _process_event(self, db: Session, event: DeadlineEvent):
        if not event.due_date:
            return

        try:
            due_date = datetime.strptime(event.due_date, "%Y-%m-%d").date()
        except ValueError:
            logger.warning(f"Invalid date format for event {event.id}: {event.due_date}")
            return

        today = datetime.now().date()
        days_left = (due_date - today).days

        # Get project info (Event -> Document -> Project)
        doc = db.query(Document).filter(Document.id == event.document_id).first()
        if not doc:
            return
        project = db.query(Project).filter(Project.id == doc.project_id).first()
        if not project:
            return

        # Collect all users to notify: owner + accepted members
        users_to_notify = self._get_project_users(db, project)

        for user in users_to_notify:
            self._notify_user_if_matched(db, user, event, project, days_left)

    def _get_project_users(self, db: Session, project: Project) -> list[Profile]:
        """Get all users associated with a project (owner + accepted members)."""
        user_ids = set()
        users = []

        # Owner
        owner = db.query(Profile).filter(Profile.id == project.owner_id).first()
        if owner:
            users.append(owner)
            user_ids.add(str(owner.id))

        # Accepted members
        members = db.query(ProjectMember).filter(
            ProjectMember.project_id == project.id,
            ProjectMember.status == "accepted",
            ProjectMember.user_id.isnot(None),
        ).all()

        for member in members:
            uid = str(member.user_id)
            if uid not in user_ids:
                profile = db.query(Profile).filter(Profile.id == member.user_id).first()
                if profile:
                    users.append(profile)
                    user_ids.add(uid)

        return users

    def _notify_user_if_matched(
        self,
        db: Session,
        user: Profile,
        event: DeadlineEvent,
        project: Project,
        days_left: int,
    ):
        """Check user's notification rules and send if matched."""
        # Get user's active rules
        rules = db.query(NotificationRule).filter(
            NotificationRule.user_id == user.id,
            NotificationRule.is_active == True,
        ).all()

        should_notify = False

        # Check rules
        for rule in rules:
            if days_left == rule.days_before:
                should_notify = True
                break

        # Overdue: notify daily
        if days_left < 0:
            should_notify = True

        if not should_notify:
            return

        # Deduplicate: check if already notified today for this event+user
        today_start = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
        existing = db.query(NotificationLog).filter(
            NotificationLog.user_id == user.id,
            NotificationLog.event_id == event.id,
            NotificationLog.sent_at >= today_start,
            NotificationLog.status == "sent",
        ).first()

        if existing:
            logger.debug(f"Already notified {user.email} for event {event.id} today")
            return

        # Send notifications
        self._send_to_user(db, user, event, project, days_left)

    def _send_to_user(
        self,
        db: Session,
        user: Profile,
        event: DeadlineEvent,
        project: Project,
        days_left: int,
    ):
        """Send LINE + Email notification to a user."""
        message_content = (
            f"事項：{event.title}\n"
            f"專案：{project.name}\n"
            f"截止：{event.due_date}\n"
            f"剩餘：{days_left} 天"
        )

        # 1. LINE notification
        if user.line_user_id and settings.LINE_CHANNEL_ACCESS_TOKEN:
            self._send_line(db, user, event, project, days_left, message_content)

        # 2. Email notification
        if user.email:
            self._send_email(db, user, event, project, days_left, message_content)

    def _send_line(
        self, db, user, event, project, days_left, message_content
    ):
        try:
            from linebot import LineBotApi
            line_bot_api = LineBotApi(settings.LINE_CHANNEL_ACCESS_TOKEN)

            flex_message = self._create_flex_message(
                project_name=project.name,
                task_title=event.title,
                due_date=event.due_date,
                days_left=days_left,
                event_id=str(event.id),
            )
            line_bot_api.push_message(user.line_user_id, flex_message)

            logger.info(f"LINE sent to {user.email} for '{event.title}'")
            self._log(db, user.id, event.id, "line", "sent", message_content)

        except Exception as e:
            logger.error(f"LINE failed for {user.email}: {e}")
            self._log(db, user.id, event.id, "line", "failed", message_content, str(e))

    def _send_email(
        self, db, user, event, project, days_left, message_content
    ):
        try:
            success = self.email_service.send_deadline_reminder(
                to_email=user.email,
                project_name=project.name,
                task_title=event.title,
                due_date=event.due_date,
                days_left=days_left,
                project_id=str(project.id),
            )
            status = "sent" if success else "skipped"
            if success:
                logger.info(f"Email sent to {user.email} for '{event.title}'")
            self._log(db, user.id, event.id, "email", status, message_content)

        except Exception as e:
            logger.error(f"Email failed for {user.email}: {e}")
            self._log(db, user.id, event.id, "email", "failed", message_content, str(e))

    # ── LINE Flex Message (Traditional Chinese) ─────────────────────────

    def _create_flex_message(
        self, project_name, task_title, due_date, days_left, event_id
    ):
        from linebot.models import (
            FlexSendMessage, BubbleContainer, BoxComponent, TextComponent,
            ButtonComponent, PostbackAction, SeparatorComponent,
        )

        # Urgency colors
        if days_left < 0:
            header_color = "#DC2626"
            header_text = "已逾期"
            status_text = f"逾期 {abs(days_left)} 天"
        elif days_left == 0:
            header_color = "#DC2626"
            header_text = "今日到期"
            status_text = "今天到期"
        elif days_left <= 1:
            header_color = "#EF4444"
            header_text = "明日到期"
            status_text = "剩餘 1 天"
        elif days_left <= 3:
            header_color = "#F59E0B"
            header_text = "即將到期"
            status_text = f"剩餘 {days_left} 天"
        elif days_left <= 7:
            header_color = "#3B82F6"
            header_text = "截止日提醒"
            status_text = f"剩餘 {days_left} 天"
        else:
            header_color = "#10B981"
            header_text = "截止日提醒"
            status_text = f"剩餘 {days_left} 天"

        bubble = BubbleContainer(
            header=BoxComponent(
                layout="vertical",
                background_color=header_color,
                padding_all="16px",
                contents=[
                    TextComponent(
                        text=header_text,
                        weight="bold",
                        color="#FFFFFF",
                        size="md",
                    ),
                ],
            ),
            body=BoxComponent(
                layout="vertical",
                spacing="md",
                contents=[
                    TextComponent(
                        text=task_title,
                        weight="bold",
                        size="xl",
                        wrap=True,
                    ),
                    TextComponent(
                        text=f"專案：{project_name}",
                        size="sm",
                        color="#666666",
                        margin="md",
                    ),
                    SeparatorComponent(margin="md"),
                    BoxComponent(
                        layout="horizontal",
                        margin="md",
                        contents=[
                            TextComponent(text="截止日期", size="sm", color="#aaaaaa", flex=1),
                            TextComponent(text=due_date, size="sm", color="#666666", flex=2, align="end"),
                        ],
                    ),
                    BoxComponent(
                        layout="horizontal",
                        margin="xs",
                        contents=[
                            TextComponent(text="狀態", size="sm", color="#aaaaaa", flex=1),
                            TextComponent(
                                text=status_text,
                                size="sm",
                                color=header_color,
                                flex=2,
                                align="end",
                                weight="bold",
                            ),
                        ],
                    ),
                ],
            ),
            footer=BoxComponent(
                layout="vertical",
                contents=[
                    ButtonComponent(
                        style="primary",
                        color=header_color,
                        height="sm",
                        action=PostbackAction(
                            label="標記為完成",
                            data=f"action=complete&task_id={event_id}",
                            display_text="正在標記任務為完成...",
                        ),
                    ),
                ],
            ),
        )

        alt = f"{'[逾期]' if days_left < 0 else '[提醒]'} {task_title} — {status_text}"
        return FlexSendMessage(alt_text=alt, contents=bubble)

    # ── Logging ─────────────────────────────────────────────────────────

    def _log(
        self, db, user_id, event_id, notification_type, status, message,
        error_message=None,
    ):
        try:
            log = NotificationLog(
                id=uuid.uuid4(),
                user_id=user_id,
                event_id=event_id,
                notification_type=notification_type,
                status=status,
                message=message,
                error_message=error_message,
            )
            db.add(log)
            db.commit()
        except Exception as e:
            logger.error(f"Failed to log notification: {e}")
            db.rollback()
