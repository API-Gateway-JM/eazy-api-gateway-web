import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  Background,
  ControlButton,
  Controls,
  ReactFlow,
  addEdge,
  useEdgesState,
  useNodesState,
  type Connection,
  type Edge,
  type OnConnect,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { FlowNodePanel } from '@/components/flow/FlowNodePanel'
import { createNodeTypes, type FlowGraphNode } from '@/components/flow/FlowNodes'
import { uid } from '@/lib/ids'
import { conditionWithRule, exportFlowDocument, validateFlowGraph } from '@/lib/flowGraph'
import { emptyMappedObject } from '@/lib/webhooks'
import { useMockStore } from '@/store/MockStore'
import type { FlowEdge, FlowNode } from '@/types'

function toEdges(edges: FlowEdge[]): Edge[] {
  return edges.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    sourceHandle: edge.when,
    label: edge.when === 'true' ? 'TRUE' : edge.when === 'false' ? 'FALSE' : undefined,
  }))
}

function toNodes(nodes: FlowNode[]): FlowGraphNode[] {
  return nodes.map((node) => ({
    id: node.id,
    type: node.type,
    position: node.position,
    data: node,
  }))
}

type EditorSnapshot = {
  nodes: FlowGraphNode[]
  edges: Edge[]
  selectedId: string | null
}

function fromDraft(nodes: FlowGraphNode[], edges: Edge[]): { nodes: FlowNode[]; edges: FlowEdge[] } {
  return {
    nodes: nodes.map((node) => ({ ...node.data, id: node.id, position: node.position })),
    edges: edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      when: edge.sourceHandle === 'true' || edge.sourceHandle === 'false' ? edge.sourceHandle : undefined,
    })),
  }
}

export function FlowEditorPage() {
  const { webhookId = '', flowId = '' } = useParams()
  const {
    state,
    getWebhook,
    getFlow,
    flowsForWebhook,
    saveFlowGraph,
    pushToast,
  } = useMockStore()
  const stored = getFlow(flowId)
  const webhook = getWebhook(webhookId)
  const [name, setName] = useState(stored?.name ?? '')
  const [description, setDescription] = useState(stored?.description ?? '')
  const [nodes, setNodes, onNodesChange] = useNodesState<FlowGraphNode>(stored ? toNodes(stored.nodes) : [])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(stored ? toEdges(stored.edges) : [])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [errors, setErrors] = useState<string[]>([])
  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)
  const past = useRef<EditorSnapshot[]>([])
  const future = useRef<EditorSnapshot[]>([])
  const dragging = useRef(false)
  const applyingHistory = useRef(false)
  const nodesRef = useRef(nodes)
  const edgesRef = useRef(edges)
  const selectedRef = useRef(selectedId)
  nodesRef.current = nodes
  edgesRef.current = edges
  selectedRef.current = selectedId

  function currentSnapshot(): EditorSnapshot {
    return {
      nodes: structuredClone(nodesRef.current),
      edges: structuredClone(edgesRef.current),
      selectedId: selectedRef.current,
    }
  }

  function remember() {
    if (applyingHistory.current) return
    past.current.push(currentSnapshot())
    if (past.current.length > 80) past.current.shift()
    future.current = []
    setCanUndo(true)
    setCanRedo(false)
  }

  function undo() {
    const previous = past.current.pop()
    if (!previous) return
    applyingHistory.current = true
    future.current.push(currentSnapshot())
    setCanUndo(past.current.length > 0)
    setCanRedo(true)
    setNodes(previous.nodes)
    setEdges(previous.edges)
    setSelectedId(previous.selectedId)
  }

  function redo() {
    const next = future.current.pop()
    if (!next) return
    applyingHistory.current = true
    past.current.push(currentSnapshot())
    setCanUndo(true)
    setCanRedo(future.current.length > 0)
    setNodes(next.nodes)
    setEdges(next.edges)
    setSelectedId(next.selectedId)
  }

  useEffect(() => {
    applyingHistory.current = false
  })

  useEffect(() => {
    if (!stored) return
    setName(stored.name)
    setDescription(stored.description ?? '')
    setNodes(toNodes(stored.nodes))
    setEdges(toEdges(stored.edges))
    setSelectedId(null)
    setErrors([])
    past.current = []
    future.current = []
    dragging.current = false
    applyingHistory.current = false
    setCanUndo(false)
    setCanRedo(false)
  }, [stored, setEdges, setNodes])

  const nodeTypes = useMemo(() => createNodeTypes(state.operators), [state.operators])
  const selected = nodes.find((node) => node.id === selectedId) ?? null
  const draft = fromDraft(nodes, edges)
  const draftFlow = stored
    ? { ...stored, name, description, nodes: draft.nodes, edges: draft.edges }
    : null

  const onConnect: OnConnect = (connection: Connection) => {
    const source = nodes.find((node) => node.id === connection.source)
    const when =
      connection.sourceHandle === 'true' || connection.sourceHandle === 'false'
        ? connection.sourceHandle
        : undefined
    if (source?.data.type === 'condition' && !when) return
    if (source?.data.type !== 'condition' && connection.sourceHandle) return
    remember()
    setEdges((current) => {
      const kept = current.filter((edge) => {
        if (edge.source !== connection.source) return true
        if (source?.data.type === 'condition') return edge.sourceHandle !== when
        return false
      })
      return addEdge(
        {
          ...connection,
          id: uid('edge'),
          label: when === 'true' ? 'TRUE' : when === 'false' ? 'FALSE' : undefined,
        },
        kept,
      )
    })
  }

  function updateSelected(next: FlowNode) {
    remember()
    setNodes((current) =>
      current.map((node) => (node.id === next.id ? { ...node, data: { ...next, position: node.position } } : node)),
    )
  }

  function deleteSelected() {
    if (!selected || selected.data.type === 'start') return
    remember()
    setNodes((current) => current.filter((node) => node.id !== selected.id))
    setEdges((current) => current.filter((edge) => edge.source !== selected.id && edge.target !== selected.id))
    setSelectedId(null)
  }

  function addNode(kind: 'operator' | 'http' | 'condition' | 'end-success' | 'end-error') {
    const position = { x: 160 + nodes.length * 28, y: 80 + (nodes.length % 5) * 36 }
    const id = uid('node')
    let data: FlowNode
    if (kind === 'operator') {
      data = { id, type: 'operator', position, operatorId: state.operators[0]?.id ?? '', input: null }
    } else if (kind === 'http') {
      data = {
        id,
        type: 'http',
        position,
        name: 'HTTP Connection',
        connectionId: '',
        accountId: null,
        enabled: true,
        maxRequests: null,
        quotaPeriod: 'day',
        usedRequests: 0,
        requestBody: emptyMappedObject(),
        responseBody: [],
      }
    } else if (kind === 'condition') {
      data = { id, type: 'condition', position, name: 'Condition', when: conditionWithRule() }
    } else {
      data = {
        id,
        type: 'end',
        position,
        role: kind === 'end-success' ? 'success' : 'error',
        status: kind === 'end-success' ? 200 : 422,
        body: emptyMappedObject(),
      }
    }
    remember()
    setNodes((current) => [...current, { id, type: data.type, position, data }])
    setSelectedId(id)
  }

  function onSave() {
    if (!draftFlow) return
    const graphErrors = validateFlowGraph(draftFlow)
    setErrors(graphErrors)
    if (!name.trim()) {
      setErrors(['Name is required.', ...graphErrors])
      return
    }
    if (graphErrors.length > 0) return
    const result = saveFlowGraph(flowId, {
      name,
      description,
      nodes: draftFlow.nodes,
      edges: draftFlow.edges,
    })
    if (result.error) {
      pushToast('warning', result.error)
      return
    }
    pushToast('success', 'Flow saved.')
  }

  function onExport() {
    if (!draftFlow) return
    const file = exportFlowDocument(draftFlow, state.operators)
    const blob = new Blob([JSON.stringify(file, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${name.trim() || 'flow'}.eazy.flow.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  if (!webhook || !stored || !draftFlow) {
    return (
      <div className="card empty">
        <p>Flow not found.</p>
        <Link to={`/webhooks/${webhookId}/flows`}>Back to flows</Link>
      </div>
    )
  }

  return (
    <div className="stack flow-editor">
      <div className="page-header" style={{ marginBottom: 0 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.15rem' }}>HTTP Flow</h2>
          <p className="muted">Nodes show their name and type. Configuration opens on the right.</p>
        </div>
        <div className="row">
          <button type="button" className="btn" onClick={onExport}>
            Export
          </button>
          <button type="button" className="btn btn-primary" onClick={onSave}>
            Save flow
          </button>
        </div>
      </div>

      <div className="card stack">
        <div className="row">
          <div className="field" style={{ flex: 1, margin: 0 }}>
            <label htmlFor="flow-name">Name</label>
            <input id="flow-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="field" style={{ flex: 2, margin: 0 }}>
            <label htmlFor="flow-desc">Description</label>
            <input id="flow-desc" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
        </div>
        <div className="row" style={{ flexWrap: 'wrap' }}>
          <button type="button" className="btn btn-sm" onClick={() => addNode('operator')}>
            Add operator
          </button>
          <button type="button" className="btn btn-sm" onClick={() => addNode('http')}>
            Add HTTP connection
          </button>
          <button type="button" className="btn btn-sm" onClick={() => addNode('condition')}>
            Add condition
          </button>
          <button type="button" className="btn btn-sm" onClick={() => addNode('end-success')}>
            Add success end
          </button>
          <button type="button" className="btn btn-sm" onClick={() => addNode('end-error')}>
            Add error end
          </button>
        </div>
        {errors.length > 0 ? (
          <ul className="field-error" style={{ margin: 0 }}>
            {errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        ) : null}
      </div>

      <div className={`flow-workspace${selected ? ' with-panel' : ''}`}>
        <div className="flow-canvas">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={(changes) => {
              const starts = new Set(
                nodes.filter((node) => node.data.type === 'start').map((node) => node.id),
              )
              const applied = changes.filter((change) => change.type !== 'remove' || !starts.has(change.id))
              const positionChanges = applied.filter((change) => change.type === 'position')
              if (positionChanges.length > 0 && !dragging.current) remember()
              if (positionChanges.length > 0) {
                dragging.current = positionChanges.some((change) => change.dragging)
              }
              if (applied.some((change) => change.type === 'remove')) remember()
              onNodesChange(applied)
            }}
            onEdgesChange={(changes) => {
              if (changes.some((change) => change.type === 'remove')) remember()
              onEdgesChange(changes)
            }}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            onNodeClick={(_, node) => setSelectedId(node.id)}
            onPaneClick={() => setSelectedId(null)}
            fitView
            colorMode={state.theme}
            proOptions={{ hideAttribution: true }}
            deleteKeyCode={['Backspace', 'Delete']}
          >
            <Background />
            <Controls>
              <ControlButton
                className="flow-control-undo"
                onClick={undo}
                disabled={!canUndo}
                title="Undo"
                aria-label="Undo"
              >
                <span className="flow-control-glyph" aria-hidden="true">
                  ↩
                </span>
              </ControlButton>
              <ControlButton
                className="flow-control-redo"
                onClick={redo}
                disabled={!canRedo}
                title="Redo"
                aria-label="Redo"
              >
                <span className="flow-control-glyph" aria-hidden="true">
                  ↪
                </span>
              </ControlButton>
            </Controls>
          </ReactFlow>
        </div>
        {selected ? (
          <FlowNodePanel
            webhook={webhook}
            flow={draftFlow}
            node={selected.data}
            operators={state.operators}
            connections={state.connections}
            accounts={state.accounts}
            flows={flowsForWebhook(webhookId)}
            onChange={updateSelected}
            onDelete={deleteSelected}
          />
        ) : null}
      </div>
    </div>
  )
}
