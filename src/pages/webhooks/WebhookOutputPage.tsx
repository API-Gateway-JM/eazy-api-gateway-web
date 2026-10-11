import { useEffect, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { KeyValueEditor } from '@/components/KeyValueEditor'
import { MappedObjectEditor } from '@/components/flow/MappedObjectEditor'
import { flowOutputFields, type PickerGroup } from '@/lib/flowGraph'
import { defaultWebhookResponse, emptyMappedObject } from '@/lib/webhooks'
import { useMockStore } from '@/store/MockStore'
import type { WebhookResponse } from '@/types'

const CONTENT_TYPES = [
  'application/json',
  'text/plain',
  'text/html',
  'application/xml',
]

export function WebhookOutputPage() {
  const { webhookId = '' } = useParams()
  const { getWebhook, flowsForWebhook, updateWebhookResponse, pushToast } = useMockStore()
  const wh = getWebhook(webhookId)
  const flows = flowsForWebhook(webhookId)
  const [draft, setDraft] = useState<WebhookResponse | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (wh) setDraft(structuredClone(wh.response ?? defaultWebhookResponse()))
  }, [wh])

  if (!wh || !draft) return null

  const sourceFlow = flows.find((flow) => flow.id === draft.sourceFlowId)
  const groups: PickerGroup[] = sourceFlow
    ? [
        {
          source: 'flow',
          id: sourceFlow.id,
          label: sourceFlow.name,
          fields: flowOutputFields(sourceFlow),
        },
      ]
    : []

  function onSave(e: FormEvent) {
    e.preventDefault()
    setError('')
    if (!draft) return
    updateWebhookResponse(webhookId, draft)
    pushToast('success', 'Output contract saved.')
  }

  return (
    <div className="stack">
      <div className="page-header" style={{ marginBottom: 0 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.15rem' }}>Output Data</h2>
          <p className="muted">
            Build the JSON callers receive. Each property links to the success output of one flow.
            Status codes come from that flow’s end nodes.
          </p>
        </div>
      </div>

      <form className="card stack" onSubmit={onSave}>
        <div className="field">
          <label htmlFor="source-flow">Response flow</label>
          <select
            id="source-flow"
            value={draft.sourceFlowId ?? ''}
            onChange={(e) => setDraft({ ...draft, sourceFlowId: e.target.value || null })}
          >
            <option value="">None</option>
            {flows.map((flow) => (
              <option key={flow.id} value={flow.id}>
                {flow.name}
              </option>
            ))}
          </select>
          {sourceFlow ? (
            <span className="field-hint">
              Success fields come from <strong>{sourceFlow.name}</strong>.{' '}
              <Link to={`/webhooks/${webhookId}/flows/${sourceFlow.id}`}>Open flow</Link>
            </span>
          ) : (
            <span className="field-hint">Choose the flow whose success output fills this response.</span>
          )}
        </div>

        <div className="field">
          <label htmlFor="resp-ctype">Content type</label>
          <select
            id="resp-ctype"
            value={draft.contentType}
            onChange={(e) => setDraft({ ...draft, contentType: e.target.value })}
          >
            {CONTENT_TYPES.map((ct) => (
              <option key={ct} value={ct}>
                {ct}
              </option>
            ))}
          </select>
        </div>

        <KeyValueEditor
          label="Response headers"
          rows={draft.headers}
          onChange={(headers) => setDraft({ ...draft, headers })}
        />

        <div className="field">
          <label>Response body</label>
          <MappedObjectEditor
            value={draft.body.kind === 'object' ? draft.body : emptyMappedObject()}
            groups={groups}
            onChange={(body) => setDraft({ ...draft, body })}
          />
        </div>

        {error ? <p className="field-error">{error}</p> : null}

        <div className="row">
          <button type="submit" className="btn btn-primary">
            Save output
          </button>
        </div>
      </form>
    </div>
  )
}
