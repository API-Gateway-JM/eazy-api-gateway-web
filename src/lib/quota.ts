import type { QuotaPeriod } from '@/types'

export const QUOTA_PERIODS: { value: QuotaPeriod; label: string }[] = [
  { value: 'minute', label: 'Minute' },
  { value: 'hour', label: 'Hour' },
  { value: 'day', label: 'Day' },
  { value: 'month', label: 'Month' },
]

export function quotaPeriodLabel(period: QuotaPeriod): string {
  switch (period) {
    case 'minute':
      return 'minute'
    case 'hour':
      return 'hour'
    case 'day':
      return 'day'
    case 'month':
      return 'month'
  }
}

export function quotaPeriodShort(period: QuotaPeriod): string {
  switch (period) {
    case 'minute':
      return '/min'
    case 'hour':
      return '/hr'
    case 'day':
      return '/day'
    case 'month':
      return '/mo'
  }
}
