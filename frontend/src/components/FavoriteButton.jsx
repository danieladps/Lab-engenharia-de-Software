import { useLocation, useNavigate } from 'react-router-dom'
import { Heart } from 'lucide-react'
import { useAuth } from '../lib/auth'
import { useFavorites } from '../lib/favorites'

export default function FavoriteButton({ pet, className = '' }) {
  const { user } = useAuth()
  const { ids, toggle } = useFavorites()
  const navigate = useNavigate()
  const location = useLocation()
  const saved = ids.has(pet.id)

  function handleClick() {
    if (!user) {
      navigate(`/entrar?volta=${encodeURIComponent(location.pathname)}`)
      return
    }
    toggle(pet)
  }

  return (
    <button
      type="button"
      className={`favorite-button${saved ? ' saved' : ''} ${className}`}
      onClick={handleClick}
      aria-pressed={saved}
      aria-label={saved ? `Remover ${pet.name} dos favoritos` : `Salvar ${pet.name} nos favoritos`}
    >
      <Heart size={18} aria-hidden="true" />
    </button>
  )
}
