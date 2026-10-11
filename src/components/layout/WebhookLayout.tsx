import { NavLink, Outlet, useParams, Link } from 'react-router-dom'
import { useMockStore } from '@/store/MockStore'

const TABS = [
  { segment: '', label: 'Overview', end: true },
  { segment: 'flows', label: 'HTTP Flows' },
  { segment: 'input', label: 'Input Data' },
  { segment: 'output', label: 'Output Data' },
  { segment: 'keys', label: 'API Keys' },
  { segment: 'clients', label: 'Allowed Clients' },
]

export function WebhookLayout() {
  const { webhookId = '' } = useParams()
  const { getWebhook } = useMockStore()
  const wh = getWebhook(webhookId)

  if (!wh) {
    return (
      <div className="card empty">
        <p>Webhook not found.</p>
        <Link to="/webhooks" className="btn btn-primary" style={{ display: 'inline-block', marginTop: '0.75rem' }}>
          Back to Webhooks
        </Link>
      </div>
    )
  }

  return (
    <div className="stack">
      <div className="page-header" style={{ marginBottom: '0.5rem' }}>
        <div>
          <p className="muted" style={{ marginBottom: '0.35rem' }}>
            <Link to="/webhooks">Webhooks</Link> / {wh.name}
          </p>
          <h1 style={{ margin: 0 }}>{wh.name}</h1>
          {wh.description ? <p className="muted">{wh.description}</p> : null}
        </div>
      </div>
      <div className="webhook-layout">
        <nav className="webhook-nav" aria-label="Webhook">
          {TABS.map((tab) => {
            const to = tab.segment
              ? `/webhooks/${webhookId}/${tab.segment}`
              : `/webhooks/${webhookId}`
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
          <Outlet context={{ webhook: wh }} />
        </div>
      </div>
    </div>
  )
}
