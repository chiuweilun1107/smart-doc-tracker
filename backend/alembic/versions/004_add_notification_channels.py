"""Add channels column to notification_rules

Revision ID: 004
Revises: 003
Create Date: 2026-02-11 16:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB

# revision identifiers, used by Alembic.
revision: str = '004'
down_revision: Union[str, None] = '003'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add channels column with default ["line", "email"]
    op.add_column(
        'notification_rules',
        sa.Column('channels', JSONB, server_default='["line", "email"]', nullable=False)
    )


def downgrade() -> None:
    op.drop_column('notification_rules', 'channels')
