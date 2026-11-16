import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ClipboardList, LoaderCircle, Mail, MapPin, MessageCircle, PartyPopper } from 'lucide-react'
import api from '../api'
import PageHeader from '../components/PageHeader'
import PetImage from '../components/PetImage'
import EmptyState from '../components/EmptyState'
import { Stars, StarInput } from '../components/Stars'
import { useToast } from '../lib/toast'
import { adoptionStatusLabels, apiError } from '../lib/pets'

const formatDate = (value) => new Date(value).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })

// Quem adotou avalia o processo de adoção, uma vez, depois do pedido aprovado.
function ReviewForm({ request, onSaved }) {
  const toast = useToast()
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function submit(event) {
    event.preventDefault()
    if (!rating) {
      setError('Escolha uma nota de 1 a 5 estrelas.')
      return
    }
    setBusy(true)
    setError('')
    try {
      const { data } = await api.post(`/adoptions/${request.id}/review`, { rating, comment })
      onSaved(data)
      toast('Obrigado pela avaliação!')
    } catch (err) {
      setError(apiError(err, 'Não foi possível salvar a avaliação.'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className="form review-form" onSubmit={submit}>
      <strong>Como foi a adoção de {request.pet.name}?</strong>
      <StarInput value={rating} onChange={setRating} disabled={busy} />
      <label>Comentário (opcional)
        <textarea value={comment} onChange={(event) => setComment(event.target.value)} maxLength={500} rows={3} placeholder={`Conte como foi o contato com ${request.pet.donor_name}.`} disabled={busy} />
      </label>
      {error && <p className="inline-error" role="alert">{error}</p>}
      <button type="submit" className="button button-primary button-small" disabled={busy}>
        {busy ? <LoaderCircle className="spin" size={16} aria-hidden="true" /> : null} Enviar avaliação
      </button>
    </form>
  )
}

export default function MyRequests() {
  const [state, setState] = useState({ loading: true, items: [], error: '' })

  useEffect(() => {
    let active = true
    api.get('/me/adoptions')
      .then(({ data }) => { if (active) setState({ loading: false, items: data, error: '' }) })
      .catch((error) => { if (active) setState({ loading: false, items: [], error: apiError(error, 'Não foi possível carregar seus pedidos.') }) })
    return () => { active = false }
  }, [])

  const { loading, items, error } = state
  const saveReview = (id, review) => setState((current) => ({
    ...current,
    items: current.items.map((item) => (item.id === id ? { ...item, review } : item)),
  }))

  return (
    <main className="page page-narrow">
      <PageHeader title="Minhas solicitações" subtitle="Pedidos de adoção que você enviou." />
      {loading && <div className="loading-state"><LoaderCircle className="spin" size={22} /> Carregando...</div>}
      {error && <p className="inline-error" role="alert">{error}</p>}
      {!loading && !error && !items.length && (
        <EmptyState icon={ClipboardList} title="Você ainda não enviou nenhum pedido" action={<Link to="/" className="button button-primary">Ver pets disponíveis</Link>}>
          Quando você tocar em "Quero adotar" em um pet, o pedido aparece aqui.
        </EmptyState>
      )}
      <ul className="my-requests">
        {items.map((request) => (
          <li key={request.id} className="my-pet">
            <Link to={`/pets/${request.pet.id}`} className="my-pet-head">
              <PetImage src={request.pet.image_url} alt="" className="my-pet-photo" />
              <span className="my-pet-name">
                <strong>{request.pet.name}</strong>
                <small><MapPin size={12} aria-hidden="true" /> {request.pet.city}, com {request.pet.donor_name}</small>
              </span>
              <span className={`status status-request-${request.status}`}>{adoptionStatusLabels[request.status] ?? request.status}</span>
            </Link>
            {request.owner_contact && (
              <div className="request-result request-approved">
                <PartyPopper size={18} aria-hidden="true" />
                <div>
                  <strong>Pedido aprovado!</strong>
                  <p>Combine a adoção de {request.pet.name} com {request.owner_contact.name}:</p>
                  <a href={`mailto:${request.owner_contact.email}?subject=${encodeURIComponent(`Adoção de ${request.pet.name}`)}`}><Mail size={14} aria-hidden="true" /> {request.owner_contact.email}</a>
                </div>
              </div>
            )}
            {request.status === 'approved' && (request.review ? (
              <div className="request-result review-done">
                <span>Sua avaliação: <Stars value={request.review.rating} /></span>
                {request.review.comment && <p>{request.review.comment}</p>}
              </div>
            ) : (
              <ReviewForm request={request} onSaved={(review) => saveReview(request.id, review)} />
            ))}
            {request.status === 'rejected' && (
              <p className="request-result request-rejected">{request.pet.donor_name} recusou este pedido. Que tal conhecer outros pets?</p>
            )}
            <div className="request-sent">
              <time dateTime={request.created_at}>Enviado em {formatDate(request.created_at)}{request.decided_at ? `, respondido em ${formatDate(request.decided_at)}` : ''}</time>
              <p>{request.message}</p>
              <Link to={`/mensagens/${request.id}`} className="button button-ghost button-small request-chat"><MessageCircle size={16} aria-hidden="true" /> Conversar com {request.pet.donor_name}</Link>
            </div>
          </li>
        ))}
      </ul>
    </main>
  )
}
