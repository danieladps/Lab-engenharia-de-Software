import { useEffect, useRef, useState } from 'react'
import { loadGoogleMaps, MAPS_KEY } from '../lib/googleMaps'

// Mapa do Google com um marcador por local e um ponto azul em quem procura.
// Tocar num marcador escolhe o local (onSelect); o local escolhido fica em destaque.
export default function PlacesMap({ center, centerLabel, places, selectedId, onSelect }) {
  const box = useRef(null)
  const map = useRef(null)
  const markers = useRef(new Map())
  const [ready, setReady] = useState(false)
  const [failed, setFailed] = useState(false)

  // Cria o mapa uma vez.
  useEffect(() => {
    let active = true
    // O Google chama esta função quando a chave é inválida ou não vale para este endereço.
    window.gm_authFailure = () => { if (active) setFailed(true) }
    loadGoogleMaps()
      .then((maps) => {
        if (!active || !box.current) return
        map.current = new maps.Map(box.current, {
          center: { lat: center.lat, lng: center.lng },
          zoom: 11,
          clickableIcons: false,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
        })
        setReady(true)
      })
      .catch(() => { if (active) setFailed(true) })
    return () => { active = false }
    // O centro inicial só importa na criação; depois, o enquadramento é feito abaixo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Marcadores: refeitos quando a lista ou a posição mudam.
  useEffect(() => {
    if (!ready) return
    const maps = window.google.maps
    const current = markers.current
    current.forEach((marker) => marker.setMap(null))
    current.clear()

    const bounds = new maps.LatLngBounds()
    const here = new maps.Marker({
      map: map.current,
      position: { lat: center.lat, lng: center.lng },
      title: centerLabel,
      zIndex: 1000,
      icon: { path: maps.SymbolPath.CIRCLE, scale: 8, fillColor: '#2563eb', fillOpacity: 1, strokeColor: '#ffffff', strokeWeight: 3 },
    })
    current.set('__here', here)
    bounds.extend(here.getPosition())

    places.forEach((place, index) => {
      const marker = new maps.Marker({
        map: map.current,
        position: { lat: place.latitude, lng: place.longitude },
        title: place.name,
        label: { text: String(index + 1), color: '#ffffff', fontWeight: '700' },
      })
      marker.addListener('click', () => onSelect(place.id))
      current.set(place.id, marker)
      bounds.extend(marker.getPosition())
    })
    if (places.length) map.current.fitBounds(bounds, 48)
    else map.current.setCenter({ lat: center.lat, lng: center.lng })
  }, [ready, center.lat, center.lng, centerLabel, places, onSelect])

  // Local escolhido na lista: centraliza e faz o marcador pular uma vez.
  useEffect(() => {
    if (!ready || !selectedId) return
    const marker = markers.current.get(selectedId)
    if (!marker) return
    map.current.panTo(marker.getPosition())
    marker.setAnimation(window.google.maps.Animation.BOUNCE)
    const timer = setTimeout(() => marker.setAnimation(null), 1400)
    return () => clearTimeout(timer)
  }, [ready, selectedId])

  if (!MAPS_KEY) return null
  if (failed) return <p className="hint map-error">O mapa não pôde ser carregado agora. A lista abaixo continua funcionando.</p>
  return <div ref={box} className="places-map" role="region" aria-label="Mapa dos locais de adoção" />
}
