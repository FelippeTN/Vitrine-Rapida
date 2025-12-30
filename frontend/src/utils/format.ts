export function formatPrice(value: number): string {
  try {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  } catch {
    return `R$ ${value.toFixed(2)}`
  }
}

export function formatDate(isoString: string | undefined | null): string {
  if (!isoString) return ''
  const date = new Date(isoString)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString('pt-BR')
}

export function formatUpdatedAtLabel(isoString: string | undefined): string {
  if (!isoString) return 'Sem atualização'
  const date = new Date(isoString)
  if (Number.isNaN(date.getTime())) return 'Sem atualização'
  return `Atualizado em ${date.toLocaleDateString('pt-BR')}`
}
