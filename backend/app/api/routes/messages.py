from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, or_, select, update
from sqlalchemy.orm import Session, selectinload

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models import Adoption, Message, Pet, User
from app.schemas import ConversationDetail, ConversationSummary, MessageCreate, MessageRead

router = APIRouter(tags=["Mensagens"])


def _participant_adoption(adoption_id: int, user: User, db: Session) -> Adoption:
    """Pedido em que o usuário é quem pediu ou o dono do pet. Para os outros, "não existe"."""
    adoption = db.scalar(
        select(Adoption)
        .options(selectinload(Adoption.pet).selectinload(Pet.owner), selectinload(Adoption.user))
        .where(Adoption.id == adoption_id)
    )
    if adoption is None or user.id not in (adoption.user_id, adoption.pet.owner_id):
        raise HTTPException(status_code=404, detail="Conversa não encontrada.")
    return adoption


def _context(adoption: Adoption, user: User) -> dict:
    is_owner = adoption.pet.owner_id == user.id
    return {
        "adoption_id": adoption.id,
        "status": adoption.status,
        "role": "owner" if is_owner else "adopter",
        # Quem pediu vê o nome exibido no anúncio; o dono vê o nome de quem pediu.
        "other_name": adoption.user.name if is_owner else adoption.pet.donor_name,
        "pet": {
            "id": adoption.pet.id,
            "name": adoption.pet.name,
            "image_url": adoption.pet.image_url,
            "status": adoption.pet.status,
        },
    }


def _message_out(message: Message, user: User) -> dict:
    return {
        "id": message.id,
        "body": message.body,
        "created_at": message.created_at,
        "mine": message.sender_id == user.id,
        "sender_name": message.sender.name,
    }


@router.get("/me/conversations", response_model=list[ConversationSummary])
def my_conversations(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Conversas de todos os pedidos em que o usuário participa (como quem pediu ou como dono)."""
    adoptions = db.scalars(
        select(Adoption)
        .join(Adoption.pet)
        .options(selectinload(Adoption.pet), selectinload(Adoption.user))
        .where(or_(Adoption.user_id == user.id, Pet.owner_id == user.id))
    ).all()
    if not adoptions:
        return []
    ids = [adoption.id for adoption in adoptions]

    # Última mensagem de cada conversa.
    last_ids = select(func.max(Message.id)).where(Message.adoption_id.in_(ids)).group_by(Message.adoption_id)
    last_messages = {m.adoption_id: m for m in db.scalars(select(Message).where(Message.id.in_(last_ids))).all()}
    # Quantas mensagens da outra pessoa ainda não foram lidas.
    unread = dict(
        db.execute(
            select(Message.adoption_id, func.count())
            .where(Message.adoption_id.in_(ids), Message.sender_id != user.id, Message.read_at.is_(None))
            .group_by(Message.adoption_id)
        ).all()
    )

    summaries = []
    for adoption in adoptions:
        last = last_messages.get(adoption.id)
        summaries.append(
            {
                **_context(adoption, user),
                "last_message": (
                    {"body": last.body, "created_at": last.created_at, "mine": last.sender_id == user.id} if last else None
                ),
                "unread": unread.get(adoption.id, 0),
                "updated_at": last.created_at if last else adoption.created_at,
            }
        )
    # Conversa com atividade mais recente primeiro.
    summaries.sort(key=lambda item: (item["updated_at"].replace(tzinfo=None), item["adoption_id"]), reverse=True)
    return summaries


@router.get("/adoptions/{adoption_id}/messages", response_model=ConversationDetail)
def read_conversation(adoption_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Abre a conversa e marca como lidas as mensagens recebidas."""
    adoption = _participant_adoption(adoption_id, user, db)
    db.execute(
        update(Message)
        .where(Message.adoption_id == adoption.id, Message.sender_id != user.id, Message.read_at.is_(None))
        .values(read_at=datetime.now(timezone.utc))
    )
    db.commit()
    messages = db.scalars(
        select(Message).options(selectinload(Message.sender)).where(Message.adoption_id == adoption.id).order_by(Message.id)
    ).all()
    return {
        **_context(adoption, user),
        "request_message": adoption.message,
        "request_sent_at": adoption.created_at,
        "can_send": adoption.status != "rejected",
        "messages": [_message_out(message, user) for message in messages],
    }


@router.post("/adoptions/{adoption_id}/messages", response_model=MessageRead, status_code=status.HTTP_201_CREATED)
def send_message(
    adoption_id: int,
    payload: MessageCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    adoption = _participant_adoption(adoption_id, user, db)
    if adoption.status == "rejected":
        raise HTTPException(status_code=409, detail="Este pedido foi recusado; a conversa fica só para leitura.")
    body = payload.body.strip()
    if not body:
        raise HTTPException(status_code=422, detail="Escreva uma mensagem.")
    message = Message(adoption_id=adoption.id, sender_id=user.id, body=body)
    db.add(message)
    db.commit()
    db.refresh(message)
    return _message_out(message, user)
