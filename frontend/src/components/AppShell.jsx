import { NavLink, Outlet } from 'react-router-dom'
import { Heart, House, MessageCircle, PawPrint, Plus, UserRound } from 'lucide-react'
import { useUnreadCount } from '../lib/unread'

const tabs = [
  { to: '/', label: 'Início', icon: House, end: true },
  { to: '/favoritos', label: 'Favoritos', icon: Heart },
  { to: '/mensagens', label: 'Mensagens', icon: MessageCircle },
  { to: '/perfil', label: 'Perfil', icon: UserRound },
]

// Moldura das telas principais: barra no topo (computador) e menu inferior (celular).
export default function AppShell() {
  const unread = useUnreadCount()
  const badge = (to) => (to === '/mensagens' && unread > 0
    ? <span className="nav-badge" aria-label={`${unread} mensagens não lidas`}>{unread > 9 ? '9+' : unread}</span>
    : null)

  return (
    <div className="shell">
      <header className="desktop-bar">
        <NavLink to="/" className="brand" aria-label="PetLume, início">
          <span className="brand-mark"><PawPrint size={18} aria-hidden="true" /></span> petlume
        </NavLink>
        <nav className="desktop-nav" aria-label="Navegação principal">
          {tabs.map(({ to, label, end }) => (
            <NavLink key={to} to={to} end={end} className="desktop-link">{label}{badge(to)}</NavLink>
          ))}
        </nav>
        <NavLink to="/anunciar" className="button button-primary button-small"><Plus size={16} aria-hidden="true" /> Anunciar pet</NavLink>
      </header>

      <div className="shell-content">
        <Outlet />
      </div>

      <nav className="tab-bar" aria-label="Navegação principal">
        {tabs.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} className="tab-link">
            <span className="tab-icon"><Icon size={22} aria-hidden="true" />{badge(to)}</span>
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
