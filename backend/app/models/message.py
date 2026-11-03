from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Message(Base):
    """Mensagem trocada dentro de um pedido de adoção, entre quem pediu e quem anunciou."""

    __tablename__ = "messages"

    id: Mapped[int] = mapped_column(primary_key=True)
    adoption_id: Mapped[int] = mapped_column(ForeignKey("adoptions.id", ondelete="CASCADE"), index=True)
    sender_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    body: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    # Preenchido quando a outra pessoa abre a conversa.
    read_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    sender: Mapped["User"] = relationship()
