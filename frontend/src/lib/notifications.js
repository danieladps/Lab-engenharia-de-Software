import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import api from '../api'
import { useAuth } from './auth'

// A tela de Avisos dispara este evento depois de marcar os avisos como vistos.
export const NOTIFICATIONS_READ_EVENT = 'petlume:avisos-lidos'

// Texto e destino de cada tipo de aviso.
export const notificationTexts = {
  adoption_requested: (item) => `${item.other_name} pediu para adotar ${item.pet.name}.`,
  adoption_approved: (item) => `Seu pedido para adotar ${item.pet.name} foi aprovado!`,
  adoption_rejected: (item) => `Seu pedido para adotar ${item.pet.name} foi recusado.`,
}

export const notificationLinks = {
  adoption_requested: '/meus-anuncios',
  adoption_approved: '/minhas-solicitacoes',
  adoption_rejected: '/minhas-solicitacoes',
}

// Total de avisos não vistos, para o número no menu.
// Atualiza ao trocar de tela e a cada 30 segundos com a aba aberta.
export function useNotificationCount() {
  const { user } = useAuth()
  const location = useLocation()
  const [count, setCount] = useState({ userId: null, value: 0 })
  const userId = user?.id ?? null

  useEffect(() => {
    if (!userId) return undefined
    let active = true
    const load = () => {
      if (document.visibilityState !== 'visible') return
      api.get('/me/notifications/unread')
        .then(({ data }) => { if (active) setCount({ userId, value: data.unread }) })
        .catch(() => {})
    }
    load()
    const timer = window.setInterval(load, 30000)
    window.addEventListener(NOTIFICATIONS_READ_EVENT, load)
    return () => {
      active = false
      window.clearInterval(timer)
      window.removeEventListener(NOTIFICATIONS_READ_EVENT, load)
    }
  }, [userId, location.pathname])

  return count.userId === userId ? count.value : 0
}
