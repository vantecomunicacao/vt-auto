/**
 * Formata número de telefone brasileiro.
 * 11 dígitos → (44) 9 9999-8888  (celular)
 * 10 dígitos → (44) 3531-3333    (fixo)
 */
export function formatPhone(raw: string | null | undefined): string {
  if (!raw) return ''
  const digits = raw.replace(/\D/g, '')
  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits[2]} ${digits.slice(3, 7)}-${digits.slice(7)}`
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
  }
  return raw // fallback: exibe como está
}
