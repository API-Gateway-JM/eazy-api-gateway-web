import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { formatDate } from '@/lib/ids'
import { useMockStore } from '@/store/MockStore'

export function WorkspaceOverviewPage() {
  const { workspaceId = '' } = useParams()
  const navigate = useNavigate()
  const {
    getWorkspace,
    updateWorkspace,
    deleteWorkspace,
    keysForWorkspace,
    routesForWorkspace,
  } = useMockStore()
  const ws = getWorkspace(workspaceId)
  const [name, setName] = useState(ws?.name ?? '')
  const [description, setDescription] = useState(ws?.description ?? '')

  useEffect(() => {
    if (!ws) return
    setName(ws.name)
    setDescription(ws.description ?? '')
  }, [ws])

  if (!ws) return null

  function onSave(e: FormEvent) {
    e.preventDefault()
    updateWorkspace(workspaceId, { name, description })
  }

  const keys = keysForWorkspace(workspaceId)
  const routes = routesForWorkspace(workspaceId)

  return (
    <div className="stack">
      <div className="grid-cards" style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
        <div className="card">
          <h3>API Keys</h3>
          <div className="stat">{keys.filter((k) => k.status === 'active').length}</div>
          <Link to={`/workspaces/${workspaceId}/keys`}>Manage keys</Link>
        </div>
        <div className="card">
          <h3>API Routes</h3>
          <div className="stat">{routes.length}</div>
          <Link to={`/workspaces/${workspaceId}/routes`}>Manage routes</Link>
        </div>
        <div className="card">
          <h3>Allowed clients</h3>
          <div className="stat">{ws.allowedClients.length}</div>
          <Link to={`/workspaces/${workspaceId}/clients`}>Manage clients</Link>
        </div>
      </div>

      <form className="card stack" onSubmit={onSave}>
        <h2 style={{ margin: 0, fontSize: '1.05rem' }}>Overview</h2>
        <div className="field">
          <label htmlFor="ws-name">Name</label>
          <input id="ws-name" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div className="field">
          <label htmlFor="ws-desc">Description</label>
          <textarea
            id="ws-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <p className="muted" style={{ fontSize: '0.85rem' }}>
          Created {formatDate(ws.createdAt)} · Updated {formatDate(ws.updatedAt)}
        </p>
        <div className="row">
          <button type="submit" className="btn btn-primary">
            Save changes
          </button>
        </div>
      </form>

      <div className="danger-zone">
        <h2 style={{ margin: 0, fontSize: '1.05rem' }}>Danger Zone</h2>
        <div className="danger-zone-row">
          <div>
            <h3>Delete workspace</h3>
            <p className="muted" style={{ fontSize: '0.85rem' }}>
              Permanently deletes this workspace and its API keys and routes. This cannot be
              undone.
            </p>
          </div>
          <button
            type="button"
            className="btn btn-danger-outline"
            onClick={() => {
              if (window.confirm('Delete this workspace and its keys/routes?')) {
                deleteWorkspace(workspaceId)
                navigate('/workspaces')
              }
            }}
          >
            Delete workspace
          </button>
        </div>
      </div>
    </div>
  )
}
