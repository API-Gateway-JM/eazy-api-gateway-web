import { useEffect, useState, type FormEvent } from 'react'
import { useParams } from 'react-router-dom'
import { KeyValueEditor } from '@/components/KeyValueEditor'
import { SchemaEditor } from '@/components/flow/SchemaEditor'
import { HTTP_METHODS } from '@/lib/httpConfig'
import { defaultWebhookInput } from '@/lib/webhooks'
import { useMockStore } from '@/store/MockStore'
import type { HttpMethod, WebhookInput } from '@/types'

export function WebhookInputPage() {
  const { webhookId = '' } = useParams()
  const { getWebhook, updateWebhookInput, pushToast } = useMockStore()
  const wh = getWebhook(webhookId)
  const [draft, setDraft] = useState<WebhookInput | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (wh) setDraft(structuredClone(wh.input ?? defaultWebhookInput()))
  }, [wh])

  if (!wh || !draft) return null

  function toggleMethod(method: HttpMethod) {
    setDraft((d) =>
      d
        ? {
            ...d,
            methods: d.methods.includes(method)
              ? d.methods.filter((m) => m !== method)
              : [...d.methods, method],
          }
        : d,
    )
  }

  function onSave(e: FormEvent) {
    e.preventDefault()
    setError('')
    if (!draft) return
    if (draft.methods.length === 0) {
      setError('Select at least one HTTP method.')
      return
    }
    updateWebhookInput(webhookId, draft)
    pushToast('success', 'Input contract saved.')
  }

  return (
    <div className="stack">
      <div className="page-header" style={{ marginBottom: 0 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.15rem' }}>Input Data</h2>
          <p className="muted">
            What callers may send. A flow that starts from this webhook can pick these fields.
          </p>
        </div>
      </div>

      <form className="card stack" onSubmit={onSave}>
        <div className="field">
          <label>HTTP methods</label>
          <div className="row" style={{ gap: '0.9rem', flexWrap: 'wrap' }}>
            {HTTP_METHODS.map((m) => (
              <label key={m} className="row" style={{ fontSize: '0.9rem', gap: '0.35rem' }}>
                <input
                  type="checkbox"
                  checked={draft.methods.includes(m)}
                  onChange={() => toggleMethod(m)}
                />
                {m}
              </label>
            ))}
          </div>
        </div>

        <KeyValueEditor
          label="Query params"
          rows={draft.queryParams}
          onChange={(queryParams) => setDraft({ ...draft, queryParams })}
        />

        <KeyValueEditor
          label="Headers"
          rows={draft.headers}
          onChange={(headers) => setDraft({ ...draft, headers })}
        />

        <div className="field">
          <label htmlFor="body-mode">Request body</label>
          <select
            id="body-mode"
            value={draft.bodyMode}
            onChange={(e) =>
              setDraft({ ...draft, bodyMode: e.target.value as WebhookInput['bodyMode'] })
            }
          >
            <option value="json">JSON properties</option>
            <option value="passthrough">Passthrough (one text body)</option>
          </select>
        </div>

        {draft.bodyMode === 'json' ? (
          <div className="field">
            <label>Body properties</label>
            <SchemaEditor
              fields={draft.bodyFields}
              onChange={(bodyFields) => setDraft({ ...draft, bodyFields })}
            />
          </div>
        ) : null}

        {error ? <p className="field-error">{error}</p> : null}

        <div className="row">
          <button type="submit" className="btn btn-primary">
            Save input
          </button>
        </div>
      </form>
    </div>
  )
}
