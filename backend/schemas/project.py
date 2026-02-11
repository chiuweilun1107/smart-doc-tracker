
from typing import Optional, List
from pydantic import BaseModel
from datetime import datetime
import uuid

# Shared properties
class ProjectBase(BaseModel):
    name: str
    description: Optional[str] = None

# Properties to receive on item creation
class ProjectCreate(ProjectBase):
    pass

# Properties to receive on item update (all fields optional for partial update)
class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None

# Properties shared by models stored in DB
class ProjectInDBBase(ProjectBase):
    id: uuid.UUID
    owner_id: uuid.UUID
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# Properties to return to client
class Project(ProjectInDBBase):
    pass

# Properties to return with counts
class ProjectWithCounts(ProjectInDBBase):
    doc_count: int = 0
    event_count: int = 0

class ProjectList(BaseModel):
    data: List[Project]
    count: int
