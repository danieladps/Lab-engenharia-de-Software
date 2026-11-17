import { useCallback, useEffect, useState } from 'react'
import { ExternalLink, House, LoaderCircle, LocateFixed, MapPin } from 'lucide-react'
import api from '../api'
import CityLocator from '../components/CityLocator'
import EmptyState from '../components/EmptyState'
import PageHeader from '../components/PageHeader'
import PlacesMap from '../components/PlacesMap'
import { apiError } from '../lib/pets'
import { distanceLabel, getUserLocation } from '../lib/location'

// Sem localização, a API busca a partir do centro de São Paulo (mesmo ponto do backend).
const SAO_PAULO = { lat: -23.55, lng: -46.63, label: 'Centro de São Paulo' }

// ONGs, abrigos e centros de adoção perto de quem procura (dados do Google Maps, via nossa API),
// num mapa e numa lista. A posição pode vir do navegador ou de uma cidade digitada.
export default function AdoptionPlaces() {
  const [position, setPosition] = useState(null)
  const [locating, setLocating] = useState(false)
  const [locationError, setLocationError] = useState('')
  const [result, setResult] = useState({ key: null, items: [], error: '' })
  const [selectedId, setSelectedId] = useState(null)

  const center = position ?? SAO_PAULO
  const key = JSON.stringify(position ? { lat: position.lat, lng: position.lng } : {})
  const loading = result.key !== key

  useEffect(() => {
    let active = true
    api.get('/adoption-places', { params: JSON.parse(key) })
      .then(({ data }) => { if (active) setResult({ key, items: data, error: '' }) })
      .catch((error) => { if (active) setResult({ key, items: [], error: apiError(error, 'Não foi possível buscar os locais agora.') }) })
    return () => { active = false }
  }, [key])

  async function locateMe() {
    setLocationError('')
    setLocating(true)
    try {
      setPosition({ ...(await getUserLocation()), label: 'você' })
      setSelectedId(null)
    } catch (error) {
      setLocationError(error.message)
    } finally {
      setLocating(false)
    }
  }

  function chooseCity(found) {
    setLocationError('')
    setPosition(found)
    setSelectedId(null)
  }

  // Marcador tocado no mapa: destaca o local e rola a lista até ele.
  const selectFromMap = useCallback((id) => {
    setSelectedId(id)
    document.getElementById(`local-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [])

  const usingDevice = position?.label === 'você'

  return (
    <main className="page">
      <PageHeader title="Onde adotar" subtitle={position ? `ONGs e abrigos perto de ${position.label}` : 'ONGs e abrigos perto do centro de São Paulo'} />

      <button type="button" className={usingDevice ? 'near-button active' : 'near-button'} onClick={locateMe} disabled={locating || usingDevice}>
        {locating ? <LoaderCircle className="spin" size={16} aria-hidden="true" /> : <LocateFixed size={16} aria-hidden="true" />}
        {locating ? 'Descobrindo sua localização...' : usingDevice ? 'Usando sua localização' : 'Usar minha localização'}
      </button>
      {locationError && <CityLocator message={locationError} onFound={chooseCity} />}

      {loading ? (
        <div className="loading-state"><LoaderCircle className="spin" size={22} /> Buscando locais...</div>
      ) : result.error ? (
        <p className="notice" role="alert">{result.error}</p>
      ) : result.items.length ? (
        <>
          <PlacesMap center={center} centerLabel={usingDevice ? 'Você está aqui' : center.label} places={result.items} selectedId={selectedId} onSelect={selectFromMap} />
          <ol className="place-list">
            {result.items.map((place, index) => (
              <li key={place.id} id={`local-${place.id}`} className={place.id === selectedId ? 'place-item selected' : 'place-item'}>
                <button type="button" className="place-number" onClick={() => setSelectedId(place.id)} aria-label={`Mostrar ${place.name} no mapa`}>{index + 1}</button>
                <div className="place-text">
                  <strong>{place.name}</strong>
                  <span className="place-address">{place.address}</span>
                  <span className="place-distance"><MapPin size={13} aria-hidden="true" /> {distanceLabel(place.distance_km)}</span>
                </div>
                {place.maps_url && (
                  <a className="button button-ghost button-small" href={place.maps_url} target="_blank" rel="noopener noreferrer" aria-label={`Abrir ${place.name} no Google Maps`}>
                    <ExternalLink size={15} aria-hidden="true" /> Rota
                  </a>
                )}
              </li>
            ))}
          </ol>
          <p className="hint place-credit">Dados do Google Maps. Confirme horários e regras de adoção direto com cada local.</p>
        </>
      ) : (
        <EmptyState icon={House} title="Nenhum local encontrado aqui">
          Tente usar sua localização ou digite outra cidade.
        </EmptyState>
      )}
    </main>
  )
}
