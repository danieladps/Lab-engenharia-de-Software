import { useRef, useState } from 'react'
import { Camera, Link2, LoaderCircle } from 'lucide-react'
import api from '../api'
import PetImage from './PetImage'
import { apiError } from '../lib/pets'
import { shrinkPhoto } from '../lib/photo'

// Campo da foto do anúncio: envia uma foto do aparelho ou usa um link.
// O endereço final vai no campo escondido "image_url" do formulário.
export default function PhotoField({ initial = '', disabled, onChange }) {
  const [url, setUrl] = useState(initial)
  const [useLink, setUseLink] = useState(Boolean(initial) && !initial.startsWith('/api/'))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const fileInput = useRef(null)

  async function handleFile(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError('Escolha um arquivo de imagem.')
      return
    }
    setBusy(true)
    setError('')
    try {
      const blob = await shrinkPhoto(file)
      const { data } = await api.post('/photos', blob, { headers: { 'Content-Type': 'image/jpeg' } })
      setUrl(data.url)
      onChange?.()
    } catch (err) {
      setError(err.response ? apiError(err, 'Não foi possível enviar a foto.') : 'Não foi possível ler esta foto. Tente outra.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="photo-field span-2">
      <span className="photo-label">Foto do pet</span>
      <div className="photo-row">
        <PetImage key={url} src={url} alt="Prévia da foto" className="photo-preview" />
        <div className="photo-actions">
          <button type="button" className="button button-ghost button-small" onClick={() => fileInput.current?.click()} disabled={disabled || busy}>
            {busy ? <LoaderCircle className="spin" size={16} aria-hidden="true" /> : <Camera size={16} aria-hidden="true" />}
            {busy ? 'Enviando...' : url && !useLink ? 'Trocar foto' : 'Escolher foto'}
          </button>
          <button type="button" className="link-button" onClick={() => { setUseLink((value) => !value); setError('') }} disabled={disabled || busy}>
            <Link2 size={14} aria-hidden="true" /> {useLink ? 'Enviar uma foto do aparelho' : 'Ou usar um link'}
          </button>
        </div>
      </div>
      <input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/*" onChange={handleFile} hidden />
      {useLink ? (
        <label>Link da foto
          <input name="image_url" type="url" value={url.startsWith('/api/') ? '' : url} onChange={(event) => setUrl(event.target.value)} placeholder="https://..." required maxLength="500" disabled={disabled} />
        </label>
      ) : (
        <input type="hidden" name="image_url" value={url} />
      )}
      {error && <p className="inline-error" role="alert">{error}</p>}
    </div>
  )
}
