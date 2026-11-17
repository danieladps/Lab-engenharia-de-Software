// Carrega o Google Maps (Maps JavaScript API) só quando a página do mapa abre.
// A chave VITE_GOOGLE_MAPS_KEY é pública por natureza (roda no navegador): no Google Cloud,
// restrinja ao endereço do site e só à Maps JavaScript API. Sem chave, o mapa não aparece.
export const MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_KEY ?? ''

let loading = null

export function loadGoogleMaps() {
  if (window.google?.maps?.Map) return Promise.resolve(window.google.maps)
  if (!MAPS_KEY) return Promise.reject(new Error('sem chave'))
  if (!loading) {
    loading = new Promise((resolve, reject) => {
      const callback = `__petlumeMaps${Date.now()}`
      window[callback] = () => {
        delete window[callback]
        resolve(window.google.maps)
      }
      const params = new URLSearchParams({ key: MAPS_KEY, callback, language: 'pt-BR', region: 'BR', loading: 'async' })
      const script = document.createElement('script')
      script.src = `https://maps.googleapis.com/maps/api/js?${params}`
      script.async = true
      script.onerror = () => {
        loading = null
        reject(new Error('Não foi possível carregar o mapa.'))
      }
      document.head.appendChild(script)
    })
  }
  return loading
}
