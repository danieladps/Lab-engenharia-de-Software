// Localização de quem procura um pet.
// A posição fica só na memória da página e vai para a API arredondada (cerca de 1 km),
// só para calcular a distância; a API não guarda.

const NOMINATIM_REVERSE = 'https://nominatim.openstreetmap.org/reverse'

function askPosition(options) {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => resolve({
        lat: Math.round(coords.latitude * 100) / 100,
        lng: Math.round(coords.longitude * 100) / 100,
      }),
      reject,
      options,
    )
  })
}

// Posição de quem procura. Se a primeira tentativa não achar a posição (comum em
// computador sem Wi-Fi ou com a localização do sistema desligada), tenta de novo
// com mais tempo e aceitando uma posição guardada há pouco pelo navegador.
export async function getUserLocation() {
  if (!('geolocation' in navigator)) {
    throw new Error('Seu navegador não informa a localização. Digite sua cidade.')
  }
  try {
    return await askPosition({ enableHighAccuracy: false, timeout: 10000, maximumAge: 10 * 60 * 1000 })
  } catch (error) {
    if (error.code === error.PERMISSION_DENIED) {
      throw new Error('Você não permitiu o acesso à localização. Libere nas configurações do navegador ou digite sua cidade.')
    }
  }
  try {
    return await askPosition({ enableHighAccuracy: true, timeout: 20000, maximumAge: 60 * 60 * 1000 })
  } catch {
    throw new Error('Não foi possível descobrir sua localização. Confira se a localização do computador está ligada ou digite sua cidade.')
  }
}

const NOMINATIM_SEARCH = 'https://nominatim.openstreetmap.org/search'

// Coordenadas do centro de uma cidade digitada, para quando a localização do navegador falha.
export async function locateCity(name) {
  const params = new URLSearchParams({ city: name.trim(), country: 'Brasil', format: 'jsonv2', limit: '1', 'accept-language': 'pt-BR' })
  let results
  try {
    const response = await fetch(`${NOMINATIM_SEARCH}?${params}`)
    if (!response.ok) throw new Error()
    results = await response.json()
  } catch {
    throw new Error('Não foi possível procurar a cidade agora. Tente de novo.')
  }
  if (!results.length) throw new Error('Não encontramos essa cidade. Confira o nome.')
  const [first] = results
  return {
    lat: Math.round(Number(first.lat) * 100) / 100,
    lng: Math.round(Number(first.lon) * 100) / 100,
    label: first.name || name.trim(),
  }
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
