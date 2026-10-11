import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  expiresAtFromOption,
  mockApiKeySecret,
  nowIso,
  uid,
} from '@/lib/ids'
import { normalizeHttpConfig } from '@/lib/httpConfig'
import { validateOperatorConfig } from '@/lib/operators'
import { emptyStart, isFlowExportFile, remapImportedFlow, type FlowExportFile } from '@/lib/flowGraph'
import { defaultWebhookInput, defaultWebhookResponse, normalizeWebhook } from '@/lib/webhooks'
import type {
  ActivityEvent,
  AllowedClient,
  ApiKey,
  HttpFlow,
  ApiWebhook,
  AppState,
  ExpirationOption,
  ExternalHttpConnection,
  FlowEdge,
  FlowNode,
  GenericHttpConfig,
  Operator,
  OperatorDef,
  OperatorKind,
  OperatorUsage,
  ConnectionAccount,
  WebhookInput,
  WebhookResponse,
} from '@/types'
import {
  COMMUNITY_MAX_KEYS,
  COMMUNITY_MAX_FLOWS,
  COMMUNITY_MAX_WEBHOOKS,
  STORAGE_KEY,
} from '@/types'
import { createSeedState, SEED_CONNECTIONS } from '@/store/seed'

type Toast = { id: string; tone: 'info' | 'success' | 'warning' | 'danger'; message: string }

type CreateWebhookInput = {
  name: string
  description?: string
  allowedClients: Omit<AllowedClient, 'id'>[]
}

type CreateKeyInput = {
  webhookId: string
  name: string
  expiration: ExpirationOption
}

type CreateFlowInput = {
  webhookId: string
  name: string
  description?: string
}

type SaveFlowInput = {
  name: string
  description?: string
  nodes: FlowNode[]
  edges: FlowEdge[]
}

type CreateCustomConnectionInput = {
  name: string
  description?: string
  http: GenericHttpConfig
}

type UpdateCustomConnectionInput = {
  name?: string
  description?: string
  http?: GenericHttpConfig
}

type CreateAccountInput = {
  connectionId: string
  name: string
  apiKey: string
}

type UpdateAccountInput = {
  name?: string
  apiKey?: string
}

type MockStoreValue = {
  state: AppState
  toasts: Toast[]
  dismissToast: (id: string) => void
  pushToast: (tone: Toast['tone'], message: string) => void
  login: (email?: string) => void
  logout: () => void
  resetDemoData: () => void
  setTheme: (theme: 'light' | 'dark') => void
  setSidebarCollapsed: (collapsed: boolean) => void
  setMockBaseUrl: (url: string) => void
  createWebhook: (input: CreateWebhookInput) => { webhook: ApiWebhook; primaryKey: ApiKey } | { error: string }
  updateWebhook: (id: string, patch: Partial<Pick<ApiWebhook, 'name' | 'description'>>) => void
  updateWebhookInput: (id: string, input: WebhookInput) => void
  updateWebhookResponse: (id: string, response: WebhookResponse) => void
  deleteWebhook: (id: string) => void
  addAllowedClient: (webhookId: string, client: Omit<AllowedClient, 'id'>) => void
  removeAllowedClient: (webhookId: string, clientId: string) => void
  createApiKey: (input: CreateKeyInput) => ApiKey | { error: string }
  regenerateApiKey: (keyId: string) => ApiKey | { error: string }
  revokeApiKey: (keyId: string) => void
  createFlow: (input: CreateFlowInput) => HttpFlow | { error: string }
  saveFlowGraph: (flowId: string, input: SaveFlowInput) => { error?: string }
  importFlow: (webhookId: string, file: FlowExportFile) => HttpFlow | { error: string }
  deleteFlow: (webhookId: string, flowId: string) => void
  createCustomConnection: (input: CreateCustomConnectionInput) => ExternalHttpConnection | { error: string }
  updateCustomConnection: (id: string, patch: UpdateCustomConnectionInput) => { error?: string }
  deleteCustomConnection: (id: string) => { error?: string }
  createOperator: (input: {
    name: string
    kind: OperatorKind
    description?: string
    config: OperatorDef['config']
  }) => OperatorDef | { error: string }
  updateOperator: (
    id: string,
    patch: { name?: string; description?: string; kind?: OperatorKind; config?: OperatorDef['config'] },
  ) => { error?: string }
  deleteOperator: (id: string) => { error?: string }
  findOperatorUsages: (operatorId: string) => OperatorUsage[]
  createAccount: (input: CreateAccountInput) => ConnectionAccount | { error: string }
  updateAccount: (id: string, patch: UpdateAccountInput) => { error?: string }
  deleteAccount: (id: string) => { error?: string }
  accountsForConnection: (connectionId: string) => ConnectionAccount[]
  getWebhook: (id: string) => ApiWebhook | undefined
  getFlow: (id: string) => HttpFlow | undefined
  keysForWebhook: (webhookId: string) => ApiKey[]
  flowsForWebhook: (webhookId: string) => HttpFlow[]
  mockRequestsThisMonth: () => number
}

const MockStoreContext = createContext<MockStoreValue | null>(null)

const PLATFORM_IDS = new Set(SEED_CONNECTIONS.map((p) => p.id))
const REMOVED_GENERIC_HTTP_ID = 'prov_generic_http'

function normalizeCustomConnection(
  raw: ExternalHttpConnection & { http?: GenericHttpConfig },
): ExternalHttpConnection | null {
  if (PLATFORM_IDS.has(raw.id) || raw.id === REMOVED_GENERIC_HTTP_ID) return null
  if (raw.origin !== 'custom' && !raw.http) return null
  return {
    id: raw.id,
    name: raw.name?.trim() || 'Custom connection',
    kind: 'http',
    description: raw.description,
    requiresApiKey: false,
    isSelfHosted: true,
    origin: 'custom',
    http: normalizeHttpConfig(raw.http),
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  }
}

function normalizeAccount(raw: ConnectionAccount): ConnectionAccount | null {
  if (!raw?.id || !raw.connectionId) return null
  if (!PLATFORM_IDS.has(raw.connectionId)) return null
  const name = raw.name?.trim()
  const apiKey = raw.apiKey?.trim()
  if (!name || !apiKey) return null
  return {
    id: raw.id,
    connectionId: raw.connectionId,
    name,
    apiKey,
    createdAt: raw.createdAt || nowIso(),
    updatedAt: raw.updatedAt || raw.createdAt || nowIso(),
  }
}

function normalizeFlows(flows: HttpFlow[] | undefined): HttpFlow[] {
  if (!flows?.length || flows.some((flow) => !Array.isArray(flow.nodes) || !Array.isArray(flow.edges))) {
    return createSeedState().flows
  }
  return flows
}

function normalizeOperators(operators: OperatorDef[] | undefined): OperatorDef[] {
  const seed = createSeedState().operators
  if (!operators?.length) return seed
  const kept = operators.filter((op) => op.kind === 'regex' || op.kind === 'text')
  return kept.length > 0 ? kept : seed
}

function mergeConnections(parsed: AppState | undefined): ExternalHttpConnection[] {
  const platform = structuredClone(SEED_CONNECTIONS)
  const customs = (parsed?.connections ?? [])
    .map((p) => normalizeCustomConnection(p))
    .filter((p): p is ExternalHttpConnection => Boolean(p))
  return [...platform, ...customs]
}

function collectOperatorUsages(flows: HttpFlow[], operatorId: string): OperatorUsage[] {
  const usages: OperatorUsage[] = []
  for (const flow of flows) {
    for (const node of flow.nodes) {
      if (node.type === 'operator' && node.operatorId === operatorId) {
        usages.push({ flowId: flow.id, flowName: flow.name, nodeId: node.id })
      }
    }
  }
  return usages
}

function normalizeWebhooks(webhooks: ApiWebhook[] | undefined): ApiWebhook[] {
  if (!webhooks?.length) return createSeedState().webhooks
  return webhooks.map((w) => normalizeWebhook(w))
}

function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return createSeedState()
    const parsed = JSON.parse(raw) as AppState
    const seed = createSeedState()
    const accounts = (parsed.accounts ?? [])
      .map(normalizeAccount)
      .filter((a): a is ConnectionAccount => Boolean(a))
    return {
      ...seed,
      ...parsed,
      connections: mergeConnections(parsed),
      accounts,
      flows: normalizeFlows(parsed.flows),
      webhooks: normalizeWebhooks(parsed.webhooks),
      operators: normalizeOperators(parsed.operators),
      operator: parsed.operator ?? null,
      sidebarCollapsed: Boolean(parsed.sidebarCollapsed),
    }
  } catch {
    return createSeedState()
  }
}

export function MockStoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(() => loadState())
  const [toasts, setToasts] = useState<Toast[]>([])

  useEffect(() => {
    const { operator: _op, ...persistable } = state
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...persistable, operator: state.operator }),
    )
  }, [state])

  useEffect(() => {
    document.documentElement.dataset.theme = state.theme
  }, [state.theme])

  const pushToast = useCallback((tone: Toast['tone'], message: string) => {
    const id = uid('toast')
    setToasts((prev) => [...prev, { id, tone, message }])
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 4200)
  }, [])

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const pushActivity = useCallback((kind: ActivityEvent['kind'], message: string) => {
    setState((prev) => ({
      ...prev,
      activity: [
        { id: uid('act'), at: nowIso(), kind, message },
        ...prev.activity,
      ].slice(0, 40),
    }))
  }, [])

  const login = useCallback(
    (email = 'admin@local') => {
      const operator: Operator = {
        id: 'op_local',
        email,
        displayName: 'Local Admin',
        edition: 'community',
      }
      setState((prev) => ({ ...prev, operator }))
      pushToast('success', 'Signed in as local administrator.')
    },
    [pushToast],
  )

  const logout = useCallback(() => {
    setState((prev) => ({ ...prev, operator: null }))
  }, [])

  const resetDemoData = useCallback(() => {
    const seed = createSeedState()
    setState((prev) => ({
      ...seed,
      operator: prev.operator,
      theme: prev.theme,
      sidebarCollapsed: prev.sidebarCollapsed,
    }))
    pushToast('info', 'Demo data reset to seed values.')
  }, [pushToast])

  const setTheme = useCallback((theme: 'light' | 'dark') => {
    setState((prev) => ({ ...prev, theme }))
  }, [])

  const setSidebarCollapsed = useCallback((collapsed: boolean) => {
    setState((prev) => ({ ...prev, sidebarCollapsed: collapsed }))
  }, [])

  const setMockBaseUrl = useCallback((url: string) => {
    setState((prev) => ({ ...prev, mockBaseUrl: url }))
  }, [])

  const createWebhook = useCallback(
    (input: CreateWebhookInput) => {
      if (state.webhooks.length >= COMMUNITY_MAX_WEBHOOKS) {
        pushToast(
          'warning',
          'Portable Community limit — upgrade for more webhooks.',
        )
        return { error: 'community_limit' }
      }
      if (!input.name.trim()) return { error: 'Name is required.' }

      const whId = uid('wh')
      const keyId = uid('key')
      const createdAt = nowIso()
      const primaryKey: ApiKey = {
        id: keyId,
        apiWebhookId: whId,
        name: 'Primary',
        key: mockApiKeySecret(),
        createdAt,
        rotatedAt: null,
        expiresAt: null,
        status: 'active',
      }
      const webhook: ApiWebhook = {
        id: whId,
        name: input.name.trim(),
        description: input.description?.trim() || undefined,
        allowedClients: input.allowedClients.map((c) => ({
          ...c,
          id: uid('cli'),
        })),
        apiKeyIds: [keyId],
        flowIds: [],
        input: defaultWebhookInput(),
        response: defaultWebhookResponse(),
        createdAt,
        updatedAt: createdAt,
      }

      setState((prev) => ({
        ...prev,
        webhooks: [...prev.webhooks, webhook],
        apiKeys: [...prev.apiKeys, primaryKey],
        activity: [
          {
            id: uid('act'),
            at: createdAt,
            kind: 'webhook',
            message: `Webhook “${webhook.name}” created with Primary API key.`,
          },
          ...prev.activity,
        ],
      }))
      return { webhook, primaryKey }
    },
    [pushToast, state.webhooks.length],
  )

  const updateWebhook = useCallback(
    (id: string, patch: Partial<Pick<ApiWebhook, 'name' | 'description'>>) => {
      setState((prev) => ({
        ...prev,
        webhooks: prev.webhooks.map((w) =>
          w.id === id
            ? {
                ...w,
                ...patch,
                name: patch.name?.trim() || w.name,
                description:
                  patch.description !== undefined
                    ? patch.description.trim() || undefined
                    : w.description,
                updatedAt: nowIso(),
              }
            : w,
        ),
      }))
    },
    [],
  )

  const updateWebhookInput = useCallback((id: string, input: WebhookInput) => {
    setState((prev) => ({
      ...prev,
      webhooks: prev.webhooks.map((w) =>
        w.id === id ? { ...w, input, updatedAt: nowIso() } : w,
      ),
    }))
  }, [])

  const updateWebhookResponse = useCallback((id: string, response: WebhookResponse) => {
    setState((prev) => ({
      ...prev,
      webhooks: prev.webhooks.map((w) =>
        w.id === id ? { ...w, response, updatedAt: nowIso() } : w,
      ),
    }))
  }, [])

  const deleteWebhook = useCallback((id: string) => {
    setState((prev) => {
      const wh = prev.webhooks.find((w) => w.id === id)
      if (!wh) return prev
      return {
        ...prev,
        webhooks: prev.webhooks.filter((w) => w.id !== id),
        apiKeys: prev.apiKeys.filter((k) => k.apiWebhookId !== id),
        flows: prev.flows.filter((p) => !wh.flowIds.includes(p.id)),
        activity: [
          {
            id: uid('act'),
            at: nowIso(),
            kind: 'webhook',
            message: `Webhook “${wh.name}” deleted.`,
          },
          ...prev.activity,
        ],
      }
    })
  }, [])

  const addAllowedClient = useCallback(
    (webhookId: string, client: Omit<AllowedClient, 'id'>) => {
      const value = client.value.trim()
      if (!value) return
      setState((prev) => ({
        ...prev,
        webhooks: prev.webhooks.map((w) =>
          w.id === webhookId
            ? {
                ...w,
                allowedClients: [
                  ...w.allowedClients,
                  { id: uid('cli'), type: client.type, value },
                ],
                updatedAt: nowIso(),
              }
            : w,
        ),
        activity: [
          {
            id: uid('act'),
            at: nowIso(),
            kind: 'client',
            message: `Allowed client ${value} added.`,
          },
          ...prev.activity,
        ],
      }))
    },
    [],
  )

  const removeAllowedClient = useCallback((webhookId: string, clientId: string) => {
    setState((prev) => ({
      ...prev,
      webhooks: prev.webhooks.map((w) =>
        w.id === webhookId
          ? {
              ...w,
              allowedClients: w.allowedClients.filter((c) => c.id !== clientId),
              updatedAt: nowIso(),
            }
          : w,
      ),
    }))
  }, [])

  const createApiKey = useCallback(
    (input: CreateKeyInput) => {
      const existing = state.apiKeys.filter(
        (k) => k.apiWebhookId === input.webhookId && k.status === 'active',
      )
      if (existing.length >= COMMUNITY_MAX_KEYS) {
        pushToast('warning', `Community edition allows at most ${COMMUNITY_MAX_KEYS} API keys per webhook.`)
        return { error: 'max_keys' }
      }
      const key: ApiKey = {
        id: uid('key'),
        apiWebhookId: input.webhookId,
        name: input.name.trim() || 'Secondary',
        key: mockApiKeySecret(),
        createdAt: nowIso(),
        rotatedAt: null,
        expiresAt: expiresAtFromOption(input.expiration),
        status: 'active',
      }
      setState((prev) => ({
        ...prev,
        apiKeys: [...prev.apiKeys, key],
        webhooks: prev.webhooks.map((w) =>
          w.id === input.webhookId
            ? { ...w, apiKeyIds: [...w.apiKeyIds, key.id], updatedAt: nowIso() }
            : w,
        ),
        activity: [
          {
            id: uid('act'),
            at: nowIso(),
            kind: 'key_created',
            message: `API key “${key.name}” created.`,
          },
          ...prev.activity,
        ],
      }))
      return key
    },
    [pushToast, state.apiKeys],
  )

  const regenerateApiKey = useCallback(
    (keyId: string) => {
      const current = state.apiKeys.find((k) => k.id === keyId)
      if (!current) return { error: 'not_found' }
      const updated: ApiKey = {
        ...current,
        key: mockApiKeySecret(),
        rotatedAt: nowIso(),
        status: 'active',
      }
      setState((prev) => ({
        ...prev,
        apiKeys: prev.apiKeys.map((k) => (k.id === keyId ? updated : k)),
        activity: [
          {
            id: uid('act'),
            at: nowIso(),
            kind: 'key_rotated',
            message: `API key “${updated.name}” regenerated.`,
          },
          ...prev.activity,
        ],
      }))
      return updated
    },
    [state.apiKeys],
  )

  const revokeApiKey = useCallback((keyId: string) => {
    setState((prev) => ({
      ...prev,
      apiKeys: prev.apiKeys.map((k) =>
        k.id === keyId ? { ...k, status: 'revoked' as const } : k,
      ),
    }))
    pushToast('info', 'API key revoked.')
  }, [pushToast])

  const createFlow = useCallback(
    (input: CreateFlowInput) => {
      if (!input.name.trim()) return { error: 'Name is required.' }
      const webhook = state.webhooks.find((w) => w.id === input.webhookId)
      if (!webhook) return { error: 'Webhook not found.' }
      if (webhook.flowIds.length >= COMMUNITY_MAX_FLOWS) {
        pushToast(
          'warning',
          `Community edition allows at most ${COMMUNITY_MAX_FLOWS} flows per webhook.`,
        )
        return { error: 'max_flows' }
      }

      const flow: HttpFlow = {
        id: uid('flow'),
        name: input.name.trim(),
        description: input.description?.trim() || undefined,
        nodes: [emptyStart()],
        edges: [],
        createdAt: nowIso(),
        updatedAt: nowIso(),
      }
      setState((prev) => ({
        ...prev,
        flows: [...prev.flows, flow],
        webhooks: prev.webhooks.map((w) =>
          w.id === input.webhookId
            ? { ...w, flowIds: [...w.flowIds, flow.id], updatedAt: nowIso() }
            : w,
        ),
        activity: [
          {
            id: uid('act'),
            at: nowIso(),
            kind: 'flow_updated',
            message: `Flow “${flow.name}” created.`,
          },
          ...prev.activity,
        ],
      }))
      return flow
    },
    [pushToast, state.webhooks],
  )

  const saveFlowGraph = useCallback(
    (flowId: string, input: SaveFlowInput): { error?: string } => {
      if (!input.name.trim()) return { error: 'Name is required.' }
      let missing = false
      setState((prev) => {
        if (!prev.flows.some((flow) => flow.id === flowId)) {
          missing = true
          return prev
        }
        return {
          ...prev,
          flows: prev.flows.map((flow) =>
            flow.id === flowId
              ? {
                  ...flow,
                  name: input.name.trim(),
                  description: input.description?.trim() || undefined,
                  nodes: input.nodes,
                  edges: input.edges,
                  updatedAt: nowIso(),
                }
              : flow,
          ),
        }
      })
      if (missing) return { error: 'Flow not found.' }
      pushActivity('flow_updated', `Flow “${input.name.trim()}” saved.`)
      return {}
    },
    [pushActivity],
  )

  const importFlow = useCallback(
    (webhookId: string, file: FlowExportFile): HttpFlow | { error: string } => {
      if (!isFlowExportFile(file)) return { error: 'This file is not an eazy.flow v1 document.' }
      const webhook = state.webhooks.find((item) => item.id === webhookId)
      if (!webhook) return { error: 'Webhook not found.' }
      if (webhook.flowIds.length >= COMMUNITY_MAX_FLOWS) {
        return { error: `Community edition allows at most ${COMMUNITY_MAX_FLOWS} flows per webhook.` }
      }
      const name = file.flow.name?.trim()
      if (!name) return { error: 'The file has no flow name.' }
      const remapped = remapImportedFlow(file, state.operators)
      const flow: HttpFlow = {
        id: uid('flow'),
        name,
        description: file.flow.description,
        nodes: remapped.nodes,
        edges: remapped.edges,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      }
      setState((prev) => ({
        ...prev,
        operators: remapped.operators,
        flows: [...prev.flows, flow],
        webhooks: prev.webhooks.map((item) =>
          item.id === webhookId
            ? { ...item, flowIds: [...item.flowIds, flow.id], updatedAt: nowIso() }
            : item,
        ),
      }))
      pushActivity('flow_updated', `Flow “${name}” imported.`)
      return flow
    },
    [pushActivity, state.operators, state.webhooks],
  )

  const deleteFlow = useCallback((webhookId: string, flowId: string) => {
    setState((prev) => ({
      ...prev,
      flows: prev.flows.filter((p) => p.id !== flowId),
      webhooks: prev.webhooks.map((w) =>
        w.id === webhookId
          ? { ...w, flowIds: w.flowIds.filter((id) => id !== flowId), updatedAt: nowIso() }
          : w,
      ),
    }))
  }, [])

  const createCustomConnection = useCallback(
    (input: CreateCustomConnectionInput): ExternalHttpConnection | { error: string } => {
      const name = input.name.trim()
      if (!name) return { error: 'Name is required.' }
      const http = normalizeHttpConfig(input.http)
      if (!http.url.trim()) return { error: 'URL is required.' }

      const connection: ExternalHttpConnection = {
        id: uid('conn'),
        name,
        kind: 'http',
        description: input.description?.trim() || undefined,
        requiresApiKey: false,
        isSelfHosted: true,
        origin: 'custom',
        http,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      }

      setState((prev) => ({
        ...prev,
        connections: [...prev.connections, connection],
      }))
      pushActivity('connection', `Custom connection “${name}” created.`)
      return connection
    },
    [pushActivity],
  )

  const updateCustomConnection = useCallback(
    (id: string, patch: UpdateCustomConnectionInput): { error?: string } => {
      let error: string | undefined
      setState((prev) => {
        const existing = prev.connections.find((p) => p.id === id)
        if (!existing) {
          error = 'Connection not found.'
          return prev
        }
        if (existing.origin !== 'custom') {
          error = 'Platform connections cannot be edited.'
          return prev
        }
        const name = patch.name !== undefined ? patch.name.trim() : existing.name
        if (!name) {
          error = 'Name is required.'
          return prev
        }
        const http = normalizeHttpConfig(patch.http ?? existing.http)
        if (!http.url.trim()) {
          error = 'URL is required.'
          return prev
        }
        return {
          ...prev,
          connections: prev.connections.map((p) =>
            p.id === id
              ? {
                  ...p,
                  name,
                  description:
                    patch.description !== undefined
                      ? patch.description.trim() || undefined
                      : p.description,
                  http,
                  updatedAt: nowIso(),
                }
              : p,
          ),
        }
      })
      if (!error) pushActivity('connection', 'Custom connection updated.')
      return error ? { error } : {}
    },
    [pushActivity],
  )

  const deleteCustomConnection = useCallback(
    (id: string): { error?: string } => {
      let error: string | undefined
      let removedName = ''
      setState((prev) => {
        const existing = prev.connections.find((p) => p.id === id)
        if (!existing) {
          error = 'Connection not found.'
          return prev
        }
        if (existing.origin !== 'custom') {
          error = 'Platform connections cannot be deleted.'
          return prev
        }
        removedName = existing.name
        return {
          ...prev,
          connections: prev.connections.filter((p) => p.id !== id),
        }
      })
      if (!error) pushActivity('connection', `Custom connection “${removedName}” removed.`)
      return error ? { error } : {}
    },
    [pushActivity],
  )

  const createOperator = useCallback(
    (
      input: {
        name: string
        kind: OperatorKind
        description?: string
        config: OperatorDef['config']
      },
    ): OperatorDef | { error: string } => {
      const name = input.name.trim()
      if (!name) return { error: 'Name is required.' }
      const configError = validateOperatorConfig(input.kind, input.config)
      if (configError) return { error: configError }
      const now = nowIso()
      const operator: OperatorDef = {
        id: uid('op'),
        name,
        kind: input.kind,
        description: input.description?.trim() || undefined,
        config: input.config,
        createdAt: now,
        updatedAt: now,
      }
      setState((prev) => ({ ...prev, operators: [...prev.operators, operator] }))
      pushActivity('operator', `Operator “${name}” created.`)
      return operator
    },
    [pushActivity],
  )

  const updateOperator = useCallback(
    (
      id: string,
      patch: {
        name?: string
        description?: string
        kind?: OperatorKind
        config?: OperatorDef['config']
      },
    ): { error?: string } => {
      let error: string | undefined
      setState((prev) => {
        const existing = prev.operators.find((o) => o.id === id)
        if (!existing) {
          error = 'Operator not found.'
          return prev
        }
        const kind = patch.kind ?? existing.kind
        const config = patch.config ?? existing.config
        if (patch.name !== undefined && !patch.name.trim()) {
          error = 'Name is required.'
          return prev
        }
        const configError = validateOperatorConfig(kind, config)
        if (configError) {
          error = configError
          return prev
        }
        return {
          ...prev,
          operators: prev.operators.map((o) =>
            o.id === id
              ? {
                  ...o,
                  name: patch.name?.trim() ?? o.name,
                  description:
                    patch.description !== undefined
                      ? patch.description.trim() || undefined
                      : o.description,
                  kind,
                  config,
                  updatedAt: nowIso(),
                }
              : o,
          ),
        }
      })
      if (!error) pushActivity('operator', 'Operator updated.')
      return error ? { error } : {}
    },
    [pushActivity],
  )

  const deleteOperator = useCallback(
    (id: string): { error?: string } => {
      let error: string | undefined
      let removedName = ''
      setState((prev) => {
        const existing = prev.operators.find((o) => o.id === id)
        if (!existing) {
          error = 'Operator not found.'
          return prev
        }
        if (collectOperatorUsages(prev.flows, id).length > 0) {
          error = 'in_use'
          return prev
        }
        removedName = existing.name
        return { ...prev, operators: prev.operators.filter((o) => o.id !== id) }
      })
      if (!error) pushActivity('operator', `Operator “${removedName}” deleted.`)
      return error ? { error } : {}
    },
    [pushActivity],
  )

  const findOperatorUsages = useCallback(
    (operatorId: string): OperatorUsage[] => collectOperatorUsages(state.flows, operatorId),
    [state.flows],
  )

  const createAccount = useCallback(    (input: CreateAccountInput): ConnectionAccount | { error: string } => {
      const connection = state.connections.find((p) => p.id === input.connectionId)
      if (!connection) return { error: 'Connection not found.' }
      if (connection.origin !== 'platform') {
        return { error: 'Accounts are only for platform connections.' }
      }
      if (!connection.requiresApiKey) {
        return { error: 'This connection does not use API key accounts.' }
      }
      const name = input.name.trim()
      const apiKey = input.apiKey.trim()
      if (!name) return { error: 'Account name is required.' }
      if (!apiKey) return { error: `${connection.credentialLabel ?? 'API key'} is required.` }

      const account: ConnectionAccount = {
        id: uid('acc'),
        connectionId: input.connectionId,
        name,
        apiKey,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      }
      setState((prev) => ({
        ...prev,
        accounts: [...prev.accounts, account],
      }))
      pushActivity('account', `Connected account “${name}” added for ${connection.name}.`)
      return account
    },
    [pushActivity, state.connections],
  )

  const updateAccount = useCallback(
    (id: string, patch: UpdateAccountInput): { error?: string } => {
      let error: string | undefined
      setState((prev) => {
        const existing = prev.accounts.find((a) => a.id === id)
        if (!existing) {
          error = 'Account not found.'
          return prev
        }
        const name = patch.name !== undefined ? patch.name.trim() : existing.name
        const apiKey = patch.apiKey !== undefined ? patch.apiKey.trim() : existing.apiKey
        if (!name) {
          error = 'Account name is required.'
          return prev
        }
        if (!apiKey) {
          error = 'API key is required.'
          return prev
        }
        return {
          ...prev,
          accounts: prev.accounts.map((a) =>
            a.id === id ? { ...a, name, apiKey, updatedAt: nowIso() } : a,
          ),
        }
      })
      if (!error) pushActivity('account', 'Connected account updated.')
      return error ? { error } : {}
    },
    [pushActivity],
  )

  const deleteAccount = useCallback(
    (id: string): { error?: string } => {
      const inUse = state.flows.some((flow) =>
        flow.nodes.some((node) => node.type === 'http' && node.accountId === id),
      )
      if (inUse) {
        return { error: 'Account is attached to one or more flows. Remove it from those HTTP nodes first.' }
      }
      let removedName = ''
      setState((prev) => {
        const existing = prev.accounts.find((a) => a.id === id)
        if (!existing) return prev
        removedName = existing.name
        return {
          ...prev,
          accounts: prev.accounts.filter((a) => a.id !== id),
        }
      })
      if (removedName) pushActivity('account', `Connected account “${removedName}” removed.`)
      return {}
    },
    [pushActivity, state.flows],
  )

  const accountsForConnection = useCallback(
    (connectionId: string) => state.accounts.filter((a) => a.connectionId === connectionId),
    [state.accounts],
  )

  const value = useMemo<MockStoreValue>(
    () => ({
      state,
      toasts,
      dismissToast,
      pushToast,
      login,
      logout,
      resetDemoData,
      setTheme,
      setSidebarCollapsed,
      setMockBaseUrl,
      createWebhook,
      updateWebhook,
      updateWebhookInput,
      updateWebhookResponse,
      deleteWebhook,
      addAllowedClient,
      removeAllowedClient,
      createApiKey,
      regenerateApiKey,
      revokeApiKey,
      createFlow,
      saveFlowGraph,
      importFlow,
      deleteFlow,
      createCustomConnection,
      updateCustomConnection,
      deleteCustomConnection,
      createOperator,
      updateOperator,
      deleteOperator,
      findOperatorUsages,
      createAccount,
      updateAccount,
      deleteAccount,
      accountsForConnection,
      getWebhook: (id) => state.webhooks.find((w) => w.id === id),
      getFlow: (id) => state.flows.find((p) => p.id === id),
      keysForWebhook: (webhookId) =>
        state.apiKeys.filter((k) => k.apiWebhookId === webhookId),
      flowsForWebhook: (webhookId) => {
        const wh = state.webhooks.find((w) => w.id === webhookId)
        if (!wh) return []
        return wh.flowIds
          .map((id) => state.flows.find((p) => p.id === id))
          .filter((p): p is HttpFlow => Boolean(p))
      },
      mockRequestsThisMonth: () =>
        state.flows.reduce(
          (sum, flow) =>
            sum +
            flow.nodes.reduce(
              (inner, node) => inner + (node.type === 'http' ? node.usedRequests : 0),
              0,
            ),
          0,
        ),
    }),
    [
      state,
      toasts,
      dismissToast,
      pushToast,
      login,
      logout,
      resetDemoData,
      setTheme,
      setSidebarCollapsed,
      setMockBaseUrl,
      createWebhook,
      updateWebhook,
      updateWebhookInput,
      updateWebhookResponse,
      deleteWebhook,
      addAllowedClient,
      removeAllowedClient,
      createApiKey,
      regenerateApiKey,
      revokeApiKey,
      createFlow,
      saveFlowGraph,
      importFlow,
      deleteFlow,
      createCustomConnection,
      updateCustomConnection,
      deleteCustomConnection,
      createOperator,
      updateOperator,
      deleteOperator,
      findOperatorUsages,
      createAccount,
      updateAccount,
      deleteAccount,
      accountsForConnection,
    ],
  )

  return (
    <MockStoreContext.Provider value={value}>{children}</MockStoreContext.Provider>
  )
}

export function useMockStore(): MockStoreValue {
  const ctx = useContext(MockStoreContext)
  if (!ctx) throw new Error('useMockStore must be used within MockStoreProvider')
  return ctx
}
