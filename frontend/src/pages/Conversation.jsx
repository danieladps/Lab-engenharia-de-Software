import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, LoaderCircle, MessageCircle, SendHorizontal } from 'lucide-react'
import api from '../api'
import EmptyState from '../components/EmptyState'
import PetImage from '../components/PetImage'
import { adoptionStatusLabels, apiError, shortTime } from '../lib/pets'
import { MESSAGES_READ_EVENT } from '../lib/unread'

const POLL_MS = 5000

export default function Conversation() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [state, setState] = useState({ id: null, data: null, error: '' })
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState('')
  const endRef = useRef(null)
  const lastCount = useRef(0)

  const load = useCallback(() => api.get(`/adoptions/${id}/messages`)
    .then(({ data }) => setState({ id, data, error: '' }))
    .catch((error) => setState({ id, data: null, error: error.response?.status === 404 ? 'not-found' : apiError(error, 'Não foi possível carregar a conversa.') })), [id])

  // Carrega e confere novas mensagens a cada poucos segundos, só com a aba visível.
  useEffect(() => {
    load()
    const timer = window.setInterval(() => { if (document.visibilityState === 'visible') load() }, POLL_MS)
    return () => window.clearInterval(timer)
  }, [load])

  // Desce até a última mensagem quando chega uma nova.
  const count = state.data?.messages.length ?? 0
  const loadedId = state.id
  useEffect(() => {
    if (count !== lastCount.current) endRef.current?.scrollIntoView({ block: 'end' })
    lastCount.current = count
  }, [count])

  // Abrir a conversa (e receber mensagem nova) marca como lidas: avisa o menu para recontar.
  useEffect(() => {
    if (loadedId === id) window.dispatchEvent(new Event(MESSAGES_READ_EVENT))
  }, [loadedId, id, count])

  async function handleSend(event) {
    event.preventDefault()
    const body = draft.trim()
    if (!body) return
    setSending(true)
    setSendError('')
    try {
      const { data: message } = await api.post(`/adoptions/${id}/messages`, { body })
      setState((current) => ({ ...current, data: { ...current.data, messages: [...current.data.messages, message] } }))
      setDraft('')
    } catch (error) {
      setSendError(apiError(error, 'Não foi possível enviar.'))
      if (error.response?.status === 409) load()
    } finally {
      setSending(false)
    }
  }

  function handleKeyDown(event) {
    // Enter envia; Shift+Enter quebra a linha.
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      event.currentTarget.form.requestSubmit()
    }
  }

  if (state.id !== id) return <main className="page"><div className="loading-state"><LoaderCircle className="spin" size={22} /> Carregando...</div></main>
  if (state.error === 'not-found') {
    return (
      <main className="page">
        <EmptyState icon={MessageCircle} title="Conversa não encontrada" action={<Link to="/mensagens" className="button button-primary">Ver minhas conversas</Link>}>
          Você só vê as conversas dos seus pedidos e dos seus anúncios.
        </EmptyState>
      </main>
    )
  }
  if (state.error) return <main className="page page-narrow"><p className="inline-error" role="alert">{state.error}</p></main>

  const { data } = state

  return (
    <main className="chat">
      <header className="chat-head">
        <button type="button" className="icon-button" onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/mensagens'))} aria-label="Voltar"><ArrowLeft size={19} /></button>
        <Link to={`/pets/${data.pet.id}`} className="chat-who">
          <PetImage src={data.pet.image_url} alt="" className="chat-photo" />
          <span>
            <strong>{data.other_name}</strong>
            <small>{data.pet.name}, {adoptionStatusLabels[data.status].toLowerCase()}</small>
          </span>
        </Link>
        <span className={`status status-request-${data.status}`}>{adoptionStatusLabels[data.status]}</span>
      </header>

      <ol className="chat-messages" aria-live="polite">
        <li className="chat-request">
          <small>{data.role === 'owner' ? `Pedido de ${data.other_name}` : 'Seu pedido'}, {shortTime(data.request_sent_at)}</small>
          <p>{data.request_message}</p>
        </li>
        {data.messages.map((message) => (
          <li key={message.id} className={message.mine ? 'bubble mine' : 'bubble'}>
            <p>{message.body}</p>
            <time dateTime={message.created_at}>{shortTime(message.created_at)}</time>
          </li>
        ))}
        {!data.messages.length && <li className="chat-empty">Nenhuma mensagem ainda. Combinem aqui uma visita ou tirem dúvidas sobre {data.pet.name}.</li>}
        <li ref={endRef} aria-hidden="true" />
      </ol>

      {data.can_send ? (
        <form className="chat-composer" onSubmit={handleSend}>
          {sendError && <p className="inline-error" role="alert">{sendError}</p>}
          <div className="chat-input">
            <textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={handleKeyDown}
              rows="1"
              maxLength="2000"
              placeholder={`Mensagem para ${data.other_name}`}
              aria-label={`Mensagem para ${data.other_name}`}
            />
            <button className="icon-button send-button" disabled={sending || !draft.trim()} aria-label="Enviar mensagem">
              {sending ? <LoaderCircle className="spin" size={19} /> : <SendHorizontal size={19} />}
            </button>
          </div>
        </form>
      ) : (
        <p className="chat-closed">Este pedido foi recusado. A conversa fica disponível só para leitura.</p>
      )}
    </main>
  )
}
