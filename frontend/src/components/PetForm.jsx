import { useState } from 'react'
import { LoaderCircle } from 'lucide-react'
import PhotoField from './PhotoField'

// Formulário do anúncio, usado para anunciar e para editar.
// `initial` traz os valores que já aparecem preenchidos.
export default function PetForm({ initial, busy, error, submitLabel, submitIcon: SubmitIcon, onSubmit }) {
  const [photoError, setPhotoError] = useState('')

  function handleSubmit(event) {
    event.preventDefault()
    const payload = Object.fromEntries(new FormData(event.currentTarget).entries())
    if (!payload.image_url) {
      setPhotoError('Adicione uma foto do pet.')
      return
    }
    setPhotoError('')
    payload.age_years = Number(payload.age_years)
    onSubmit(payload)
  }

  return (
    <form className="form form-grid" onSubmit={handleSubmit}>
      <label>Nome do pet<input name="name" defaultValue={initial.name} placeholder="Ex.: Nina" required minLength="2" maxLength="100" /></label>
      <label>Espécie
        <select name="species" defaultValue={initial.species ?? 'Cão'}><option>Cão</option><option>Gato</option><option>Outro</option></select>
      </label>
      <label>Raça<input name="breed" defaultValue={initial.breed} placeholder="Ex.: Sem raça definida" required minLength="2" maxLength="100" /></label>
      <label>Porte
        <select name="size" defaultValue={initial.size ?? 'medium'}><option value="small">Pequeno</option><option value="medium">Médio</option><option value="large">Grande</option></select>
      </label>
      <label>Idade em anos<input name="age_years" type="number" inputMode="numeric" min="0" max="30" defaultValue={initial.age_years ?? 1} required /><small className="hint">Use 0 para filhotes com menos de 1 ano.</small></label>
      <label>Cidade<input name="city" defaultValue={initial.city} required minLength="2" maxLength="100" /></label>
      <PhotoField initial={initial.image_url ?? ''} disabled={busy} onChange={() => setPhotoError('')} />
      <label className="span-2">Sobre o pet<textarea name="description" rows="4" defaultValue={initial.description} placeholder="Personalidade, saúde, vacinas e rotina." required minLength="10" maxLength="2000" /></label>
      <label className="span-2">Nome exibido como responsável<input name="donor_name" defaultValue={initial.donor_name} required minLength="2" maxLength="120" /><small className="hint">Pode ser você ou o abrigo.</small></label>
      {(photoError || error) && <p className="inline-error span-2" role="alert">{photoError || error}</p>}
      <button className="button button-primary button-block span-2" disabled={busy}>
        {busy ? <LoaderCircle className="spin" size={18} /> : <SubmitIcon size={18} aria-hidden="true" />} {submitLabel}
      </button>
    </form>
  )
}
