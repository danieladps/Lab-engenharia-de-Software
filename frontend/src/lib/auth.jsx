import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import api, { hasToken, saveToken } from '../api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  // undefined = conferindo o login salvo; null = sem login.
  const [user, setUser] = useState(() => (hasToken() ? undefined : null))

  useEffect(() => {
    if (user !== undefined) return undefined
    let active = true
    api.get('/auth/me')
      .then(({ data }) => { if (active) setUser(data) })
      .catch(() => {
        saveToken(null)
        if (active) setUser(null)
      })
    return () => { active = false }
  }, [user])

  const signIn = useCallback((data) => {
    saveToken(data.access_token)
    setUser(data.user)
  }, [])

  const signOut = useCallback(() => {
    saveToken(null)
    setUser(null)
  }, [])

  const value = useMemo(() => ({ user, checking: user === undefined, signIn, signOut }), [user, signIn, signOut])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react/only-export-components
export function useAuth() {
  return useContext(AuthContext)
}
