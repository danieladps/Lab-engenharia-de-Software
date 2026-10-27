import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'

// Painel que sobe da parte de baixo da tela (no computador, aparece centralizado).
export default function Sheet({ title, onClose, children }) {
  const panelRef = useRef(null)

  useEffect(() => {
    const previous = document.activeElement
    panelRef.current?.querySelector('textarea, input, button')?.focus()
    function onKey(event) { if (event.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      previous?.focus?.()
    }
  }, [onClose])

  return (
    <div className="sheet-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <section ref={panelRef} className="sheet" role="dialog" aria-modal="true" aria-labelledby="sheet-title">
        <div className="sheet-head">
          <h2 id="sheet-title">{title}</h2>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Fechar"><X size={18} /></button>
        </div>
        {children}
      </section>
    </div>
  )
}
