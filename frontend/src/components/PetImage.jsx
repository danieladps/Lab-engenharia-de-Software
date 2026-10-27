import { useState } from 'react'
import { PawPrint } from 'lucide-react'

// Mostra a foto do pet ou, se o link falhar, um fundo com uma pata.
export default function PetImage({ src, alt, className = '' }) {
  const [failed, setFailed] = useState(false)
  if (failed || !src) {
    return (
      <div className={`pet-image-fallback ${className}`} role="img" aria-label={alt}>
        <PawPrint size={34} aria-hidden="true" />
      </div>
    )
  }
  return <img className={className} src={src} alt={alt} loading="lazy" onError={() => setFailed(true)} />
}
