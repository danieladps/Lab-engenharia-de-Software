import { useState } from 'react'
import { LoaderCircle, MapPin } from 'lucide-react'
import { locateCity } from '../lib/location'

// Alternativa quando a localização do navegador falha: a pessoa digita a cidade.
// Devolve { lat, lng, label } do centro da cidade em onFound.
export default function CityLocator({ message, onFound }) {
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()
    if (name.trim().length < 2) return
    setBusy(true)
    setError('')
    try {
      onFound(await locateCity(name))
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className="city-locator" onSubmit={handleSubmit}>
      <p className="city-locator-message" role="alert">{message}</p>
      <div className="city-locator-row">
        <label className="search-field">
          <MapPin size={18} aria-hidden="true" />
          <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Sua cidade, ex.: São Paulo" aria-label="Sua cidade" minLength="2" maxLength="100" required />
        </label>
        <button className="button button-primary button-small" disabled={busy}>
          {busy && <LoaderCircle className="spin" size={16} aria-hidden="true" />} Buscar
        </button>
      </div>
      {error && <p className="inline-error">{error}</p>}
    </form>
  )
}
