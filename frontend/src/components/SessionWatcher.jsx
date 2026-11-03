import { useEffect, useRef } from 'react'
import { useAuth } from '../lib/auth'
import { useToast } from '../lib/toast'

// Avisa quando o login venceu. As telas que exigem login já mandam para "Entrar" sozinhas.
export default function SessionWatcher() {
  const { expiredCount } = useAuth()
  const toast = useToast()
  const seen = useRef(expiredCount)

  useEffect(() => {
    if (expiredCount > seen.current) toast('Seu login expirou. Entre de novo para continuar.')
    seen.current = expiredCount
  }, [expiredCount, toast])

  return null
}
