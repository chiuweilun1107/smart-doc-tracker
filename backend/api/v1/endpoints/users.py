
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from pydantic import BaseModel
from datetime import datetime, timedelta
import random

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
    current_user = Depends(deps.get_current_user),
    db: Session = Depends(get_db)
):
    """
    Check if the current user has bound their Line account.
    """
    # Query Profile table for line_user_id (not in CurrentUser schema)
    profile = db.query(Profile).filter(Profile.id == str(current_user.id)).first()

    is_bound = False
    line_user_id = None
    verification_code = None

    if profile:
        if profile.line_user_id:
            is_bound = True
            line_user_id = profile.line_user_id # masked if needed?

        # Return active verification code if exists and not expired
        if profile.line_verification_code and profile.line_verification_expires_at:
            if profile.line_verification_expires_at > datetime.now():
                verification_code = profile.line_verification_code

    return {
        "is_bound": is_bound,
        "line_user_id": line_user_id,
        "verification_code": verification_code
    }

@router.post("/me/line-verification-code")
def generate_line_verification_code(
    current_user = Depends(deps.get_current_user),
    db: Session = Depends(get_db)
):
    """
    Generate a new 6-digit verification code for Line binding.
    Code expires in 15 minutes.
    """
    # Query or create profile
    profile = db.query(Profile).filter(Profile.id == str(current_user.id)).first()

    if not profile:
        # Create new profile if doesn't exist
        profile = Profile(
            id=str(current_user.id),
            email=current_user.email
        )
        db.add(profile)

    # Check if already bound
    if profile.line_user_id:
        raise HTTPException(status_code=400, detail="Line account already bound")

    # Generate 6-digit code
    verification_code = f"{random.randint(0, 999999):06d}"

    # Set expiration (15 minutes from now)
    expires_at = datetime.now() + timedelta(minutes=15)

    # Update profile
    profile.line_verification_code = verification_code
    profile.line_verification_expires_at = expires_at

    db.commit()
    db.refresh(profile)

    return {
        "verification_code": verification_code,
        "expires_at": expires_at.isoformat(),
        "message": "請在 Line Bot 中輸入此驗證碼來綁定您的帳號"
    }

# NOTE: list_users endpoint removed due to privacy concerns.
# This endpoint allowed any authenticated user to list all profiles including emails and line_user_ids.
# If admin functionality is needed, implement proper RBAC with role checks first.
