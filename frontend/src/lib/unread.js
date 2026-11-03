import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import api from '../api'
import { useAuth } from './auth'

// A tela de conversa dispara este evento depois de marcar as mensagens como lidas.
export const MESSAGES_READ_EVENT = 'petlume:mensagens-lidas'

// Total de mensagens não lidas, para o número no menu.
// Atualiza ao trocar de tela e a cada 30 segundos com a aba aberta.
export function useUnreadCount() {
  const { user } = useAuth()
  const location = useLocation()
  const [count, setCount] = useState({ userId: null, value: 0 })
  const userId = user?.id ?? null

  useEffect(() => {
    if (!userId) return undefined
    let active = true
    const load = () => {
      if (document.visibilityState !== 'visible') return
      api.get('/me/conversations')
        .then(({ data }) => {
          if (active) setCount({ userId, value: data.reduce((total, item) => total + item.unread, 0) })
        })
        .catch(() => {})
    }
    load()
    const timer = window.setInterval(load, 30000)
    window.addEventListener(MESSAGES_READ_EVENT, load)
    return () => {
      active = false
      window.clearInterval(timer)
      window.removeEventListener(MESSAGES_READ_EVENT, load)
    }
  }, [userId, location.pathname])

  return count.userId === userId ? count.value : 0
}
