import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { formatDate } from '@/lib/ids'
import { useMockStore } from '@/store/MockStore'

export function WebhookOverviewPage() {
  const { webhookId = '' } = useParams()
  const navigate = useNavigate()
  const {
    getWebhook,
    updateWebhook,
    deleteWebhook,
    keysForWebhook,
    flowsForWebhook,
  } = useMockStore()
  const wh = getWebhook(webhookId)
  const [name, setName] = useState(wh?.name ?? '')
  const [description, setDescription] = useState(wh?.description ?? '')

  useEffect(() => {
    if (!wh) return
    setName(wh.name)
    setDescription(wh.description ?? '')
  }, [wh])

  if (!wh) return null

  function onSave(e: FormEvent) {
    e.preventDefault()
    updateWebhook(webhookId, { name, description })
  }

  const keys = keysForWebhook(webhookId)
  const flows = flowsForWebhook(webhookId)

  return (
    <div className="stack">
      <div className="grid-cards" style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
        <div className="card">
          <h3>API Keys</h3>
          <div className="stat">{keys.filter((k) => k.status === 'active').length}</div>
          <Link to={`/webhooks/${webhookId}/keys`}>Manage keys</Link>
        </div>
        <div className="card">
          <h3>HTTP Flows</h3>
          <div className="stat">{flows.length}</div>
          <Link to={`/webhooks/${webhookId}/flows`}>Manage flows</Link>
        </div>
        <div className="card">
          <h3>Allowed clients</h3>
          <div className="stat">{wh.allowedClients.length}</div>
          <Link to={`/webhooks/${webhookId}/clients`}>Manage clients</Link>
        </div>
      </div>

      <form className="card stack" onSubmit={onSave}>
        <h2 style={{ margin: 0, fontSize: '1.05rem' }}>Overview</h2>
        <div className="field">
          <label htmlFor="wh-name">Name</label>
          <input id="wh-name" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div className="field">
          <label htmlFor="wh-desc">Description</label>
          <textarea
            id="wh-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <p className="muted" style={{ fontSize: '0.85rem' }}>
          Created {formatDate(wh.createdAt)} · Updated {formatDate(wh.updatedAt)}
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
            <h3>Delete webhook</h3>
            <p className="muted" style={{ fontSize: '0.85rem' }}>
              Permanently deletes this webhook and its API keys and flows. This cannot be
              undone.
            </p>
          </div>
          <button
            type="button"
            className="btn btn-danger-outline"
            onClick={() => {
              if (window.confirm('Delete this webhook and its keys/flows?')) {
                deleteWebhook(webhookId)
                navigate('/webhooks')
              }
            }}
          >
            Delete webhook
          </button>
        </div>
      </div>
    </div>
  )
}
