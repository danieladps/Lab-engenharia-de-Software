from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.api.routes import adoptions, auth, me, pets
from app.core.config import settings
from app.db.session import get_db


app = FastAPI(
    title="PetLume API",
    version="0.2.0",
    description="API da plataforma de adoção responsável de pets.",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in settings.cors_origins.split(",") if origin.strip()],
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(auth.router, prefix="/api")
app.include_router(me.router, prefix="/api")
app.include_router(pets.router, prefix="/api")
app.include_router(adoptions.router, prefix="/api")


@app.get("/api/health", tags=["Infraestrutura"])
def health(db: Session = Depends(get_db)):
    db.execute(text("SELECT 1"))
    return {"status": "ok", "database": "connected"}
