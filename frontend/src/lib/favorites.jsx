import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import api from '../api'

const NO_PETS = []
import { useAuth } from './auth'
import { useToast } from './toast'
import { apiError } from './pets'

const FavoritesContext = createContext(null)

// Guarda os favoritos da conta logada para os corações aparecerem certos em todas as telas.
export function FavoritesProvider({ children }) {
  const { user } = useAuth()
  const toast = useToast()
  const [state, setState] = useState({ userId: null, pets: [], loaded: false })
  const userId = user?.id ?? null

  const refresh = useCallback(() => {
    if (!userId) return Promise.resolve()
    return api.get('/me/favorites')
      .then(({ data }) => setState({ userId, pets: data, loaded: true }))
      .catch(() => setState((current) => ({ ...current, userId, loaded: true })))
  }, [userId])

  useEffect(() => {
    if (userId) refresh()
  }, [userId, refresh])

  // Ao sair da conta, os favoritos da conta anterior deixam de valer.
  const pets = state.userId === userId ? state.pets : NO_PETS
  const loaded = state.userId === userId && state.loaded
  const ids = useMemo(() => new Set(pets.map((pet) => pet.id)), [pets])

  const toggle = useCallback(async (pet) => {
    const saved = ids.has(pet.id)
    // Atualiza na hora e desfaz se a API recusar.
    setState((current) => {
      const base = current.userId === userId ? current.pets : NO_PETS
      return { ...current, userId, pets: saved ? base.filter((item) => item.id !== pet.id) : [pet, ...base] }
    })
    try {
      if (saved) await api.delete(`/me/favorites/${pet.id}`)
      else await api.put(`/me/favorites/${pet.id}`)
    } catch (error) {
      setState((current) => (current.userId !== userId ? current : {
        ...current,
        pets: saved ? [pet, ...current.pets] : current.pets.filter((item) => item.id !== pet.id),
      }))
      if (error.response?.status !== 401) toast(apiError(error, 'Não foi possível atualizar os favoritos.'))
    }
  }, [ids, toast, userId])

  const value = useMemo(() => ({ pets, ids, loaded, toggle, refresh }), [pets, ids, loaded, toggle, refresh])
  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>
}

// eslint-disable-next-line react/only-export-components
export function useFavorites() {
  return useContext(FavoritesContext)
}
