from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

EMAIL_PATTERN = r"^[^@\s]+@[^@\s]+\.[^@\s]+$"


class UserCreate(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    email: str = Field(min_length=5, max_length=255, pattern=EMAIL_PATTERN)
    password: str = Field(min_length=8, max_length=128)
    city: str = Field(min_length=2, max_length=100)


class LoginRequest(BaseModel):
    email: str = Field(min_length=5, max_length=255)
    password: str = Field(min_length=1, max_length=128)


class UserRead(BaseModel):
    id: int
    name: str
    email: str
    city: str
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class TokenResponse(BaseModel):
    access_token: str
    token_type: Literal["bearer"] = "bearer"
    user: UserRead


class PetCreate(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    species: Literal["Cão", "Gato", "Outro"]
    breed: str = Field(min_length=2, max_length=100)
    size: Literal["small", "medium", "large"]
    age_years: int = Field(ge=0, le=30)
    city: str = Field(min_length=2, max_length=100)
    description: str = Field(min_length=10, max_length=2000)
    image_url: str = Field(min_length=8, max_length=500)
    donor_name: str = Field(min_length=2, max_length=120)


class PetRead(BaseModel):
    id: int
    name: str
    species: str
    breed: str
    size: str
    age_years: int
    city: str
    description: str
    image_url: str
    status: str
    donor_name: str
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class AdoptionCreate(BaseModel):
    message: str = Field(min_length=10, max_length=2000)


class AdoptionRead(BaseModel):
    id: int
    pet_id: int
    applicant_name: str
    applicant_email: str
    message: str
    status: str
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class PetManagement(BaseModel):
    pet: PetRead
    adoptions: list[AdoptionRead]
