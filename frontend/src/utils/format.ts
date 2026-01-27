export function formatPrice(value: number): string {
  try {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  } catch {
    return `R$ ${value.toFixed(2)}`
  }
}

export function formatCurrencyInput(value: string): string {
  const numbers = value.replace(/\D/g, '')
  if (!numbers) return ''
  
  const cents = parseInt(numbers, 10)
  const reais = cents / 100
  
  return reais.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
}

export function parseCurrencyInput(formatted: string): number {
  const numbers = formatted.replace(/\D/g, '')
  if (!numbers) return 0
  
  return parseInt(numbers, 10) / 100
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

export function formatPhone(value: string): string {
  const numbers = value.replace(/\D/g, '')
  
  if (numbers.length <= 10) {
    return numbers.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
  }
  
  return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
}
