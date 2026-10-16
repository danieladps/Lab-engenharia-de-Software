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
    applicant_name: Mapped[str] = mapped_column(String(120))
    applicant_email: Mapped[str] = mapped_column(String(255))
    message: Mapped[str] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(20), default="pending")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    pet: Mapped["Pet"] = relationship(back_populates="adoptions")
