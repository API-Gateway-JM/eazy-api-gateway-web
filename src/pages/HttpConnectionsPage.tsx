import { useMemo, useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { GenericHttpFields } from '@/components/GenericHttpFields'
import { createDefaultHttpConfig } from '@/lib/httpConfig'
import { useMockStore } from '@/store/MockStore'
import type { ExternalHttpConnection, GenericHttpConfig } from '@/types'

type Tab = 'platform' | 'custom'
type ConnectionEditor = { type: 'create' } | { type: 'edit'; connection: ExternalHttpConnection } | null

export function HttpConnectionsPage() {
  const {
    state,
    createCustomConnection,
    updateCustomConnection,
    deleteCustomConnection,
    accountsForConnection,
    pushToast,
  } = useMockStore()
  const [searchParams, setSearchParams] = useSearchParams()
  const tab: Tab = searchParams.get('tab') === 'custom' ? 'custom' : 'platform'

  const [editor, setEditor] = useState<ConnectionEditor>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [http, setHttp] = useState<GenericHttpConfig>(createDefaultHttpConfig())
  const [revealSecret, setRevealSecret] = useState(false)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  const platformConnections = useMemo(
    () => state.connections.filter((p) => p.origin === 'platform'),
    [state.connections],
  )
  const customConnections = useMemo(
    () => state.connections.filter((p) => p.origin === 'custom'),
    [state.connections],
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

  function openEdit(connection: ExternalHttpConnection) {
    setName(connection.name)
    setDescription(connection.description ?? '')
    setHttp(connection.http ? { ...connection.http } : createDefaultHttpConfig())
    setRevealSecret(false)
    setEditor({ type: 'edit', connection })
  }

  function closeEditor() {
    setEditor(null)
  }

  function onSubmitCustom(e: FormEvent) {
    e.preventDefault()
    if (editor?.type === 'create') {
      const result = createCustomConnection({ name, description, http })
      if ('error' in result) {
        pushToast('danger', result.error)
        return
      }
      pushToast('success', `Connection “${result.name}” created.`)
      closeEditor()
      setTab('custom')
      return
    }
    if (editor?.type === 'edit') {
      const result = updateCustomConnection(editor.connection.id, { name, description, http })
      if (result.error) {
        pushToast('danger', result.error)
        return
      }
      pushToast('success', 'Connection updated.')
      closeEditor()
    }
  }

  function onDeleteCustom(id: string) {
    const result = deleteCustomConnection(id)
    if (result.error) {
      pushToast('danger', result.error)
      return
    }
    pushToast('success', 'Custom connection deleted.')
    setDeleteConfirmId(null)
  }

  return (
    <div className="stack">
      <div className="page-header">
        <div>
          <h1>HTTP Connections</h1>
          <p>
            Browse platform connectors or define custom HTTP connections. API-key credentials for
            platform services are managed on each connection’s accounts page.
          </p>
        </div>
        {tab === 'custom' ? (
          <button type="button" className="btn btn-primary" onClick={openCreate}>
            New custom connection
          </button>
        ) : null}
      </div>

      <div className="tabs" role="tablist" aria-label="Connection catalogs">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'platform'}
          className={`tab${tab === 'platform' ? ' active' : ''}`}
          onClick={() => setTab('platform')}
        >
          Platform
          <span className="badge" style={{ marginLeft: 6 }}>
            {platformConnections.length}
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
            {customConnections.length}
          </span>
        </button>
      </div>

      {tab === 'platform' ? (
        <div className="stack">
          <p className="field-hint" style={{ margin: 0 }}>
            Built-in connectors. Open a connection to connect named accounts and reuse them on flows.
          </p>
          {platformConnections.map((p) => {
            const accountCount = accountsForConnection(p.id).length
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
                        No upstream API key required — attach directly on a flow.
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
                        to={`/connections/${p.id}/accounts`}
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
            Your HTTP recipes (URL, method, auth, headers). Auth secrets live on the connection, not as
            separate accounts.
          </p>
          {customConnections.length === 0 ? (
            <div className="card empty">
              <p>No custom connections yet.</p>
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
            customConnections.map((p) => (
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
            aria-labelledby="connection-editor-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="connection-editor-title">
              {editor.type === 'create' ? 'New custom connection' : 'Edit custom connection'}
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
                idPrefix={editor.type === 'edit' ? editor.connection.id : 'new'}
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
            <h2>Delete custom connection?</h2>
            <p className="muted">
              This removes the connection from the catalog. Flow nodes that used it will show a missing connection until you pick another.
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

      {tab === 'custom' && customConnections.length > 0 ? (
        <p className="field-hint">
          Attach custom connections from a <Link to="/webhooks">webhook</Link> flow editor.
        </p>
      ) : null}
    </div>
  )
}
