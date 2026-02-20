
from sqlalchemy import Column, String, Integer, DateTime, Boolean, ForeignKey, Text, JSON
from sqlalchemy.dialects.postgresql import UUID, JSONB
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
    line_verification_code = Column(String(6), nullable=True)  # 6-digit verification code
    line_verification_expires_at = Column(DateTime(timezone=True), nullable=True)  # Code expiration
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
    filename = Column("original_filename", String, nullable=False)
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
    user_id = Column(UUID(as_uuid=True), ForeignKey("profiles.id"), nullable=False)  # Owner of this rule
    days_before = Column(Integer, nullable=False) # e.g., 7, 3, 1, 0
    severity = Column(String, default="info") # info, warning, critical
    is_active = Column(Boolean, default=True)
    channels = Column(JSONB, server_default='["line", "email"]', nullable=False)  # ["line"], ["email"], ["line", "email"]
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    user = relationship("Profile", backref="notification_rules")

# Project Member
class ProjectMember(Base):
    __tablename__ = "project_members"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("profiles.id", ondelete="CASCADE"), nullable=True)
    email = Column(String, nullable=False)
    status = Column(String, default="pending")  # pending, accepted
    invited_by = Column(UUID(as_uuid=True), ForeignKey("profiles.id"), nullable=False)
    invited_at = Column(DateTime(timezone=True), server_default=func.now())
    joined_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    project = relationship("Project", backref="members")
    user = relationship("Profile", foreign_keys=[user_id], backref="memberships")
    inviter = relationship("Profile", foreign_keys=[invited_by])

# Notification Log (Audit trail of sent notifications)
class NotificationLog(Base):
    __tablename__ = "notification_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("profiles.id"), nullable=False)
    event_id = Column(UUID(as_uuid=True), ForeignKey("deadline_events.id"), nullable=False)
    notification_type = Column(String, nullable=False)  # 'line', 'email', etc.
    status = Column(String, nullable=False)  # 'sent', 'failed', 'pending'
    message = Column(Text, nullable=True)  # The actual message content
    error_message = Column(Text, nullable=True)  # Error if failed
    sent_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    user = relationship("Profile", backref="notification_logs")
    event = relationship("DeadlineEvent", backref="notification_logs")
