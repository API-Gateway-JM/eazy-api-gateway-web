export function uid(prefix = 'id'): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36).slice(-4)}`
}

export function nowIso(): string {
  return new Date().toISOString()
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'route'
}

export function mockApiKeySecret(): string {
  const body = Array.from({ length: 32 }, () =>
    'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'.charAt(
      Math.floor(Math.random() * 62),
    ),
  ).join('')
  return `eam_${body}`
}

export function expiresAtFromOption(
  option: 'never' | '30' | '90' | '180' | '365',
): string | null {
  if (option === 'never') return null
  const days = Number(option)
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString()
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return 'Never'
  return new Date(iso).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function maskKey(key: string, revealed: boolean): string {
  if (revealed) return key
  if (key.length <= 10) return '••••••••'
  return `${key.slice(0, 4)}${'•'.repeat(Math.min(20, key.length - 8))}${key.slice(-4)}`
}
