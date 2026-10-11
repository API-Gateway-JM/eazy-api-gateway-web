import { useState } from 'react'
import { pathLabel, refLabel, type PickerGroup } from '@/lib/flowGraph'
import type { ValueRef } from '@/types'

type Props = {
  groups: PickerGroup[]
  value: ValueRef | null
  onChange: (value: ValueRef) => void
}

export function FieldPicker({ groups, value, onChange }: Props) {
  const [open, setOpen] = useState(false)
  const [literal, setLiteral] = useState(
    value?.kind === 'literal' && value.value !== null ? String(value.value) : '',
  )
  const chip = refLabel(value, groups)
  const missing =
    value &&
    value.kind !== 'literal' &&
    !groups.some(
      (group) =>
        group.source === (value.kind === 'flow' ? 'flow' : 'node') &&
        group.id === (value.kind === 'flow' ? value.flowId : value.nodeId) &&
        group.fields.some((field) => field.path.join('.') === value.path.join('.')),
    )

  return (
    <div className="field-picker">
      <button type="button" className={`chip${missing ? ' chip-missing' : ''}`} onClick={() => setOpen((v) => !v)}>
        {chip}
      </button>
      {open ? (
        <div className="field-picker-menu stack">
          {groups.length === 0 ? (
            <p className="muted">Connect this node to an earlier step to pick a field.</p>
          ) : (
            groups.map((group) => (
              <div key={`${group.source}:${group.id}`}>
                <div className="field-picker-group">{group.label}</div>
                {group.fields.map((field) => (
                  <button
                    key={field.path.join('.')}
                    type="button"
                    className="field-picker-item"
                    onClick={() => {
                      onChange(
                        group.source === 'flow'
                          ? { kind: 'flow', flowId: group.id, path: field.path }
                          : { kind: 'field', nodeId: group.id, path: field.path },
                      )
                      setOpen(false)
                    }}
                  >
                    <span>{field.label}</span>
                    <span className="muted">{field.valueType}</span>
                  </button>
                ))}
              </div>
            ))
          )}
          <div className="field">
            <label>Literal</label>
            <div className="row">
              <input
                value={literal}
                onChange={(e) => setLiteral(e.target.value)}
                placeholder="en"
              />
              <button
                type="button"
                className="btn btn-sm"
                onClick={() => {
                  onChange({ kind: 'literal', value: coerceLiteral(literal) })
                  setOpen(false)
                }}
              >
                Use
              </button>
            </div>
            <span className="field-hint">true, false, null, and numbers are stored as those types.</span>
          </div>
          {value && value.kind !== 'literal' ? (
            <p className="field-hint" style={{ margin: 0 }}>
              Path {pathLabel(value.path)}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

function coerceLiteral(raw: string): string | number | boolean | null {
  const text = raw.trim()
  if (text === 'true') return true
  if (text === 'false') return false
  if (text === 'null') return null
  if (text !== '' && !Number.isNaN(Number(text))) return Number(text)
  return raw
}
