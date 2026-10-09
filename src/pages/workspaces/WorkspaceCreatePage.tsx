import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { KeyReveal } from '@/components/KeyReveal'
import { useMockStore } from '@/store/MockStore'
import type { AllowedClient, ApiKey } from '@/types'

type ClientDraft = { type: AllowedClient['type']; value: string }

export function WorkspaceCreatePage() {
  const { createWorkspace } = useMockStore()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [clients, setClients] = useState<ClientDraft[]>([
    { type: 'domain', value: '' },
  ])
  const [error, setError] = useState('')
  const [createdKey, setCreatedKey] = useState<ApiKey | null>(null)
  const [createdWsId, setCreatedWsId] = useState<string | null>(null)

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    const result = createWorkspace({
      name,
      description,
      allowedClients: clients
        .filter((c) => c.value.trim())
        .map((c) => ({ type: c.type, value: c.value.trim() })),
    })
    if ('error' in result) {
      if (result.error === 'community_limit') {
        setError('Portable Community limit — upgrade for more workspaces.')
      } else {
        setError(result.error)
      }
      return
    }
    setCreatedKey(result.primaryKey)
    setCreatedWsId(result.workspace.id)
  }

  if (createdKey && createdWsId) {
    return (
      <div className="stack" style={{ maxWidth: 640 }}>
        <div className="page-header">
          <div>
            <h1>Workspace created</h1>
            <p>Primary API key was generated automatically. You can reveal it anytime later.</p>
          </div>
        </div>
        <div className="key-panel stack">
          <strong>Primary API key</strong>
          <KeyReveal secret={createdKey.key} initiallyRevealed />
        </div>
        <div className="row">
          <Link to={`/workspaces/${createdWsId}`} className="btn btn-primary">
            Go to workspace
          </Link>
          <Link to={`/workspaces/${createdWsId}/routes`} className="btn">
            Add API Routes
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="stack" style={{ maxWidth: 640 }}>
      <div className="page-header">
        <div>
          <h1>New API Workspace</h1>
          <p>Community edition allows up to two active workspaces. A Primary key is created on save.</p>
        </div>
      </div>

      <form className="card stack" onSubmit={onSubmit}>
        <div className="field">
          <label htmlFor="name">Name</label>
          <input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="Workspace name"
          />
        </div>
        <div className="field">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional"
          />
        </div>

        <div className="stack">
          <strong>Allowed clients</strong>
          <p className="field-hint">Restrict which domains / IPs may call managed APIs.</p>
          {clients.map((c, idx) => (
            <div key={idx} className="row">
              <select
                aria-label="Client type"
                value={c.type}
                onChange={(e) => {
                  const next = [...clients]
                  next[idx] = { ...c, type: e.target.value as AllowedClient['type'] }
                  setClients(next)
                }}
              >
                <option value="domain">Domain</option>
                <option value="ip">IP</option>
              </select>
              <input
                style={{ flex: 1, minWidth: 180 }}
                value={c.value}
                onChange={(e) => {
                  const next = [...clients]
                  next[idx] = { ...c, value: e.target.value }
                  setClients(next)
                }}
                placeholder={c.type === 'domain' ? 'app.example.com' : '203.0.113.10'}
              />
              <button
                type="button"
                className="btn btn-sm"
                onClick={() => setClients(clients.filter((_, i) => i !== idx))}
                disabled={clients.length === 1}
              >
                Remove
              </button>
            </div>
          ))}
          <button
            type="button"
            className="btn btn-sm"
            onClick={() => setClients([...clients, { type: 'domain', value: '' }])}
          >
            Add client
          </button>
        </div>

        {error ? <p className="field-error">{error}</p> : null}

        <div className="row">
          <button type="submit" className="btn btn-primary">
            Create workspace
          </button>
          <Link to="/workspaces" className="btn">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}
