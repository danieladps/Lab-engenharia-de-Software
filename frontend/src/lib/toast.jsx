import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { Check, X } from 'lucide-react'

const ToastContext = createContext(() => {})

export function ToastProvider({ children }) {
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!message) return undefined
    const timeout = window.setTimeout(() => setMessage(''), 3800)
    return () => window.clearTimeout(timeout)
  }, [message])

  const show = useCallback((text) => setMessage(text), [])

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div className="toast-region" aria-live="polite">
        {message && (
          <div className="toast" role="status">
            <Check size={17} aria-hidden="true" />
            <span>{message}</span>
            <button type="button" onClick={() => setMessage('')} aria-label="Fechar aviso"><X size={15} /></button>
          </div>
        )}
      </div>
    </ToastContext.Provider>
  )
}

// eslint-disable-next-line react/only-export-components
export function useToast() {
  return useContext(ToastContext)
}
