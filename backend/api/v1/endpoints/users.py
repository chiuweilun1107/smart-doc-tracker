
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from pydantic import BaseModel

from backend.core.database import get_db
from backend.models import Profile
from backend.core import deps

router = APIRouter()

# Pydantic Schemas
class UserProfile(BaseModel):
    id: UUID
    email: str
    full_name: str | None
    line_user_id: str | None
    
    class Config:
        from_attributes = True

@router.get("/me/line-status")
def get_line_binding_status(
    current_user: Profile = Depends(deps.get_current_user),
    db: Session = Depends(get_db)
):
    """
    Check if the current user has bound their Line account.
    """
    is_bound = False
    line_user_id = None
    
    if current_user.line_user_id:
        is_bound = True
        line_user_id = current_user.line_user_id # masked if needed?
        
    return {
        "is_bound": is_bound,
        "line_user_id": line_user_id
    }

@router.get("/", response_model=List[UserProfile])
def list_users(
    skip: int = 0,
    limit: int = 100,
    current_user: Profile = Depends(deps.get_current_user), # TODO: Add admin check
    db: Session = Depends(get_db)
):
    """
    List all users (profiles).
    """
    users = db.query(Profile).offset(skip).limit(limit).all()
    return users
