from datetime import datetime, timezone

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

# Tipos de aviso: pedido novo (para quem anunciou) e resposta ao pedido (para quem pediu).
NOTIFICATION_KINDS = ("adoption_requested", "adoption_approved", "adoption_rejected")


class Notification(Base):
    """Aviso dentro do app sobre um pedido de adoção."""

    __tablename__ = "notifications"
    __table_args__ = (
        CheckConstraint(
            "kind IN ('adoption_requested', 'adoption_approved', 'adoption_rejected')",
            name="ck_notifications_kind",
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    # Quem recebe o aviso.
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    adoption_id: Mapped[int] = mapped_column(ForeignKey("adoptions.id", ondelete="CASCADE"), index=True)
    kind: Mapped[str] = mapped_column(String(30))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    # Preenchido quando a pessoa abre a tela de avisos.
    read_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    adoption: Mapped["Adoption"] = relationship()
