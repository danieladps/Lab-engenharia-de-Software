import { Link } from 'react-router-dom'
import { MapPin } from 'lucide-react'
import FavoriteButton from './FavoriteButton'
import PetImage from './PetImage'
import { ageLabel, sizeLabels, statusLabels } from '../lib/pets'

export default function PetCard({ pet }) {
  const available = pet.status === 'available'
  return (
    // O coração fica fora do link para não ter um botão dentro de outro elemento clicável.
    <article className="pet-card">
      <Link to={`/pets/${pet.id}`} className="pet-card-link" aria-label={`Ver ${pet.name}, ${pet.breed}`}>
        <div className="pet-card-photo">
          <PetImage src={pet.image_url} alt="" />
          <span className={`species-badge species-${pet.species === 'Gato' ? 'cat' : pet.species === 'Cão' ? 'dog' : 'other'}`}>{pet.species}</span>
        </div>
        <div className="pet-card-body">
          <div className="pet-card-title">
            <h3>{pet.name}</h3>
            <span>{ageLabel(pet.age_years)}</span>
          </div>
          <p className="pet-card-breed">{pet.breed}</p>
          <p className="pet-card-city"><MapPin size={13} aria-hidden="true" /> {pet.city}</p>
          {available
            ? <span className="size-tag">Porte {sizeLabels[pet.size]?.toLowerCase()}</span>
            : <span className="size-tag tag-pending">{statusLabels[pet.status] ?? pet.status}</span>}
        </div>
      </Link>
      <FavoriteButton pet={pet} className="card-favorite" />
    </article>
  )
}
