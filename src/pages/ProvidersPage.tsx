import { useMemo, useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { GenericHttpFields } from '@/components/GenericHttpFields'
import { createDefaultHttpConfig } from '@/lib/httpConfig'
import { useMockStore } from '@/store/MockStore'
import type { ExternalProvider, GenericHttpConfig } from '@/types'

type Tab = 'platform' | 'custom'
type CustomEditor = { type: 'create' } | { type: 'edit'; provider: ExternalProvider } | null

export function ProvidersPage() {
  const {
    state,
    createCustomProvider,
    updateCustomProvider,
    deleteCustomProvider,
    accountsForProvider,
    pushToast,
  } = useMockStore()
  const [searchParams, setSearchParams] = useSearchParams()
  const tab: Tab = searchParams.get('tab') === 'custom' ? 'custom' : 'platform'

  const [editor, setEditor] = useState<CustomEditor>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [http, setHttp] = useState<GenericHttpConfig>(createDefaultHttpConfig())
  const [revealSecret, setRevealSecret] = useState(false)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  const platformProviders = useMemo(
    () => state.providers.filter((p) => p.origin === 'platform'),
    [state.providers],
  )
  const customProviders = useMemo(
    () => state.providers.filter((p) => p.origin === 'custom'),
    [state.providers],
  )

  function setTab(next: Tab) {
    setSearchParams(next === 'custom' ? { tab: 'custom' } : {})
  }

  function openCreate() {
    setName('')
    setDescription('')
    setHttp(createDefaultHttpConfig())
    setRevealSecret(false)
    setEditor({ type: 'create' })
  }

  function openEdit(provider: ExternalProvider) {
    setName(provider.name)
    setDescription(provider.description ?? '')
    setHttp(provider.http ? { ...provider.http } : createDefaultHttpConfig())
    setRevealSecret(false)
    setEditor({ type: 'edit', provider })
  }

  function closeEditor() {
    setEditor(null)
  }

  function onSubmitCustom(e: FormEvent) {
    e.preventDefault()
    if (editor?.type === 'create') {
      const result = createCustomProvider({ name, description, http })
      if ('error' in result) {
        pushToast('danger', result.error)
        return
      }
      pushToast('success', `Provider “${result.name}” created.`)
      closeEditor()
      setTab('custom')
      return
    }
    if (editor?.type === 'edit') {
      const result = updateCustomProvider(editor.provider.id, { name, description, http })
      if (result.error) {
        pushToast('danger', result.error)
        return
      }
      pushToast('success', 'Provider updated.')
      closeEditor()
    }
  }

  function onDeleteCustom(id: string) {
    const result = deleteCustomProvider(id)
    if (result.error) {
      pushToast('danger', result.error)
      return
    }
    pushToast('success', 'Custom provider deleted. Route bindings removed.')
    setDeleteConfirmId(null)
  }

  return (
    <div className="stack">
      <div className="page-header">
        <div>
          <h1>Providers</h1>
          <p>
            Browse platform connectors or define custom HTTP providers. API-key credentials for
            platform services are managed on each provider’s accounts page.
          </p>
        </div>
        {tab === 'custom' ? (
          <button type="button" className="btn btn-primary" onClick={openCreate}>
            New custom provider
          </button>
        ) : null}
      </div>

      <div className="tabs" role="tablist" aria-label="Provider catalogs">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'platform'}
          className={`tab${tab === 'platform' ? ' active' : ''}`}
          onClick={() => setTab('platform')}
        >
          Platform
          <span className="badge" style={{ marginLeft: 6 }}>
            {platformProviders.length}
          </span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'custom'}
          className={`tab${tab === 'custom' ? ' active' : ''}`}
          onClick={() => setTab('custom')}
        >
          Custom
          <span className="badge" style={{ marginLeft: 6 }}>
            {customProviders.length}
          </span>
        </button>
      </div>

      {tab === 'platform' ? (
        <div className="stack">
          <p className="field-hint" style={{ margin: 0 }}>
            Built-in connectors. Open a provider to connect named accounts and reuse them on routes.
          </p>
          {platformProviders.map((p) => {
            const accountCount = accountsForProvider(p.id).length
            return (
              <div key={p.id} className="card">
                <div
                  className="row"
                  style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}
                >
                  <div>
                    <strong style={{ fontSize: '1.05rem' }}>{p.name}</strong>
                    <p className="muted" style={{ marginTop: '0.25rem' }}>
                      {p.description}
                    </p>
                    {p.requiresApiKey ? (
                      <p className="field-hint" style={{ marginTop: '0.45rem' }}>
                        {accountCount === 0
                          ? 'No connected accounts yet.'
                          : `${accountCount} connected account${accountCount === 1 ? '' : 's'}.`}
                      </p>
                    ) : (
                      <p className="field-hint" style={{ marginTop: '0.45rem' }}>
                        No upstream API key required — attach directly on a route.
                      </p>
                    )}
                  </div>
                  <div
                    className="stack"
                    style={{ alignItems: 'flex-end', gap: '0.55rem', flexShrink: 0 }}
                  >
                    <div className="row">
                      <span className="badge">{p.kind}</span>
                      <span className="badge badge-success">Free</span>
                      {p.isSelfHosted ? (
                        <span className="badge badge-accent">Self-hosted</span>
                      ) : (
                        <span className="badge">Cloud API</span>
                      )}
                    </div>
                    {p.requiresApiKey ? (
                      <Link
                        to={`/providers/${p.id}/accounts`}
                        className="btn btn-sm btn-primary"
                      >
                        Manage accounts
                      </Link>
                    ) : null}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="stack">
          <p className="field-hint" style={{ margin: 0 }}>
            Your HTTP recipes (URL, method, auth, headers). Auth secrets live on the provider, not as
            separate accounts.
          </p>
          {customProviders.length === 0 ? (
            <div className="card empty">
              <p>No custom providers yet.</p>
              <button
                type="button"
                className="btn btn-primary"
                style={{ marginTop: '0.75rem' }}
                onClick={openCreate}
              >
                Create your first
              </button>
            </div>
          ) : (
            customProviders.map((p) => (
              <div key={p.id} className="card">
                <div
                  className="row"
                  style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}
                >
                  <div>
                    <strong style={{ fontSize: '1.05rem' }}>{p.name}</strong>
                    {p.description ? (
                      <p className="muted" style={{ marginTop: '0.25rem' }}>
                        {p.description}
                      </p>
                    ) : null}
                    <p className="mono muted" style={{ marginTop: '0.4rem', fontSize: '0.85rem' }}>
                      {p.http?.method ?? 'POST'} {p.http?.url || '(no URL)'}
                    </p>
                  </div>
                  <div className="row">
                    <span className="badge badge-accent">Custom</span>
                    <button type="button" className="btn btn-sm" onClick={() => openEdit(p)}>
                      Edit
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-danger"
                      onClick={() => setDeleteConfirmId(p.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {editor ? (
        <div className="modal-backdrop" role="presentation" onClick={closeEditor}>
          <div
            className="modal modal-wide"
            role="dialog"
            aria-modal="true"
            aria-labelledby="provider-editor-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="provider-editor-title">
              {editor.type === 'create' ? 'New custom provider' : 'Edit custom provider'}
            </h2>
            <form className="stack" onSubmit={onSubmitCustom}>
              <div className="field">
                <label htmlFor="prov-name">Name</label>
                <input
                  id="prov-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="e.g. Zapier webhook"
                />
              </div>
              <div className="field">
                <label htmlFor="prov-desc">Description</label>
                <textarea
                  id="prov-desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optional notes"
                />
              </div>
              <GenericHttpFields
                idPrefix={editor.type === 'edit' ? editor.provider.id : 'new'}
                value={http}
                onChange={setHttp}
                revealSecret={revealSecret}
                onToggleReveal={() => setRevealSecret((v) => !v)}
              />
              <div className="row" style={{ justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button type="button" className="btn" onClick={closeEditor}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editor.type === 'create' ? 'Create' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {deleteConfirmId ? (
        <div className="modal-backdrop" role="presentation" onClick={() => setDeleteConfirmId(null)}>
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <h2>Delete custom provider?</h2>
            <p className="muted">
              This removes the provider and any route bindings that use it. This cannot be undone.
            </p>
            <div className="row" style={{ justifyContent: 'flex-end', marginTop: '1rem' }}>
              <button type="button" className="btn" onClick={() => setDeleteConfirmId(null)}>
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={() => onDeleteCustom(deleteConfirmId)}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {tab === 'custom' && customProviders.length > 0 ? (
        <p className="field-hint">
          Attach custom providers from a <Link to="/workspaces">workspace</Link> route editor.
        </p>
      ) : null}
    </div>
  )
}
