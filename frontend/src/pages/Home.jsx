import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { LoaderCircle, MapPin, PawPrint, Plus, Search, SlidersHorizontal, X } from 'lucide-react'
import api from '../api'
import PetCard from '../components/PetCard'
import PetImage from '../components/PetImage'
import EmptyState from '../components/EmptyState'
import { useAuth } from '../lib/auth'
import { ageLabel, apiError, firstName, speciesChips } from '../lib/pets'

export default function Home() {
  const { user } = useAuth()
  const [species, setSpecies] = useState('Todos')
  const [size, setSize] = useState('Todos')
  const [city, setCity] = useState('')
  const [cityDraft, setCityDraft] = useState('')
  const [text, setText] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [result, setResult] = useState({ key: null, items: [], error: '' })

  // A busca por espécie, porte e cidade vai para a API; nome e raça filtram na tela.
  const key = JSON.stringify({ species, size, city })
  const current = result.key === key ? result : null
  const loading = current === null

  useEffect(() => {
    let active = true
    const params = Object.fromEntries(Object.entries(JSON.parse(key)).filter(([, value]) => value && value !== 'Todos'))
    api.get('/pets', { params })
      .then(({ data }) => { if (active) setResult({ key, items: data, error: '' }) })
      .catch((error) => { if (active) setResult({ key, items: [], error: apiError(error, 'Não foi possível carregar os pets.') }) })
    return () => { active = false }
  }, [key])

  const pets = useMemo(() => {
    const term = text.trim().toLowerCase()
    const items = current?.items ?? []
    return term ? items.filter((pet) => `${pet.name} ${pet.breed}`.toLowerCase().includes(term)) : items
  }, [current, text])

  const featured = !text && species === 'Todos' && size === 'Todos' && !city ? pets[0] : null
  const activeFilters = (size !== 'Todos') + Boolean(city)

  function applyCity(event) {
    event.preventDefault()
    setCity(cityDraft.trim())
    setShowFilters(false)
  }

  function clearFilters() {
    setSize('Todos')
    setCity('')
    setCityDraft('')
  }

  return (
    <main className="page home">
      <header className="home-head">
        <div>
          <p className="home-location"><MapPin size={14} aria-hidden="true" /> {city || user?.city || 'Todo o Brasil'}</p>
          <h1 className="home-title">
            {user ? `Olá, ${firstName(user.name)}! ` : ''}Encontre seu <em>companheiro perfeito</em>
          </h1>
        </div>
        <Link to={user ? '/perfil' : '/entrar'} className="avatar" aria-label={user ? 'Meu perfil' : 'Entrar'}>
          {user ? firstName(user.name)[0]?.toUpperCase() : <PawPrint size={18} aria-hidden="true" />}
        </Link>
      </header>

      <div className="search-row">
        <label className="search-field">
          <Search size={18} aria-hidden="true" />
          <input type="search" value={text} onChange={(event) => setText(event.target.value)} placeholder="Buscar por nome ou raça" aria-label="Buscar por nome ou raça" />
        </label>
        <button type="button" className={`icon-button filter-toggle${activeFilters ? ' has-filters' : ''}`} onClick={() => setShowFilters((open) => !open)} aria-expanded={showFilters} aria-controls="filters" aria-label="Filtros de porte e cidade">
          <SlidersHorizontal size={18} />
          {activeFilters > 0 && <span className="filter-count">{activeFilters}</span>}
        </button>
      </div>

      {showFilters && (
        <form id="filters" className="filter-panel" onSubmit={applyCity}>
          <label>Porte
            <select value={size} onChange={(event) => setSize(event.target.value)}>
              <option value="Todos">Todos</option>
              <option value="small">Pequeno</option>
              <option value="medium">Médio</option>
              <option value="large">Grande</option>
            </select>
          </label>
          <label>Cidade
            <input value={cityDraft} onChange={(event) => setCityDraft(event.target.value)} placeholder="Ex.: São Paulo" />
          </label>
          <div className="filter-actions">
            <button type="button" className="button button-ghost button-small" onClick={clearFilters}><X size={15} aria-hidden="true" /> Limpar</button>
            <button className="button button-primary button-small">Aplicar</button>
          </div>
        </form>
      )}

      {featured && (
        <Link to={`/pets/${featured.id}`} className="featured">
          <PetImage src={featured.image_url} alt="" className="featured-photo" />
          <div className="featured-text">
            <span className="featured-label">Chegou agora</span>
            <strong>{featured.name}</strong>
            <span>{featured.breed}, {ageLabel(featured.age_years).toLowerCase()}</span>
            <span className="featured-cta">Ver perfil</span>
          </div>
        </Link>
      )}

      <section aria-labelledby="available-title">
        <div className="section-title">
          <h2 id="available-title">Disponíveis para adoção</h2>
          {!loading && <span>{pets.length} {pets.length === 1 ? 'pet' : 'pets'}</span>}
        </div>
        <div className="chips" role="group" aria-label="Filtrar por espécie">
          {speciesChips.map((chip) => (
            <button key={chip.value} type="button" className={species === chip.value ? 'chip selected' : 'chip'} aria-pressed={species === chip.value} onClick={() => setSpecies(chip.value)}>
              {chip.label}
            </button>
          ))}
        </div>

        {current?.error && <p className="inline-error" role="alert">{current.error}</p>}
        {loading ? (
          <div className="loading-state"><LoaderCircle className="spin" size={22} /> Buscando pets...</div>
        ) : pets.length ? (
          <div className="pet-grid">{pets.map((pet) => <PetCard key={pet.id} pet={pet} />)}</div>
        ) : !current?.error && (
          <EmptyState icon={PawPrint} title="Nenhum pet encontrado" action={<Link to="/anunciar" className="button button-primary"><Plus size={16} aria-hidden="true" /> Anunciar um pet</Link>}>
            Tente outra busca ou limpe os filtros. Se você tem um pet para doar, ele pode ser o primeiro daqui.
          </EmptyState>
        )}
      </section>

      <Link to="/anunciar" className="fab" aria-label="Anunciar um pet"><Plus size={24} aria-hidden="true" /></Link>
    </main>
  )
}
