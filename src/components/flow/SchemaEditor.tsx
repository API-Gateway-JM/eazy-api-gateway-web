import { uid } from '@/lib/ids'
import type { SchemaField, SchemaFieldType } from '@/types'

const TYPES: SchemaFieldType[] = ['string', 'number', 'boolean', 'object', 'array']

type Props = {
  fields: SchemaField[]
  onChange: (fields: SchemaField[]) => void
}

export function SchemaEditor({ fields, onChange }: Props) {
  return (
    <div className="stack" style={{ gap: '0.45rem' }}>
      {fields.map((field, index) => (
        <SchemaRow
          key={field.id}
          field={field}
          onChange={(next) => onChange(fields.map((item, i) => (i === index ? next : item)))}
          onRemove={() => onChange(fields.filter((_, i) => i !== index))}
        />
      ))}
      <button
        type="button"
        className="btn btn-sm"
        onClick={() => onChange([...fields, { id: uid('fld'), name: '', type: 'string' }])}
      >
        Add property
      </button>
    </div>
  )
}

function SchemaRow({
  field,
  onChange,
  onRemove,
}: {
  field: SchemaField
  onChange: (field: SchemaField) => void
  onRemove: () => void
}) {
  return (
    <div className="schema-row">
      <div className="row">
        <input
          aria-label="Property name"
          value={field.name}
          placeholder="name"
          onChange={(e) => onChange({ ...field, name: e.target.value })}
        />
        <select
          aria-label="Property type"
          value={field.type}
          onChange={(e) => {
            const type = e.target.value as SchemaFieldType
            onChange({
              ...field,
              type,
              itemType: type === 'array' ? field.itemType ?? 'string' : undefined,
              children: type === 'object' || type === 'array' ? field.children ?? [] : undefined,
            })
          }}
        >
          {TYPES.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
        <button type="button" className="btn btn-sm" onClick={onRemove} aria-label="Remove property">
          Remove
        </button>
      </div>
      {field.type === 'array' ? (
        <div className="field" style={{ margin: 0 }}>
          <label>Item type</label>
          <select
            value={field.itemType ?? 'string'}
            onChange={(e) =>
              onChange({
                ...field,
                itemType: e.target.value as NonNullable<SchemaField['itemType']>,
                children: e.target.value === 'object' ? field.children ?? [] : undefined,
              })
            }
          >
            <option value="string">string</option>
            <option value="number">number</option>
            <option value="boolean">boolean</option>
            <option value="object">object</option>
          </select>
        </div>
      ) : null}
      {field.type === 'object' || (field.type === 'array' && field.itemType === 'object') ? (
        <div className="schema-children">
          <SchemaEditor fields={field.children ?? []} onChange={(children) => onChange({ ...field, children })} />
        </div>
      ) : null}
    </div>
  )
}
