import { uid } from '@/lib/ids'
import { FieldPicker } from '@/components/flow/FieldPicker'
import type { PickerGroup } from '@/lib/flowGraph'
import { emptyMappedObject } from '@/lib/webhooks'
import type { MappedField, MappedValue } from '@/types'

type Props = {
  value: MappedValue
  groups: PickerGroup[]
  onChange: (value: MappedValue) => void
}

export function MappedObjectEditor({ value, groups, onChange }: Props) {
  const objectValue = value.kind === 'object' ? value : emptyMappedObject()

  function updateField(index: number, patch: Partial<MappedField>) {
    onChange({
      kind: 'object',
      fields: objectValue.fields.map((field, i) => (i === index ? { ...field, ...patch } : field)),
    })
  }

  return (
    <div className="stack" style={{ gap: '0.55rem' }}>
      {objectValue.fields.map((field, index) => (
        <div key={field.id} className="schema-row">
          <div className="row">
            <input
              aria-label="Property name"
              value={field.name}
              placeholder="property"
              onChange={(e) => updateField(index, { name: e.target.value })}
            />
            <button
              type="button"
              className="btn btn-sm"
              onClick={() =>
                onChange({
                  kind: 'object',
                  fields: objectValue.fields.filter((_, i) => i !== index),
                })
              }
            >
              Remove
            </button>
          </div>
          {field.value.kind === 'object' ? (
            <MappedObjectEditor
              value={field.value}
              groups={groups}
              onChange={(next) => updateField(index, { value: next })}
            />
          ) : (
            <div className="row">
              <FieldPicker
                groups={groups}
                value={field.value}
                onChange={(next) => updateField(index, { value: next })}
              />
              <button
                type="button"
                className="btn btn-sm"
                onClick={() => updateField(index, { value: emptyMappedObject() })}
              >
                Nest object
              </button>
            </div>
          )}
        </div>
      ))}
      <button
        type="button"
        className="btn btn-sm"
        onClick={() =>
          onChange({
            kind: 'object',
            fields: [
              ...objectValue.fields,
              { id: uid('map'), name: '', value: { kind: 'literal', value: '' } },
            ],
          })
        }
      >
        Add property
      </button>
    </div>
  )
}
