"""Add notification_rules table and notification_logs table

Revision ID: 001
Revises: d2005c3b8556
Create Date: 2026-02-11 11:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '001'
down_revision: Union[str, None] = 'd2005c3b8556'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create notification_rules table with user_id
    op.create_table('notification_rules',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('days_before', sa.Integer(), nullable=False),
        sa.Column('severity', sa.String(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['profiles.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

    # Create notification_logs table for tracking sent notifications
    op.create_table('notification_logs',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('event_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('notification_type', sa.String(), nullable=False),  # 'line', 'email', etc.
        sa.Column('status', sa.String(), nullable=False),  # 'sent', 'failed', 'pending'
        sa.Column('message', sa.Text(), nullable=True),  # The actual message content
        sa.Column('error_message', sa.Text(), nullable=True),  # Error if failed
        sa.Column('sent_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['profiles.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['event_id'], ['deadline_events.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

    # Create indexes for better query performance
    op.create_index('idx_notification_rules_user_id', 'notification_rules', ['user_id'])
    op.create_index('idx_notification_logs_user_id', 'notification_logs', ['user_id'])
    op.create_index('idx_notification_logs_event_id', 'notification_logs', ['event_id'])
    op.create_index('idx_notification_logs_sent_at', 'notification_logs', ['sent_at'])


def downgrade() -> None:
    # Drop indexes
    op.drop_index('idx_notification_logs_sent_at', table_name='notification_logs')
    op.drop_index('idx_notification_logs_event_id', table_name='notification_logs')
    op.drop_index('idx_notification_logs_user_id', table_name='notification_logs')
    op.drop_index('idx_notification_rules_user_id', table_name='notification_rules')

    # Drop tables
    op.drop_table('notification_logs')
    op.drop_table('notification_rules')
