from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, LargeBinary, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Photo(Base):
    """Foto enviada pelo site, guardada no próprio banco.

    No Render gratuito o disco do servidor é apagado a cada deploy, então a foto
    fica no Postgres. O anúncio aponta para ela pelo endereço /api/photos/{id}.
    """

    __tablename__ = "photos"

    id: Mapped[int] = mapped_column(primary_key=True)
    # Quem enviou a foto.
    owner_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    content_type: Mapped[str] = mapped_column(String(20))
    data: Mapped[bytes] = mapped_column(LargeBinary)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
