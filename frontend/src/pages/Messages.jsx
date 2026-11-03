import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { LoaderCircle, LogIn, MessageCircle } from 'lucide-react'
import api from '../api'
import EmptyState from '../components/EmptyState'
import PetImage from '../components/PetImage'
import { useAuth } from '../lib/auth'
import { adoptionStatusLabels, apiError, shortTime } from '../lib/pets'

export default function Messages() {
  const { user, checking } = useAuth()
  const [state, setState] = useState({ loading: true, items: [], error: '' })

  useEffect(() => {
    if (!user) return undefined
    let active = true
    api.get('/me/conversations')
      .then(({ data }) => { if (active) setState({ loading: false, items: data, error: '' }) })
      .catch((error) => { if (active) setState({ loading: false, items: [], error: apiError(error, 'Não foi possível carregar as conversas.') }) })
    return () => { active = false }
  }, [user])

  if (!checking && !user) {
    return (
      <main className="page">
        <h1 className="page-title">Mensagens</h1>
        <EmptyState icon={LogIn} title="Entre para ver suas conversas" action={<Link to="/entrar?volta=%2Fmensagens" className="button button-primary">Entrar</Link>}>
          Cada pedido de adoção vira uma conversa entre quem pediu e quem anunciou.
        </EmptyState>
      </main>
    )
  }

  const { loading, items, error } = state

  return (
    <main className="page page-narrow">
      <h1 className="page-title">Mensagens</h1>
      <p className="page-lead">Uma conversa para cada pedido de adoção.</p>
      {loading && <div className="loading-state"><LoaderCircle className="spin" size={22} /> Carregando...</div>}
      {error && <p className="inline-error" role="alert">{error}</p>}
      {!loading && !error && !items.length && (
        <EmptyState icon={MessageCircle} title="Nenhuma conversa ainda" action={<Link to="/" className="button button-primary">Ver pets disponíveis</Link>}>
          Quando você pedir para adotar um pet, ou receber um pedido, a conversa aparece aqui.
        </EmptyState>
      )}
      <ul className="conversation-list">
        {items.map((item) => (
          <li key={item.adoption_id}>
            <Link to={`/mensagens/${item.adoption_id}`} className={item.unread ? 'conversation-item unread' : 'conversation-item'}>
              <PetImage src={item.pet.image_url} alt="" className="conversation-photo" />
              <span className="conversation-text">
                <span className="conversation-top">
                  <strong>{item.other_name}</strong>
                  <time dateTime={item.updated_at}>{shortTime(item.updated_at)}</time>
                </span>
                <small className="conversation-about">
                  {item.role === 'owner' ? `Pediu ${item.pet.name}` : `Sobre ${item.pet.name}`}, {adoptionStatusLabels[item.status].toLowerCase()}
                </small>
                <span className="conversation-preview">
                  {item.last_message ? `${item.last_message.mine ? 'Você: ' : ''}${item.last_message.body}` : 'Nenhuma mensagem ainda. Toque para conversar.'}
                </span>
              </span>
              {item.unread > 0 && <span className="unread-badge" aria-label={`${item.unread} não lidas`}>{item.unread}</span>}
            </Link>
          </li>
        ))}
      </ul>
    </main>
  )
}
