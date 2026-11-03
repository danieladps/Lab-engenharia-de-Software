"""Cria a tabela de mensagens, trocadas dentro de cada pedido de adoção.

Cada mensagem pertence a um pedido e a quem enviou; ao apagar o pedido ou o
usuário, as mensagens somem junto. read_at marca quando a outra pessoa leu.

Revision ID: 0004
Revises: 0003
Create Date: 2026-11-03
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0004'
down_revision: Union[str, Sequence[str], None] = '0003'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table('messages',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('adoption_id', sa.Integer(), nullable=False),
    sa.Column('sender_id', sa.Integer(), nullable=False),
    sa.Column('body', sa.Text(), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    sa.Column('read_at', sa.DateTime(timezone=True), nullable=True),
    sa.ForeignKeyConstraint(['adoption_id'], ['adoptions.id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['sender_id'], ['users.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
    with op.batch_alter_table('messages', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_messages_adoption_id'), ['adoption_id'], unique=False)
        batch_op.create_index(batch_op.f('ix_messages_sender_id'), ['sender_id'], unique=False)



def downgrade() -> None:
    with op.batch_alter_table('messages', schema=None) as batch_op:
        batch_op.drop_index(batch_op.f('ix_messages_sender_id'))
        batch_op.drop_index(batch_op.f('ix_messages_adoption_id'))

    op.drop_table('messages')
