import { useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Modal } from '@/components/Modal'
import { useMockStore } from '@/store/MockStore'
import { COMMUNITY_MAX_ROUTES } from '@/types'

export function WorkspaceRoutesPage() {
  const { workspaceId = '' } = useParams()
  const { routesForWorkspace, createRoute, deleteRoute, pathConflict, pushToast } = useMockStore()
  const routes = routesForWorkspace(workspaceId)
  const atRouteLimit = routes.length >= COMMUNITY_MAX_ROUTES
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [path, setPath] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState('')

  const fullPath = `/${path.replace(/^\/+/, '')}`

  function openCreate() {
    if (atRouteLimit) {
      pushToast(
        'warning',
        `Community edition allows at most ${COMMUNITY_MAX_ROUTES} API routes per workspace.`,
      )
      return
    }
    setOpen(true)
  }

  function onCreate(e: FormEvent) {
    e.preventDefault()
    setError('')
    if (!path.trim()) {
      setError('Complete the custom path.')
      return
    }
    const result = createRoute({ workspaceId, name, path: fullPath, description })
    if ('error' in result) {
      if (result.error === 'max_routes') {
        setError(
          `Community edition allows at most ${COMMUNITY_MAX_ROUTES} API routes per workspace.`,
        )
      } else {
        setError(result.error)
      }
      return
    }
    setOpen(false)
    setName('')
    setPath('')
    setDescription('')
  }

  const pathWarning = !path.trim()
    ? 'Complete the custom path.'
    : pathConflict(fullPath)
      ? 'Another route already uses this path.'
      : ''

  return (
    <div className="stack">
      <div className="page-header" style={{ marginBottom: 0 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.15rem' }}>API Routes</h2>
          <p className="muted">
            Each route is an independent managed endpoint with its own custom path. Community limit:{' '}
            {routes.length}/{COMMUNITY_MAX_ROUTES} routes per workspace.
          </p>
        </div>
        <button type="button" className="btn btn-primary" onClick={openCreate}>
          Create route
        </button>
      </div>

      {routes.length === 0 ? (
        <div className="card empty">
          <p>No routes in this workspace yet.</p>
          <button type="button" className="btn btn-primary" style={{ marginTop: '0.75rem' }} onClick={openCreate}>
            Create your first route
          </button>
        </div>
      ) : (
        <div className="stack">
          {routes.map((p) => (
            <div key={p.id} className="card">
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <div>
                  <Link
                    to={`/workspaces/${workspaceId}/routes/${p.id}`}
                    style={{ fontWeight: 700, fontSize: '1.05rem' }}
                  >
                    {p.name}
                  </Link>
                  <div className="row" style={{ marginTop: '0.35rem' }}>
                    <code className="mono">{p.path}</code>
                    <span className="badge">{p.providers.filter((b) => b.enabled).length} providers</span>
                  </div>
                  {p.description ? (
                    <p className="muted" style={{ marginTop: '0.35rem' }}>
                      {p.description}
                    </p>
                  ) : null}
                </div>
                <div className="row">
                  <Link to={`/workspaces/${workspaceId}/routes/${p.id}`} className="btn btn-sm">
                    Edit
                  </Link>
                  <button
                    type="button"
                    className="btn btn-sm btn-danger"
                    onClick={() => {
                      if (window.confirm(`Delete route “${p.name}”?`)) {
                        deleteRoute(workspaceId, p.id)
                      }
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {open ? (
        <Modal
          title="Create API Route"
          onClose={() => setOpen(false)}
          footer={
            <>
              <button type="button" className="btn" onClick={() => setOpen(false)}>
                Cancel
              </button>
              <button type="submit" form="create-route-form" className="btn btn-primary">
                Create
              </button>
            </>
          }
        >
          <form id="create-route-form" className="stack" onSubmit={onCreate}>
            <div className="field">
              <label htmlFor="route-name">Name</label>
              <input
                id="route-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Detect Language"
              />
            </div>
            <div className="field">
              <label htmlFor="route-path">Custom path</label>
              <div className="path-input">
                <span className="path-input-prefix" aria-hidden="true">
                  /
                </span>
                <input
                  id="route-path"
                  value={path}
                  onChange={(e) => setPath(e.target.value.replace(/^\/+/, ''))}
                  className="mono"
                  placeholder="custom-path"
                  aria-describedby="route-path-error"
                />
              </div>
              {pathWarning ? (
                <span id="route-path-error" className="field-error">
                  {pathWarning}
                </span>
              ) : null}
            </div>
            <div className="field">
              <label htmlFor="route-desc">Description</label>
              <textarea
                id="route-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            {error ? <p className="field-error">{error}</p> : null}
          </form>
        </Modal>
      ) : null}
    </div>
  )
}
