import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LoaderCircle, Plus } from 'lucide-react'
import api from '../api'
import PageHeader from '../components/PageHeader'
import { useAuth } from '../lib/auth'
import { useToast } from '../lib/toast'
import { apiError } from '../lib/pets'

export default function NewPet() {
  const { user } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()
    const payload = Object.fromEntries(new FormData(event.currentTarget).entries())
    payload.age_years = Number(payload.age_years)
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
      <form className="form form-grid" onSubmit={handleSubmit}>
        <label>Nome do pet<input name="name" placeholder="Ex.: Nina" required minLength="2" maxLength="100" /></label>
        <label>Espécie
          <select name="species" defaultValue="Cão"><option>Cão</option><option>Gato</option><option>Outro</option></select>
        </label>
        <label>Raça<input name="breed" placeholder="Ex.: Sem raça definida" required minLength="2" maxLength="100" /></label>
        <label>Porte
          <select name="size" defaultValue="medium"><option value="small">Pequeno</option><option value="medium">Médio</option><option value="large">Grande</option></select>
        </label>
        <label>Idade em anos<input name="age_years" type="number" inputMode="numeric" min="0" max="30" defaultValue="1" required /><small className="hint">Use 0 para filhotes com menos de 1 ano.</small></label>
        <label>Cidade<input name="city" defaultValue={user.city} required minLength="2" maxLength="100" /></label>
        <label className="span-2">Link da foto<input name="image_url" type="url" placeholder="https://..." required maxLength="500" /></label>
        <label className="span-2">Sobre o pet<textarea name="description" rows="4" placeholder="Personalidade, saúde, vacinas e rotina." required minLength="10" maxLength="2000" /></label>
        <label className="span-2">Nome exibido como responsável<input name="donor_name" defaultValue={user.name} required minLength="2" maxLength="120" /><small className="hint">Pode ser você ou o abrigo.</small></label>
        {error && <p className="inline-error span-2" role="alert">{error}</p>}
        <button className="button button-primary button-block span-2" disabled={busy}>
          {busy ? <LoaderCircle className="spin" size={18} /> : <Plus size={18} aria-hidden="true" />} Publicar anúncio
        </button>
      </form>
    </main>
  )
}
