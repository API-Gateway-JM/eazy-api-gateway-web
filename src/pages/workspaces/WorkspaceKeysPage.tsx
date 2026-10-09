import { useState, type FormEvent } from 'react'
import { useParams } from 'react-router-dom'
import { KeyReveal } from '@/components/KeyReveal'
import { Modal } from '@/components/Modal'
import { formatDate } from '@/lib/ids'
import { useMockStore } from '@/store/MockStore'
import type { ApiKey, ExpirationOption } from '@/types'
import { COMMUNITY_MAX_KEYS } from '@/types'

export function WorkspaceKeysPage() {
  const { workspaceId = '' } = useParams()
  const { keysForWorkspace, createApiKey, regenerateApiKey, revokeApiKey, pushToast } =
    useMockStore()
  const keys = keysForWorkspace(workspaceId)
  const activeCount = keys.filter((k) => k.status === 'active').length

  const [showCreate, setShowCreate] = useState(false)
  const [name, setName] = useState('Secondary')
  const [expiration, setExpiration] = useState<ExpirationOption>('never')
  const [freshKey, setFreshKey] = useState<ApiKey | null>(null)
  const [confirmRegen, setConfirmRegen] = useState<ApiKey | null>(null)

  function onCreate(e: FormEvent) {
    e.preventDefault()
    const result = createApiKey({ workspaceId, name, expiration })
    if ('error' in result) return
    setShowCreate(false)
    setFreshKey(result)
    setName('Secondary')
    setExpiration('never')
  }

  function onConfirmRegen() {
    if (!confirmRegen) return
    const result = regenerateApiKey(confirmRegen.id)
    setConfirmRegen(null)
    if ('error' in result) {
      pushToast('danger', 'Could not regenerate key.')
      return
    }
    setFreshKey(result)
    pushToast('success', 'Key regenerated — copy the new secret now.')
  }

  return (
    <div className="stack">
      <div className="page-header" style={{ marginBottom: 0 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.15rem' }}>API Keys</h2>
          <p className="muted">
            Azure-style: reveal and copy anytime. Community max {COMMUNITY_MAX_KEYS} active keys.
            Regenerating does not count toward the limit.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          disabled={activeCount >= COMMUNITY_MAX_KEYS}
          onClick={() => {
            if (activeCount >= COMMUNITY_MAX_KEYS) {
              pushToast('warning', `Max ${COMMUNITY_MAX_KEYS} keys in Community edition.`)
              return
            }
            setShowCreate(true)
          }}
        >
          Create key
        </button>
      </div>

      {freshKey ? (
        <div className="key-panel stack">
          <strong>
            {freshKey.rotatedAt ? 'Regenerated' : 'New'} key — {freshKey.name}
          </strong>
          <KeyReveal secret={freshKey.key} initiallyRevealed />
          <button type="button" className="btn btn-sm" onClick={() => setFreshKey(null)}>
            Dismiss
          </button>
        </div>
      ) : null}

      {keys.length === 0 ? (
        <div className="card empty">No keys yet.</div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Status</th>
                <th>Expires</th>
                <th>Secret</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {keys.map((k) => (
                <tr key={k.id}>
                  <td>
                    <strong>{k.name}</strong>
                    <div className="muted" style={{ fontSize: '0.8rem' }}>
                      Created {formatDate(k.createdAt)}
                      {k.rotatedAt ? ` · Rotated ${formatDate(k.rotatedAt)}` : ''}
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${k.status === 'active' ? 'badge-success' : 'badge-danger'}`}>
                      {k.status}
                    </span>
                  </td>
                  <td>{formatDate(k.expiresAt)}</td>
                  <td style={{ minWidth: 220 }}>
                    {k.status === 'active' ? <KeyReveal secret={k.key} /> : <span className="muted">—</span>}
                  </td>
                  <td>
                    <div className="row">
                      <button
                        type="button"
                        className="btn btn-sm"
                        disabled={k.status !== 'active'}
                        onClick={() => setConfirmRegen(k)}
                      >
                        Regenerate
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-danger"
                        disabled={k.status !== 'active'}
                        onClick={() => {
                          if (window.confirm('Revoke this key? Clients using it will fail.')) {
                            revokeApiKey(k.id)
                          }
                        }}
                      >
                        Revoke
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showCreate ? (
        <Modal
          title="Create API key"
          onClose={() => setShowCreate(false)}
          footer={
            <>
              <button type="button" className="btn" onClick={() => setShowCreate(false)}>
                Cancel
              </button>
              <button type="submit" form="create-key-form" className="btn btn-primary">
                Create
              </button>
            </>
          }
        >
          <form id="create-key-form" className="stack" onSubmit={onCreate}>
            <div className="field">
              <label htmlFor="key-name">Name</label>
              <input
                id="key-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="key-exp">Expiration</label>
              <select
                id="key-exp"
                value={expiration}
                onChange={(e) => setExpiration(e.target.value as ExpirationOption)}
              >
                <option value="never">Never</option>
                <option value="30">30 days</option>
                <option value="90">90 days</option>
                <option value="180">180 days</option>
                <option value="365">1 year</option>
              </select>
            </div>
          </form>
        </Modal>
      ) : null}

      {confirmRegen ? (
        <Modal
          title="Regenerate API key?"
          onClose={() => setConfirmRegen(null)}
          footer={
            <>
              <button type="button" className="btn" onClick={() => setConfirmRegen(null)}>
                Cancel
              </button>
              <button type="button" className="btn btn-danger" onClick={onConfirmRegen}>
                Regenerate
              </button>
            </>
          }
        >
          <p>
            The previous secret for <strong>{confirmRegen.name}</strong> will stop working
            immediately. Clients must be updated to the new value.
          </p>
        </Modal>
      ) : null}
    </div>
  )
}
