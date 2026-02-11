
import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List, Optional
from pydantic import BaseModel
from uuid import UUID

from backend.core.database import get_db
from backend.models import NotificationRule, NotificationLog, Profile
from backend.core import deps

router = APIRouter()


# ─── Email Config Models ───
class SmtpConfig(BaseModel):
    host: str = "smtp.gmail.com"
    port: int = 587
    user: str = ""
    password: str = ""
    from_name: str = "Smart Doc Tracker"

class ResendConfig(BaseModel):
    api_key: str = ""
    from_email: str = ""

class EmailConfigResponse(BaseModel):
    provider: str
    smtp: SmtpConfig
    resend: ResendConfig

class EmailConfigUpdate(BaseModel):
    provider: str  # "smtp" or "resend"
    smtp: Optional[SmtpConfig] = None
    resend: Optional[ResendConfig] = None

# Pydantic Models
class NotificationRuleBase(BaseModel):
    days_before: int
    severity: str = "info"
    is_active: bool = True
    channels: list[str] = ["line", "email"]

class NotificationRuleCreate(NotificationRuleBase):
    pass

class NotificationRuleResponse(NotificationRuleBase):
    id: UUID

    class Config:
        from_attributes = True

class NotificationLogResponse(BaseModel):
    id: UUID
    event_id: UUID
    notification_type: str
    status: str
    message: Optional[str]
    error_message: Optional[str]
    sent_at: Optional[str]

    class Config:
        from_attributes = True

# CRUD Endpoints

@router.get("/rules", response_model=List[NotificationRuleResponse])
def get_notification_rules(
    current_user = Depends(deps.get_current_user),
    db: Session = Depends(get_db)
):
    """List current user's notification rules."""
    rules = db.query(NotificationRule)\
        .filter(NotificationRule.user_id == str(current_user.id))\
        .order_by(NotificationRule.days_before.desc())\
        .all()
    return rules

@router.post("/rules", response_model=NotificationRuleResponse)
def create_notification_rule(
    rule: NotificationRuleCreate,
    current_user = Depends(deps.get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new notification rule for current user."""
    db_rule = NotificationRule(**rule.dict(), user_id=str(current_user.id))
    db.add(db_rule)
    db.commit()
    db.refresh(db_rule)
    return db_rule

@router.delete("/rules/{rule_id}")
def delete_notification_rule(
    rule_id: UUID,
    current_user = Depends(deps.get_current_user),
    db: Session = Depends(get_db)
):
    """Delete current user's notification rule."""
    db_rule = db.query(NotificationRule)\
        .filter(NotificationRule.id == rule_id)\
        .filter(NotificationRule.user_id == str(current_user.id))\
        .first()
    if not db_rule:
        raise HTTPException(status_code=404, detail="Rule not found")

    db.delete(db_rule)
    db.commit()
    return {"status": "success", "message": "Rule deleted"}

@router.get("/email-config", response_model=EmailConfigResponse)
def get_email_config(
    current_user = Depends(deps.get_current_user),
    db: Session = Depends(get_db),
):
    """Get current email provider configuration."""
    provider_row = db.execute(text("SELECT value FROM system_settings WHERE key = 'email_provider'")).fetchone()
    smtp_row = db.execute(text("SELECT value FROM system_settings WHERE key = 'smtp_config'")).fetchone()
    resend_row = db.execute(text("SELECT value FROM system_settings WHERE key = 'resend_config'")).fetchone()

    provider = provider_row[0] if provider_row else "smtp"
    smtp_val = smtp_row[0] if smtp_row else {}
    resend_val = resend_row[0] if resend_row else {}

    # Mask password for security
    smtp_display = dict(smtp_val) if smtp_val else {}
    if smtp_display.get("password"):
        smtp_display["password"] = "••••••••"

    resend_display = dict(resend_val) if resend_val else {}
    if resend_display.get("api_key"):
        resend_display["api_key"] = resend_display["api_key"][:8] + "••••••••"

    return EmailConfigResponse(
        provider=provider if isinstance(provider, str) else str(provider),
        smtp=SmtpConfig(**smtp_display),
        resend=ResendConfig(**resend_display),
    )


@router.put("/email-config")
def update_email_config(
    config: EmailConfigUpdate,
    current_user = Depends(deps.get_current_user),
    db: Session = Depends(get_db),
):
    """Update email provider configuration. Saves to system_settings table."""
    if config.provider not in ("smtp", "resend"):
        raise HTTPException(status_code=400, detail="Provider must be 'smtp' or 'resend'")

    # Upsert provider
    db.execute(text("""
        INSERT INTO system_settings (key, value, updated_at)
        VALUES ('email_provider', :val, now())
        ON CONFLICT (key) DO UPDATE SET value = :val, updated_at = now()
    """), {"val": config.provider})

    # Upsert SMTP config if provided
    if config.smtp:
        # If password is masked, keep old password
        smtp_dict = config.smtp.model_dump()
        if smtp_dict["password"] == "••••••••":
            old_row = db.execute(text("SELECT value FROM system_settings WHERE key = 'smtp_config'")).fetchone()
            if old_row and old_row[0]:
                smtp_dict["password"] = old_row[0].get("password", "")

        db.execute(text("""
            INSERT INTO system_settings (key, value, updated_at)
            VALUES ('smtp_config', :val::jsonb, now())
            ON CONFLICT (key) DO UPDATE SET value = :val::jsonb, updated_at = now()
        """), {"val": json.dumps(smtp_dict)})

    # Upsert Resend config if provided
    if config.resend:
        resend_dict = config.resend.model_dump()
        if resend_dict["api_key"].endswith("••••••••"):
            old_row = db.execute(text("SELECT value FROM system_settings WHERE key = 'resend_config'")).fetchone()
            if old_row and old_row[0]:
                resend_dict["api_key"] = old_row[0].get("api_key", "")

        db.execute(text("""
            INSERT INTO system_settings (key, value, updated_at)
            VALUES ('resend_config', :val::jsonb, now())
            ON CONFLICT (key) DO UPDATE SET value = :val::jsonb, updated_at = now()
        """), {"val": json.dumps(resend_dict)})

    db.commit()
    return {"status": "success", "provider": config.provider}


@router.get("/email-status")
def get_email_status(
    current_user = Depends(deps.get_current_user),
    db: Session = Depends(get_db),
):
    """Check current email service configuration status."""
    from backend.services.email import EmailService
    service = EmailService(db=db)
    return service.get_status()

class EmailTestRequest(BaseModel):
    to_email: Optional[str] = None

@router.post("/email-test")
def send_test_email(
    body: EmailTestRequest = EmailTestRequest(),
    current_user = Depends(deps.get_current_user),
    db: Session = Depends(get_db),
):
    """Send a test email. Defaults to current user's email if not specified."""
    from backend.services.email import EmailService
    service = EmailService(db=db)
    if not service.enabled:
        raise HTTPException(status_code=400, detail="Email service not configured")

    recipient = body.to_email or current_user.email
    if not recipient:
        raise HTTPException(status_code=400, detail="No recipient email provided")

    success = service.send_deadline_reminder(
        to_email=recipient,
        project_name="測試專案",
        task_title="這是一封測試郵件",
        due_date="2026-02-18",
        days_left=7,
    )
    if success:
        return {"status": "sent", "to": recipient}
    raise HTTPException(status_code=500, detail="Failed to send test email")

@router.get("/notification-logs", response_model=List[NotificationLogResponse])
def get_notification_logs(
    skip: int = 0,
    limit: int = 50,
    current_user = Depends(deps.get_current_user),
    db: Session = Depends(get_db)
):
    """Get notification logs for current user."""
    logs = db.query(NotificationLog)\
        .filter(NotificationLog.user_id == str(current_user.id))\
        .order_by(NotificationLog.sent_at.desc())\
        .offset(skip)\
        .limit(limit)\
        .all()
    return logs
