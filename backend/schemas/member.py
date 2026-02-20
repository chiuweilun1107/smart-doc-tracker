from typing import Optional
from pydantic import BaseModel, EmailStr
from datetime import datetime
import uuid


class MemberInvite(BaseModel):
    email: EmailStr


class MemberResponse(BaseModel):
    id: uuid.UUID
    project_id: uuid.UUID
    user_id: Optional[uuid.UUID] = None
    email: str
    status: str
    invited_by: uuid.UUID
    invited_at: datetime
    joined_at: Optional[datetime] = None
    # Populated from profiles join
    full_name: Optional[str] = None
    # Email notification status
    email_sent: Optional[bool] = None

    class Config:
        from_attributes = True
