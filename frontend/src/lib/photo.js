// Reduz a foto no navegador antes de enviar: no máximo 1200 px no lado maior, em JPEG.
// Uma foto de celular (3 a 8 MB) vira algo perto de 200 KB.
const MAX_SIDE = 1200
const QUALITY = 0.82

async function loadImage(file) {
  if ('createImageBitmap' in window) {
    // Respeita a rotação gravada pela câmera do celular.
    return createImageBitmap(file, { imageOrientation: 'from-image' })
  }
  const url = URL.createObjectURL(file)
  try {
    const image = new Image()
    image.src = url
    await image.decode()
    return image
  } finally {
    URL.revokeObjectURL(url)
  }
}

export async function shrinkPhoto(file) {
  const image = await loadImage(file)
  const scale = Math.min(1, MAX_SIDE / Math.max(image.width, image.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(image.width * scale)
  canvas.height = Math.round(image.height * scale)
  canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height)
  image.close?.()
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', QUALITY))
  if (!blob) throw new Error('Não foi possível ler esta foto.')
  return blob
}
