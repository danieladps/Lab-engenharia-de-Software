import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import api from '../api'
import PageHeader from '../components/PageHeader'
import PetForm from '../components/PetForm'
import { useAuth } from '../lib/auth'
import { useToast } from '../lib/toast'
import { apiError } from '../lib/pets'

export default function NewPet() {
  const { user } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(payload) {
    setBusy(true)
    setError('')
    try {
      const { data } = await api.post('/pets', payload)
      toast(`${data.name} foi publicado!`)
      navigate('/meus-anuncios')
    } catch (err) {
      setError(apiError(err, 'Não foi possível publicar o anúncio.'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="page page-narrow">
      <PageHeader title="Anunciar um pet" subtitle="Uma boa descrição ajuda a encontrar a família certa." />
      <PetForm initial={{ city: user.city, donor_name: user.name }} busy={busy} error={error} submitLabel="Publicar anúncio" submitIcon={Plus} onSubmit={handleSubmit} />
    </main>
  )
}
