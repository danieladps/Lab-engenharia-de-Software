import { useEffect, useState } from 'react'
import { ExternalLink, House, LoaderCircle, LocateFixed, MapPin } from 'lucide-react'
import api from '../api'
import PageHeader from '../components/PageHeader'
import EmptyState from '../components/EmptyState'
import { apiError } from '../lib/pets'
import { distanceLabel, getUserLocation } from '../lib/location'

// ONGs, abrigos e centros de adoção perto de quem procura (dados do Google Maps, via nossa API).
// Sem a localização, a API busca a partir do centro de São Paulo.
export default function AdoptionPlaces() {
  const [position, setPosition] = useState(null)
  const [locating, setLocating] = useState(false)
  const [locationError, setLocationError] = useState('')
  const [result, setResult] = useState({ key: null, items: [], error: '' })

  const key = JSON.stringify(position ?? {})
  const loading = result.key !== key

  useEffect(() => {
    let active = true
    api.get('/adoption-places', { params: JSON.parse(key) })
      .then(({ data }) => { if (active) setResult({ key, items: data, error: '' }) })
      .catch((error) => { if (active) setResult({ key, items: [], error: apiError(error, 'Não foi possível buscar os locais agora.') }) })
    return () => { active = false }
  }, [key])

  async function useMyLocation() {
    setLocationError('')
    setLocating(true)
    try {
      setPosition(await getUserLocation())
    } catch (error) {
      setLocationError(error.message)
    } finally {
      setLocating(false)
    }
  }

  return (
    <main className="page">
      <PageHeader title="Onde adotar" subtitle={position ? 'ONGs e abrigos perto de você' : 'ONGs e abrigos perto do centro de São Paulo'} />

      <button type="button" className={position ? 'near-button active' : 'near-button'} onClick={useMyLocation} disabled={locating || Boolean(position)}>
        {locating ? <LoaderCircle className="spin" size={16} aria-hidden="true" /> : <LocateFixed size={16} aria-hidden="true" />}
        {locating ? 'Descobrindo sua localização...' : position ? 'Usando sua localização' : 'Usar minha localização'}
      </button>
      {locationError && <p className="inline-error" role="alert">{locationError}</p>}

      {loading ? (
        <div className="loading-state"><LoaderCircle className="spin" size={22} /> Buscando locais...</div>
      ) : result.error ? (
        <p className="notice" role="alert">{result.error}</p>
      ) : result.items.length ? (
        <>
          <ul className="place-list">
            {result.items.map((place) => (
              <li key={place.id} className="place-item">
                <span className="owner-icon"><House size={18} aria-hidden="true" /></span>
                <div className="place-text">
                  <strong>{place.name}</strong>
                  <span className="place-address">{place.address}</span>
                  <span className="place-distance"><MapPin size={13} aria-hidden="true" /> {distanceLabel(place.distance_km)}</span>
                </div>
                {place.maps_url && (
                  <a className="button button-ghost button-small" href={place.maps_url} target="_blank" rel="noopener noreferrer" aria-label={`Abrir ${place.name} no Google Maps`}>
                    <ExternalLink size={15} aria-hidden="true" /> Mapa
                  </a>
                )}
              </li>
            ))}
          </ul>
          <p className="hint place-credit">Dados do Google Maps. Confirme horários e regras de adoção direto com cada local.</p>
        </>
      ) : (
        <EmptyState icon={House} title="Nenhum local encontrado aqui">
          Tente usar sua localização ou procure de novo mais tarde.
        </EmptyState>
      )}
    </main>
  )
}
