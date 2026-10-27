from datetime import datetime, timezone

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Adoption(Base):
    __tablename__ = "adoptions"
    __table_args__ = (
        CheckConstraint("status = 'pending'", name="ck_adoptions_status"),
        UniqueConstraint("pet_id", name="uq_adoptions_pet"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    pet_id: Mapped[int] = mapped_column(ForeignKey("pets.id", ondelete="CASCADE"), index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    message: Mapped[str] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(20), default="pending")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    pet: Mapped["Pet"] = relationship(back_populates="adoptions")
    user: Mapped["User"] = relationship(back_populates="adoptions")

    # Nome e e-mail vêm da conta de quem pediu; só o dono do anúncio recebe esses dados.
    @property
    def applicant_name(self) -> str:
        return self.user.name

    @property
    def applicant_email(self) -> str:
        return self.user.email
