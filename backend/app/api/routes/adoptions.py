from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models import Adoption, Pet, User
from app.schemas import AdoptionCreate, AdoptionRead

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
    if pet.status != "available":
        raise HTTPException(status_code=409, detail="Este pet não está mais disponível.")
    adoption = Adoption(
        pet=pet,
        user=user,
        message=payload.message.strip(),
    )
    pet.status = "adoption_pending"
    db.add(adoption)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Este pet já recebeu uma solicitação de adoção.") from None
    db.refresh(adoption)
    return adoption
