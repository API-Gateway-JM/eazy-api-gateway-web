import { uid } from '@/lib/ids'
import type {
  ApiWebhook,
  ConditionNode,
  EndNode,
  FlowEdge,
  FlowNode,
  HttpFlow,
  HttpNode,
  MappedValue,
  OperatorDef,
  SchemaField,
  StartNode,
  ValueRef,
} from '@/types'
import { FLOW_FORMAT, FLOW_FORMAT_VERSION } from '@/types'

export type FieldChoice = {
  path: string[]
  label: string
  valueType: 'string' | 'number' | 'boolean' | 'object'
}

export type PickerGroup = {
  source: 'node' | 'flow'
  id: string
  label: string
  fields: FieldChoice[]
}

export function emptyStart(position = { x: 80, y: 160 }): StartNode {
  return { id: uid('node'), type: 'start', position, input: { from: 'webhook' } }
}

export function nodeLabel(node: FlowNode, operators: OperatorDef[]): string {
  switch (node.type) {
    case 'start':
      return 'Start'
    case 'operator':
      return operators.find((o) => o.id === node.operatorId)?.name ?? 'Operator'
    case 'http':
      return node.name || 'HTTP Connection'
    case 'condition':
      return node.name || 'Condition'
    case 'end':
      return `HTTP ${node.status}`
  }
}

export function nodeTypeLabel(node: FlowNode): string {
  switch (node.type) {
    case 'start':
      return 'Start'
    case 'operator':
      return 'Operator'
    case 'http':
      return 'HTTP Connection'
    case 'condition':
      return 'Condition'
    case 'end':
      return node.role === 'success' ? 'Success end' : 'Error end'
  }
}

function flattenSchema(fields: SchemaField[], prefix: string[]): FieldChoice[] {
  const out: FieldChoice[] = []
  for (const field of fields) {
    if (!field.name.trim()) continue
    const path = [...prefix, field.name]
    if (field.type === 'object') {
      out.push(...flattenSchema(field.children ?? [], path))
      continue
    }
    if (field.type === 'array') {
      const itemPath = [...path, '0']
      if (field.itemType === 'object') {
        out.push(...flattenSchema(field.children ?? [], itemPath))
      } else {
        out.push({
          path: itemPath,
          label: `${pathLabel(path)}[0]`,
          valueType: field.itemType ?? 'string',
        })
      }
      continue
    }
    out.push({
      path,
      label: pathLabel(path),
      valueType: field.type,
    })
  }
  return out
}

export function pathLabel(path: string[]): string {
  let label = ''
  for (const part of path) {
    if (/^\d+$/.test(part)) label += `[${part}]`
    else label += label ? `.${part}` : part
  }
  return label || '(value)'
}

export function schemaFromSample(value: unknown, idFactory: () => string = () => uid('fld')): SchemaField[] {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return []
  return Object.entries(value as Record<string, unknown>).map(([name, child]) =>
    fieldFromSample(name, child, idFactory),
  )
}

function fieldFromSample(name: string, value: unknown, idFactory: () => string): SchemaField {
  if (Array.isArray(value)) {
    const first = value[0]
    if (first && typeof first === 'object' && !Array.isArray(first)) {
      return {
        id: idFactory(),
        name,
        type: 'array',
        itemType: 'object',
        children: schemaFromSample(first, idFactory),
      }
    }
    const itemType =
      typeof first === 'number' ? 'number' : typeof first === 'boolean' ? 'boolean' : 'string'
    return { id: idFactory(), name, type: 'array', itemType }
  }
  if (value && typeof value === 'object') {
    return {
      id: idFactory(),
      name,
      type: 'object',
      children: schemaFromSample(value, idFactory),
    }
  }
  if (typeof value === 'number') return { id: idFactory(), name, type: 'number' }
  if (typeof value === 'boolean') return { id: idFactory(), name, type: 'boolean' }
  return { id: idFactory(), name, type: 'string' }
}

export function schemaFromMapped(value: MappedValue): SchemaField[] {
  if (value.kind !== 'object') return []
  return value.fields
    .filter((field) => field.name.trim())
    .map((field) => mappedFieldToSchema(field.name, field.value))
}

function mappedFieldToSchema(name: string, value: MappedValue): SchemaField {
  if (value.kind === 'object') {
    return { id: uid('fld'), name, type: 'object', children: schemaFromMapped(value) }
  }
  if (value.kind === 'literal') {
    if (typeof value.value === 'number') return { id: uid('fld'), name, type: 'number' }
    if (typeof value.value === 'boolean') return { id: uid('fld'), name, type: 'boolean' }
  }
  return { id: uid('fld'), name, type: 'string' }
}

export function successEnds(flow: HttpFlow): EndNode[] {
  return flow.nodes.filter((node): node is EndNode => node.type === 'end' && node.role === 'success')
}

export function successSchema(flow: HttpFlow): SchemaField[] {
  const end = successEnds(flow)[0]
  if (!end) return []
  return schemaFromMapped(end.body)
}

export function flowOutputFields(flow: HttpFlow): FieldChoice[] {
  return flattenSchema(successSchema(flow), [])
}

function startFields(node: StartNode, webhook: ApiWebhook | undefined, flows: HttpFlow[]): FieldChoice[] {
  const input = node.input
  if (input.from === 'flow') {
    const source = flows.find((flow) => flow.id === input.flowId)
    return source ? flowOutputFields(source) : []
  }
  if (!webhook || webhook.input.bodyMode !== 'json') {
    return [{ path: ['body'], label: 'body', valueType: 'string' }]
  }
  const body = flattenSchema(webhook.input.bodyFields, ['body'])
  const query = webhook.input.queryParams
    .filter((row) => row.key.trim())
    .map((row) => ({
      path: ['query', row.key],
      label: `query.${row.key}`,
      valueType: 'string' as const,
    }))
  const headers = webhook.input.headers
    .filter((row) => row.key.trim())
    .map((row) => ({
      path: ['headers', row.key],
      label: `headers.${row.key}`,
      valueType: 'string' as const,
    }))
  return [...body, ...query, ...headers]
}

function httpFields(node: HttpNode): FieldChoice[] {
  return [
    { path: ['ok'], label: 'ok', valueType: 'boolean' },
    { path: ['status'], label: 'status', valueType: 'number' },
    ...flattenSchema(node.responseBody, ['body']),
  ]
}

function outputFieldsOf(
  node: FlowNode,
  operators: OperatorDef[],
  webhook: ApiWebhook | undefined,
  flows: HttpFlow[],
): FieldChoice[] {
  switch (node.type) {
    case 'start':
      return startFields(node, webhook, flows)
    case 'operator': {
      const op = operators.find((item) => item.id === node.operatorId)
      if (op?.kind === 'regex' && 'mode' in op.config && op.config.mode === 'test') {
        return [{ path: ['matched'], label: 'matched', valueType: 'boolean' }]
      }
      return [{ path: ['text'], label: 'text', valueType: 'string' }]
    }
    case 'http':
      return httpFields(node)
    default:
      return []
  }
}

export function ancestors(flow: HttpFlow, nodeId: string): FlowNode[] {
  const byId = new Map(flow.nodes.map((node) => [node.id, node]))
  const incoming = new Map<string, string[]>()
  for (const edge of flow.edges) {
    const list = incoming.get(edge.target) ?? []
    list.push(edge.source)
    incoming.set(edge.target, list)
  }
  const seen = new Set<string>()
  const ordered: FlowNode[] = []
  const walk = (id: string) => {
    for (const sourceId of incoming.get(id) ?? []) {
      if (seen.has(sourceId)) continue
      seen.add(sourceId)
      walk(sourceId)
      const node = byId.get(sourceId)
      if (node) ordered.push(node)
    }
  }
  walk(nodeId)
  return ordered
}

export function ancestorGroups(
  flow: HttpFlow,
  nodeId: string,
  operators: OperatorDef[],
  webhook: ApiWebhook | undefined,
  flows: HttpFlow[],
): PickerGroup[] {
  return ancestors(flow, nodeId)
    .map((node) => ({
      source: 'node' as const,
      id: node.id,
      label: nodeLabel(node, operators),
      fields: outputFieldsOf(node, operators, webhook, flows),
    }))
    .filter((group) => group.fields.length > 0)
}

export function validateFlowGraph(flow: Pick<HttpFlow, 'nodes' | 'edges'>): string[] {
  const errors: string[] = []
  const starts = flow.nodes.filter((node) => node.type === 'start')
  if (starts.length !== 1) errors.push('A flow needs exactly one Start node.')
  if (!flow.nodes.some((node) => node.type === 'end')) errors.push('A flow needs at least one end node.')

  const ids = new Set(flow.nodes.map((node) => node.id))
  if (ids.size !== flow.nodes.length) errors.push('Node ids must be unique.')

  const outgoing = new Map<string, FlowEdge[]>()
  for (const edge of flow.edges) {
    if (!ids.has(edge.source) || !ids.has(edge.target)) {
      errors.push('An arrow points at a missing node.')
      continue
    }
    const list = outgoing.get(edge.source) ?? []
    list.push(edge)
    outgoing.set(edge.source, list)
  }

  for (const node of flow.nodes) {
    const edges = outgoing.get(node.id) ?? []
    if (node.type === 'end') {
      if (edges.length > 0) errors.push(`${nodeLabel(node, [])} cannot have an outgoing arrow.`)
      continue
    }
    if (node.type === 'condition') {
      const flags = new Set(edges.map((edge) => edge.when))
      if (!flags.has('true') || !flags.has('false')) {
        errors.push(`“${node.name || 'Condition'}” needs both a true and a false arrow.`)
      }
      if (edges.length > 2) errors.push(`“${node.name || 'Condition'}” has extra arrows.`)
      continue
    }
    if (edges.length !== 1) {
      errors.push(`${nodeLabel(node, [])} needs exactly one outgoing arrow.`)
    }
    if (node.type === 'http' && !node.connectionId) {
      errors.push(`“${node.name || 'HTTP Connection'}” needs a connection.`)
    }
    if (node.type === 'operator' && !node.operatorId) {
      errors.push('An operator node has no operator selected.')
    }
  }

  const visiting = new Set<string>()
  const visited = new Set<string>()
  const byOutgoing = outgoing
  let cyclic = false
  const dfs = (id: string) => {
    if (cyclic) return
    if (visiting.has(id)) {
      cyclic = true
      return
    }
    if (visited.has(id)) return
    visiting.add(id)
    for (const edge of byOutgoing.get(id) ?? []) dfs(edge.target)
    visiting.delete(id)
    visited.add(id)
  }
  for (const node of flow.nodes) dfs(node.id)
  if (cyclic) errors.push('The flow contains a cycle.')
  return errors
}

export function refLabel(
  ref: ValueRef | null | undefined,
  groups: PickerGroup[],
): string {
  if (!ref) return 'Choose a value'
  if (ref.kind === 'literal') return ref.value === null ? 'null' : String(ref.value)
  const group = groups.find((item) => item.source === (ref.kind === 'flow' ? 'flow' : 'node') && item.id === (ref.kind === 'flow' ? ref.flowId : ref.nodeId))
  const field = group?.fields.find((item) => item.path.join('.') === ref.path.join('.'))
  const name = group?.label ?? 'Missing'
  return `${name} → ${field?.label ?? pathLabel(ref.path)}`
}

export type FlowExportOperator = {
  key: string
  name: string
  kind: OperatorDef['kind']
  description?: string
  config: OperatorDef['config']
}

export type FlowExportFile = {
  format: typeof FLOW_FORMAT
  version: typeof FLOW_FORMAT_VERSION
  flow: {
    name: string
    description?: string
    nodes: FlowNode[]
    edges: FlowEdge[]
  }
  operators: FlowExportOperator[]
}

export function exportFlowDocument(flow: HttpFlow, operators: OperatorDef[]): FlowExportFile {
  const used = new Set<string>()
  for (const node of flow.nodes) {
    if (node.type === 'operator' && node.operatorId) used.add(node.operatorId)
  }
  return {
    format: FLOW_FORMAT,
    version: FLOW_FORMAT_VERSION,
    flow: {
      name: flow.name,
      description: flow.description,
      nodes: flow.nodes,
      edges: flow.edges,
    },
    operators: operators
      .filter((op) => used.has(op.id))
      .map((op) => ({
        key: op.id,
        name: op.name,
        kind: op.kind,
        description: op.description,
        config: op.config,
      })),
  }
}

export function isFlowExportFile(value: unknown): value is FlowExportFile {
  if (!value || typeof value !== 'object') return false
  const file = value as FlowExportFile
  return file.format === FLOW_FORMAT && file.version === FLOW_FORMAT_VERSION && Array.isArray(file.flow?.nodes)
}

export function remapImportedFlow(
  file: FlowExportFile,
  existing: OperatorDef[],
): { nodes: FlowNode[]; edges: FlowEdge[]; operators: OperatorDef[] } {
  const idMap = new Map(file.flow.nodes.map((node) => [node.id, uid('node')]))
  const operators = [...existing]
  const opMap = new Map<string, string>()
  for (const embedded of file.operators ?? []) {
    const match = operators.find((op) => op.name === embedded.name && op.kind === embedded.kind)
    if (match) {
      opMap.set(embedded.key, match.id)
      continue
    }
    const id = uid('op')
    opMap.set(embedded.key, id)
    operators.push({
      id,
      name: embedded.name,
      kind: embedded.kind,
      description: embedded.description,
      config: embedded.config,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
  }

  const mapRef = (ref: ValueRef): ValueRef => {
    if (ref.kind === 'field') return { ...ref, nodeId: idMap.get(ref.nodeId) ?? ref.nodeId }
    return ref
  }
  const mapValue = (value: MappedValue): MappedValue => {
    if (value.kind === 'object') {
      return { kind: 'object', fields: value.fields.map((field) => ({ ...field, id: uid('map'), value: mapValue(field.value) })) }
    }
    if (value.kind === 'field' || value.kind === 'literal' || value.kind === 'flow') return mapRef(value)
    return value
  }

  const nodes = file.flow.nodes.map((node) => {
    const id = idMap.get(node.id) ?? node.id
    if (node.type === 'operator') return { ...node, id, operatorId: opMap.get(node.operatorId) ?? node.operatorId, input: node.input ? mapRef(node.input) : null }
    if (node.type === 'http') return { ...node, id, requestBody: mapValue(node.requestBody) }
    if (node.type === 'condition') {
      return {
        ...node,
        id,
        when: {
          ...node.when,
          rules: node.when.rules.map((rule) => ({
            ...rule,
            id: uid('rule'),
            left: mapRef(rule.left),
            right: rule.right ? mapRef(rule.right) : undefined,
          })),
        },
      }
    }
    if (node.type === 'end') return { ...node, id, body: mapValue(node.body) }
    if (node.type === 'start' && node.input.from === 'flow') return { ...node, id }
    return { ...node, id }
  })
  const edges = file.flow.edges.map((edge) => ({
    ...edge,
    id: uid('edge'),
    source: idMap.get(edge.source) ?? edge.source,
    target: idMap.get(edge.target) ?? edge.target,
  }))
  return { nodes, edges, operators }
}

export function conditionWithRule(): ConditionNode['when'] {
  return {
    op: 'and',
    rules: [
      {
        id: uid('rule'),
        left: { kind: 'literal', value: '' },
        cmp: 'eq',
        right: { kind: 'literal', value: '' },
      },
    ],
  }
}
