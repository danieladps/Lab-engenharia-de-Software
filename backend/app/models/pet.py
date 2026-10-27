from datetime import datetime, timezone

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Pet(Base):
    __tablename__ = "pets"
    __table_args__ = (
        CheckConstraint("size IN ('small', 'medium', 'large')", name="ck_pets_size"),
        CheckConstraint("age_years >= 0", name="ck_pets_age"),
        CheckConstraint("status IN ('available', 'adoption_pending')", name="ck_pets_status"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    owner_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    name: Mapped[str] = mapped_column(String(100))
    species: Mapped[str] = mapped_column(String(30))
    breed: Mapped[str] = mapped_column(String(100))
    size: Mapped[str] = mapped_column(String(20))
    age_years: Mapped[int] = mapped_column(Integer)
    city: Mapped[str] = mapped_column(String(100))
    description: Mapped[str] = mapped_column(Text)
    image_url: Mapped[str] = mapped_column(String(500))
    # Nome exibido no anúncio (a pessoa ou o abrigo responsável).
    donor_name: Mapped[str] = mapped_column(String(120))
    status: Mapped[str] = mapped_column(String(30), default="available", index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    owner: Mapped["User"] = relationship(back_populates="pets")
    adoptions: Mapped[list["Adoption"]] = relationship(back_populates="pet", cascade="all, delete-orphan")
