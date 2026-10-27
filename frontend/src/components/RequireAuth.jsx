import { Navigate, useLocation } from 'react-router-dom'
import { LoaderCircle } from 'lucide-react'
import { useAuth } from '../lib/auth'

// Manda para o login quem não entrou, guardando a página para voltar depois.
export default function RequireAuth({ children }) {
  const { user, checking } = useAuth()
  const location = useLocation()
  if (checking) return <div className="loading-state"><LoaderCircle className="spin" size={22} /> Carregando...</div>
  if (!user) return <Navigate to={`/entrar?volta=${encodeURIComponent(location.pathname)}`} replace />
  return children
}
