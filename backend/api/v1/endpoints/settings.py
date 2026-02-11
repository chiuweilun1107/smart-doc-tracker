
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

# Pydantic Models
class NotificationRuleBase(BaseModel):
    days_before: int
    severity: str = "info"
    is_active: bool = True

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
