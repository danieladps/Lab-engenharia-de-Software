"""Cria usuários e liga anúncios e interesses a uma conta.

Primeira migração versionada. Substitui as tabelas que antes eram criadas por
create_all: pets ganha owner_id (sai manage_token) e adoptions ganha user_id
(saem applicant_name e applicant_email, que agora vêm da conta).

Revision ID: 0001
Revises:
Create Date: 2026-10-27
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0001'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table('users',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('name', sa.String(length=120), nullable=False),
    sa.Column('email', sa.String(length=255), nullable=False),
    sa.Column('password_hash', sa.String(length=255), nullable=False),
    sa.Column('city', sa.String(length=100), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    sa.PrimaryKeyConstraint('id')
    )
    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_users_email'), ['email'], unique=True)

    op.create_table('pets',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('owner_id', sa.Integer(), nullable=False),
    sa.Column('name', sa.String(length=100), nullable=False),
    sa.Column('species', sa.String(length=30), nullable=False),
    sa.Column('breed', sa.String(length=100), nullable=False),
    sa.Column('size', sa.String(length=20), nullable=False),
    sa.Column('age_years', sa.Integer(), nullable=False),
    sa.Column('city', sa.String(length=100), nullable=False),
    sa.Column('description', sa.Text(), nullable=False),
    sa.Column('image_url', sa.String(length=500), nullable=False),
    sa.Column('donor_name', sa.String(length=120), nullable=False),
    sa.Column('status', sa.String(length=30), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    sa.CheckConstraint("size IN ('small', 'medium', 'large')", name='ck_pets_size'),
    sa.CheckConstraint("status IN ('available', 'adoption_pending')", name='ck_pets_status'),
    sa.CheckConstraint('age_years >= 0', name='ck_pets_age'),
    sa.ForeignKeyConstraint(['owner_id'], ['users.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
    with op.batch_alter_table('pets', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_pets_owner_id'), ['owner_id'], unique=False)
        batch_op.create_index(batch_op.f('ix_pets_status'), ['status'], unique=False)

    op.create_table('adoptions',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('pet_id', sa.Integer(), nullable=False),
    sa.Column('user_id', sa.Integer(), nullable=False),
    sa.Column('message', sa.Text(), nullable=False),
    sa.Column('status', sa.String(length=20), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    sa.CheckConstraint("status = 'pending'", name='ck_adoptions_status'),
    sa.ForeignKeyConstraint(['pet_id'], ['pets.id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('pet_id', name='uq_adoptions_pet')
    )
    with op.batch_alter_table('adoptions', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_adoptions_pet_id'), ['pet_id'], unique=False)
        batch_op.create_index(batch_op.f('ix_adoptions_user_id'), ['user_id'], unique=False)



def downgrade() -> None:
    with op.batch_alter_table('adoptions', schema=None) as batch_op:
        batch_op.drop_index(batch_op.f('ix_adoptions_user_id'))
        batch_op.drop_index(batch_op.f('ix_adoptions_pet_id'))

    op.drop_table('adoptions')
    with op.batch_alter_table('pets', schema=None) as batch_op:
        batch_op.drop_index(batch_op.f('ix_pets_status'))
        batch_op.drop_index(batch_op.f('ix_pets_owner_id'))

    op.drop_table('pets')
    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.drop_index(batch_op.f('ix_users_email'))

    op.drop_table('users')
