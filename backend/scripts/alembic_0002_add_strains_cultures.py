"""Add strains + cultures traceability tables and batch lineage FKs

PORTABLE ARTIFACT — copy this into hal-9000/packages/mycoflow/migrations/versions/
as `0002_add_strains_cultures.py` when wiring MycoFlow into HAL-9000.

Runnable against an empty database after 0001 (invariant I-21): 0001 creates the
`batches` table, this revision only ALTERs it. DDL-only — no data backfill here;
production data backfill uses scripts/add_strains_cultures.py (strain/culture
derivation from existing lc_cultures + batches).

Revision ID: 0002
Revises: 0001
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0002"
down_revision: Union[str, None] = "0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ── strains ──────────────────────────────────────────────────────────────
    op.create_table(
        "strains",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("species_code", sa.String(4), nullable=False),
        sa.Column("strain_number", sa.String(20), nullable=False),
        sa.Column("prefix", sa.String(30), nullable=False),
        sa.Column("species_latin", sa.String(100), nullable=True),
        sa.Column("common_name", sa.String(100), nullable=True),
        sa.Column("strain_category", sa.String(50), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("active", sa.Boolean(), nullable=True, server_default="true"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("prefix"),
    )
    op.create_index("ix_strains_prefix", "strains", ["prefix"])
    op.create_index("ix_strains_strain_category", "strains", ["strain_category"])

    # ── cultures ─────────────────────────────────────────────────────────────
    op.create_table(
        "cultures",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("code", sa.String(50), nullable=False),
        sa.Column("strain_id", sa.Integer(), nullable=False),
        sa.Column("media_type", sa.String(4), nullable=False),
        sa.Column("year_week", sa.String(4), nullable=True),
        sa.Column("unit", sa.String(4), nullable=True),
        sa.Column("parent_culture_id", sa.Integer(), nullable=True),
        sa.Column("source", sa.String(100), nullable=True),
        sa.Column("quantity", sa.Float(), nullable=True),
        sa.Column("quantity_unit", sa.String(20), nullable=True),
        sa.Column("date_created", sa.DateTime(), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("active", sa.Boolean(), nullable=True, server_default="true"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.ForeignKeyConstraint(["strain_id"], ["strains.id"]),
        sa.ForeignKeyConstraint(["parent_culture_id"], ["cultures.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("code"),
    )
    op.create_index("ix_cultures_code", "cultures", ["code"])
    op.create_index("ix_cultures_strain_id", "cultures", ["strain_id"])
    op.create_index("ix_cultures_media_type", "cultures", ["media_type"])
    op.create_index("ix_cultures_parent_culture_id", "cultures", ["parent_culture_id"])

    # ── batches lineage FKs ──────────────────────────────────────────────────
    op.add_column("batches", sa.Column("source_culture_id", sa.Integer(), nullable=True))
    op.add_column("batches", sa.Column("strain_id", sa.Integer(), nullable=True))
    op.create_foreign_key(
        "fk_batches_source_culture", "batches", "cultures", ["source_culture_id"], ["id"]
    )
    op.create_foreign_key(
        "fk_batches_strain", "batches", "strains", ["strain_id"], ["id"]
    )


def downgrade() -> None:
    op.drop_constraint("fk_batches_strain", "batches", type_="foreignkey")
    op.drop_constraint("fk_batches_source_culture", "batches", type_="foreignkey")
    op.drop_column("batches", "strain_id")
    op.drop_column("batches", "source_culture_id")
    op.drop_table("cultures")
    op.drop_table("strains")
