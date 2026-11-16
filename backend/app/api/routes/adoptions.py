from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, selectinload

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models import Adoption, Notification, Pet, Review, User
from app.schemas import AdoptionCreate, AdoptionDecision, AdoptionRead, ReviewCreate, ReviewRead

router = APIRouter(tags=["Solicitações de adoção"])


@router.post("/pets/{pet_id}/adoptions", response_model=AdoptionRead, status_code=status.HTTP_201_CREATED)
def request_adoption(
    pet_id: int,
    payload: AdoptionCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    pet = db.scalar(select(Pet).where(Pet.id == pet_id))
    if pet is None:
        raise HTTPException(status_code=404, detail="Pet não encontrado.")
    if pet.owner_id == user.id:
        raise HTTPException(status_code=400, detail="Você não pode pedir para adotar o seu próprio pet.")
    already_asked = db.scalar(select(Adoption.id).where(Adoption.pet_id == pet.id, Adoption.user_id == user.id))
    if already_asked is not None:
        raise HTTPException(status_code=409, detail="Você já enviou um pedido para este pet. Acompanhe em Minhas solicitações.")
    if pet.status != "available":
        raise HTTPException(status_code=409, detail="Este pet não está mais disponível.")
    adoption = Adoption(
        pet=pet,
        user=user,
        message=payload.message.strip(),
    )
    pet.status = "adoption_pending"
    db.add(adoption)
    # Avisa quem anunciou que chegou um pedido.
    db.add(Notification(user_id=pet.owner_id, adoption=adoption, kind="adoption_requested"))
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Este pet já recebeu uma solicitação de adoção.") from None
    db.refresh(adoption)
    return adoption


@router.patch("/adoptions/{adoption_id}", response_model=AdoptionRead)
def decide_adoption(
    adoption_id: int,
    payload: AdoptionDecision,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """O dono do anúncio aprova ou recusa um pedido em aberto."""
    adoption = db.scalar(
        select(Adoption).options(selectinload(Adoption.pet), selectinload(Adoption.user)).where(Adoption.id == adoption_id)
    )
    # Para quem não é o dono, o pedido "não existe": não revela pedidos de outras pessoas.
    if adoption is None or adoption.pet.owner_id != user.id:
        raise HTTPException(status_code=404, detail="Pedido não encontrado.")
    if adoption.status != "pending":
        raise HTTPException(status_code=409, detail="Este pedido já foi respondido.")

    adoption.status = payload.status
    adoption.decided_at = datetime.now(timezone.utc)
    # Aprovado: o pet foi adotado. Recusado: o pet volta para a busca.
    adoption.pet.status = "adopted" if payload.status == "approved" else "available"
    # Avisa quem pediu sobre a resposta.
    db.add(Notification(user_id=adoption.user_id, adoption=adoption, kind=f"adoption_{payload.status}"))
    db.commit()
    db.refresh(adoption)
    return adoption


@router.post("/adoptions/{adoption_id}/review", response_model=ReviewRead, status_code=status.HTTP_201_CREATED)
def review_adoption(
    adoption_id: int,
    payload: ReviewCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Quem adotou avalia o processo de adoção (uma vez, depois do pedido aprovado)."""
    adoption = db.scalar(select(Adoption).options(selectinload(Adoption.review)).where(Adoption.id == adoption_id))
    # Só quem fez o pedido pode avaliar; para os outros, o pedido "não existe".
    if adoption is None or adoption.user_id != user.id:
        raise HTTPException(status_code=404, detail="Pedido não encontrado.")
    if adoption.status != "approved":
        raise HTTPException(status_code=409, detail="Só dá para avaliar depois que o pedido for aprovado.")
    if adoption.review is not None:
        raise HTTPException(status_code=409, detail="Você já avaliou esta adoção.")
    comment = (payload.comment or "").strip() or None
    review = Review(adoption=adoption, rating=payload.rating, comment=comment)
    db.add(review)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Você já avaliou esta adoção.") from None
    db.refresh(review)
    return review
