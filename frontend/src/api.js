import axios from 'axios'

export const TOKEN_KEY = 'petlume.token'
export const SESSION_EXPIRED_EVENT = 'petlume:sessao-expirada'

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || '/api' })

// Envia o token de login em toda chamada, quando existir.
api.interceptors.request.use((config) => {
  try {
    const token = window.localStorage.getItem(TOKEN_KEY)
    if (token) config.headers.Authorization = `Bearer ${token}`
  } catch {
    // Navegador sem armazenamento: segue sem login.
  }
  return config
})

// Se uma chamada com login voltar 401, o token venceu ou é inválido:
// apaga o token e avisa o app (lib/auth.jsx) para deslogar a pessoa.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const sentToken = Boolean(error.config?.headers?.Authorization)
    const isLoginCall = /\/auth\/(login|cadastro)$/.test(error.config?.url ?? '')
    if (error.response?.status === 401 && sentToken && !isLoginCall) {
      saveToken(null)
      window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT))
    }
    return Promise.reject(error)
  },
)

export function saveToken(token) {
  try {
    if (token) window.localStorage.setItem(TOKEN_KEY, token)
    else window.localStorage.removeItem(TOKEN_KEY)
  } catch {
    // Ignora: o login vale só até fechar a aba.
  }
}

export function hasToken() {
  try {
    return Boolean(window.localStorage.getItem(TOKEN_KEY))
  } catch {
    return false
  }
}

export default api
