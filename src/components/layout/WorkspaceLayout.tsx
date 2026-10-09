import { NavLink, Outlet, useParams, Link } from 'react-router-dom'
import { useMockStore } from '@/store/MockStore'

const TABS = [
  { segment: '', label: 'Overview', end: true },
  { segment: 'keys', label: 'API Keys' },
  { segment: 'routes', label: 'API Routes' },
  { segment: 'clients', label: 'Allowed Clients' },
]

export function WorkspaceLayout() {
  const { workspaceId = '' } = useParams()
  const { getWorkspace } = useMockStore()
  const ws = getWorkspace(workspaceId)

  if (!ws) {
    return (
      <div className="card empty">
        <p>Workspace not found.</p>
        <Link to="/workspaces" className="btn btn-primary" style={{ display: 'inline-block', marginTop: '0.75rem' }}>
          Back to API Workspaces
        </Link>
      </div>
    )
  }

  return (
    <div className="stack">
      <div className="page-header" style={{ marginBottom: '0.5rem' }}>
        <div>
          <p className="muted" style={{ marginBottom: '0.35rem' }}>
            <Link to="/workspaces">API Workspaces</Link> / {ws.name}
          </p>
          <h1 style={{ margin: 0 }}>{ws.name}</h1>
          {ws.description ? <p className="muted">{ws.description}</p> : null}
        </div>
      </div>
      <div className="workspace-layout">
        <nav className="workspace-nav" aria-label="Workspace">
          {TABS.map((tab) => {
            const to = tab.segment
              ? `/workspaces/${workspaceId}/${tab.segment}`
              : `/workspaces/${workspaceId}`
            return (
              <NavLink
                key={tab.label}
                to={to}
                end={tab.end}
                className={({ isActive }) => (isActive ? 'active' : undefined)}
              >
                {tab.label}
              </NavLink>
            )
          })}
        </nav>
        <div className="stack">
          <Outlet context={{ workspace: ws }} />
        </div>
      </div>
    </div>
  )
}
