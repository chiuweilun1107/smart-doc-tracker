
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List, Optional
from pydantic import BaseModel
from uuid import UUID

from backend.core.database import get_db
from backend.models import NotificationRule

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

# CRUD Endpoints

@router.get("/rules", response_model=List[NotificationRuleResponse])
def get_notification_rules(db: Session = Depends(get_db)):
    """List all notification rules."""
    rules = db.query(NotificationRule).order_by(NotificationRule.days_before.desc()).all()
    return rules

@router.post("/rules", response_model=NotificationRuleResponse)
def create_notification_rule(rule: NotificationRuleCreate, db: Session = Depends(get_db)):
    """Create a new notification rule."""
    db_rule = NotificationRule(**rule.dict())
    db.add(db_rule)
    db.commit()
    db.refresh(db_rule)
    return db_rule

@router.delete("/rules/{rule_id}")
def delete_notification_rule(rule_id: UUID, db: Session = Depends(get_db)):
    """Delete a notification rule."""
    db_rule = db.query(NotificationRule).filter(NotificationRule.id == rule_id).first()
    if not db_rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    
    db.delete(db_rule)
    db.commit()
    return {"status": "success", "message": "Rule deleted"}
