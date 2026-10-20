from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.db.session import get_db
from app.models import Pet
from app.schemas import PetManagement

router = APIRouter(prefix="/manage", tags=["Gerenciamento do anúncio"])


@router.get("/{manage_token}", response_model=PetManagement)
def get_pet_management(manage_token: str, db: Session = Depends(get_db)):
    """Mostra o anúncio e os interesses recebidos para quem tem o código de gerenciamento."""
    pet = db.scalar(
        select(Pet).options(selectinload(Pet.adoptions)).where(Pet.manage_token == manage_token)
    )
    if pet is None:
        raise HTTPException(status_code=404, detail="Código de gerenciamento inválido.")
    return {"pet": pet, "adoptions": pet.adoptions}
