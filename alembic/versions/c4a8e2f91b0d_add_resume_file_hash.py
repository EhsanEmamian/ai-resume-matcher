"""add_resume_file_hash

Revision ID: c4a8e2f91b0d
Revises: f30841500e46
Create Date: 2026-05-23 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "c4a8e2f91b0d"
down_revision: Union[str, None] = "f30841500e46"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("resumes", sa.Column("file_hash", sa.String(length=64), nullable=True))
    op.create_index(op.f("ix_resumes_file_hash"), "resumes", ["file_hash"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_resumes_file_hash"), table_name="resumes")
    op.drop_column("resumes", "file_hash")
