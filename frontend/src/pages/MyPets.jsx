import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, Inbox, LoaderCircle, Mail, MapPin, PawPrint, Plus, X } from 'lucide-react'
import api from '../api'
import PageHeader from '../components/PageHeader'
import PetImage from '../components/PetImage'
import EmptyState from '../components/EmptyState'
import Sheet from '../components/Sheet'
import { useToast } from '../lib/toast'
import { adoptionStatusLabels, apiError, firstName, sizeLabels, statusLabels } from '../lib/pets'

const formatDate = (value) => new Date(value).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })

export default function MyPets() {
  const toast = useToast()
  const [state, setState] = useState({ loading: true, items: [], error: '' })
  // Pedido que está sendo aprovado ou recusado: { pet, adoption, status }.
  const [deciding, setDeciding] = useState(null)
  const [busy, setBusy] = useState(false)
  const [decisionError, setDecisionError] = useState('')

  useEffect(() => {
    let active = true
    api.get('/me/pets')
      .then(({ data }) => { if (active) setState({ loading: false, items: data, error: '' }) })
      .catch((error) => { if (active) setState({ loading: false, items: [], error: apiError(error, 'Não foi possível carregar seus anúncios.') }) })
    return () => { active = false }
  }, [])

  function openDecision(pet, adoption, status) {
    setDecisionError('')
    setDeciding({ pet, adoption, status })
  }

  async function confirmDecision() {
    const { pet, adoption, status } = deciding
    setBusy(true)
    setDecisionError('')
    try {
      const { data } = await api.patch(`/adoptions/${adoption.id}`, { status })
      const petStatus = status === 'approved' ? 'adopted' : 'available'
      setState((current) => ({
        ...current,
        items: current.items.map((item) => (item.pet.id !== pet.id ? item : {
          pet: { ...item.pet, status: petStatus },
          adoptions: item.adoptions.map((a) => (a.id === data.id ? data : a)),
        })),
      }))
      setDeciding(null)
      toast(status === 'approved'
        ? `Pedido aprovado! ${firstName(adoption.applicant_name)} vai ver seu e-mail para combinarem.`
        : `Pedido recusado. ${pet.name} voltou para a busca.`)
    } catch (error) {
      setDecisionError(apiError(error, 'Não foi possível salvar a resposta.'))
    } finally {
      setBusy(false)
    }
  }

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
                  <li key={adoption.id} className={adoption.status !== 'pending' ? 'request-decided' : undefined}>
                    <div className="request-head">
                      <strong>{adoption.applicant_name}</strong>
                      {adoption.status === 'pending'
                        ? <time dateTime={adoption.created_at}>{formatDate(adoption.created_at)}</time>
                        : <span className={`status status-request-${adoption.status}`}>{adoptionStatusLabels[adoption.status]}</span>}
                    </div>
                    <a href={`mailto:${adoption.applicant_email}?subject=${encodeURIComponent(`Adoção de ${pet.name}`)}`}><Mail size={14} aria-hidden="true" /> {adoption.applicant_email}</a>
                    <p>{adoption.message}</p>
                    {adoption.status === 'pending' && (
                      <div className="decision-actions">
                        <button type="button" className="button button-ghost button-small" onClick={() => openDecision(pet, adoption, 'rejected')}><X size={16} aria-hidden="true" /> Recusar</button>
                        <button type="button" className="button button-primary button-small" onClick={() => openDecision(pet, adoption, 'approved')}><Check size={16} aria-hidden="true" /> Aprovar</button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="hint my-pet-empty"><Inbox size={14} aria-hidden="true" /> Nenhum pedido ainda.</p>
            )}
          </article>
        ))}
      </div>

      {deciding && (
        <Sheet
          title={deciding.status === 'approved' ? `Aprovar o pedido de ${firstName(deciding.adoption.applicant_name)}?` : `Recusar o pedido de ${firstName(deciding.adoption.applicant_name)}?`}
          onClose={() => !busy && setDeciding(null)}
        >
          <div className="form">
            <p className="sheet-text">
              {deciding.status === 'approved'
                ? `${deciding.pet.name} sai da busca e fica como adotado. ${deciding.adoption.applicant_name} vai ver o seu e-mail para vocês combinarem a adoção.`
                : `${deciding.pet.name} volta para a busca e pode receber pedidos de outras pessoas. ${deciding.adoption.applicant_name} vai ver o pedido como recusado.`}
            </p>
            <p className="hint">Essa resposta não pode ser desfeita.</p>
            {decisionError && <p className="inline-error" role="alert">{decisionError}</p>}
            <div className="form-actions">
              <button type="button" className="button button-ghost" onClick={() => setDeciding(null)} disabled={busy}>Cancelar</button>
              <button type="button" className="button button-primary" onClick={confirmDecision} disabled={busy}>
                {busy && <LoaderCircle className="spin" size={18} />} {deciding.status === 'approved' ? 'Aprovar pedido' : 'Recusar pedido'}
              </button>
            </div>
          </div>
        </Sheet>
      )}
    </main>
  )
}
