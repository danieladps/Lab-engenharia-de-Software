"""Cria a tabela de fotos enviadas pelo site.

A foto fica no banco porque o disco do Render gratuito é apagado a cada deploy.
Ao apagar o usuário, as fotos dele somem junto.

Revision ID: 0007
Revises: 0006
Create Date: 2026-11-16
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0007'
down_revision: Union[str, Sequence[str], None] = '0006'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table('photos',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('owner_id', sa.Integer(), nullable=False),
    sa.Column('content_type', sa.String(length=20), nullable=False),
    sa.Column('data', sa.LargeBinary(), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    sa.ForeignKeyConstraint(['owner_id'], ['users.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
    with op.batch_alter_table('photos', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_photos_owner_id'), ['owner_id'], unique=False)


def downgrade() -> None:
    with op.batch_alter_table('photos', schema=None) as batch_op:
        batch_op.drop_index(batch_op.f('ix_photos_owner_id'))

    op.drop_table('photos')
