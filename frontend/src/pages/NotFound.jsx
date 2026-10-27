import { Link } from 'react-router-dom'
import { PawPrint } from 'lucide-react'
import EmptyState from '../components/EmptyState'

export default function NotFound() {
  return (
    <main className="page">
      <EmptyState icon={PawPrint} title="Página não encontrada" action={<Link to="/" className="button button-primary">Ir para o início</Link>}>
        O endereço pode estar incompleto.
      </EmptyState>
    </main>
  )
}
