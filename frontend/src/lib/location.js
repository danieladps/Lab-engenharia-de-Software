// Localização de quem procura um pet.
// A posição fica só na memória da página e vai para a API arredondada (cerca de 1 km),
// só para calcular a distância; a API não guarda.

const NOMINATIM_REVERSE = 'https://nominatim.openstreetmap.org/reverse'

export function getUserLocation() {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('Seu navegador não informa a localização. Use o filtro de cidade.'))
      return
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => resolve({
        lat: Math.round(coords.latitude * 100) / 100,
        lng: Math.round(coords.longitude * 100) / 100,
      }),
      (error) => reject(new Error(error.code === error.PERMISSION_DENIED
        ? 'Você não permitiu o acesso à localização. Libere nas configurações do navegador ou use o filtro de cidade.'
        : 'Não foi possível descobrir sua localização agora. Tente de novo ou use o filtro de cidade.')),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 10 * 60 * 1000 },
    )
  })
}

// Nome da cidade da posição, pela API pública do OpenStreetMap. Se falhar, a busca funciona igual.
export async function cityName({ lat, lng }) {
  try {
    const params = new URLSearchParams({ lat, lon: lng, format: 'jsonv2', zoom: '10', 'accept-language': 'pt-BR' })
    const response = await fetch(`${NOMINATIM_REVERSE}?${params}`)
    if (!response.ok) return null
    const { address = {} } = await response.json()
    return address.city || address.town || address.municipality || address.village || null
  } catch {
    return null
  }
}

export function distanceLabel(km) {
  if (km == null) return null
  if (km < 5) return 'a menos de 5 km'
  return `a ${km < 100 ? Math.round(km) : Math.round(km / 10) * 10} km`
}
