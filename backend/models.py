
from sqlalchemy import Column, String, Integer, DateTime, Boolean, ForeignKey, Text, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from backend.core.database import Base
import uuid

# User Profile (matches Supabase Auth)
class Profile(Base):
    __tablename__ = "profiles"

    id = Column(UUID(as_uuid=True), primary_key=True) # References auth.users.id
    email = Column(String, nullable=False)
    full_name = Column(String, nullable=True)
    line_user_id = Column(String, nullable=True) # Line User ID for push messages
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

# Project
class Project(Base):
    __tablename__ = "projects"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    owner_id = Column(UUID(as_uuid=True), ForeignKey("profiles.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    owner = relationship("Profile", backref="projects")

# Document
class Document(Base):
    __tablename__ = "documents"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id"), nullable=False)
    filename = Column(String, nullable=False)
    file_path = Column(String, nullable=False) # S3/Storage path
    file_type = Column(String, nullable=False) # e.g., 'pdf'
    status = Column(String, default="pending") # pending, processing, completed, error
    raw_content = Column(Text, nullable=True) # Extracted raw text
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    project = relationship("Project", backref="documents")

# Deadline Event (Parsed from Document)
class DeadlineEvent(Base):
    __tablename__ = "deadline_events"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    document_id = Column(UUID(as_uuid=True), ForeignKey("documents.id"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    due_date = Column(String, nullable=False) # ISO 8601 Date String (YYYY-MM-DD)
    status = Column(String, default="pending") # pending, completed
    confidence_score = Column(Integer, default=0) # AI confidence (0-100)
    source_text = Column(Text, nullable=True) # Text snippet justifying this event
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    document = relationship("Document", backref="events")

# Notification Rule
class NotificationRule(Base):
    __tablename__ = "notification_rules"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    days_before = Column(Integer, nullable=False) # e.g., 7, 3, 1, 0
    severity = Column(String, default="info") # info, warning, critical
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
