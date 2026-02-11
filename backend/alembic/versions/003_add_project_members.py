"""Add project_members table

Revision ID: 003
Revises: 002
Create Date: 2026-02-11 14:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

# revision identifiers, used by Alembic.
revision: str = '003'
down_revision: Union[str, None] = '002'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'project_members',
        sa.Column('id', UUID(as_uuid=True), primary_key=True),
        sa.Column('project_id', UUID(as_uuid=True), sa.ForeignKey('projects.id', ondelete='CASCADE'), nullable=False),
        sa.Column('user_id', UUID(as_uuid=True), sa.ForeignKey('profiles.id', ondelete='CASCADE'), nullable=True),
        sa.Column('email', sa.String, nullable=False),
        sa.Column('status', sa.String, nullable=False, server_default='pending'),
        sa.Column('invited_by', UUID(as_uuid=True), sa.ForeignKey('profiles.id'), nullable=False),
        sa.Column('invited_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('joined_at', sa.DateTime(timezone=True), nullable=True),
    )

    # Indexes for common queries
    op.create_index('idx_project_members_project_id', 'project_members', ['project_id'])
    op.create_index('idx_project_members_user_id', 'project_members', ['user_id'])
    op.create_index('idx_project_members_email', 'project_members', ['email'])
    # Prevent duplicate invitations
    op.create_unique_constraint('uq_project_member', 'project_members', ['project_id', 'email'])


def downgrade() -> None:
    op.drop_constraint('uq_project_member', 'project_members', type_='unique')
    op.drop_index('idx_project_members_email', table_name='project_members')
    op.drop_index('idx_project_members_user_id', table_name='project_members')
    op.drop_index('idx_project_members_project_id', table_name='project_members')
    op.drop_table('project_members')
