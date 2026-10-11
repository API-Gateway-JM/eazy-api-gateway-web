import { Link } from 'react-router-dom'
import { formatDate } from '@/lib/ids'
import { useMockStore } from '@/store/MockStore'
import { COMMUNITY_MAX_WEBHOOKS } from '@/types'

export function WebhookListPage() {
  const { state, flowsForWebhook, keysForWebhook, pushToast } = useMockStore()
  const atLimit = state.webhooks.length >= COMMUNITY_MAX_WEBHOOKS

  return (
    <div className="stack">
      <div className="page-header">
        <div>
          <h1>Webhooks</h1>
          <p>
            Community edition allows up to {COMMUNITY_MAX_WEBHOOKS} local webhooks (
            {state.webhooks.length}/{COMMUNITY_MAX_WEBHOOKS}).
          </p>
        </div>
        {atLimit ? (
          <button
            type="button"
            className="btn btn-primary"
            onClick={() =>
              pushToast(
                'warning',
                'Portable Community limit — upgrade for more webhooks.',
              )
            }
          >
            New webhook
          </button>
        ) : (
          <Link to="/webhooks/new" className="btn btn-primary">
            New webhook
          </Link>
        )}
      </div>

      {state.webhooks.length === 0 ? (
        <div className="card empty">
          <p>No webhooks yet.</p>
          <Link to="/webhooks/new" className="btn btn-primary" style={{ display: 'inline-block', marginTop: '0.75rem' }}>
            Create your first webhook
          </Link>
        </div>
      ) : (
        <div className="stack">
          {state.webhooks.map((wh) => {
            const keys = keysForWebhook(wh.id).filter((k) => k.status === 'active').length
            const flows = flowsForWebhook(wh.id).length
            return (
              <div key={wh.id} className="card">
                <div className="row" style={{ justifyContent: 'space-between' }}>
                  <div>
                    <Link to={`/webhooks/${wh.id}`} style={{ fontWeight: 700, fontSize: '1.1rem' }}>
                      {wh.name}
                    </Link>
                    {wh.description ? (
                      <p className="muted" style={{ marginTop: '0.25rem' }}>
                        {wh.description}
                      </p>
                    ) : null}
                    <p className="muted" style={{ marginTop: '0.45rem', fontSize: '0.85rem' }}>
                      {keys} active keys · {flows} flows · {wh.allowedClients.length} clients ·
                      updated {formatDate(wh.updatedAt)}
                    </p>
                  </div>
                  <Link to={`/webhooks/${wh.id}`} className="btn btn-sm">
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
