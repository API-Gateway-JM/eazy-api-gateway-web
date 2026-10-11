import { useState } from 'react'
import { Link } from 'react-router-dom'
import { FieldPicker } from '@/components/flow/FieldPicker'
import { MappedObjectEditor } from '@/components/flow/MappedObjectEditor'
import { SchemaEditor } from '@/components/flow/SchemaEditor'
import { uid } from '@/lib/ids'
import { ancestorGroups, schemaFromSample, successEnds } from '@/lib/flowGraph'
import { QUOTA_PERIODS } from '@/lib/quota'
import { emptyMappedObject } from '@/lib/webhooks'
import type {
  ApiWebhook,
  CompareOp,
  ConditionNode,
  ConnectionAccount,
  EndNode,
  ExternalHttpConnection,
  FlowNode,
  HttpFlow,
  HttpNode,
  OperatorDef,
  OperatorNode,
  StartNode,
} from '@/types'

const COMPARES: { value: CompareOp; label: string }[] = [
  { value: 'eq', label: 'equals' },
  { value: 'neq', label: 'does not equal' },
  { value: 'contains', label: 'contains' },
  { value: 'empty', label: 'is empty' },
  { value: 'gt', label: 'greater than' },
  { value: 'lt', label: 'less than' },
]

type Props = {
  webhook: ApiWebhook
  flow: HttpFlow
  node: FlowNode
  operators: OperatorDef[]
  connections: ExternalHttpConnection[]
  accounts: ConnectionAccount[]
  flows: HttpFlow[]
  onChange: (node: FlowNode) => void
  onDelete: () => void
}

export function FlowNodePanel({
  webhook,
  flow,
  node,
  operators,
  connections,
  accounts,
  flows,
  onChange,
  onDelete,
}: Props) {
  const groups = ancestorGroups(flow, node.id, operators, webhook, flows)
  const otherFlows = flows.filter((item) => item.id !== flow.id)

  return (
    <aside className="flow-panel">
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <h2 style={{ margin: 0, fontSize: '1rem' }}>
          {node.type === 'start' ? 'Start' : node.type === 'end' ? 'End' : node.type === 'http' ? 'HTTP Connection' : node.type === 'operator' ? 'Operator' : 'Condition'}
        </h2>
        {node.type !== 'start' ? (
          <button type="button" className="btn btn-sm btn-danger" onClick={onDelete}>
            Delete
          </button>
        ) : null}
      </div>

      {node.type === 'start' ? (
        <StartForm node={node} flows={otherFlows} onChange={onChange} />
      ) : null}
      {node.type === 'operator' ? (
        <OperatorForm node={node} operators={operators} groups={groups} onChange={onChange} />
      ) : null}
      {node.type === 'http' ? (
        <HttpForm
          node={node}
          connections={connections}
          accounts={accounts}
          groups={groups}
          onChange={onChange}
        />
      ) : null}
      {node.type === 'condition' ? (
        <ConditionForm node={node} groups={groups} onChange={onChange} />
      ) : null}
      {node.type === 'end' ? (
        <EndForm node={node} flow={flow} groups={groups} onChange={onChange} />
      ) : null}
    </aside>
  )
}

function StartForm({
  node,
  flows,
  onChange,
}: {
  node: StartNode
  flows: HttpFlow[]
  onChange: (node: FlowNode) => void
}) {
  return (
    <div className="stack">
      <p className="muted">This is the input of the flow.</p>
      <label className="row">
        <input
          type="radio"
          checked={node.input.from === 'webhook'}
          onChange={() => onChange({ ...node, input: { from: 'webhook' } })}
        />
        This webhook
      </label>
      <label className="row">
        <input
          type="radio"
          checked={node.input.from === 'flow'}
          onChange={() =>
            onChange({
              ...node,
              input: { from: 'flow', flowId: node.input.from === 'flow' ? node.input.flowId : flows[0]?.id ?? '' },
            })
          }
        />
        Another HTTP Flow
      </label>
      {node.input.from === 'flow' ? (
        <div className="field">
          <label htmlFor="start-flow">Flow</label>
          <select
            id="start-flow"
            value={node.input.flowId}
            onChange={(e) => onChange({ ...node, input: { from: 'flow', flowId: e.target.value } })}
          >
            {flows.length === 0 ? <option value="">No other flows</option> : null}
            {flows.map((flow) => (
              <option key={flow.id} value={flow.id}>
                {flow.name}
              </option>
            ))}
          </select>
          <span className="field-hint">Later steps see that flow’s success output.</span>
        </div>
      ) : (
        <p className="field-hint">Later steps see the body, query params, and headers from Input Data.</p>
      )}
    </div>
  )
}

function OperatorForm({
  node,
  operators,
  groups,
  onChange,
}: {
  node: OperatorNode
  operators: OperatorDef[]
  groups: ReturnType<typeof ancestorGroups>
  onChange: (node: FlowNode) => void
}) {
  return (
    <div className="stack">
      <div className="field">
        <label htmlFor="op-select">Library operator</label>
        <select
          id="op-select"
          value={node.operatorId}
          onChange={(e) => onChange({ ...node, operatorId: e.target.value })}
        >
          <option value="">Select…</option>
          {operators.map((op) => (
            <option key={op.id} value={op.id}>
              {op.name} ({op.kind})
            </option>
          ))}
        </select>
        <span className="field-hint">
          Text and regex operators are created on the Operators page. The result is text, or a boolean when the regex mode is test.
        </span>
      </div>
      <div className="field">
        <label>Input</label>
        <FieldPicker groups={groups} value={node.input} onChange={(input) => onChange({ ...node, input })} />
      </div>
    </div>
  )
}

function HttpForm({
  node,
  connections,
  accounts,
  groups,
  onChange,
}: {
  node: HttpNode
  connections: ExternalHttpConnection[]
  accounts: ConnectionAccount[]
  groups: ReturnType<typeof ancestorGroups>
  onChange: (node: FlowNode) => void
}) {
  const [sample, setSample] = useState('')
  const [sampleError, setSampleError] = useState('')
  const connection = connections.find((item) => item.id === node.connectionId)
  const accountChoices = accounts.filter((account) => account.connectionId === node.connectionId)

  function applySample() {
    try {
      const parsed = JSON.parse(sample) as unknown
      const fields = schemaFromSample(parsed)
      if (fields.length === 0) {
        setSampleError('Paste a JSON object to build the response fields.')
        return
      }
      setSampleError('')
      onChange({ ...node, responseBody: fields })
    } catch {
      setSampleError('That sample is not valid JSON.')
    }
  }

  return (
    <div className="stack">
      <div className="field">
        <label htmlFor="http-name">Name on the canvas</label>
        <input id="http-name" value={node.name} onChange={(e) => onChange({ ...node, name: e.target.value })} />
      </div>
      <div className="field">
        <label htmlFor="http-conn">Connection</label>
        <select
          id="http-conn"
          value={node.connectionId}
          onChange={(e) => onChange({ ...node, connectionId: e.target.value, accountId: null })}
        >
          <option value="">Select…</option>
          {connections.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
        {!connection && node.connectionId ? (
          <span className="field-error">This connection is not in the catalog.</span>
        ) : null}
      </div>
      {connection?.requiresApiKey ? (
        <div className="field">
          <label htmlFor="http-account">Account</label>
          {accountChoices.length === 0 ? (
            <p className="field-hint">
              No accounts yet.{' '}
              <Link to={`/connections/${connection.id}/accounts`}>Connect an account</Link>
            </p>
          ) : (
            <select
              id="http-account"
              value={node.accountId ?? ''}
              onChange={(e) => onChange({ ...node, accountId: e.target.value || null })}
            >
              <option value="">Select account…</option>
              {accountChoices.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </select>
          )}
        </div>
      ) : null}
      <label className="row">
        <input
          type="checkbox"
          checked={node.enabled}
          onChange={(e) => onChange({ ...node, enabled: e.target.checked })}
        />
        Enabled
      </label>
      <div className="field">
        <label htmlFor="http-max">Max requests</label>
        <div className="row">
          <input
            id="http-max"
            type="number"
            min={0}
            placeholder="Unlimited"
            value={node.maxRequests ?? ''}
            onChange={(e) =>
              onChange({ ...node, maxRequests: e.target.value === '' ? null : Number(e.target.value) })
            }
          />
          <select
            aria-label="Quota period"
            value={node.quotaPeriod}
            onChange={(e) => onChange({ ...node, quotaPeriod: e.target.value as HttpNode['quotaPeriod'] })}
          >
            {QUOTA_PERIODS.map((period) => (
              <option key={period.value} value={period.value}>
                {period.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="field">
        <label>Request body</label>
        <MappedObjectEditor
          value={node.requestBody}
          groups={groups}
          onChange={(requestBody) => onChange({ ...node, requestBody })}
        />
      </div>
      <div className="field">
        <label>Response body fields</label>
        <p className="field-hint">
          Later nodes can pick <code className="mono">ok</code>, <code className="mono">status</code>, and these body fields.
        </p>
        <SchemaEditor fields={node.responseBody} onChange={(responseBody) => onChange({ ...node, responseBody })} />
      </div>
      <div className="field">
        <label htmlFor="http-sample">Build fields from a sample response</label>
        <textarea id="http-sample" className="mono" rows={4} value={sample} onChange={(e) => setSample(e.target.value)} placeholder='{"data":{"detections":[{"language":"en"}]}}' />
        <button type="button" className="btn btn-sm" onClick={applySample}>
          Use sample
        </button>
        {sampleError ? <span className="field-error">{sampleError}</span> : null}
      </div>
    </div>
  )
}

function ConditionForm({
  node,
  groups,
  onChange,
}: {
  node: ConditionNode
  groups: ReturnType<typeof ancestorGroups>
  onChange: (node: FlowNode) => void
}) {
  return (
    <div className="stack">
      <div className="field">
        <label htmlFor="cond-name">Name</label>
        <input id="cond-name" value={node.name} onChange={(e) => onChange({ ...node, name: e.target.value })} />
      </div>
      <div className="field">
        <label htmlFor="cond-op">Match</label>
        <select
          id="cond-op"
          value={node.when.op}
          onChange={(e) => onChange({ ...node, when: { ...node.when, op: e.target.value as 'and' | 'or' } })}
        >
          <option value="and">All rules (AND)</option>
          <option value="or">Any rule (OR)</option>
        </select>
      </div>
      {node.when.rules.map((rule, index) => (
        <div key={rule.id} className="schema-row stack">
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <strong>Rule {index + 1}</strong>
            <button
              type="button"
              className="btn btn-sm"
              onClick={() =>
                onChange({
                  ...node,
                  when: { ...node.when, rules: node.when.rules.filter((item) => item.id !== rule.id) },
                })
              }
            >
              Remove
            </button>
          </div>
          <FieldPicker
            groups={groups}
            value={rule.left}
            onChange={(left) =>
              onChange({
                ...node,
                when: {
                  ...node.when,
                  rules: node.when.rules.map((item) => (item.id === rule.id ? { ...item, left } : item)),
                },
              })
            }
          />
          <select
            aria-label="Comparison"
            value={rule.cmp}
            onChange={(e) =>
              onChange({
                ...node,
                when: {
                  ...node.when,
                  rules: node.when.rules.map((item) =>
                    item.id === rule.id ? { ...item, cmp: e.target.value as CompareOp } : item,
                  ),
                },
              })
            }
          >
            {COMPARES.map((cmp) => (
              <option key={cmp.value} value={cmp.value}>
                {cmp.label}
              </option>
            ))}
          </select>
          {rule.cmp === 'empty' ? null : (
            <FieldPicker
              groups={groups}
              value={rule.right ?? { kind: 'literal', value: '' }}
              onChange={(right) =>
                onChange({
                  ...node,
                  when: {
                    ...node.when,
                    rules: node.when.rules.map((item) => (item.id === rule.id ? { ...item, right } : item)),
                  },
                })
              }
            />
          )}
        </div>
      ))}
      <button
        type="button"
        className="btn btn-sm"
        onClick={() =>
          onChange({
            ...node,
            when: {
              ...node.when,
              rules: [
                ...node.when.rules,
                {
                  id: uid('rule'),
                  left: { kind: 'literal', value: '' },
                  cmp: 'eq',
                  right: { kind: 'literal', value: '' },
                },
              ],
            },
          })
        }
      >
        Add rule
      </button>
      <p className="field-hint">Draw the true arrow from the upper handle and the false arrow from the lower handle.</p>
    </div>
  )
}

function EndForm({
  node,
  flow,
  groups,
  onChange,
}: {
  node: EndNode
  flow: HttpFlow
  groups: ReturnType<typeof ancestorGroups>
  onChange: (node: FlowNode) => void
}) {
  const others = successEnds(flow).filter((end) => end.id !== node.id)
  const expected = others[0]?.body.kind === 'object' ? others[0].body.fields.map((field) => field.name) : []
  const actual = node.body.kind === 'object' ? node.body.fields.map((field) => field.name) : []
  const mismatch =
    node.role === 'success' &&
    expected.length > 0 &&
    (expected.length !== actual.length || expected.some((name) => !actual.includes(name)))

  return (
    <div className="stack">
      <div className="field">
        <label htmlFor="end-role">Role</label>
        <select
          id="end-role"
          value={node.role}
          onChange={(e) => onChange({ ...node, role: e.target.value as EndNode['role'] })}
        >
          <option value="success">Success — other flows and Output Data can read this</option>
          <option value="error">Error — stops the caller</option>
        </select>
      </div>
      <div className="field">
        <label htmlFor="end-status">HTTP status</label>
        <input
          id="end-status"
          type="number"
          min={100}
          max={599}
          value={node.status}
          onChange={(e) => onChange({ ...node, status: Number(e.target.value) })}
        />
      </div>
      <div className="field">
        <label>Body</label>
        <MappedObjectEditor
          value={node.body.kind === 'object' ? node.body : emptyMappedObject()}
          groups={groups}
          onChange={(body) => onChange({ ...node, body })}
        />
        {mismatch ? (
          <span className="field-error">
            Other success ends publish {expected.join(', ')}. Use the same property names.
          </span>
        ) : null}
      </div>
    </div>
  )
}
