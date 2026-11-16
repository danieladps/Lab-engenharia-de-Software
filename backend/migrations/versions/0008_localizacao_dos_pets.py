"""Guarda as coordenadas da cidade de cada anúncio, para buscar pets perto de quem procura.

São as coordenadas do centro da cidade (não o endereço de quem anunciou).
As colunas aceitam vazio: anúncios antigos ganham coordenadas na primeira busca por perto.

Revision ID: 0008
Revises: 0007
Create Date: 2026-11-16
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0008'
down_revision: Union[str, Sequence[str], None] = '0007'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table('pets', schema=None) as batch_op:
        batch_op.add_column(sa.Column('latitude', sa.Float(), nullable=True))
        batch_op.add_column(sa.Column('longitude', sa.Float(), nullable=True))


def downgrade() -> None:
    with op.batch_alter_table('pets', schema=None) as batch_op:
        batch_op.drop_column('longitude')
        batch_op.drop_column('latitude')
