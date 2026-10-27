import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Inbox, LoaderCircle, Mail, MapPin, PawPrint, Plus } from 'lucide-react'
import api from '../api'
import PageHeader from '../components/PageHeader'
import PetImage from '../components/PetImage'
import EmptyState from '../components/EmptyState'
import { apiError, sizeLabels, statusLabels } from '../lib/pets'

export default function MyPets() {
  const [state, setState] = useState({ loading: true, items: [], error: '' })

  useEffect(() => {
    let active = true
    api.get('/me/pets')
      .then(({ data }) => { if (active) setState({ loading: false, items: data, error: '' }) })
      .catch((error) => { if (active) setState({ loading: false, items: [], error: apiError(error, 'Não foi possível carregar seus anúncios.') }) })
    return () => { active = false }
  }, [])

  const { loading, items, error } = state

  return (
    <main className="page page-narrow">
      <PageHeader title="Meus anúncios" subtitle="Seus pets e os pedidos de adoção recebidos." />
      {loading && <div className="loading-state"><LoaderCircle className="spin" size={22} /> Carregando...</div>}
      {error && <p className="inline-error" role="alert">{error}</p>}
      {!loading && !error && !items.length && (
        <EmptyState icon={PawPrint} title="Você ainda não anunciou nenhum pet" action={<Link to="/anunciar" className="button button-primary"><Plus size={16} aria-hidden="true" /> Anunciar um pet</Link>} />
      )}
      <div className="my-pets">
        {items.map(({ pet, adoptions }) => (
          <article key={pet.id} className="my-pet">
            <Link to={`/pets/${pet.id}`} className="my-pet-head">
              <PetImage src={pet.image_url} alt="" className="my-pet-photo" />
              <span className="my-pet-name">
                <strong>{pet.name}</strong>
                <small><MapPin size={12} aria-hidden="true" /> {pet.city}, porte {sizeLabels[pet.size]?.toLowerCase()}</small>
              </span>
              <span className={`status status-${pet.status}`}>{statusLabels[pet.status] ?? pet.status}</span>
            </Link>
            {adoptions.length ? (
              <ul className="requests">
                {adoptions.map((adoption) => (
                  <li key={adoption.id}>
                    <div className="request-head">
                      <strong>{adoption.applicant_name}</strong>
                      <time dateTime={adoption.created_at}>{new Date(adoption.created_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</time>
                    </div>
                    <a href={`mailto:${adoption.applicant_email}?subject=${encodeURIComponent(`Adoção de ${pet.name}`)}`}><Mail size={14} aria-hidden="true" /> {adoption.applicant_email}</a>
                    <p>{adoption.message}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="hint my-pet-empty"><Inbox size={14} aria-hidden="true" /> Nenhum pedido ainda.</p>
            )}
          </article>
        ))}
      </div>
    </main>
  )
}
