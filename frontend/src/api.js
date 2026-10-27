import axios from 'axios'

export const TOKEN_KEY = 'petlume.token'

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
