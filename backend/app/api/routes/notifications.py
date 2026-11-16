from datetime import datetime, timezone

from fastapi import APIRouter, Depends, status
from sqlalchemy import func, select, update
from sqlalchemy.orm import Session, selectinload

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models import Adoption, Notification, User
from app.schemas import ConversationPet, NotificationCount, NotificationRead

router = APIRouter(prefix="/me/notifications", tags=["Avisos"])

# A tela mostra só os avisos mais recentes.
LIST_LIMIT = 50


@router.get("", response_model=list[NotificationRead])
def my_notifications(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Avisos da conta logada, do mais novo para o mais antigo."""
    items = db.scalars(
        select(Notification)
        .options(selectinload(Notification.adoption).selectinload(Adoption.pet), selectinload(Notification.adoption).selectinload(Adoption.user))
        .where(Notification.user_id == user.id)
        .order_by(Notification.created_at.desc(), Notification.id.desc())
        .limit(LIST_LIMIT)
    ).all()
    return [
        NotificationRead(
            id=item.id,
            kind=item.kind,
            adoption_id=item.adoption_id,
            pet=ConversationPet.model_validate(item.adoption.pet, from_attributes=True),
            other_name=item.adoption.user.name if item.kind == "adoption_requested" else item.adoption.pet.donor_name,
            created_at=item.created_at,
            read=item.read_at is not None,
        )
        for item in items
    ]


@router.get("/unread", response_model=NotificationCount)
def unread_count(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Quantos avisos ainda não foram vistos, para o número no menu."""
    total = db.scalar(select(func.count(Notification.id)).where(Notification.user_id == user.id, Notification.read_at.is_(None)))
    return NotificationCount(unread=total or 0)


@router.post("/read", status_code=status.HTTP_204_NO_CONTENT)
def mark_all_read(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Marca todos os avisos da conta logada como vistos."""
    db.execute(
        update(Notification)
        .where(Notification.user_id == user.id, Notification.read_at.is_(None))
        .values(read_at=datetime.now(timezone.utc))
    )
    db.commit()
