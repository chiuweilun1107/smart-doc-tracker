from pydantic import BaseModel
from uuid import UUID
from datetime import datetime


class CurrentUser(BaseModel):
    """
    Unified current user schema for authenticated endpoints.
    Represents the user data returned from Supabase auth.get_user().
    """
    id: UUID | str
    email: str
    phone: str | None = None
    email_confirmed_at: datetime | None = None
    created_at: datetime | None = None

    class Config:
        # Allow both Supabase User objects and dicts
        from_attributes = True

    @property
    def user_id(self) -> str:
        """Return user ID as string for consistency"""
        return str(self.id)
