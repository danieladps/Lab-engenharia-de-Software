import { useEffect, useState } from 'react'
import {
  ArrowLeft, ArrowRight, Check, ChevronDown, Copy, Heart, Inbox, KeyRound, LoaderCircle, Mail,
  MapPin, PawPrint, Plus, Search, ShieldCheck, Sparkles, X,
} from 'lucide-react'
import api from './api'
import './App.css'

const speciesOptions = ['Todos', 'Cão', 'Gato', 'Outro']
const sizeLabels = { small: 'Pequeno', medium: 'Médio', large: 'Grande' }
const statusLabels = { available: 'Disponível', adoption_pending: 'Interesse recebido' }
const MANAGE_PREFIX = '#gerenciar/'

function tokenFromHash() {
  const { hash } = window.location
  return hash.startsWith(MANAGE_PREFIX) ? decodeURIComponent(hash.slice(MANAGE_PREFIX.length)) : ''
}

function manageLink(token) {
  return `${window.location.origin}${window.location.pathname}${MANAGE_PREFIX}${token}`
}

// Aceita tanto o link completo quanto só o código colado pelo responsável.
function extractToken(value) {
  const text = value.trim()
  const index = text.indexOf(MANAGE_PREFIX)
  return index >= 0 ? text.slice(index + MANAGE_PREFIX.length) : text
}

function App() {
  const [petResults, setPetResults] = useState({ filterKey: null, items: [], error: '' })
  const [filters, setFilters] = useState({ species: 'Todos', size: 'Todos', city: '' })
  const [citySearch, setCitySearch] = useState('')
  const [modal, setModal] = useState(null)
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)
  const [manageToken, setManageToken] = useState(tokenFromHash)
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
    const syncToken = () => setManageToken(tokenFromHash())
    window.addEventListener('hashchange', syncToken)
    return () => window.removeEventListener('hashchange', syncToken)
  }, [])

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
      setModal({ type: 'created', pet: createdPet })
      const { manage_token: _token, ...publicPet } = createdPet
      if ((filters.species === 'Todos' || filters.species === createdPet.species)
        && (filters.size === 'Todos' || filters.size === createdPet.size)
        && (!filters.city || createdPet.city.toLowerCase().includes(filters.city.toLowerCase()))) {
        setPetResults((current) => current.filterKey === filterKey
          ? { ...current, items: [publicPet, ...current.items] }
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
      await api.post(`/pets/${modal.pet.id}/adoptions`, {
        applicant_name: form.get('applicant_name'),
        applicant_email: form.get('applicant_email'),
        message: form.get('message'),
      })
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

  function openManagePage(token) {
    setModal(null)
    window.location.hash = `${MANAGE_PREFIX.slice(1)}${encodeURIComponent(token)}`
    window.scrollTo(0, 0)
  }

  function leaveManagePage() {
    window.location.hash = 'pets'
    setManageToken('')
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#inicio" aria-label="PetLume, início">
          <span className="brand-mark"><PawPrint size={21} strokeWidth={2.5} /></span>
          <span>petlume<span className="brand-period">.</span></span>
        </a>
        <nav className="main-nav" aria-label="Navegação principal">
          <a className={manageToken ? 'nav-link' : 'nav-link active'} href="#pets"><span className="nav-long">Encontrar um pet</span><span className="nav-short">Pets</span></a>
          <button className={manageToken ? 'nav-link active' : 'nav-link'} onClick={() => setModal({ type: 'access' })}>Meu anúncio</button>
        </nav>
        <div className="account-actions">
          <button className="button button-dark button-small" onClick={() => setModal({ type: 'pet' })}>
            <Plus size={15} /> Anunciar pet
          </button>
        </div>
      </header>

      {manageToken ? (
        <ManagePage key={manageToken} token={manageToken} onBack={leaveManagePage} />
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
              <button className="button button-light" onClick={() => setModal({ type: 'pet' })}>
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
            <div className="pet-grid">{pets.map((pet, index) => <PetCard key={pet.id} pet={pet} index={index} onAdopt={() => setModal({ type: 'adoption', pet })} />)}</div>
          ) : !loadError ? (
            <div className="empty-state">
              <span className="empty-paw"><PawPrint size={28} /></span>
              <h3>Nenhum pet por aqui ainda</h3>
              <p>Tente outra cidade ou volte em breve. Novos amigos aparecem por aqui todos os dias.</p>
              <button className="button button-dark" onClick={() => setModal({ type: 'pet' })}><Plus size={16} /> Publicar um anúncio</button>
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
          {modal.type === 'pet' && <PetForm busy={busy} onSubmit={handlePetSubmit} onClose={() => setModal(null)} />}
          {modal.type === 'adoption' && <AdoptionForm pet={modal.pet} busy={busy} onSubmit={handleAdoptionSubmit} onClose={() => setModal(null)} />}
          {modal.type === 'created' && <CreatedNotice pet={modal.pet} onOpen={() => openManagePage(modal.pet.manage_token)} onClose={() => setModal(null)} />}
          {modal.type === 'access' && <AccessForm onSubmit={openManagePage} onClose={() => setModal(null)} />}
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

function PetForm({ busy, onSubmit, onClose }) {
  return (
    <>
      <ModalHeading eyebrow="Um novo encontro" title="Conte sobre o pet" subtitle="Uma boa história ajuda a encontrar a família certa." onClose={onClose} />
      <form className="form-stack form-grid" onSubmit={onSubmit}>
        <label>Seu nome<input name="donor_name" placeholder="Ex.: Casa Amora" required minLength="2" maxLength="120" /></label>
        <label>Nome do pet<input name="name" placeholder="Ex.: Nina" required minLength="2" /></label>
        <label>Espécie<select name="species" defaultValue="Cão"><option>Cão</option><option>Gato</option><option>Outro</option></select></label>
        <label>Raça<input name="breed" placeholder="Ex.: Sem raça definida" required minLength="2" /></label>
        <label>Porte<select name="size" defaultValue="medium"><option value="small">Pequeno</option><option value="medium">Médio</option><option value="large">Grande</option></select></label>
        <label>Idade (anos)<input name="age_years" type="number" min="0" max="30" defaultValue="1" required /></label>
        <label>Cidade<input name="city" placeholder="Ex.: São Paulo, SP" required minLength="2" /></label>
        <label className="full-field">Foto do pet (URL)<input name="image_url" type="url" placeholder="https://..." required /></label>
        <label className="full-field">Um pouco sobre ele<textarea name="description" rows="3" placeholder="Conte sobre a personalidade, saúde e rotina do pet." required minLength="10" maxLength="2000" /></label>
        <button className="button button-dark form-submit full-field" disabled={busy}>{busy ? <LoaderCircle className="spin" size={18} /> : <Plus size={17} />} Publicar anúncio</button>
      </form>
    </>
  )
}

function AdoptionForm({ pet, busy, onSubmit, onClose }) {
  return (
    <>
      <ModalHeading eyebrow={`Conheça ${pet.name}`} title="Dê o primeiro passo" subtitle="Deixe um contato para que o responsável pelo pet possa falar com você." onClose={onClose} />
      <div className="modal-pet"><img src={pet.image_url} alt="" /><span><strong>{pet.name}</strong><small><MapPin size={13} /> {pet.city}</small></span></div>
      <form className="form-stack" onSubmit={onSubmit}>
        <label>Seu nome<input name="applicant_name" autoComplete="name" required minLength="2" maxLength="120" /></label>
        <label>Seu e-mail<input name="applicant_email" type="email" autoComplete="email" required minLength="5" maxLength="255" /></label>
        <label>Mensagem<textarea name="message" rows="4" minLength="10" maxLength="2000" placeholder="Fale um pouco sobre você, sua casa e os cuidados que pode oferecer." required /></label>
        <button className="button button-dark form-submit" disabled={busy}>{busy ? <LoaderCircle className="spin" size={18} /> : <Heart size={17} />} Enviar interesse</button>
      </form>
    </>
  )
}

function CreatedNotice({ pet, onOpen, onClose }) {
  const [copied, setCopied] = useState(false)
  const link = manageLink(pet.manage_token)

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
    } catch {
      setCopied(false)
    }
  }

  return (
    <>
      <ModalHeading eyebrow="Anúncio publicado" title={`${pet.name} já está na vitrine`} subtitle="Guarde este link: é por ele que você vai ver quem se interessou. Ele não será mostrado de novo." onClose={onClose} />
      <div className="form-stack">
        <label>Seu link de gerenciamento
          <span className="copy-field">
            <input readOnly value={link} onFocus={(event) => event.target.select()} aria-label="Link de gerenciamento" />
            <button type="button" className="button button-light button-small" onClick={copyLink}>
              {copied ? <Check size={15} /> : <Copy size={15} />} {copied ? 'Copiado' : 'Copiar'}
            </button>
          </span>
        </label>
        <p className="hint"><KeyRound size={14} /> Quem tiver este link vê os contatos dos interessados. Não compartilhe.</p>
        <button className="button button-dark form-submit" onClick={onOpen}><Inbox size={17} /> Ver interesses recebidos</button>
      </div>
    </>
  )
}

function AccessForm({ onSubmit, onClose }) {
  return (
    <>
      <ModalHeading eyebrow="Para quem anunciou" title="Acesse seu anúncio" subtitle="Cole o link ou o código que apareceu quando você publicou o pet." onClose={onClose} />
      <form className="form-stack" onSubmit={(event) => {
        event.preventDefault()
        const token = extractToken(new FormData(event.currentTarget).get('token') || '')
        if (token) onSubmit(token)
      }}>
        <label>Link ou código<input name="token" required minLength="10" autoComplete="off" placeholder="https://.../#gerenciar/..." /></label>
        <button className="button button-dark form-submit"><KeyRound size={17} /> Ver meu anúncio</button>
      </form>
    </>
  )
}

function ManagePage({ token, onBack }) {
  const [state, setState] = useState({ loading: true, data: null, error: '' })

  useEffect(() => {
    let active = true
    api.get(`/manage/${encodeURIComponent(token)}`)
      .then(({ data }) => { if (active) setState({ loading: false, data, error: '' }) })
      .catch((error) => {
        if (active) {
          setState({
            loading: false,
            data: null,
            error: error.response?.status === 404
              ? 'Não encontramos um anúncio com este link. Confira se ele foi copiado inteiro.'
              : 'Não foi possível carregar o anúncio. Confira se a API está ativa.',
          })
        }
      })
    return () => { active = false }
  }, [token])

  const { loading, data, error } = state

  return (
    <main className="content-section manage-page">
      <button className="back-link" onClick={onBack}><ArrowLeft size={16} /> Voltar para os pets</button>
      <div className="section-heading">
        <div><span className="eyebrow eyebrow-muted">Área do responsável</span><h2>Interesses recebidos<span className="brand-period">.</span></h2></div>
      </div>
      {loading && <div className="loading-state"><LoaderCircle className="spin" size={24} /> Carregando seu anúncio...</div>}
      {error && <div className="inline-error">{error}</div>}
      {data && (
        <>
          <div className="modal-pet manage-pet">
            <img src={data.pet.image_url} alt="" />
            <span>
              <strong>{data.pet.name}</strong>
              <small><MapPin size={13} /> {data.pet.city} · {sizeLabels[data.pet.size]}</small>
            </span>
            <span className={`status-pill status-${data.pet.status}`}>{statusLabels[data.pet.status] ?? data.pet.status}</span>
          </div>
          {data.adoptions.length ? (
            <ul className="interest-list">
              {data.adoptions.map((adoption) => (
                <li key={adoption.id} className="interest-card">
                  <div className="interest-head">
                    <strong>{adoption.applicant_name}</strong>
                    <time dateTime={adoption.created_at}>{new Date(adoption.created_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</time>
                  </div>
                  <a className="interest-email" href={`mailto:${adoption.applicant_email}?subject=${encodeURIComponent(`Adoção de ${data.pet.name}`)}`}>
                    <Mail size={14} /> {adoption.applicant_email}
                  </a>
                  <p>{adoption.message}</p>
                </li>
              ))}
            </ul>
          ) : (
            <div className="empty-state">
              <span className="empty-paw"><Inbox size={28} /></span>
              <h3>Nenhum interesse ainda</h3>
              <p>Assim que alguém demonstrar interesse em {data.pet.name}, o contato aparece aqui.</p>
            </div>
          )}
        </>
      )}
    </main>
  )
}

export default App
