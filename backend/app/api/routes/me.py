from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models import Adoption, Pet, User
from app.schemas import PetManagement

router = APIRouter(prefix="/me", tags=["Minha conta"])


@router.get("/pets", response_model=list[PetManagement])
def my_pets(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Anúncios do usuário logado, com os interesses recebidos em cada um."""
    pets = db.scalars(
        select(Pet)
        .options(selectinload(Pet.adoptions).selectinload(Adoption.user))
        .where(Pet.owner_id == user.id)
        .order_by(Pet.created_at.desc())
    ).all()
    return [{"pet": pet, "adoptions": pet.adoptions} for pet in pets]
