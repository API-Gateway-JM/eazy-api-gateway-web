import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { CascadePreview } from '@/components/CascadePreview'
import { QUOTA_PERIODS, quotaPeriodLabel } from '@/lib/quota'
import { useMockStore } from '@/store/MockStore'
import type { QuotaPeriod } from '@/types'

export function RouteEditorPage() {
  const { workspaceId = '', routeId = '' } = useParams()
  const {
    getRoute,
    state,
    updateRoute,
    pathConflict,
    addProviderToRoute,
    removeProviderFromRoute,
    updateBinding,
    moveBinding,
    accountsForProvider,
    pushToast,
  } = useMockStore()
  const route = getRoute(routeId)

  const [name, setName] = useState(route?.name ?? '')
  const [path, setPath] = useState(route?.path ?? '')
  const [description, setDescription] = useState(route?.description ?? '')
  const [providerToAdd, setProviderToAdd] = useState('')
  const [accountToAdd, setAccountToAdd] = useState('')

  useEffect(() => {
    if (!route) return
    setName(route.name)
    setPath(route.path)
    setDescription(route.description ?? '')
  }, [route])

  useEffect(() => {
    setAccountToAdd('')
  }, [providerToAdd])

  const selectedProvider = useMemo(
    () => state.providers.find((p) => p.id === providerToAdd),
    [providerToAdd, state.providers],
  )
  const accountsForSelected = useMemo(
    () => (providerToAdd ? accountsForProvider(providerToAdd) : []),
    [accountsForProvider, providerToAdd],
  )

  if (!route) {
    return (
      <div className="card empty">
        <p>Route not found.</p>
        <Link to={`/workspaces/${workspaceId}/routes`} className="btn" style={{ marginTop: '0.75rem' }}>
          Back to routes
        </Link>
      </div>
    )
  }

  const conflict = pathConflict(path, route.id)
  const platformProviders = state.providers.filter((p) => p.origin === 'platform')
  const customProviders = state.providers.filter((p) => p.origin === 'custom')
  const byId = new Map(state.providers.map((p) => [p.id, p]))
  const accountById = new Map(state.accounts.map((a) => [a.id, a]))
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  const fullRouteUrl = `${state.mockBaseUrl.replace(/\/$/, '')}${normalizedPath}`

  const ordered = [
    ...route.providers.filter((b) => b.enabled).sort((a, b) => a.priority - b.priority),
    ...route.providers.filter((b) => !b.enabled),
  ]

  const needsAccount = Boolean(selectedProvider?.requiresApiKey)
  const canAdd =
    Boolean(providerToAdd) && (!needsAccount || Boolean(accountToAdd))

  function onSaveMeta(e: FormEvent) {
    e.preventDefault()
    const result = updateRoute(routeId, { name, path, description })
    if (result.error) {
      pushToast('danger', result.error)
      return
    }
    pushToast('success', 'Route details saved.')
  }

  async function copyFullRouteUrl() {
    try {
      await navigator.clipboard.writeText(fullRouteUrl)
      pushToast('success', 'Full API route URL copied.')
    } catch {
      pushToast('danger', 'Could not copy to clipboard.')
    }
  }

  function onAddProvider() {
    const result = addProviderToRoute(
      routeId,
      providerToAdd,
      needsAccount ? accountToAdd : null,
    )
    if (result.error) {
      pushToast('danger', result.error)
      return
    }
    setProviderToAdd('')
    setAccountToAdd('')
    pushToast('success', 'Provider added to route.')
  }

  return (
    <div className="stack">
      <div className="page-header" style={{ marginBottom: 0 }}>
        <div>
          <p className="muted" style={{ marginBottom: '0.25rem' }}>
            <Link to={`/workspaces/${workspaceId}/routes`}>API Routes</Link> / {route.name}
          </p>
          <h2 style={{ margin: 0, fontSize: '1.15rem' }}>Route editor</h2>
          <p className="muted">
            Custom path + ordered providers. The same catalog provider can be added more than once
            with different connected accounts.
          </p>
        </div>
      </div>

      <form className="card stack" onSubmit={onSaveMeta}>
        <div className="field">
          <label htmlFor="edit-name">Name</label>
          <input id="edit-name" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div className="field">
          <label htmlFor="edit-path">Custom path</label>
          <input
            id="edit-path"
            className="mono"
            value={path}
            onChange={(e) => setPath(e.target.value)}
            required
          />
          {conflict ? (
            <span className="field-error">Path conflict: another route already uses this path.</span>
          ) : null}
          {!path.startsWith('/') ? (
            <span className="field-error">Path must start with /.</span>
          ) : null}
        </div>
        <div className="field">
          <label htmlFor="edit-full-url">Full API Route URL</label>
          <div className="input-with-action">
            <input
              id="edit-full-url"
              className="mono"
              value={fullRouteUrl}
              readOnly
              aria-label="Full API Route URL"
            />
            <button type="button" className="btn btn-sm" onClick={copyFullRouteUrl}>
              Copy
            </button>
          </div>
          <span className="field-hint">Updates as you edit the custom path. Informative only.</span>
        </div>
        <div className="field">
          <label htmlFor="edit-desc">Description</label>
          <textarea
            id="edit-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>
          Save details
        </button>
      </form>

      <div className="card stack">
        <h3 style={{ margin: 0 }}>Cascade preview</h3>
        <CascadePreview
          route={route}
          providers={state.providers}
          accounts={state.accounts}
        />
      </div>

      <div className="card stack">
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <h3 style={{ margin: 0 }}>Providers</h3>
          <p className="field-hint" style={{ margin: 0 }}>
            Re-enabling appends a provider to the end of the enabled list.
          </p>
        </div>

        <div className="stack" style={{ gap: '0.5rem' }}>
          <div className="row">
            <select
              aria-label="Add provider"
              value={providerToAdd}
              onChange={(e) => setProviderToAdd(e.target.value)}
              style={{ flex: 1, minWidth: 200 }}
            >
              <option value="">Select from catalog…</option>
              {platformProviders.length > 0 ? (
                <optgroup label="Platform">
                  {platformProviders.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                      {p.requiresApiKey ? ' (needs account)' : ''}
                    </option>
                  ))}
                </optgroup>
              ) : null}
              {customProviders.length > 0 ? (
                <optgroup label="Custom">
                  {customProviders.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </optgroup>
              ) : null}
            </select>
            <button
              type="button"
              className="btn btn-primary"
              disabled={!canAdd}
              onClick={onAddProvider}
            >
              Add provider
            </button>
          </div>

          {needsAccount ? (
            <div className="field" style={{ margin: 0 }}>
              <label htmlFor="account-to-add">Connected account</label>
              {accountsForSelected.length === 0 ? (
                <p className="field-hint" style={{ margin: 0 }}>
                  No accounts for {selectedProvider?.name}.{' '}
                  <Link to={`/providers/${providerToAdd}/accounts`}>
                    Connect an account
                  </Link>{' '}
                  first.
                </p>
              ) : (
                <select
                  id="account-to-add"
                  value={accountToAdd}
                  onChange={(e) => setAccountToAdd(e.target.value)}
                >
                  <option value="">Select account…</option>
                  {accountsForSelected.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          ) : null}
        </div>

        {ordered.length === 0 ? (
          <div className="empty">No providers yet. Add one from the catalog.</div>
        ) : (
          <div className="stack">
            {ordered.map((b) => {
              const provider = byId.get(b.providerId)
              const account = b.accountId ? accountById.get(b.accountId) : undefined
              const providerAccounts = accountsForProvider(b.providerId)
              const maxRequests = b.maxRequests ?? null
              const usedRequests = b.usedRequests ?? 0
              const quotaPeriod = b.quotaPeriod ?? 'day'
              const over = maxRequests !== null && usedRequests >= maxRequests
              const pct =
                maxRequests && maxRequests > 0
                  ? Math.min(100, (usedRequests / maxRequests) * 100)
                  : 0
              const periodLabel = quotaPeriodLabel(quotaPeriod)
              const isCustom = provider?.origin === 'custom'
              const missingAccount =
                Boolean(provider?.requiresApiKey) && (!b.accountId || !account)

              return (
                <div
                  key={b.id}
                  className={`provider-row${!b.enabled ? ' disabled-row' : ''}`}
                >
                  <div className="stack" style={{ gap: '0.25rem' }}>
                    <button
                      type="button"
                      className="btn btn-sm"
                      disabled={!b.enabled}
                      onClick={() => moveBinding(routeId, b.id, 'up')}
                      aria-label="Move up"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm"
                      disabled={!b.enabled}
                      onClick={() => moveBinding(routeId, b.id, 'down')}
                      aria-label="Move down"
                    >
                      ↓
                    </button>
                  </div>
                  <div>
                    <strong>{provider?.name ?? b.providerId}</strong>
                    {account ? (
                      <div className="muted" style={{ fontSize: '0.85rem', marginTop: 2 }}>
                        {account.name}
                      </div>
                    ) : null}
                    <div className="row" style={{ marginTop: '0.25rem' }}>
                      <span className="badge">P{b.priority}</span>
                      {isCustom ? <span className="badge badge-accent">Custom</span> : null}
                      {b.isDefault ? <span className="badge badge-accent">Default</span> : null}
                      {!b.enabled ? <span className="badge">Disabled</span> : null}
                      {over ? <span className="badge badge-danger">Quota exceeded</span> : null}
                      {missingAccount ? (
                        <span className="badge badge-danger">No account</span>
                      ) : null}
                    </div>
                  </div>
                  <div className="stack" style={{ gap: '0.4rem' }}>
                    <label className="row" style={{ fontSize: '0.85rem' }}>
                      <input
                        type="checkbox"
                        checked={b.enabled}
                        onChange={(e) =>
                          updateBinding(routeId, b.id, { enabled: e.target.checked })
                        }
                      />
                      Enabled
                    </label>
                    <label className="row" style={{ fontSize: '0.85rem' }}>
                      <input
                        type="radio"
                        name={`default-${routeId}`}
                        checked={b.isDefault}
                        disabled={!b.enabled}
                        onChange={() => updateBinding(routeId, b.id, { isDefault: true })}
                      />
                      Default provider
                    </label>
                    <div className="field">
                      <label htmlFor={`cap-${b.id}`}>Max requests</label>
                      <div className="input-with-action">
                        <input
                          id={`cap-${b.id}`}
                          type="number"
                          min={0}
                          placeholder="Unlimited"
                          value={maxRequests ?? ''}
                          onChange={(e) => {
                            const v = e.target.value
                            updateBinding(routeId, b.id, {
                              maxRequests: v === '' ? null : Number(v),
                            })
                          }}
                        />
                        <select
                          id={`period-${b.id}`}
                          aria-label="Quota period"
                          value={quotaPeriod}
                          onChange={(e) =>
                            updateBinding(routeId, b.id, {
                              quotaPeriod: e.target.value as QuotaPeriod,
                            })
                          }
                        >
                          {QUOTA_PERIODS.map((p) => (
                            <option key={p.value} value={p.value}>
                              per {p.label.toLowerCase()}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    {maxRequests !== null ? (
                      <div>
                        <div className="muted" style={{ fontSize: '0.8rem', marginBottom: 4 }}>
                          {usedRequests.toLocaleString()} / {maxRequests.toLocaleString()} this{' '}
                          {periodLabel}
                        </div>
                        <div className={`progress${over ? ' over' : ''}`}>
                          <span style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    ) : (
                      <span className="muted" style={{ fontSize: '0.8rem' }}>
                        Unlimited · used {usedRequests.toLocaleString()} this {periodLabel}
                      </span>
                    )}
                    {provider?.requiresApiKey ? (
                      <div className="field">
                        <label htmlFor={`acc-${b.id}`}>Connected account</label>
                        {providerAccounts.length === 0 ? (
                          <p className="field-hint" style={{ margin: 0 }}>
                            <Link to={`/providers/${b.providerId}/accounts`}>
                              Connect an account
                            </Link>{' '}
                            for {provider.name}.
                          </p>
                        ) : (
                          <select
                            id={`acc-${b.id}`}
                            value={b.accountId ?? ''}
                            onChange={(e) =>
                              updateBinding(routeId, b.id, {
                                accountId: e.target.value || null,
                              })
                            }
                          >
                            <option value="">Select account…</option>
                            {providerAccounts.map((a) => (
                              <option key={a.id} value={a.id}>
                                {a.name}
                              </option>
                            ))}
                          </select>
                        )}
                        <Link
                          to={`/providers/${b.providerId}/accounts`}
                          className="field-hint"
                          style={{ display: 'inline-block', marginTop: 4 }}
                        >
                          Manage accounts
                        </Link>
                      </div>
                    ) : isCustom ? (
                      <div className="field">
                        <span className="field-hint" style={{ display: 'block', marginBottom: 4 }}>
                          HTTP recipe lives on the provider.
                        </span>
                        <p className="mono muted" style={{ margin: 0, fontSize: '0.85rem' }}>
                          {provider?.http?.method ?? 'POST'} {provider?.http?.url || '(no URL)'}
                        </p>
                        <Link
                          to="/providers?tab=custom"
                          className="btn btn-sm"
                          style={{ marginTop: '0.4rem', alignSelf: 'flex-start' }}
                        >
                          Edit in Providers
                        </Link>
                      </div>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    className="btn btn-sm btn-danger"
                    onClick={() => removeProviderFromRoute(routeId, b.id)}
                  >
                    Remove
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
