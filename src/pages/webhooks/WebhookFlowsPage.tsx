import { useRef, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Modal } from '@/components/Modal'
import { isFlowExportFile } from '@/lib/flowGraph'
import { useMockStore } from '@/store/MockStore'
import { COMMUNITY_MAX_FLOWS } from '@/types'

export function WebhookFlowsPage() {
  const { webhookId = '' } = useParams()
  const { flowsForWebhook, createFlow, deleteFlow, importFlow, pushToast } = useMockStore()
  const flows = flowsForWebhook(webhookId)
  const atFlowLimit = flows.length >= COMMUNITY_MAX_FLOWS
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  function openCreate() {
    if (atFlowLimit) {
      pushToast(
        'warning',
        `Community edition allows at most ${COMMUNITY_MAX_FLOWS} flows per webhook.`,
      )
      return
    }
    setOpen(true)
  }

  function onCreate(e: FormEvent) {
    e.preventDefault()
    setError('')
    const result = createFlow({ webhookId, name, description })
    if ('error' in result) {
      setError(result.error === 'max_flows' ? `Community edition allows at most ${COMMUNITY_MAX_FLOWS} flows per webhook.` : result.error)
      return
    }
    setOpen(false)
    setName('')
    setDescription('')
  }

  async function onImport(file: File) {
    try {
      const parsed = JSON.parse(await file.text()) as unknown
      if (!isFlowExportFile(parsed)) {
        pushToast('warning', 'This file is not an eazy.flow v1 document.')
        return
      }
      const result = importFlow(webhookId, parsed)
      if ('error' in result) {
        pushToast('warning', result.error)
        return
      }
      pushToast('success', `Imported “${result.name}”.`)
    } catch {
      pushToast('warning', 'Could not read that JSON file.')
    }
  }

  return (
    <div className="stack">
      <div className="page-header" style={{ marginBottom: 0 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.15rem' }}>HTTP Flows</h2>
          <p className="muted">
            Each flow is a pipeline with a start, operators, HTTP connections, conditions, and ends.
            Community limit: {flows.length}/{COMMUNITY_MAX_FLOWS} flows per webhook.
          </p>
        </div>
        <div className="row">
          <button type="button" className="btn" onClick={() => fileRef.current?.click()}>
            Import
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={(e) => {
              const file = e.target.files?.[0]
              e.target.value = ''
              if (file) void onImport(file)
            }}
          />
          <button type="button" className="btn btn-primary" onClick={openCreate}>
            Create flow
          </button>
        </div>
      </div>

      {flows.length === 0 ? (
        <div className="card empty">
          <p>No flows in this webhook yet.</p>
          <button type="button" className="btn btn-primary" style={{ marginTop: '0.75rem' }} onClick={openCreate}>
            Create your first flow
          </button>
        </div>
      ) : (
        <div className="stack">
          {flows.map((flow) => (
            <div key={flow.id} className="card">
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <div>
                  <Link
                    to={`/webhooks/${webhookId}/flows/${flow.id}`}
                    style={{ fontWeight: 700, fontSize: '1.05rem' }}
                  >
                    {flow.name}
                  </Link>
                  <div className="row" style={{ marginTop: '0.35rem' }}>
                    <span className="badge">{flow.nodes.length} nodes</span>
                    <span className="badge">{flow.edges.length} links</span>
                  </div>
                  {flow.description ? (
                    <p className="muted" style={{ marginTop: '0.35rem' }}>
                      {flow.description}
                    </p>
                  ) : null}
                </div>
                <div className="row">
                  <Link to={`/webhooks/${webhookId}/flows/${flow.id}`} className="btn btn-sm">
                    Edit
                  </Link>
                  <button
                    type="button"
                    className="btn btn-sm btn-danger"
                    onClick={() => {
                      if (window.confirm(`Delete flow “${flow.name}”?`)) {
                        deleteFlow(webhookId, flow.id)
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
          title="Create HTTP Flow"
          onClose={() => setOpen(false)}
          footer={
            <>
              <button type="button" className="btn" onClick={() => setOpen(false)}>
                Cancel
              </button>
              <button type="submit" form="create-flow-form" className="btn btn-primary">
                Create
              </button>
            </>
          }
        >
          <form id="create-flow-form" className="stack" onSubmit={onCreate}>
            <div className="field">
              <label htmlFor="flow-name">Name</label>
              <input
                id="flow-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Detect Language"
              />
            </div>
            <div className="field">
              <label htmlFor="flow-desc">Description</label>
              <textarea
                id="flow-desc"
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
