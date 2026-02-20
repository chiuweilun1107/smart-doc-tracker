
import json
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List, Optional
from pydantic import BaseModel
from uuid import UUID

from backend.core.database import get_db
from backend.core.config import settings
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


# ─── LINE Config Models ───
class LineConfigResponse(BaseModel):
    bot_id: str = ""
    bot_name: str = ""
    channel_secret: str = ""
    channel_access_token: str = ""

class LineConfigUpdate(BaseModel):
    channel_secret: str = ""
    channel_access_token: str = ""


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
    sent_at: Optional[datetime] = None

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
    db_rule = NotificationRule(**rule.model_dump(), user_id=str(current_user.id))
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
    current_user = Depends(deps.require_admin),
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
    current_user = Depends(deps.require_admin),
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

@router.get("/line-config", response_model=LineConfigResponse)
def get_line_config(
    current_user = Depends(deps.require_admin),
    db: Session = Depends(get_db),
):
    """Get current LINE bot configuration."""
    row = db.execute(text("SELECT value FROM system_settings WHERE key = 'line_config'")).fetchone()
    cfg = row[0] if row and row[0] else {}

    # Mask secrets
    display = dict(cfg)
    if display.get("channel_secret"):
        display["channel_secret"] = display["channel_secret"][:8] + "••••••••"
    if display.get("channel_access_token"):
        display["channel_access_token"] = display["channel_access_token"][:12] + "••••••••"

    return LineConfigResponse(**display)


@router.put("/line-config")
def update_line_config(
    config: LineConfigUpdate,
    current_user = Depends(deps.require_admin),
    db: Session = Depends(get_db),
):
    """Update LINE bot configuration. Auto-detects bot ID and name from LINE API."""
    import urllib.request

    # If secrets are masked, keep old values
    secret = config.channel_secret
    token = config.channel_access_token
    old_row = db.execute(text("SELECT value FROM system_settings WHERE key = 'line_config'")).fetchone()
    old_cfg = old_row[0] if old_row and old_row[0] else {}

    if secret.endswith("••••••••"):
        secret = old_cfg.get("channel_secret", "")
    if token.endswith("••••••••"):
        token = old_cfg.get("channel_access_token", "")

    if not token:
        raise HTTPException(status_code=400, detail="Channel Access Token is required")

    # Auto-detect bot ID and name from LINE API
    bot_id = ""
    bot_name = ""
    try:
        req = urllib.request.Request(
            "https://api.line.me/v2/bot/info",
            headers={"Authorization": f"Bearer {token}"}
        )
        resp = urllib.request.urlopen(req, timeout=10)
        import json as json_module
        data = json_module.loads(resp.read())
        bot_id = data.get("basicId", "")
        bot_name = data.get("displayName", "")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"無法驗證 LINE Token，請確認 Channel Access Token 是否正確: {e}")

    line_cfg = {
        "bot_id": bot_id,
        "bot_name": bot_name,
        "channel_secret": secret,
        "channel_access_token": token,
    }

    db.execute(text("""
        INSERT INTO system_settings (key, value, updated_at)
        VALUES ('line_config', :val::jsonb, now())
        ON CONFLICT (key) DO UPDATE SET value = :val::jsonb, updated_at = now()
    """), {"val": json.dumps(line_cfg)})
    db.commit()

    return {"status": "success", "bot_id": bot_id, "bot_name": bot_name}


@router.post("/line-test")
def send_test_line_message(
    current_user = Depends(deps.get_current_user),
    db: Session = Depends(get_db),
):
    """Send a test LINE message to the current user."""
    from linebot import LineBotApi
    from linebot.models import TextSendMessage

    # Get user's line_user_id
    profile = db.query(Profile).filter(Profile.id == str(current_user.id)).first()
    if not profile or not profile.line_user_id:
        raise HTTPException(status_code=400, detail="您尚未綁定 LINE 帳號，請先完成綁定。")

    # Get LINE config from DB, fallback to .env
    token = settings.LINE_CHANNEL_ACCESS_TOKEN
    row = db.execute(text("SELECT value FROM system_settings WHERE key = 'line_config'")).fetchone()
    if row and row[0] and row[0].get("channel_access_token"):
        token = row[0]["channel_access_token"]

    if not token:
        raise HTTPException(status_code=400, detail="LINE Bot 尚未設定 Channel Access Token")

    try:
        line_bot_api = LineBotApi(token)
        line_bot_api.push_message(
            profile.line_user_id,
            TextSendMessage(text="✅ 這是一則測試訊息\n\nSmart Doc Tracker 的 LINE 通知功能正常運作中！\n截止日提醒和專案通知會透過此機器人發送給您。")
        )
        return {"status": "sent", "to": profile.line_user_id[:10] + "..."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"LINE 訊息發送失敗: {e}")


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
