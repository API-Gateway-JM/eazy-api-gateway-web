import { createEmptyKeyValue } from '@/lib/httpConfig'
import type { HttpKeyValue } from '@/types'

export function KeyValueEditor({
  label,
  rows,
  onChange,
}: {
  label: string
  rows: HttpKeyValue[]
  onChange: (rows: HttpKeyValue[]) => void
}) {
  return (
    <div className="field">
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <label>{label}</label>
        <button
          type="button"
          className="btn btn-sm"
          onClick={() => onChange([...rows, createEmptyKeyValue()])}
        >
          Add
        </button>
      </div>
      {rows.length === 0 ? (
        <span className="field-hint">None configured.</span>
      ) : (
        <div className="stack" style={{ gap: '0.4rem' }}>
          {rows.map((row, idx) => (
            <div key={row.id} className="row">
              <input
                aria-label={`${label} key ${idx + 1}`}
                placeholder="Name"
                value={row.key}
                onChange={(e) => {
                  const next = [...rows]
                  next[idx] = { ...row, key: e.target.value }
                  onChange(next)
                }}
                style={{ flex: 1, minWidth: 0 }}
              />
              <input
                aria-label={`${label} value ${idx + 1}`}
                placeholder="Value"
                value={row.value}
                onChange={(e) => {
                  const next = [...rows]
                  next[idx] = { ...row, value: e.target.value }
                  onChange(next)
                }}
                style={{ flex: 1, minWidth: 0 }}
              />
              <button
                type="button"
                className="btn btn-sm"
                onClick={() => onChange(rows.filter((r) => r.id !== row.id))}
                aria-label={`Remove ${label} row`}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
