import { quotaPeriodShort } from '@/lib/quota'
import type { ApiRoute, ExternalProvider, ProviderAccount } from '@/types'

type Props = {
  route: ApiRoute
  providers: ExternalProvider[]
  accounts: ProviderAccount[]
}

export function CascadePreview({ route, providers, accounts }: Props) {
  const byId = new Map(providers.map((p) => [p.id, p]))
  const accountById = new Map(accounts.map((a) => [a.id, a]))
  const enabled = route.providers
    .filter((b) => b.enabled)
    .sort((a, b) => a.priority - b.priority)
  const defaultBinding = enabled.find((b) => b.isDefault)
  const rest = enabled.filter((b) => !b.isDefault)
  const ordered = defaultBinding ? [defaultBinding, ...rest] : enabled
  const disabled = route.providers.filter((b) => !b.enabled)

  function labelFor(b: (typeof ordered)[number]) {
    const providerName = byId.get(b.providerId)?.name ?? b.providerId
    const account = b.accountId ? accountById.get(b.accountId) : undefined
    return account ? `${providerName} · ${account.name}` : providerName
  }

  if (ordered.length === 0) {
    return <p className="muted">No enabled providers — add one to build a cascade.</p>
  }

  return (
    <div className="stack" style={{ gap: '0.5rem' }}>
      <div className="cascade" aria-label="Cascade preview">
        {ordered.map((b, i) => {
          const name = labelFor(b)
          const maxRequests = b.maxRequests ?? null
          const usedRequests = b.usedRequests ?? 0
          const quotaPeriod = b.quotaPeriod ?? 'day'
          const overQuota = maxRequests !== null && usedRequests >= maxRequests
          return (
            <span key={b.id} className="row" style={{ gap: '0.35rem' }}>
              <span className={`cascade-chip${overQuota ? ' skip' : ''}`}>
                {name}
                {b.isDefault ? ' (default)' : ''}
                {overQuota
                  ? ` · quota exceeded (${quotaPeriodShort(quotaPeriod)}) → skip`
                  : ''}
              </span>
              {i < ordered.length - 1 ? <span className="muted">→</span> : null}
            </span>
          )
        })}
      </div>
      {disabled.length > 0 ? (
        <p className="muted" style={{ fontSize: '0.85rem' }}>
          Skipped (disabled): {disabled.map((b) => labelFor(b)).join(', ')}
        </p>
      ) : null}
      <p className="field-hint">
        Requests try providers starting from the default (when enabled and under quota), then remaining
        enabled providers by priority. Disabled or quota-exceeded providers are skipped. On
        network/5xx/429 (future runtime), cascade continues to the next provider.
      </p>
    </div>
  )
}
