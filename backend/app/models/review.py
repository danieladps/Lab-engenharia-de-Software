from datetime import datetime, timezone

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Integer, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Review(Base):
    """Avaliação do processo de adoção, feita por quem adotou depois do pedido aprovado."""

    __tablename__ = "reviews"
    __table_args__ = (CheckConstraint("rating BETWEEN 1 AND 5", name="ck_reviews_rating"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    # Uma avaliação por pedido.
    adoption_id: Mapped[int] = mapped_column(ForeignKey("adoptions.id", ondelete="CASCADE"), unique=True)
    rating: Mapped[int] = mapped_column(Integer)
    comment: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    adoption: Mapped["Adoption"] = relationship(back_populates="review")
