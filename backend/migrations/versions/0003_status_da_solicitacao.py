"""Pedidos podem ser aprovados ou recusados; pets podem ficar adotados.

- adoptions.status aceita pending, approved e rejected; nova coluna decided_at.
- Sai a regra "um pedido por pet para sempre" (uq_adoptions_pet). Entram:
  uq_adoptions_pet_user (cada pessoa pede cada pet uma vez) e
  uq_adoptions_pet_active (no máximo um pedido em aberto ou aprovado por pet).
- pets.status aceita também adopted.

Os pedidos que já existem continuam pending; nenhum dado é apagado.

Revision ID: 0003
Revises: 0002
Create Date: 2026-11-03
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0003"
down_revision: Union[str, Sequence[str], None] = "0002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

ACTIVE = "status IN ('pending', 'approved')"


def upgrade() -> None:
    with op.batch_alter_table("adoptions") as batch_op:
        batch_op.add_column(sa.Column("decided_at", sa.DateTime(timezone=True), nullable=True))
        batch_op.drop_constraint("ck_adoptions_status", type_="check")
        batch_op.create_check_constraint("ck_adoptions_status", "status IN ('pending', 'approved', 'rejected')")
        batch_op.drop_constraint("uq_adoptions_pet", type_="unique")
        batch_op.create_unique_constraint("uq_adoptions_pet_user", ["pet_id", "user_id"])
    op.create_index(
        "uq_adoptions_pet_active", "adoptions", ["pet_id"], unique=True,
        sqlite_where=sa.text(ACTIVE), postgresql_where=sa.text(ACTIVE),
    )

    with op.batch_alter_table("pets") as batch_op:
        batch_op.drop_constraint("ck_pets_status", type_="check")
        batch_op.create_check_constraint("ck_pets_status", "status IN ('available', 'adoption_pending', 'adopted')")


def downgrade() -> None:
    # Volta ao modelo antigo: decisões viram pedidos em aberto e pets adotados voltam a "pedido recebido".
    # Pedidos recusados são apagados, porque o modelo antigo só aceitava um pedido por pet.
    op.execute("UPDATE pets SET status = 'adoption_pending' WHERE status = 'adopted'")
    op.execute("DELETE FROM adoptions WHERE status = 'rejected'")
    op.execute("UPDATE adoptions SET status = 'pending' WHERE status = 'approved'")

    with op.batch_alter_table("pets") as batch_op:
        batch_op.drop_constraint("ck_pets_status", type_="check")
        batch_op.create_check_constraint("ck_pets_status", "status IN ('available', 'adoption_pending')")

    op.drop_index("uq_adoptions_pet_active", table_name="adoptions")
    with op.batch_alter_table("adoptions") as batch_op:
        batch_op.drop_constraint("uq_adoptions_pet_user", type_="unique")
        batch_op.create_unique_constraint("uq_adoptions_pet", ["pet_id"])
        batch_op.drop_constraint("ck_adoptions_status", type_="check")
        batch_op.create_check_constraint("ck_adoptions_status", "status = 'pending'")
        batch_op.drop_column("decided_at")
