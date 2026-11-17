import { useState } from 'react'
import { PawPrint } from 'lucide-react'
import { mediaUrl } from '../api'

// Mostra a foto do pet ou, se o link falhar, um fundo com uma pata.
// A falha vale só para aquele endereço: se a foto mudar, tenta de novo.
// Fotos enviadas pelo site ganham uma segunda tentativa, porque a API
// do plano gratuito pode estar "acordando" na primeira.
export default function PetImage({ src, alt, className = '' }) {
  const [attempt, setAttempt] = useState({ src, retries: 0, failed: false })
  const current = attempt.src === src ? attempt : { src, retries: 0, failed: false }

  function handleError() {
    const canRetry = src?.startsWith('/api/') && current.retries === 0
    if (canRetry) {
      setTimeout(() => setAttempt({ src, retries: 1, failed: false }), 3000)
    } else {
      setAttempt({ src, retries: current.retries, failed: true })
    }
  }

  if (current.failed || !src) {
    return (
      <div className={`pet-image-fallback ${className}`} role="img" aria-label={alt}>
        <PawPrint size={34} aria-hidden="true" />
      </div>
    )
  }
  const url = mediaUrl(src)
  return (
    <img
      key={`${url}#${current.retries}`}
      className={className}
      src={current.retries ? `${url}?tentativa=${current.retries}` : url}
      alt={alt}
      loading="lazy"
      // Alguns sites bloqueiam fotos abertas a partir de outro site (pelo "Referer").
      referrerPolicy="no-referrer"
      onError={handleError}
    />
  )
}
