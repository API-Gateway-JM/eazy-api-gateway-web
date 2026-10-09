import { Link } from 'react-router-dom'
import { formatDate } from '@/lib/ids'
import { useMockStore } from '@/store/MockStore'
import { COMMUNITY_MAX_WORKSPACES } from '@/types'

/** Demo success rate for the week (alerts / fail tracking not wired yet). */
const SUCCESS_RATE_THIS_WEEK = 98

export function DashboardPage() {
  const { state, mockRequestsThisMonth } = useMockStore()
  const routes = state.routes.length
  const successfulRequestsThisWeek = mockRequestsThisMonth()
  const sentAlerts = 0

  return (
    <div className="stack">
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p>Manage API Workspaces, keys, and routes on a unified gateway path.</p>
        </div>
        <Link to="/workspaces/new" className="btn btn-primary">
          New workspace
        </Link>
      </div>

      <div className="grid-cards">
        <div className="card">
          <h3>API Workspaces</h3>
          <div className="stat">
            {state.workspaces.length}/{COMMUNITY_MAX_WORKSPACES}
          </div>
          <p className="muted">Community limit</p>
        </div>
        <div className="card">
          <h3>Routes</h3>
          <div className="stat">{routes}</div>
          <p className="muted">Custom gateway paths</p>
        </div>
        <div className="card">
          <h3>Weekly requests</h3>
          <div className="stat">{successfulRequestsThisWeek.toLocaleString()}</div>
          <p className="muted">{SUCCESS_RATE_THIS_WEEK}% successful</p>
        </div>
        <div className="card">
          <h3>Sent alerts</h3>
          <div className="stat">{sentAlerts}</div>
          <p className="muted">On API failure or free quota reached (coming soon)</p>
        </div>
      </div>

      <div className="card">
        <div className="page-header" style={{ marginBottom: '0.75rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.1rem' }}>Recent activity</h2>
        </div>
        {state.activity.length === 0 ? (
          <div className="empty">No activity yet.</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>When</th>
                <th>Event</th>
              </tr>
            </thead>
            <tbody>
              {state.activity.slice(0, 8).map((a) => (
                <tr key={a.id}>
                  <td className="muted">{formatDate(a.at)}</td>
                  <td>{a.message}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
