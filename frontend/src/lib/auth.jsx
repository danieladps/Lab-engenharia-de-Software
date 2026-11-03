import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import api, { SESSION_EXPIRED_EVENT, hasToken, saveToken } from '../api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  // undefined = conferindo o login salvo; null = sem login.
  const [user, setUser] = useState(() => (hasToken() ? undefined : null))
  // Conta quantas vezes o login venceu, para o app mostrar um aviso.
  const [expiredCount, setExpiredCount] = useState(0)
  const userRef = useRef(user)
  useEffect(() => { userRef.current = user }, [user])

  useEffect(() => {
    function onExpired() {
      // Só avisa se a pessoa estava logada (não ao conferir um token velho na abertura).
      if (userRef.current) setExpiredCount((count) => count + 1)
      setUser(null)
    }
    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired)
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired)
  }, [])

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

  const value = useMemo(
    () => ({ user, checking: user === undefined, expiredCount, signIn, signOut, updateUser: setUser }),
    [user, expiredCount, signIn, signOut],
  )
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react/only-export-components
export function useAuth() {
  return useContext(AuthContext)
}
