export const sizeLabels = { small: 'Pequeno', medium: 'Médio', large: 'Grande' }
export const statusLabels = { available: 'Disponível', adoption_pending: 'Pedido recebido', adopted: 'Adotado' }
export const adoptionStatusLabels = { pending: 'Aguardando resposta', approved: 'Aprovado', rejected: 'Recusado' }

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

// Horário curto para listas e conversas: "14:05" se for hoje, senão "03/11".
export function shortTime(value) {
  const date = new Date(value)
  const now = new Date()
  const sameDay = date.toDateString() === now.toDateString()
  return sameDay
    ? date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    : date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}
