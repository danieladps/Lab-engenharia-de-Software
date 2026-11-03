import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ChevronRight, ClipboardList, Heart, LoaderCircle, LogIn, LogOut, MapPin, PawPrint, Pencil, Plus } from 'lucide-react'
import api from '../api'
import EmptyState from '../components/EmptyState'
import { useAuth } from '../lib/auth'
import { useFavorites } from '../lib/favorites'
import { useToast } from '../lib/toast'
import { apiError, firstName } from '../lib/pets'

export default function Profile() {
  const { user, signOut, updateUser } = useAuth()
  const { pets: favorites, loaded } = useFavorites()
  const toast = useToast()
  const navigate = useNavigate()
  const [editing, setEditing] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  if (!user) {
    return (
      <main className="page">
        <EmptyState icon={LogIn} title="Entre para ver seu perfil" action={<Link to="/entrar?volta=%2Fperfil" className="button button-primary">Entrar</Link>}>
          Com uma conta você anuncia pets, salva favoritos e acompanha seus pedidos.
        </EmptyState>
      </main>
    )
  }

  function handleSignOut() {
    signOut()
    toast('Você saiu da conta.')
    navigate('/')
  }

  async function handleSave(event) {
    event.preventDefault()
    const payload = Object.fromEntries(new FormData(event.currentTarget).entries())
    setBusy(true)
    setError('')
    try {
      const { data } = await api.patch('/auth/me', payload)
      updateUser(data)
      setEditing(false)
      toast('Perfil atualizado.')
    } catch (err) {
      setError(apiError(err, 'Não foi possível salvar.'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="profile">
      <header className="profile-head">
        <span className="profile-avatar" aria-hidden="true">{firstName(user.name)[0]?.toUpperCase()}</span>
        <h1>{user.name}</h1>
        <p>{user.email}</p>
      </header>

      <div className="page page-narrow profile-body">
        {editing ? (
          <form className="form edit-profile" onSubmit={handleSave}>
            <h2>Editar perfil</h2>
            <label>Nome<input name="name" defaultValue={user.name} autoComplete="name" required minLength="2" maxLength="120" /></label>
            <label>Cidade<input name="city" defaultValue={user.city} autoComplete="address-level2" required minLength="2" maxLength="100" /></label>
            <p className="hint">O e-mail não pode ser alterado.</p>
            {error && <p className="inline-error" role="alert">{error}</p>}
            <div className="form-actions">
              <button type="button" className="button button-ghost" onClick={() => { setEditing(false); setError('') }}>Cancelar</button>
              <button className="button button-primary" disabled={busy}>{busy && <LoaderCircle className="spin" size={18} />} Salvar</button>
            </div>
          </form>
        ) : (
          <ul className="menu-list">
            <li><Link to="/minhas-solicitacoes"><ClipboardList size={19} aria-hidden="true" /><span><strong>Minhas solicitações</strong><small>Pedidos de adoção que você enviou</small></span><ChevronRight size={18} aria-hidden="true" /></Link></li>
            <li><Link to="/meus-anuncios"><PawPrint size={19} aria-hidden="true" /><span><strong>Meus anúncios</strong><small>Pets que você anunciou e pedidos recebidos</small></span><ChevronRight size={18} aria-hidden="true" /></Link></li>
            <li><Link to="/favoritos"><Heart size={19} aria-hidden="true" /><span><strong>Favoritos</strong><small>{loaded ? `${favorites.length} ${favorites.length === 1 ? 'pet salvo' : 'pets salvos'}` : 'Pets que você salvou'}</small></span><ChevronRight size={18} aria-hidden="true" /></Link></li>
            <li><Link to="/anunciar"><Plus size={19} aria-hidden="true" /><span><strong>Anunciar um pet</strong><small>Publique um pet para adoção</small></span><ChevronRight size={18} aria-hidden="true" /></Link></li>
            <li><button type="button" className="menu-row" onClick={() => setEditing(true)}><MapPin size={19} aria-hidden="true" /><span><strong>{user.city}</strong><small>Editar nome e cidade</small></span><Pencil size={16} aria-hidden="true" /></button></li>
          </ul>
        )}
        <button type="button" className="button button-outline button-block" onClick={handleSignOut}><LogOut size={18} aria-hidden="true" /> Sair da conta</button>
      </div>
    </main>
  )
}
