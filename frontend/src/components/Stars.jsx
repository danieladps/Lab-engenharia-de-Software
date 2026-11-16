import { Star } from 'lucide-react'

const STEPS = [1, 2, 3, 4, 5]

// Mostra uma nota de 1 a 5 em estrelas.
export function Stars({ value, size = 16 }) {
  return (
    <span className="stars" role="img" aria-label={`Nota ${value} de 5`}>
      {STEPS.map((step) => <Star key={step} size={size} aria-hidden="true" className={step <= value ? 'star on' : 'star'} />)}
    </span>
  )
}

// Escolha da nota: cada estrela é um botão.
export function StarInput({ value, onChange, disabled }) {
  return (
    <div className="stars stars-input" role="radiogroup" aria-label="Nota de 1 a 5">
      {STEPS.map((step) => (
        <button
          key={step}
          type="button"
          role="radio"
          aria-checked={value === step}
          aria-label={`${step} ${step === 1 ? 'estrela' : 'estrelas'}`}
          className="star-button"
          onClick={() => onChange(step)}
          disabled={disabled}
        >
          <Star size={28} aria-hidden="true" className={step <= value ? 'star on' : 'star'} />
        </button>
      ))}
    </div>
  )
}
