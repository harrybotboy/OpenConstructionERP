"""v4.1.0 -- Add azure_openai_api_key column to oe_ai_settings.

Revision ID: v4100_azure_openai
Revises: v40_fieldreports_uuid_typing
Create Date: 2026-05-26
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "v4100_azure_openai"
down_revision: Union[str, None] = "v40_fieldreports_uuid_typing"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, None] = None


def _add_column_safe(table_name: str, column: sa.Column) -> None:
    """Add a column, silently skipping if it already exists."""
    bind = op.get_bind()
    insp = sa.inspect(bind)
    existing = [c["name"] for c in insp.get_columns(table_name)]
    if column.name not in existing:
        op.add_column(table_name, column)


def upgrade() -> None:
    _add_column_safe(
        "oe_ai_settings",
        sa.Column("azure_openai_api_key", sa.String(500), nullable=True),
    )


def downgrade() -> None:
    with op.batch_alter_table("oe_ai_settings") as batch_op:
        batch_op.drop_column("azure_openai_api_key")
