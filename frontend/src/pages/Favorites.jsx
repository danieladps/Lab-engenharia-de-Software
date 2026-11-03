import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Heart, LoaderCircle, LogIn } from 'lucide-react'
import PetCard from '../components/PetCard'
import EmptyState from '../components/EmptyState'
import { useAuth } from '../lib/auth'
import { useFavorites } from '../lib/favorites'

export default function Favorites() {
  const { user, checking } = useAuth()
  const { pets, loaded, refresh } = useFavorites()

  // Busca de novo ao abrir, para mostrar o status atual de cada pet.
  useEffect(() => { refresh() }, [refresh])

  if (!checking && !user) {
    return (
      <main className="page">
        <h1 className="page-title">Favoritos</h1>
        <EmptyState icon={LogIn} title="Entre para ver seus favoritos" action={<Link to="/entrar?volta=%2Ffavoritos" className="button button-primary">Entrar</Link>}>
          Toque no coração de um pet para salvá-lo aqui.
        </EmptyState>
      </main>
    )
  }

  return (
    <main className="page">
      <h1 className="page-title">Meus favoritos</h1>
      <p className="page-lead">{loaded ? `${pets.length} ${pets.length === 1 ? 'pet salvo' : 'pets salvos'}` : '\u00a0'}</p>
      {!loaded ? (
        <div className="loading-state"><LoaderCircle className="spin" size={22} /> Carregando...</div>
      ) : pets.length ? (
        <div className="pet-grid">{pets.map((pet) => <PetCard key={pet.id} pet={pet} />)}</div>
      ) : (
        <EmptyState icon={Heart} title="Nenhum pet salvo ainda" action={<Link to="/" className="button button-primary">Ver pets disponíveis</Link>}>
          Toque no coração de um pet para salvá-lo aqui.
        </EmptyState>
      )}
    </main>
  )
}
