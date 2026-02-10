
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

# Properties to receive on item update
class ProjectUpdate(ProjectBase):
    pass

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

class ProjectList(BaseModel):
    data: List[Project]
    count: int
