import { useEffect, useState } from 'react'
import {
  ArrowLeft, ArrowRight, Check, ChevronDown, Heart, Inbox, LoaderCircle, LogIn, LogOut, Mail,
  MapPin, PawPrint, Plus, Search, ShieldCheck, Sparkles, UserPlus, X,
} from 'lucide-react'
import api, { hasToken, saveToken } from './api'
import './App.css'

const speciesOptions = ['Todos', 'Cão', 'Gato', 'Outro']
const sizeLabels = { small: 'Pequeno', medium: 'Médio', large: 'Grande' }
const statusLabels = { available: 'Disponível', adoption_pending: 'Interesse recebido' }
const MY_PETS_HASH = '#meus-anuncios'

const isMyPetsHash = () => window.location.hash === MY_PETS_HASH

function App() {
  const [petResults, setPetResults] = useState({ filterKey: null, items: [], error: '' })
  const [filters, setFilters] = useState({ species: 'Todos', size: 'Todos', city: '' })
  const [citySearch, setCitySearch] = useState('')
  const [modal, setModal] = useState(null)
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)
  const [showMyPets, setShowMyPets] = useState(isMyPetsHash)
  // undefined = conferindo o login salvo; null = sem login.
  const [user, setUser] = useState(() => (hasToken() ? undefined : null))
  const filterKey = JSON.stringify(filters)
  const currentResults = petResults.filterKey === filterKey ? petResults : null
  const pets = currentResults?.items ?? []
  const loading = currentResults === null
  const loadError = currentResults?.error ?? ''

  useEffect(() => {
    let active = true
    const params = Object.fromEntries(
      Object.entries(JSON.parse(filterKey)).filter(([, value]) => value && value !== 'Todos'),
    )
    api.get('/pets', { params })
      .then(({ data }) => {
        if (active) setPetResults({ filterKey, items: data, error: '' })
      })
      .catch((error) => {
        if (active) {
          setPetResults({
            filterKey,
            items: [],
            error: error.response?.data?.detail || 'Não foi possível carregar os pets. Confira se a API está ativa.',
          })
        }
      })
    return () => { active = false }
  }, [filterKey])

  useEffect(() => {
    const syncHash = () => setShowMyPets(isMyPetsHash())
    window.addEventListener('hashchange', syncHash)
    return () => window.removeEventListener('hashchange', syncHash)
  }, [])

  useEffect(() => {
    if (user !== undefined) return undefined
    let active = true
    api.get('/auth/me')
      .then(({ data }) => { if (active) setUser(data) })
      .catch(() => {
        saveToken(null)
        if (active) setUser(null)
      })
    return () => { active = false }
  }, [user])

  // Abre a ação pedida ou, se a pessoa não entrou, o login antes dela.
  function requireLogin(next) {
    setModal(user ? next : { type: 'login', next })
  }

  function handleLoggedIn(data, next) {
    saveToken(data.access_token)
    setUser(data.user)
    setModal(next ?? null)
    if (!next) setNotice(`Olá, ${data.user.name.split(' ')[0]}! Você entrou na sua conta.`)
  }

  function logout() {
    saveToken(null)
    setUser(null)
    setModal(null)
    if (isMyPetsHash()) leaveMyPetsPage()
    setNotice('Você saiu da sua conta.')
  }

  useEffect(() => {
    if (!notice) return undefined
    const timeout = window.setTimeout(() => setNotice(''), 3600)
    return () => window.clearTimeout(timeout)
  }, [notice])

  async function handlePetSubmit(event) {
    event.preventDefault()
    const payload = Object.fromEntries(new FormData(event.currentTarget).entries())
    payload.age_years = Number(payload.age_years)
    setBusy(true)
    try {
      const { data: createdPet } = await api.post('/pets', payload)
      setModal(null)
      setNotice(`${createdPet.name} foi publicado! Veja os interesses em "Meus anúncios".`)
      if ((filters.species === 'Todos' || filters.species === createdPet.species)
        && (filters.size === 'Todos' || filters.size === createdPet.size)
        && (!filters.city || createdPet.city.toLowerCase().includes(filters.city.toLowerCase()))) {
        setPetResults((current) => current.filterKey === filterKey
          ? { ...current, items: [createdPet, ...current.items] }
          : current)
      }
    } catch (error) {
      setNotice(error.response?.data?.detail || 'Não foi possível publicar o anúncio.')
    } finally {
      setBusy(false)
    }
  }

  async function handleAdoptionSubmit(event) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    setBusy(true)
    try {
      await api.post(`/pets/${modal.pet.id}/adoptions`, { message: form.get('message') })
      setPetResults((current) => current.filterKey === filterKey
        ? { ...current, items: current.items.filter((pet) => pet.id !== modal.pet.id) }
        : current)
      setModal(null)
      setNotice('Interesse enviado! O responsável pelo pet poderá entrar em contato.')
    } catch (error) {
      setNotice(error.response?.data?.detail || 'Não foi possível enviar seu interesse.')
    } finally {
      setBusy(false)
    }
  }

  function openMyPetsPage() {
    if (!user) {
      setModal({ type: 'login' })
      return
    }
    window.location.hash = MY_PETS_HASH.slice(1)
    window.scrollTo(0, 0)
  }

  function leaveMyPetsPage() {
    window.location.hash = 'pets'
    setShowMyPets(false)
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#inicio" aria-label="PetLume, início">
          <span className="brand-mark"><PawPrint size={21} strokeWidth={2.5} /></span>
          <span>petlume<span className="brand-period">.</span></span>
        </a>
        <nav className="main-nav" aria-label="Navegação principal">
          <a className={showMyPets ? 'nav-link' : 'nav-link active'} href="#pets"><span className="nav-long">Encontrar um pet</span><span className="nav-short">Pets</span></a>
          <button className={showMyPets ? 'nav-link active' : 'nav-link'} onClick={openMyPetsPage}><span className="nav-long">Meus anúncios</span><span className="nav-short">Meus</span></button>
        </nav>
        <div className="account-actions">
          {user ? (
            <button className="button button-light button-small" onClick={logout} title={`Sair da conta de ${user.name}`}>
              <LogOut size={15} /> <span className="nav-long">Sair</span>
            </button>
          ) : (
            <button className="button button-light button-small" onClick={() => setModal({ type: 'login' })} disabled={user === undefined}>
              <LogIn size={15} /> <span className="nav-long">Entrar</span>
            </button>
          )}
          <button className="button button-dark button-small" onClick={() => requireLogin({ type: 'pet' })}>
            <Plus size={15} /> Anunciar pet
          </button>
        </div>
      </header>

      {showMyPets && user ? (
        <MyPetsPage key={user.id} onBack={leaveMyPetsPage} />
      ) : showMyPets && user === null ? (
        <main className="content-section manage-page">
          <div className="empty-state">
            <span className="empty-paw"><LogIn size={28} /></span>
            <h3>Entre para ver seus anúncios</h3>
            <p>Os anúncios e os interesses recebidos ficam na sua conta.</p>
            <button className="button button-dark" onClick={() => setModal({ type: 'login' })}><LogIn size={16} /> Entrar</button>
          </div>
        </main>
      ) : (
      <main>
        <section className="hero" id="inicio">
          <div className="hero-copy">
            <span className="eyebrow"><Sparkles size={14} /> Adoção responsável, com carinho</span>
            <h1>Um novo começo<br />pode ter <em>quatro patas.</em></h1>
            <p>Encontre seu companheiro entre pets que esperam por uma família como a sua.</p>
            <div className="hero-actions">
              <button className="button button-dark" onClick={() => document.getElementById('pets')?.scrollIntoView({ behavior: 'smooth' })}>
                Encontrar meu pet <ArrowRight size={17} />
              </button>
              <button className="button button-light" onClick={() => requireLogin({ type: 'pet' })}>
                <Plus size={17} /> Quero anunciar um pet
              </button>
            </div>
            <div className="hero-trust">
              <span className="trust-avatars"><span>🐶</span><span>🐱</span><span>🐾</span></span>
              <span><strong>Conexões que mudam vidas</strong><br />um encontro de cada vez</span>
            </div>
          </div>
          <div className="hero-art" aria-label="Cão pronto para encontrar uma família">
            <img src="https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=1300&q=90" alt="Cão caramelo olhando para a câmera" />
            <div className="photo-note"><span className="note-icon"><Heart size={16} fill="currentColor" /></span><span><strong>Amor não se compra.</strong><br />Se encontra.</span></div>
            <div className="hero-stamp"><PawPrint size={23} /><span>adote<br />com amor</span></div>
          </div>
        </section>

        <section className="content-section" id="pets">
          <div className="section-heading">
            <div><span className="eyebrow eyebrow-muted">A família pode começar aqui</span><h2>Pets esperando por você<span className="brand-period">.</span></h2></div>
            <button className="location-chip" onClick={() => document.getElementById('city-filter')?.focus()}>
              <MapPin size={16} /> Brasil <ChevronDown size={15} />
            </button>
          </div>
          <div className="search-panel">
            <form className="search-field" onSubmit={(event) => {
              event.preventDefault()
              setFilters((current) => ({ ...current, city: citySearch.trim() }))
            }}>
              <Search size={19} />
              <input id="city-filter" aria-label="Buscar por cidade" value={citySearch} onChange={(event) => setCitySearch(event.target.value)} placeholder="Busque por cidade" />
              <span className="field-divider" />
              <button className="search-submit" type="submit" aria-label="Buscar"><ArrowRight size={18} /></button>
            </form>
            <div className="species-filter" role="group" aria-label="Filtrar por espécie">
              {speciesOptions.map((species) => (
                <button key={species} className={filters.species === species ? 'species-option selected' : 'species-option'} onClick={() => setFilters((current) => ({ ...current, species }))}>
                  {species}
                </button>
              ))}
            </div>
            <label className="size-select">
              <span>Porte</span>
              <select value={filters.size} onChange={(event) => setFilters((current) => ({ ...current, size: event.target.value }))}>
                <option value="Todos">Todos</option><option value="small">Pequeno</option><option value="medium">Médio</option><option value="large">Grande</option>
              </select>
              <ChevronDown size={15} />
            </label>
          </div>
          <div className="results-line">
            <span>{loading ? 'Buscando companheiros...' : `${pets.length} ${pets.length === 1 ? 'pet' : 'pets'} para conhecer`}</span>
            <span className="result-note"><ShieldCheck size={15} /> Adoção consciente começa com uma conversa</span>
          </div>
          {loadError && <div className="inline-error">{loadError}</div>}
          {loading ? (
            <div className="loading-state"><LoaderCircle className="spin" size={24} /> Encontrando novos amigos...</div>
          ) : pets.length ? (
            <div className="pet-grid">{pets.map((pet, index) => <PetCard key={pet.id} pet={pet} index={index} onAdopt={() => requireLogin({ type: 'adoption', pet })} />)}</div>
          ) : !loadError ? (
            <div className="empty-state">
              <span className="empty-paw"><PawPrint size={28} /></span>
              <h3>Nenhum pet por aqui ainda</h3>
              <p>Tente outra cidade ou volte em breve. Novos amigos aparecem por aqui todos os dias.</p>
              <button className="button button-dark" onClick={() => requireLogin({ type: 'pet' })}><Plus size={16} /> Publicar um anúncio</button>
            </div>
          ) : null}
        </section>
        <section className="promise-band">
          <div className="promise-icon"><Heart size={20} /></div>
          <div><strong>Adotar é um compromisso para a vida.</strong><p>Conheça a história, converse com o responsável e escolha com o coração e a responsabilidade.</p></div>
          <span className="promise-paw"><PawPrint size={60} /></span>
        </section>
      </main>
      )}

      <footer className="site-footer">
        <a className="brand footer-brand" href="#inicio"><span className="brand-mark"><PawPrint size={18} /></span><span>petlume<span className="brand-period">.</span></span></a>
        <span>Feito para aproximar quem ama de quem precisa de um lar.</span><span>© 2026 PetLume</span>
      </footer>
      {notice && <div className="toast" role="status"><Check size={17} />{notice}<button onClick={() => setNotice('')} aria-label="Fechar aviso"><X size={15} /></button></div>}
      {modal && (
        <Modal onClose={() => setModal(null)}>
          {modal.type === 'login' && <AuthForm next={modal.next} onDone={handleLoggedIn} onClose={() => setModal(null)} />}
          {modal.type === 'pet' && user && <PetForm user={user} busy={busy} onSubmit={handlePetSubmit} onClose={() => setModal(null)} />}
          {modal.type === 'adoption' && user && <AdoptionForm user={user} pet={modal.pet} busy={busy} onSubmit={handleAdoptionSubmit} onClose={() => setModal(null)} />}
        </Modal>
      )}
    </div>
  )
}

function PetCard({ pet, index, onAdopt }) {
  return (
    <article className="pet-card" style={{ '--card-delay': `${index * 70}ms` }}>
      <div className="pet-image-wrap"><img className="pet-image" src={pet.image_url} alt={pet.name} loading="lazy" /><span className="pet-tag">{pet.species}</span></div>
      <div className="pet-info">
        <div className="pet-title-line"><h3>{pet.name}</h3><span className="pet-age">{pet.age_years} {pet.age_years === 1 ? 'ano' : 'anos'}</span></div>
        <p className="pet-breed">{pet.breed}</p>
        <p className="pet-description">{pet.description}</p>
        <div className="pet-meta"><span><MapPin size={14} />{pet.city}</span><span>{sizeLabels[pet.size]}</span></div>
        <div className="pet-card-footer">
          <span className="donor-name"><span className="donor-avatar">{pet.donor_name?.[0]}</span> {pet.donor_name}</span>
          <button className="adopt-link" onClick={onAdopt}>Tenho interesse <ArrowRight size={15} /></button>
        </div>
      </div>
    </article>
  )
}

function Modal({ children, onClose }) {
  useEffect(() => {
    function closeOnEscape(event) { if (event.key === 'Escape') onClose() }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [onClose])

  return (
    <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <section className="modal-panel" role="dialog" aria-modal="true">{children}</section>
    </div>
  )
}

function ModalHeading({ eyebrow, title, subtitle, onClose }) {
  return (
    <div className="modal-heading">
      <div><span className="eyebrow eyebrow-muted">{eyebrow}</span><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div>
      <button className="icon-button modal-close" onClick={onClose} aria-label="Fechar"><X size={19} /></button>
    </div>
  )
}

function AuthForm({ next, onDone, onClose }) {
  const [mode, setMode] = useState('login')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const isLogin = mode === 'login'

  async function handleSubmit(event) {
    event.preventDefault()
    const payload = Object.fromEntries(new FormData(event.currentTarget).entries())
    setBusy(true)
    setError('')
    try {
      const { data } = await api.post(isLogin ? '/auth/login' : '/auth/cadastro', payload)
      onDone(data, next)
    } catch (err) {
      const detail = err.response?.data?.detail
      setError(typeof detail === 'string' ? detail : 'Confira os dados e tente de novo.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <ModalHeading
        eyebrow={next ? 'Antes de continuar' : 'Sua conta'}
        title={isLogin ? 'Entre na sua conta' : 'Crie sua conta'}
        subtitle={isLogin ? 'Para anunciar pets e demonstrar interesse.' : 'Leva menos de um minuto.'}
        onClose={onClose}
      />
      <div className="species-filter auth-tabs" role="tablist" aria-label="Entrar ou criar conta">
        <button role="tab" aria-selected={isLogin} className={isLogin ? 'species-option selected' : 'species-option'} onClick={() => { setMode('login'); setError('') }}>Entrar</button>
        <button role="tab" aria-selected={!isLogin} className={!isLogin ? 'species-option selected' : 'species-option'} onClick={() => { setMode('register'); setError('') }}>Criar conta</button>
      </div>
      <form key={mode} className="form-stack" onSubmit={handleSubmit}>
        {!isLogin && <label>Nome<input name="name" autoComplete="name" required minLength="2" maxLength="120" /></label>}
        <label>E-mail<input name="email" type="email" autoComplete="email" required minLength="5" maxLength="255" /></label>
        <label>Senha<input name="password" type="password" autoComplete={isLogin ? 'current-password' : 'new-password'} required minLength={isLogin ? 1 : 8} maxLength="128" />{!isLogin && <small className="hint">Mínimo de 8 caracteres.</small>}</label>
        {!isLogin && <label>Cidade<input name="city" autoComplete="address-level2" placeholder="Ex.: São Paulo" required minLength="2" maxLength="100" /></label>}
        {error && <div className="inline-error" role="alert">{error}</div>}
        <button className="button button-dark form-submit" disabled={busy}>
          {busy ? <LoaderCircle className="spin" size={18} /> : isLogin ? <LogIn size={17} /> : <UserPlus size={17} />} {isLogin ? 'Entrar' : 'Criar conta'}
        </button>
      </form>
    </>
  )
}

function PetForm({ user, busy, onSubmit, onClose }) {
  return (
    <>
      <ModalHeading eyebrow="Um novo encontro" title="Conte sobre o pet" subtitle="Uma boa história ajuda a encontrar a família certa." onClose={onClose} />
      <form className="form-stack form-grid" onSubmit={onSubmit}>
        <label>Nome exibido no anúncio<input name="donor_name" defaultValue={user.name} placeholder="Você ou o abrigo" required minLength="2" maxLength="120" /></label>
        <label>Nome do pet<input name="name" placeholder="Ex.: Nina" required minLength="2" /></label>
        <label>Espécie<select name="species" defaultValue="Cão"><option>Cão</option><option>Gato</option><option>Outro</option></select></label>
        <label>Raça<input name="breed" placeholder="Ex.: Sem raça definida" required minLength="2" /></label>
        <label>Porte<select name="size" defaultValue="medium"><option value="small">Pequeno</option><option value="medium">Médio</option><option value="large">Grande</option></select></label>
        <label>Idade (anos)<input name="age_years" type="number" min="0" max="30" defaultValue="1" required /></label>
        <label>Cidade<input name="city" defaultValue={user.city} placeholder="Ex.: São Paulo, SP" required minLength="2" /></label>
        <label className="full-field">Foto do pet (URL)<input name="image_url" type="url" placeholder="https://..." required /></label>
        <label className="full-field">Um pouco sobre ele<textarea name="description" rows="3" placeholder="Conte sobre a personalidade, saúde e rotina do pet." required minLength="10" maxLength="2000" /></label>
        <button className="button button-dark form-submit full-field" disabled={busy}>{busy ? <LoaderCircle className="spin" size={18} /> : <Plus size={17} />} Publicar anúncio</button>
      </form>
    </>
  )
}

function AdoptionForm({ user, pet, busy, onSubmit, onClose }) {
  return (
    <>
      <ModalHeading eyebrow={`Conheça ${pet.name}`} title="Dê o primeiro passo" subtitle="O responsável vai receber seu nome e e-mail para falar com você." onClose={onClose} />
      <div className="modal-pet"><img src={pet.image_url} alt="" /><span><strong>{pet.name}</strong><small><MapPin size={13} /> {pet.city}</small></span></div>
      <form className="form-stack" onSubmit={onSubmit}>
        <p className="hint"><Mail size={14} /> Enviando como <strong>{user.name}</strong> ({user.email})</p>
        <label>Mensagem<textarea name="message" rows="4" minLength="10" maxLength="2000" placeholder="Fale um pouco sobre você, sua casa e os cuidados que pode oferecer." required /></label>
        <button className="button button-dark form-submit" disabled={busy}>{busy ? <LoaderCircle className="spin" size={18} /> : <Heart size={17} />} Enviar interesse</button>
      </form>
    </>
  )
}

function MyPetsPage({ onBack }) {
  const [state, setState] = useState({ loading: true, items: [], error: '' })

  useEffect(() => {
    let active = true
    api.get('/me/pets')
      .then(({ data }) => { if (active) setState({ loading: false, items: data, error: '' }) })
      .catch(() => {
        if (active) setState({ loading: false, items: [], error: 'Não foi possível carregar seus anúncios. Confira se a API está ativa.' })
      })
    return () => { active = false }
  }, [])

  const { loading, items, error } = state

  return (
    <main className="content-section manage-page">
      <button className="back-link" onClick={onBack}><ArrowLeft size={16} /> Voltar para os pets</button>
      <div className="section-heading">
        <div><span className="eyebrow eyebrow-muted">Área do responsável</span><h2>Meus anúncios<span className="brand-period">.</span></h2></div>
      </div>
      {loading && <div className="loading-state"><LoaderCircle className="spin" size={24} /> Carregando seus anúncios...</div>}
      {error && <div className="inline-error">{error}</div>}
      {!loading && !error && !items.length && (
        <div className="empty-state">
          <span className="empty-paw"><PawPrint size={28} /></span>
          <h3>Você ainda não anunciou nenhum pet</h3>
          <p>Use o botão "Anunciar pet" no topo da página.</p>
        </div>
      )}
      {items.map(({ pet, adoptions }) => (
        <section key={pet.id} className="my-pet-block">
          <div className="modal-pet manage-pet">
            <img src={pet.image_url} alt="" />
            <span>
              <strong>{pet.name}</strong>
              <small><MapPin size={13} /> {pet.city} · {sizeLabels[pet.size]}</small>
            </span>
            <span className={`status-pill status-${pet.status}`}>{statusLabels[pet.status] ?? pet.status}</span>
          </div>
          {adoptions.length ? (
            <ul className="interest-list">
              {adoptions.map((adoption) => (
                <li key={adoption.id} className="interest-card">
                  <div className="interest-head">
                    <strong>{adoption.applicant_name}</strong>
                    <time dateTime={adoption.created_at}>{new Date(adoption.created_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</time>
                  </div>
                  <a className="interest-email" href={`mailto:${adoption.applicant_email}?subject=${encodeURIComponent(`Adoção de ${pet.name}`)}`}>
                    <Mail size={14} /> {adoption.applicant_email}
                  </a>
                  <p>{adoption.message}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="hint"><Inbox size={14} /> Nenhum interesse em {pet.name} ainda.</p>
          )}
        </section>
      ))}
    </main>
  )
}

export default App
