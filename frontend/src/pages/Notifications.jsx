import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bell, LoaderCircle } from 'lucide-react'
import api from '../api'
import EmptyState from '../components/EmptyState'
import PetImage from '../components/PetImage'
import { NOTIFICATIONS_READ_EVENT, notificationLinks, notificationTexts } from '../lib/notifications'
import { apiError, shortTime } from '../lib/pets'

export default function Notifications() {
  const [state, setState] = useState({ loading: true, items: [], error: '' })

  useEffect(() => {
    let active = true
    api.get('/me/notifications')
      .then(({ data }) => {
        if (!active) return
        // Mostra os não vistos destacados e, em seguida, marca todos como vistos.
        setState({ loading: false, items: data, error: '' })
        if (data.some((item) => !item.read)) {
          api.post('/me/notifications/read')
            .then(() => window.dispatchEvent(new Event(NOTIFICATIONS_READ_EVENT)))
            .catch(() => {})
        }
      })
      .catch((error) => { if (active) setState({ loading: false, items: [], error: apiError(error, 'Não foi possível carregar os avisos.') }) })
    return () => { active = false }
  }, [])

  const { loading, items, error } = state

  return (
    <main className="page page-narrow">
      <h1 className="page-title">Avisos</h1>
      <p className="page-lead">Pedidos recebidos e respostas aos seus pedidos de adoção.</p>
      {loading && <div className="loading-state"><LoaderCircle className="spin" size={22} /> Carregando...</div>}
      {error && <p className="inline-error" role="alert">{error}</p>}
      {!loading && !error && !items.length && (
        <EmptyState icon={Bell} title="Nenhum aviso ainda" action={<Link to="/" className="button button-primary">Ver pets disponíveis</Link>}>
          Quando alguém pedir um pet seu, ou você receber resposta a um pedido, o aviso aparece aqui.
        </EmptyState>
      )}
      <ul className="conversation-list">
        {items.map((item) => (
          <li key={item.id}>
            <Link to={notificationLinks[item.kind]} className={item.read ? 'conversation-item' : 'conversation-item unread'}>
              <PetImage src={item.pet.image_url} alt="" className="conversation-photo" />
              <span className="conversation-text">
                <span className={item.read ? 'notification-text' : 'notification-text unread'}>{notificationTexts[item.kind](item)}</span>
                <time className="conversation-about" dateTime={item.created_at}>{shortTime(item.created_at)}</time>
              </span>
              {!item.read && <span className="notification-dot" aria-label="Novo" />}
            </Link>
          </li>
        ))}
      </ul>
    </main>
  )
}
