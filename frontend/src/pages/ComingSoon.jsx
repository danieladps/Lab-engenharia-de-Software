import { Link } from 'react-router-dom'
import EmptyState from '../components/EmptyState'

// Abas do protótipo que chegam nos próximos PRs (favoritos e mensagens).
export default function ComingSoon({ icon, title, children }) {
  return (
    <main className="page">
      <h1 className="page-title">{title}</h1>
      <EmptyState icon={icon} title="Em breve" action={<Link to="/" className="button button-outline">Ver pets disponíveis</Link>}>
        {children}
      </EmptyState>
    </main>
  )
}
