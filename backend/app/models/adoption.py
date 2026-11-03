from datetime import datetime, timezone

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Index, String, Text, UniqueConstraint, text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Adoption(Base):
    __tablename__ = "adoptions"
    __table_args__ = (
        CheckConstraint("status IN ('pending', 'approved', 'rejected')", name="ck_adoptions_status"),
        # A mesma pessoa pede cada pet uma vez só (inclusive depois de recusada).
        UniqueConstraint("pet_id", "user_id", name="uq_adoptions_pet_user"),
        # Um pet tem no máximo um pedido em aberto ou aprovado; recusados não contam.
        Index(
            "uq_adoptions_pet_active",
            "pet_id",
            unique=True,
            sqlite_where=text("status IN ('pending', 'approved')"),
            postgresql_where=text("status IN ('pending', 'approved')"),
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    pet_id: Mapped[int] = mapped_column(ForeignKey("pets.id", ondelete="CASCADE"), index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    message: Mapped[str] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(20), default="pending")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    decided_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    pet: Mapped["Pet"] = relationship(back_populates="adoptions")
    user: Mapped["User"] = relationship(back_populates="adoptions")

    # Nome e e-mail vêm da conta de quem pediu; só o dono do anúncio recebe esses dados.
    @property
    def applicant_name(self) -> str:
        return self.user.name

    @property
    def applicant_email(self) -> str:
        return self.user.email
