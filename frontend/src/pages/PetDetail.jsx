import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Heart, House, LoaderCircle, Mail, MapPin, PawPrint } from 'lucide-react'
import api from '../api'
import PetImage from '../components/PetImage'
import Sheet from '../components/Sheet'
import EmptyState from '../components/EmptyState'
import { useAuth } from '../lib/auth'
import { useToast } from '../lib/toast'
import { ageLabel, apiError, sizeLabels } from '../lib/pets'

export default function PetDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const toast = useToast()
  const [state, setState] = useState({ id: null, pet: null, error: '' })
  const [asking, setAsking] = useState(false)
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState('')

  const loading = state.id !== id

  useEffect(() => {
    let active = true
    api.get(`/pets/${id}`)
      .then(({ data }) => { if (active) setState({ id, pet: data, error: '' }) })
      .catch((error) => {
        if (active) setState({ id, pet: null, error: error.response?.status === 404 ? 'not-found' : apiError(error, 'Não foi possível carregar este pet.') })
      })
    return () => { active = false }
  }, [id])

  function startAdoption() {
    if (!user) {
      navigate(`/entrar?volta=${encodeURIComponent(`/pets/${id}`)}`)
      return
    }
    setSendError('')
    setAsking(true)
  }

  async function sendInterest(event) {
    event.preventDefault()
    setSending(true)
    setSendError('')
    try {
      await api.post(`/pets/${id}/adoptions`, { message: new FormData(event.currentTarget).get('message') })
      toast(`Pedido enviado! ${state.pet.donor_name} vai receber seu contato.`)
      navigate('/')
    } catch (error) {
      setSendError(apiError(error, 'Não foi possível enviar o pedido.'))
    } finally {
      setSending(false)
    }
  }

  if (loading) return <main className="page"><div className="loading-state"><LoaderCircle className="spin" size={22} /> Carregando...</div></main>
  if (state.error === 'not-found') {
    return (
      <main className="page">
        <EmptyState icon={PawPrint} title="Este pet não foi encontrado" action={<Link to="/" className="button button-primary">Ver pets disponíveis</Link>}>
          O anúncio pode ter sido removido ou o link está incompleto.
        </EmptyState>
      </main>
    )
  }
  if (state.error) return <main className="page"><p className="inline-error" role="alert">{state.error}</p></main>

  const { pet } = state
  const available = pet.status === 'available'

  return (
    <main className="pet-detail">
      <div className="detail-hero">
        <PetImage src={pet.image_url} alt={`Foto de ${pet.name}`} className="detail-photo" />
        <button type="button" className="icon-button detail-back" onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/'))} aria-label="Voltar"><ArrowLeft size={19} /></button>
        <div className="detail-name">
          <h1>{pet.name}</h1>
          <p>{pet.breed}</p>
        </div>
      </div>

      <div className="detail-body">
        <dl className="facts">
          <div><dt>Idade</dt><dd>{ageLabel(pet.age_years)}</dd></div>
          <div><dt>Porte</dt><dd>{sizeLabels[pet.size]}</dd></div>
          <div><dt>Espécie</dt><dd>{pet.species}</dd></div>
        </dl>

        <section>
          <h2>Sobre {pet.name}</h2>
          <p className="detail-description">{pet.description}</p>
        </section>

        <div className="owner-card">
          <span className="owner-icon"><House size={18} aria-hidden="true" /></span>
          <span className="owner-text"><small>Responsável</small><strong>{pet.donor_name}</strong></span>
          <span className="owner-city"><MapPin size={14} aria-hidden="true" /> {pet.city}</span>
        </div>

        <div className="detail-actions">
          {available ? (
            <button type="button" className="button button-primary button-block" onClick={startAdoption}>
              <Heart size={18} aria-hidden="true" /> Quero adotar
            </button>
          ) : (
            <p className="notice">{pet.name} já recebeu um pedido de adoção e não está aceitando novos.</p>
          )}
          {available && !user && <p className="hint">Você vai precisar entrar na sua conta para enviar o pedido.</p>}
        </div>
      </div>

      {asking && (
        <Sheet title={`Pedido para adotar ${pet.name}`} onClose={() => setAsking(false)}>
          <form className="form" onSubmit={sendInterest}>
            <p className="hint"><Mail size={14} aria-hidden="true" /> {pet.donor_name} vai receber seu nome ({user.name}) e e-mail ({user.email}).</p>
            <label>Mensagem para {pet.donor_name}
              <textarea name="message" rows="5" required minLength="10" maxLength="2000" placeholder="Conte sobre você, sua casa e como vai cuidar do pet." />
            </label>
            {sendError && <p className="inline-error" role="alert">{sendError}</p>}
            <button className="button button-primary button-block" disabled={sending}>
              {sending ? <LoaderCircle className="spin" size={18} /> : <Heart size={18} aria-hidden="true" />} Enviar pedido
            </button>
          </form>
        </Sheet>
      )}
    </main>
  )
}
