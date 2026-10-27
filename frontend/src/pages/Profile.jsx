import { Link, useNavigate } from 'react-router-dom'
import { ChevronRight, ClipboardList, LogIn, LogOut, MapPin, PawPrint, Plus } from 'lucide-react'
import EmptyState from '../components/EmptyState'
import { useAuth } from '../lib/auth'
import { useToast } from '../lib/toast'
import { firstName } from '../lib/pets'

export default function Profile() {
  const { user, signOut } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()

  if (!user) {
    return (
      <main className="page">
        <EmptyState icon={LogIn} title="Entre para ver seu perfil" action={<Link to="/entrar?volta=%2Fperfil" className="button button-primary">Entrar</Link>}>
          Com uma conta você anuncia pets e acompanha seus pedidos.
        </EmptyState>
      </main>
    )
  }

  function handleSignOut() {
    signOut()
    toast('Você saiu da conta.')
    navigate('/')
  }

  return (
    <main className="profile">
      <header className="profile-head">
        <span className="profile-avatar" aria-hidden="true">{firstName(user.name)[0]?.toUpperCase()}</span>
        <h1>{user.name}</h1>
        <p>{user.email}</p>
      </header>

      <div className="page page-narrow profile-body">
        <ul className="menu-list">
          <li><Link to="/meus-anuncios"><PawPrint size={19} aria-hidden="true" /><span><strong>Meus anúncios</strong><small>Pets que você anunciou e pedidos recebidos</small></span><ChevronRight size={18} aria-hidden="true" /></Link></li>
          <li><Link to="/anunciar"><Plus size={19} aria-hidden="true" /><span><strong>Anunciar um pet</strong><small>Publique um pet para adoção</small></span><ChevronRight size={18} aria-hidden="true" /></Link></li>
          <li className="menu-soon"><span className="menu-row"><ClipboardList size={19} aria-hidden="true" /><span><strong>Minhas solicitações</strong><small>Acompanhar seus pedidos de adoção: em breve</small></span></span></li>
          <li className="menu-static"><span className="menu-row"><MapPin size={19} aria-hidden="true" /><span><strong>Cidade</strong><small>{user.city}</small></span></span></li>
        </ul>
        <button type="button" className="button button-outline button-block" onClick={handleSignOut}><LogOut size={18} aria-hidden="true" /> Sair da conta</button>
      </div>
    </main>
  )
}
