from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models import Photo, User
from app.schemas import PhotoRead

router = APIRouter(prefix="/photos", tags=["Fotos"])

# O site já reduz a foto antes de enviar (cerca de 200 KB); este é só o teto.
MAX_PHOTO_BYTES = 2 * 1024 * 1024


def _image_type(data: bytes) -> str | None:
    """Descobre o tipo pela assinatura do arquivo, sem confiar no nome ou no cabeçalho."""
    if data.startswith(b"\xff\xd8\xff"):
        return "image/jpeg"
    if data.startswith(b"\x89PNG\r\n\x1a\n"):
        return "image/png"
    if data[:4] == b"RIFF" and data[8:12] == b"WEBP":
        return "image/webp"
    return None


@router.post("", response_model=PhotoRead, status_code=status.HTTP_201_CREATED)
async def upload_photo(request: Request, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Recebe a foto no corpo da requisição (JPEG, PNG ou WebP, até 2 MB) e devolve o endereço dela."""
    data = bytearray()
    async for chunk in request.stream():
        data.extend(chunk)
        if len(data) > MAX_PHOTO_BYTES:
            raise HTTPException(status_code=413, detail="A foto passou de 2 MB. Escolha uma imagem menor.")
    content_type = _image_type(bytes(data))
    if content_type is None:
        raise HTTPException(status_code=415, detail="Envie uma foto em JPG, PNG ou WebP.")
    photo = Photo(owner_id=user.id, content_type=content_type, data=bytes(data))
    db.add(photo)
    db.commit()
    return PhotoRead(id=photo.id, url=f"/api/photos/{photo.id}")


@router.get("/{photo_id}")
def get_photo(photo_id: int, db: Session = Depends(get_db)):
    """Mostra a foto. É pública, como o anúncio em que ela aparece."""
    photo = db.get(Photo, photo_id)
    if photo is None:
        raise HTTPException(status_code=404, detail="Foto não encontrada.")
    return Response(
        content=photo.data,
        media_type=photo.content_type,
        headers={
            # A foto nunca muda depois de enviada: o navegador pode guardar.
            "Cache-Control": "public, max-age=31536000, immutable",
            "X-Content-Type-Options": "nosniff",
        },
    )
