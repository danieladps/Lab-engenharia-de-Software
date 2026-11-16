"""Cria a tabela de avisos (notificações dentro do app).

Cada aviso pertence a quem recebe e a um pedido de adoção; ao apagar o pedido
ou o usuário, os avisos somem junto. read_at marca quando a pessoa viu.

Revision ID: 0005
Revises: 0004
Create Date: 2026-11-16
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0005'
down_revision: Union[str, Sequence[str], None] = '0004'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table('notifications',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('user_id', sa.Integer(), nullable=False),
    sa.Column('adoption_id', sa.Integer(), nullable=False),
    sa.Column('kind', sa.String(length=30), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    sa.Column('read_at', sa.DateTime(timezone=True), nullable=True),
    sa.CheckConstraint("kind IN ('adoption_requested', 'adoption_approved', 'adoption_rejected')", name='ck_notifications_kind'),
    sa.ForeignKeyConstraint(['adoption_id'], ['adoptions.id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
    with op.batch_alter_table('notifications', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_notifications_adoption_id'), ['adoption_id'], unique=False)
        batch_op.create_index(batch_op.f('ix_notifications_user_id'), ['user_id'], unique=False)


def downgrade() -> None:
    with op.batch_alter_table('notifications', schema=None) as batch_op:
        batch_op.drop_index(batch_op.f('ix_notifications_user_id'))
        batch_op.drop_index(batch_op.f('ix_notifications_adoption_id'))

    op.drop_table('notifications')
