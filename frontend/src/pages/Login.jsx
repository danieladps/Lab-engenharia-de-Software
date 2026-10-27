import { useState } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, LoaderCircle, PawPrint } from 'lucide-react'
import api from '../api'
import { useAuth } from '../lib/auth'
import { useToast } from '../lib/toast'
import { apiError, firstName } from '../lib/pets'

// Só aceita voltar para uma página do próprio site.
function safeReturn(value) {
  return value && value.startsWith('/') && !value.startsWith('//') ? value : '/'
}

export default function Login({ mode }) {
  const isLogin = mode === 'login'
  const [params] = useSearchParams()
  const back = safeReturn(params.get('volta'))
  const { user, signIn } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  if (user) return <Navigate to={back} replace />

  async function handleSubmit(event) {
    event.preventDefault()
    const payload = Object.fromEntries(new FormData(event.currentTarget).entries())
    setBusy(true)
    setError('')
    try {
      const { data } = await api.post(isLogin ? '/auth/login' : '/auth/cadastro', payload)
      signIn(data)
      toast(isLogin ? `Olá, ${firstName(data.user.name)}!` : 'Conta criada. Boas-vindas ao PetLume!')
      navigate(back, { replace: true })
    } catch (err) {
      setError(apiError(err, 'Confira os dados e tente de novo.'))
    } finally {
      setBusy(false)
    }
  }

  const otherLink = `${isLogin ? '/cadastro' : '/entrar'}${back !== '/' ? `?volta=${encodeURIComponent(back)}` : ''}`

  return (
    <main className="auth-page">
      <Link to="/" className="icon-button auth-back" aria-label="Voltar para o início"><ArrowLeft size={19} /></Link>
      <div className="auth-card">
        <span className="brand-mark brand-mark-large"><PawPrint size={24} aria-hidden="true" /></span>
        <h1>{isLogin ? 'Entre na sua conta' : 'Crie sua conta'}</h1>
        <p className="auth-lead">{isLogin ? 'Para anunciar pets e enviar pedidos de adoção.' : 'Com uma conta você anuncia pets e pede para adotar.'}</p>

        <form key={mode} className="form" onSubmit={handleSubmit}>
          {!isLogin && <label>Nome<input name="name" autoComplete="name" required minLength="2" maxLength="120" /></label>}
          <label>E-mail<input name="email" type="email" autoComplete="email" required minLength="5" maxLength="255" /></label>
          <label>Senha
            <input name="password" type="password" autoComplete={isLogin ? 'current-password' : 'new-password'} required minLength={isLogin ? 1 : 8} maxLength="128" aria-describedby={isLogin ? undefined : 'password-hint'} />
            {!isLogin && <small id="password-hint" className="hint">Pelo menos 8 caracteres.</small>}
          </label>
          {!isLogin && <label>Cidade<input name="city" autoComplete="address-level2" placeholder="Ex.: São Paulo" required minLength="2" maxLength="100" /></label>}
          {error && <p className="inline-error" role="alert">{error}</p>}
          <button className="button button-primary button-block" disabled={busy}>
            {busy && <LoaderCircle className="spin" size={18} />} {isLogin ? 'Entrar' : 'Criar conta'}
          </button>
        </form>

        <p className="auth-switch">
          {isLogin ? 'Ainda não tem conta?' : 'Já tem conta?'} <Link to={otherLink}>{isLogin ? 'Criar conta' : 'Entrar'}</Link>
        </p>
      </div>
    </main>
  )
}
