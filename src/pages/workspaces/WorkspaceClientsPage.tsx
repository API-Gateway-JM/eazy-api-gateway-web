import { useState, type FormEvent } from 'react'
import { useParams } from 'react-router-dom'
import { useMockStore } from '@/store/MockStore'
import type { AllowedClient } from '@/types'

export function WorkspaceClientsPage() {
  const { workspaceId = '' } = useParams()
  const { getWorkspace, addAllowedClient, removeAllowedClient } = useMockStore()
  const ws = getWorkspace(workspaceId)
  const [type, setType] = useState<AllowedClient['type']>('domain')
  const [value, setValue] = useState('')

  if (!ws) return null

  function onAdd(e: FormEvent) {
    e.preventDefault()
    if (!value.trim()) return
    addAllowedClient(workspaceId, { type, value: value.trim() })
    setValue('')
  }

  return (
    <div className="stack">
      <div className="page-header" style={{ marginBottom: 0 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.15rem' }}>Allowed Clients</h2>
          <p className="muted">Domains and IPs permitted to call this workspace’s managed APIs.</p>
        </div>
      </div>

      <form className="card row" onSubmit={onAdd}>
        <select
          aria-label="Client type"
          value={type}
          onChange={(e) => setType(e.target.value as AllowedClient['type'])}
        >
          <option value="domain">Domain</option>
          <option value="ip">IP</option>
        </select>
        <input
          style={{ flex: 1, minWidth: 200 }}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={type === 'domain' ? 'app.example.com' : '203.0.113.10'}
          required
        />
        <button type="submit" className="btn btn-primary">
          Add
        </button>
      </form>

      {ws.allowedClients.length === 0 ? (
        <div className="card empty">
          <p>No allowed clients yet. Add a domain or IP to restrict traffic.</p>
        </div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <table className="table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Value</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {ws.allowedClients.map((c) => (
                <tr key={c.id}>
                  <td>
                    <span className="badge">{c.type}</span>
                  </td>
                  <td className="mono">{c.value}</td>
                  <td>
                    <button
                      type="button"
                      className="btn btn-sm btn-danger"
                      onClick={() => removeAllowedClient(workspaceId, c.id)}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
