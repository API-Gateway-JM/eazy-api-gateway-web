import { Link } from 'react-router-dom'
import { formatDate } from '@/lib/ids'
import { useMockStore } from '@/store/MockStore'
import { COMMUNITY_MAX_WORKSPACES } from '@/types'

export function WorkspaceListPage() {
  const { state, routesForWorkspace, keysForWorkspace, pushToast } = useMockStore()
  const atLimit = state.workspaces.length >= COMMUNITY_MAX_WORKSPACES

  return (
    <div className="stack">
      <div className="page-header">
        <div>
          <h1>API Workspaces</h1>
          <p>
            Community edition allows up to {COMMUNITY_MAX_WORKSPACES} local workspaces (
            {state.workspaces.length}/{COMMUNITY_MAX_WORKSPACES}).
          </p>
        </div>
        {atLimit ? (
          <button
            type="button"
            className="btn btn-primary"
            onClick={() =>
              pushToast(
                'warning',
                'Portable Community limit — upgrade for more workspaces.',
              )
            }
          >
            New workspace
          </button>
        ) : (
          <Link to="/workspaces/new" className="btn btn-primary">
            New workspace
          </Link>
        )}
      </div>

      {state.workspaces.length === 0 ? (
        <div className="card empty">
          <p>No API Workspaces yet.</p>
          <Link to="/workspaces/new" className="btn btn-primary" style={{ display: 'inline-block', marginTop: '0.75rem' }}>
            Create your first workspace
          </Link>
        </div>
      ) : (
        <div className="stack">
          {state.workspaces.map((ws) => {
            const keys = keysForWorkspace(ws.id).filter((k) => k.status === 'active').length
            const routes = routesForWorkspace(ws.id).length
            return (
              <div key={ws.id} className="card">
                <div className="row" style={{ justifyContent: 'space-between' }}>
                  <div>
                    <Link to={`/workspaces/${ws.id}`} style={{ fontWeight: 700, fontSize: '1.1rem' }}>
                      {ws.name}
                    </Link>
                    {ws.description ? (
                      <p className="muted" style={{ marginTop: '0.25rem' }}>
                        {ws.description}
                      </p>
                    ) : null}
                    <p className="muted" style={{ marginTop: '0.45rem', fontSize: '0.85rem' }}>
                      {keys} active keys · {routes} routes · {ws.allowedClients.length} clients ·
                      updated {formatDate(ws.updatedAt)}
                    </p>
                  </div>
                  <Link to={`/workspaces/${ws.id}`} className="btn btn-sm">
                    Open
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
