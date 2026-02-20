
from typing import Optional, Literal
from pydantic import BaseModel, Field


class EventUpdate(BaseModel):
    """Schema for updating a deadline event."""
    title: Optional[str] = None
    due_date: Optional[str] = None
    status: Optional[Literal["pending", "confirmed", "completed"]] = None
    description: Optional[str] = None
    source_text: Optional[str] = None
    confidence_score: Optional[int] = Field(None, ge=0, le=100)


class DocumentUpdate(BaseModel):
    """Schema for updating a document's metadata."""
    original_filename: Optional[str] = None
    status: Optional[Literal["processing", "completed", "error"]] = None
