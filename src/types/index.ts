export type Operator = {
  id: string
  email: string
  displayName: string
  edition: 'community' | 'enterprise'
}

export type AllowedClient = {
  id: string
  type: 'domain' | 'ip'
  value: string
}

export type SchemaFieldType = 'string' | 'number' | 'boolean' | 'object' | 'array'

export type SchemaField = {
  id: string
  name: string
  type: SchemaFieldType
  /** Present when type is array. */
  itemType?: 'string' | 'number' | 'boolean' | 'object'
  children?: SchemaField[]
}

/** A pointer at a node output, or at a flow's published success output. */
export type ValueRef =
  | { kind: 'literal'; value: string | number | boolean | null }
  | { kind: 'field'; nodeId: string; path: string[] }
  | { kind: 'flow'; flowId: string; path: string[] }

export type MappedField = {
  id: string
  name: string
  value: MappedValue
}

export type MappedValue =
  | { kind: 'literal'; value: string | number | boolean | null }
  | { kind: 'field'; nodeId: string; path: string[] }
  | { kind: 'flow'; flowId: string; path: string[] }
  | { kind: 'object'; fields: MappedField[] }

export type WebhookInput = {
  methods: HttpMethod[]
  queryParams: HttpKeyValue[]
  headers: HttpKeyValue[]
  bodyMode: 'passthrough' | 'json'
  bodyFields: SchemaField[]
}

export type WebhookResponse = {
  /** Flow whose success output feeds the public response. */
  sourceFlowId: string | null
  contentType: string
  headers: HttpKeyValue[]
  body: MappedValue
}

export type ApiWebhook = {
  id: string
  name: string
  description?: string
  allowedClients: AllowedClient[]
  apiKeyIds: string[]
  flowIds: string[]
  input: WebhookInput
  response: WebhookResponse
  createdAt: string
  updatedAt: string
}

export type ApiKey = {
  id: string
  apiWebhookId: string
  name: string
  key: string
  createdAt: string
  rotatedAt?: string | null
  expiresAt: string | null
  status: 'active' | 'revoked'
}

export type ConnectionKind = 'http' | 'translation' | 'llm' | 'custom'

export type ConnectionOrigin = 'platform' | 'custom'

export type QuotaPeriod = 'minute' | 'hour' | 'day' | 'month'

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

export type HttpAuthType = 'none' | 'bearer' | 'api_key_header' | 'basic'

export type HttpKeyValue = {
  id: string
  key: string
  value: string
}

/** HTTP recipe for custom connections (user-maintained). */
export type GenericHttpConfig = {
  url: string
  method: HttpMethod
  authType: HttpAuthType
  apiKeyHeaderName?: string
  basicUsername?: string
  authSecret?: string
  headers: HttpKeyValue[]
  queryParams: HttpKeyValue[]
}

export type ExternalHttpConnection = {
  id: string
  name: string
  kind: ConnectionKind
  description?: string
  requiresApiKey: boolean
  isSelfHosted: boolean
  credentialLabel?: string
  origin: ConnectionOrigin
  http?: GenericHttpConfig
  createdAt?: string
  updatedAt?: string
}

export type ConnectionAccount = {
  id: string
  connectionId: string
  name: string
  apiKey: string
  createdAt: string
  updatedAt: string
}

export type OperatorKind = 'regex' | 'text'

export type RegexOperatorConfig = {
  pattern: string
  flags: string
  mode: 'test' | 'extract' | 'replace'
  replacement?: string
}

export type TextOperatorConfig = {
  operation: 'html-to-text' | 'uppercase' | 'lowercase' | 'trim' | 'truncate'
  maxLength?: number
}

export type OperatorDef = {
  id: string
  name: string
  kind: OperatorKind
  description?: string
  config: RegexOperatorConfig | TextOperatorConfig
  createdAt: string
  updatedAt: string
}

export type OperatorUsage = {
  flowId: string
  flowName: string
  nodeId: string
}

export type FlowPosition = { x: number; y: number }

export type StartNode = {
  id: string
  type: 'start'
  position: FlowPosition
  input: { from: 'webhook' } | { from: 'flow'; flowId: string }
}

export type OperatorNode = {
  id: string
  type: 'operator'
  position: FlowPosition
  operatorId: string
  /** Text (or other value) this operator reads. */
  input: ValueRef | null
}

export type HttpNode = {
  id: string
  type: 'http'
  position: FlowPosition
  name: string
  connectionId: string
  accountId?: string | null
  enabled: boolean
  maxRequests: number | null
  quotaPeriod: QuotaPeriod
  usedRequests: number
  requestBody: MappedValue
  responseBody: SchemaField[]
}

export type CompareOp = 'eq' | 'neq' | 'contains' | 'empty' | 'gt' | 'lt'

export type ConditionRule = {
  id: string
  left: ValueRef
  cmp: CompareOp
  right?: ValueRef
}

export type ConditionGroup = {
  op: 'and' | 'or'
  rules: ConditionRule[]
}

export type ConditionNode = {
  id: string
  type: 'condition'
  position: FlowPosition
  name: string
  when: ConditionGroup
}

export type EndNode = {
  id: string
  type: 'end'
  position: FlowPosition
  role: 'success' | 'error'
  status: number
  body: MappedValue
}

export type FlowNode = StartNode | OperatorNode | HttpNode | ConditionNode | EndNode

export type FlowEdge = {
  id: string
  source: string
  target: string
  /** Set when the source is a condition. */
  when?: 'true' | 'false'
}

export type HttpFlow = {
  id: string
  name: string
  description?: string
  nodes: FlowNode[]
  edges: FlowEdge[]
  createdAt: string
  updatedAt: string
}

export type ActivityEvent = {
  id: string
  at: string
  kind:
    | 'key_created'
    | 'key_rotated'
    | 'flow_updated'
    | 'fallback'
    | 'webhook'
    | 'client'
    | 'connection'
    | 'account'
    | 'operator'
  message: string
}

export type AppState = {
  operator: Operator | null
  webhooks: ApiWebhook[]
  apiKeys: ApiKey[]
  flows: HttpFlow[]
  connections: ExternalHttpConnection[]
  accounts: ConnectionAccount[]
  operators: OperatorDef[]
  activity: ActivityEvent[]
  mockBaseUrl: string
  theme: 'light' | 'dark'
  sidebarCollapsed: boolean
}

export type ExpirationOption = 'never' | '30' | '90' | '180' | '365'

export const COMMUNITY_MAX_WEBHOOKS = 2
export const COMMUNITY_MAX_KEYS = 2
export const COMMUNITY_MAX_FLOWS = 3
export const STORAGE_KEY = 'eazy-api-gateway-demo-v11'

export const FLOW_FORMAT = 'eazy.flow'
export const FLOW_FORMAT_VERSION = 1
