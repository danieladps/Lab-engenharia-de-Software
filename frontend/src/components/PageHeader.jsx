import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

export default function PageHeader({ title, subtitle, back = true }) {
  const navigate = useNavigate()
  return (
    <header className="page-header">
      {back && (
        <button type="button" className="icon-button" onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/'))} aria-label="Voltar">
          <ArrowLeft size={19} />
        </button>
      )}
      <div>
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
    </header>
  )
}
