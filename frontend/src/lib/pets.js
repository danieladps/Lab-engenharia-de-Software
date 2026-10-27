export const sizeLabels = { small: 'Pequeno', medium: 'Médio', large: 'Grande' }
export const statusLabels = { available: 'Disponível', adoption_pending: 'Pedido recebido' }

// Rótulo do filtro → valor de `species` na API.
export const speciesChips = [
  { label: 'Todos', value: 'Todos' },
  { label: 'Cães', value: 'Cão' },
  { label: 'Gatos', value: 'Gato' },
  { label: 'Outros', value: 'Outro' },
]

export function ageLabel(years) {
  if (years === 0) return 'Menos de 1 ano'
  return years === 1 ? '1 ano' : `${years} anos`
}

export function firstName(name = '') {
  return name.trim().split(/\s+/)[0] || ''
}

export function apiError(error, fallback) {
  const detail = error?.response?.data?.detail
  if (typeof detail === 'string') return detail
  if (!error?.response) return 'Sem conexão com a API. Confira se ela está rodando.'
  return fallback
}
