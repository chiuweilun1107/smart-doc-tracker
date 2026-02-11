"""Add Line verification code fields to profiles

Revision ID: 002
Revises: 001
Create Date: 2026-02-11 11:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '002'
down_revision: Union[str, None] = '001'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add Line verification fields to profiles table
    op.add_column('profiles', sa.Column('line_verification_code', sa.String(length=6), nullable=True))
    op.add_column('profiles', sa.Column('line_verification_expires_at', sa.DateTime(timezone=True), nullable=True))

    # Create index for faster lookup
    op.create_index('idx_profiles_verification_code', 'profiles', ['line_verification_code'])


def downgrade() -> None:
    # Drop index
    op.drop_index('idx_profiles_verification_code', table_name='profiles')

    # Drop columns
    op.drop_column('profiles', 'line_verification_expires_at')
    op.drop_column('profiles', 'line_verification_code')
