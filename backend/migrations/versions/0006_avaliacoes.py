"""Cria a tabela de avaliações do processo de adoção.

Uma avaliação por pedido (adoption_id único), com nota de 1 a 5 e comentário
opcional. Ao apagar o pedido, a avaliação some junto.

Revision ID: 0006
Revises: 0005
Create Date: 2026-11-16
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0006'
down_revision: Union[str, Sequence[str], None] = '0005'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table('reviews',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('adoption_id', sa.Integer(), nullable=False),
    sa.Column('rating', sa.Integer(), nullable=False),
    sa.Column('comment', sa.Text(), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    sa.CheckConstraint('rating BETWEEN 1 AND 5', name='ck_reviews_rating'),
    sa.ForeignKeyConstraint(['adoption_id'], ['adoptions.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('adoption_id')
    )


def downgrade() -> None:
    op.drop_table('reviews')
