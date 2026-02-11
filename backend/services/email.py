import json
import logging
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from backend.core.config import settings

logger = logging.getLogger(__name__)


class EmailService:
    """Email service that reads config from system_settings DB table, with .env fallback."""

    def __init__(self, db=None):
        self.provider = settings.EMAIL_PROVIDER
        self._smtp_host = settings.SMTP_HOST
        self._smtp_port = settings.SMTP_PORT
        self._smtp_user = settings.SMTP_USER
        self._smtp_password = settings.SMTP_PASSWORD
        self._smtp_from_name = settings.SMTP_FROM_NAME
        self._resend_api_key = settings.RESEND_API_KEY
        self._resend_from_email = settings.RESEND_FROM_EMAIL

        # Override with DB config if available
        if db is not None:
            self._load_from_db(db)

        # Determine enabled state
        if self.provider == "smtp":
            self.enabled = bool(self._smtp_user and self._smtp_password)
            if not self.enabled:
                logger.warning("SMTP credentials not configured — email disabled")
        elif self.provider == "resend":
            self.enabled = bool(self._resend_api_key)
            if self.enabled:
                import resend
                resend.api_key = self._resend_api_key
            else:
                logger.warning("Resend API key not configured — email disabled")
        else:
            self.enabled = False
            logger.warning(f"Unknown EMAIL_PROVIDER: {self.provider}")

    def _load_from_db(self, db):
        """Load email config from system_settings table."""
        try:
            from sqlalchemy import text
            row = db.execute(text("SELECT value FROM system_settings WHERE key = 'email_provider'")).fetchone()
            if row and row[0]:
                self.provider = row[0] if isinstance(row[0], str) else str(row[0])

            smtp_row = db.execute(text("SELECT value FROM system_settings WHERE key = 'smtp_config'")).fetchone()
            if smtp_row and smtp_row[0]:
                cfg = smtp_row[0] if isinstance(smtp_row[0], dict) else json.loads(smtp_row[0])
                if cfg.get("host"):
                    self._smtp_host = cfg["host"]
                if cfg.get("port"):
                    self._smtp_port = int(cfg["port"])
                if cfg.get("user"):
                    self._smtp_user = cfg["user"]
                if cfg.get("password"):
                    self._smtp_password = cfg["password"]
                if cfg.get("from_name"):
                    self._smtp_from_name = cfg["from_name"]

            resend_row = db.execute(text("SELECT value FROM system_settings WHERE key = 'resend_config'")).fetchone()
            if resend_row and resend_row[0]:
                cfg = resend_row[0] if isinstance(resend_row[0], dict) else json.loads(resend_row[0])
                if cfg.get("api_key"):
                    self._resend_api_key = cfg["api_key"]
                if cfg.get("from_email"):
                    self._resend_from_email = cfg["from_email"]

        except Exception as e:
            logger.warning(f"Failed to load email config from DB, using .env fallback: {e}")

    def get_status(self) -> dict:
        """Return current email config status (for settings API)."""
        return {
            "provider": self.provider,
            "enabled": self.enabled,
            "smtp_user": self._smtp_user if self.provider == "smtp" else "",
            "resend_configured": bool(self._resend_api_key) if self.provider == "resend" else False,
        }

    def send_deadline_reminder(
        self,
        to_email: str,
        project_name: str,
        task_title: str,
        due_date: str,
        days_left: int,
        project_id: str = "",
    ) -> bool:
        if not self.enabled:
            logger.info(f"[Email SKIP] {self.provider} not configured. Would send to {to_email}: {task_title}")
            return False

        if days_left > 0:
            subject = f"[提醒] {task_title} — 還有 {days_left} 天到期"
            urgency_text = f"距離截止日還有 <strong>{days_left} 天</strong>"
            urgency_color = "#f59e0b" if days_left <= 3 else "#3b82f6"
        elif days_left == 0:
            subject = f"[今日到期] {task_title}"
            urgency_text = "<strong>今天到期</strong>"
            urgency_color = "#ef4444"
        else:
            overdue = abs(days_left)
            subject = f"[已逾期] {task_title} — 逾期 {overdue} 天"
            urgency_text = f"已逾期 <strong>{overdue} 天</strong>"
            urgency_color = "#dc2626"

        html = f"""
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
            <div style="background: {urgency_color}; color: white; padding: 16px 20px; border-radius: 8px 8px 0 0;">
                <h2 style="margin: 0; font-size: 16px;">截止日提醒</h2>
            </div>
            <div style="border: 1px solid #e5e7eb; border-top: none; padding: 20px; border-radius: 0 0 8px 8px;">
                <h3 style="margin: 0 0 8px 0; font-size: 18px; color: #111827;">{task_title}</h3>
                <p style="margin: 4px 0; color: #6b7280; font-size: 14px;">專案：{project_name}</p>
                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 16px 0;">
                <table style="width: 100%; font-size: 14px;">
                    <tr>
                        <td style="color: #9ca3af; padding: 4px 0;">截止日期</td>
                        <td style="text-align: right; color: #374151; font-weight: 500;">{due_date}</td>
                    </tr>
                    <tr>
                        <td style="color: #9ca3af; padding: 4px 0;">狀態</td>
                        <td style="text-align: right; color: {urgency_color}; font-weight: 600;">{urgency_text}</td>
                    </tr>
                </table>
            </div>
            <p style="text-align: center; margin-top: 16px; font-size: 12px; color: #9ca3af;">
                Smart Doc Tracker — 智能文件期限追蹤系統
            </p>
        </div>
        """
        return self._send(to_email, subject, html)

    def send_invitation(
        self,
        to_email: str,
        project_name: str,
        inviter_name: str,
    ) -> bool:
        if not self.enabled:
            logger.info(f"[Email SKIP] {self.provider} not configured. Would send invitation to {to_email}")
            return False

        subject = f"{inviter_name} 邀請你加入專案「{project_name}」"
        html = f"""
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
            <div style="background: #3b82f6; color: white; padding: 16px 20px; border-radius: 8px 8px 0 0;">
                <h2 style="margin: 0; font-size: 16px;">專案邀請</h2>
            </div>
            <div style="border: 1px solid #e5e7eb; border-top: none; padding: 20px; border-radius: 0 0 8px 8px;">
                <p style="font-size: 15px; color: #374151; margin: 0 0 12px 0;">
                    <strong>{inviter_name}</strong> 邀請你加入專案：
                </p>
                <div style="background: #f3f4f6; border-radius: 6px; padding: 12px 16px; margin: 12px 0;">
                    <p style="margin: 0; font-size: 16px; font-weight: 600; color: #111827;">{project_name}</p>
                </div>
                <p style="font-size: 14px; color: #6b7280; margin: 16px 0 0 0;">
                    登入 Smart Doc Tracker 即可查看此專案的文件和截止日期。
                </p>
            </div>
            <p style="text-align: center; margin-top: 16px; font-size: 12px; color: #9ca3af;">
                Smart Doc Tracker — 智能文件期限追蹤系統
            </p>
        </div>
        """
        return self._send(to_email, subject, html)

    def _send(self, to_email: str, subject: str, html: str) -> bool:
        if self.provider == "smtp":
            return self._send_smtp(to_email, subject, html)
        elif self.provider == "resend":
            return self._send_resend(to_email, subject, html)
        return False

    def _send_smtp(self, to_email: str, subject: str, html: str) -> bool:
        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = f"{self._smtp_from_name} <{self._smtp_user}>"
            msg["To"] = to_email
            msg.attach(MIMEText(html, "html", "utf-8"))

            with smtplib.SMTP(self._smtp_host, self._smtp_port) as server:
                server.starttls()
                server.login(self._smtp_user, self._smtp_password)
                server.sendmail(self._smtp_user, to_email, msg.as_string())

            logger.info(f"[SMTP] Email sent to {to_email}: {subject}")
            return True
        except Exception as e:
            logger.error(f"[SMTP] Failed to send to {to_email}: {e}")
            return False

    def _send_resend(self, to_email: str, subject: str, html: str) -> bool:
        try:
            import resend
            resend.Emails.send({
                "from": self._resend_from_email,
                "to": [to_email],
                "subject": subject,
                "html": html,
            })
            logger.info(f"[Resend] Email sent to {to_email}: {subject}")
            return True
        except Exception as e:
            logger.error(f"[Resend] Failed to send to {to_email}: {e}")
            return False
