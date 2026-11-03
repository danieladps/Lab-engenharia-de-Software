import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { LoaderCircle, PawPrint, Save } from 'lucide-react'
import api from '../api'
import EmptyState from '../components/EmptyState'
import PageHeader from '../components/PageHeader'
import PetForm from '../components/PetForm'
import { useToast } from '../lib/toast'
import { apiError } from '../lib/pets'

export default function EditPet() {
  const { id } = useParams()
  const toast = useToast()
  const navigate = useNavigate()
  const [state, setState] = useState({ loading: true, pet: null, error: '' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  // Busca nos anúncios da própria conta: assim só o dono consegue abrir a edição.
  useEffect(() => {
    let active = true
    api.get('/me/pets')
      .then(({ data }) => {
        const found = data.find((item) => String(item.pet.id) === id)
        if (active) setState({ loading: false, pet: found?.pet ?? null, error: '' })
      })
      .catch((err) => { if (active) setState({ loading: false, pet: null, error: apiError(err, 'Não foi possível carregar o anúncio.') }) })
    return () => { active = false }
  }, [id])

  async function handleSubmit(payload) {
    setBusy(true)
    setError('')
    try {
      const { data } = await api.patch(`/pets/${id}`, payload)
      toast(`Anúncio de ${data.name} atualizado.`)
      navigate('/meus-anuncios')
    } catch (err) {
      setError(apiError(err, 'Não foi possível salvar as alterações.'))
    } finally {
      setBusy(false)
    }
  }

  if (state.loading) return <main className="page"><div className="loading-state"><LoaderCircle className="spin" size={22} /> Carregando...</div></main>
  if (state.error) return <main className="page page-narrow"><p className="inline-error" role="alert">{state.error}</p></main>
  if (!state.pet) {
    return (
      <main className="page">
        <EmptyState icon={PawPrint} title="Anúncio não encontrado" action={<Link to="/meus-anuncios" className="button button-primary">Ver meus anúncios</Link>}>
          Você só pode editar os pets que você anunciou.
        </EmptyState>
      </main>
    )
  }

  return (
    <main className="page page-narrow">
      <PageHeader title={`Editar ${state.pet.name}`} subtitle="Corrija os dados do anúncio. Quem já salvou ou pediu este pet verá as mudanças." />
      <PetForm initial={state.pet} busy={busy} error={error} submitLabel="Salvar alterações" submitIcon={Save} onSubmit={handleSubmit} />
    </main>
  )
}
