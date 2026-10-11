import { useMemo, useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Modal } from '@/components/Modal'
import {
  OPERATOR_KINDS,
  defaultOperatorConfig,
  summarizeOperatorConfig,
} from '@/lib/operators'
import { useMockStore } from '@/store/MockStore'
import type { OperatorDef, OperatorKind } from '@/types'

type Tab = OperatorKind
type OperatorEditor = { type: 'create' } | { type: 'edit'; operator: OperatorDef } | null

function kindLabel(kind: OperatorKind) {
  return OPERATOR_KINDS.find((k) => k.value === kind)?.label ?? kind
}

export function OperatorsPage() {
  const {
    state,
    createOperator,
    updateOperator,
    deleteOperator,
    findOperatorUsages,
    pushToast,
  } = useMockStore()
  const [searchParams, setSearchParams] = useSearchParams()
  const tabParam = searchParams.get('tab')
  const tab: Tab = tabParam === 'regex' ? 'regex' : 'text'

  const [editor, setEditor] = useState<OperatorEditor>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [kind, setKind] = useState<OperatorKind>('text')
  const [config, setConfig] = useState<OperatorDef['config']>(defaultOperatorConfig('text'))
  const [error, setError] = useState('')
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState('')

  const counts = useMemo(() => {
    const map = { regex: 0, text: 0 } as Record<Tab, number>
    for (const op of state.operators) map[op.kind] += 1
    return map
  }, [state.operators])

  const visibleOperators = useMemo(
    () => state.operators.filter((op) => op.kind === tab),
    [state.operators, tab],
  )

  function setTab(next: Tab) {
    setSearchParams(next === 'text' ? {} : { tab: next })
  }

  function openCreate() {
    setName('')
    setDescription('')
    setKind(tab)
    setConfig(defaultOperatorConfig(tab))
    setError('')
    setEditor({ type: 'create' })
  }

  function openEdit(operator: OperatorDef) {
    setName(operator.name)
    setDescription(operator.description ?? '')
    setKind(operator.kind)
    setConfig(structuredClone(operator.config))
    setError('')
    setEditor({ type: 'edit', operator })
  }

  function closeEditor() {
    setEditor(null)
    setError('')
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    if (editor?.type === 'create') {
      const result = createOperator({ name, kind, description, config })
      if ('error' in result) {
        setError(result.error)
        return
      }
      pushToast('success', `Operator “${result.name}” created.`)
      closeEditor()
      setTab(kind)
      return
    }
    if (editor?.type === 'edit') {
      const result = updateOperator(editor.operator.id, { name, description, kind, config })
      if (result.error) {
        setError(result.error)
        return
      }
      pushToast('success', 'Operator updated.')
      closeEditor()
      setTab(kind)
    }
  }

  function openDelete(id: string) {
    setDeleteConfirmId(id)
    setDeleteError('')
  }

  function onDelete(id: string) {
    const result = deleteOperator(id)
    if (result.error) {
      setDeleteError(
        result.error === 'in_use'
          ? 'This operator is used by a flow. Remove it from those nodes first.'
          : result.error,
      )
      return
    }
    pushToast('success', 'Operator deleted.')
    setDeleteConfirmId(null)
  }

  function usageWebhookId(flowId: string) {
    return state.webhooks.find((w) => w.flowIds.includes(flowId))?.id
  }

  const deleteTarget = state.operators.find((o) => o.id === deleteConfirmId)
  const deleteUsages = deleteConfirmId ? findOperatorUsages(deleteConfirmId) : []

  return (
    <div className="stack">
      <div className="page-header">
        <div>
          <h1>Operators</h1>
          <p>
            Reusable text parsers and regular expressions. A flow chooses which value each operator reads.
          </p>
        </div>
        <button type="button" className="btn btn-primary" onClick={openCreate}>
          New operator
        </button>
      </div>

      <div className="tabs" role="tablist" aria-label="Operator kinds">
        {OPERATOR_KINDS.map((k) => (
          <button
            key={k.value}
            type="button"
            role="tab"
            aria-selected={tab === k.value}
            className={`tab${tab === k.value ? ' active' : ''}`}
            onClick={() => setTab(k.value)}
            title={k.hint}
          >
            {k.label}
            <span className="badge" style={{ marginLeft: 6 }}>
              {counts[k.value]}
            </span>
          </button>
        ))}
      </div>

      {visibleOperators.length === 0 ? (
        <div className="card empty">
          <p>No {kindLabel(tab).toLowerCase()} operators yet.</p>
          <button
            type="button"
            className="btn btn-primary"
            style={{ marginTop: '0.75rem' }}
            onClick={openCreate}
          >
            Create your first
          </button>
        </div>
      ) : (
        <div className="stack">
          {visibleOperators.map((op) => {
            const usages = findOperatorUsages(op.id)
            return (
              <div key={op.id} className="card">
                <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <strong style={{ fontSize: '1.05rem' }}>{op.name}</strong>
                    {op.description ? (
                      <p className="muted" style={{ marginTop: '0.25rem' }}>
                        {op.description}
                      </p>
                    ) : null}
                    <p className="mono muted" style={{ marginTop: '0.4rem', fontSize: '0.85rem' }}>
                      {summarizeOperatorConfig(op)}
                    </p>
                    <p className="field-hint" style={{ marginTop: '0.45rem' }}>
                      {usages.length === 0
                        ? 'Not used by any flow yet.'
                        : `Used by ${usages.length} flow${usages.length === 1 ? '' : 's'}.`}
                    </p>
                  </div>
                  <div className="row">
                    <span className="badge badge-accent">{kindLabel(op.kind)}</span>
                    <button type="button" className="btn btn-sm" onClick={() => openEdit(op)}>
                      Edit
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-danger"
                      onClick={() => openDelete(op.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {editor ? (
        <Modal
          title={editor.type === 'create' ? 'New operator' : 'Edit operator'}
          onClose={closeEditor}
          footer={
            <>
              <button type="button" className="btn" onClick={closeEditor}>
                Cancel
              </button>
              <button type="submit" form="operator-form" className="btn btn-primary">
                {editor.type === 'create' ? 'Create' : 'Save'}
              </button>
            </>
          }
        >
          <form id="operator-form" className="stack" onSubmit={onSubmit}>
            <div className="field">
              <label htmlFor="op-kind">Kind</label>
              <select
                id="op-kind"
                value={kind}
                onChange={(e) => {
                  const next = e.target.value as OperatorKind
                  setKind(next)
                  setConfig(defaultOperatorConfig(next))
                }}
              >
                {OPERATOR_KINDS.map((k) => (
                  <option key={k.value} value={k.value} title={k.hint}>
                    {k.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="op-name">Name</label>
              <input
                id="op-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="HTML to Text"
              />
            </div>
            <div className="field">
              <label htmlFor="op-desc">Description</label>
              <textarea
                id="op-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional"
              />
            </div>

            {kind === 'regex' && 'pattern' in config ? (
              <>
                <div className="field">
                  <label htmlFor="op-pattern">Pattern</label>
                  <input
                    id="op-pattern"
                    className="mono"
                    value={config.pattern}
                    onChange={(e) => setConfig({ ...config, pattern: e.target.value })}
                    placeholder="\s+"
                  />
                </div>
                <div className="row">
                  <div className="field" style={{ flex: 1 }}>
                    <label htmlFor="op-flags">Flags</label>
                    <input
                      id="op-flags"
                      className="mono"
                      value={config.flags}
                      onChange={(e) => setConfig({ ...config, flags: e.target.value })}
                      placeholder="g"
                    />
                  </div>
                  <div className="field" style={{ flex: 1 }}>
                    <label htmlFor="op-mode">Mode</label>
                    <select
                      id="op-mode"
                      value={config.mode}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          mode: e.target.value as 'test' | 'extract' | 'replace',
                        })
                      }
                    >
                      <option value="test">Test</option>
                      <option value="extract">Extract</option>
                      <option value="replace">Replace</option>
                    </select>
                  </div>
                </div>
                {config.mode === 'replace' ? (
                  <div className="field">
                    <label htmlFor="op-repl">Replacement</label>
                    <input
                      id="op-repl"
                      className="mono"
                      value={config.replacement ?? ''}
                      onChange={(e) => setConfig({ ...config, replacement: e.target.value })}
                      placeholder=" "
                    />
                  </div>
                ) : null}
              </>
            ) : null}

            {kind === 'text' && 'operation' in config ? (
              <>
                <div className="field">
                  <label htmlFor="op-operation">Operation</label>
                  <select
                    id="op-operation"
                    value={config.operation}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        operation: e.target.value as
                          | 'html-to-text'
                          | 'uppercase'
                          | 'lowercase'
                          | 'trim'
                          | 'truncate',
                      })
                    }
                  >
                    <option value="html-to-text">HTML to text</option>
                    <option value="uppercase">Uppercase</option>
                    <option value="lowercase">Lowercase</option>
                    <option value="trim">Trim</option>
                    <option value="truncate">Truncate</option>
                  </select>
                </div>
                <span className="field-hint">The flow chooses the text this operator reads.</span>
                {config.operation === 'truncate' ? (
                  <div className="field">
                    <label htmlFor="op-maxlen">Max length</label>
                    <input
                      id="op-maxlen"
                      type="number"
                      min={1}
                      value={config.maxLength ?? ''}
                      onChange={(e) =>
                        setConfig({ ...config, maxLength: Number(e.target.value) })
                      }
                    />
                  </div>
                ) : null}
              </>
            ) : null}

            {error ? <p className="field-error">{error}</p> : null}
          </form>
        </Modal>
      ) : null}

      {deleteTarget ? (
        <Modal
          title="Delete operator?"
          onClose={() => setDeleteConfirmId(null)}
          footer={
            <>
              <button type="button" className="btn" onClick={() => setDeleteConfirmId(null)}>
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger"
                disabled={deleteUsages.length > 0}
                onClick={() => onDelete(deleteTarget.id)}
              >
                Delete
              </button>
            </>
          }
        >
          <p>
            Permanently delete operator <strong>{deleteTarget.name}</strong>? This cannot be
            undone.
          </p>
          {deleteUsages.length > 0 ? (
            <div className="stack" style={{ gap: '0.4rem' }}>
              <p className="field-error" style={{ margin: 0 }}>
                In use — remove these references first:
              </p>
              <ul style={{ margin: 0, paddingLeft: '1.2rem' }}>
                {deleteUsages.map((u) => {
                  const webhookId = usageWebhookId(u.flowId)
                  return (
                    <li key={`${u.flowId}-${u.nodeId}`}>
                      {u.flowName}
                      {webhookId ? (
                        <>
                          {' · '}
                          <Link to={`/webhooks/${webhookId}/flows/${u.flowId}`}>
                            Open flow
                          </Link>
                        </>
                      ) : null}
                    </li>
                  )
                })}
              </ul>
            </div>
          ) : null}
          {deleteError ? <p className="field-error">{deleteError}</p> : null}
        </Modal>
      ) : null}
    </div>
  )
}
