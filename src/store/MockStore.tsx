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
  slugify,
  uid,
} from '@/lib/ids'
import { normalizeHttpConfig } from '@/lib/httpConfig'
import type {
  ActivityEvent,
  AllowedClient,
  ApiKey,
  ApiRoute,
  ApiWorkspace,
  AppState,
  ExpirationOption,
  ExternalProvider,
  GenericHttpConfig,
  Operator,
  ProviderAccount,
  RouteProviderBinding,
} from '@/types'
import {
  COMMUNITY_MAX_KEYS,
  COMMUNITY_MAX_ROUTES,
  COMMUNITY_MAX_WORKSPACES,
  STORAGE_KEY,
} from '@/types'
import { createSeedState, SEED_PROVIDERS } from '@/store/seed'

type Toast = { id: string; tone: 'info' | 'success' | 'warning' | 'danger'; message: string }

type CreateWorkspaceInput = {
  name: string
  description?: string
  allowedClients: Omit<AllowedClient, 'id'>[]
}

type CreateKeyInput = {
  workspaceId: string
  name: string
  expiration: ExpirationOption
}

type CreateRouteInput = {
  workspaceId: string
  name: string
  path: string
  description?: string
}

type CreateCustomProviderInput = {
  name: string
  description?: string
  http: GenericHttpConfig
}

type UpdateCustomProviderInput = {
  name?: string
  description?: string
  http?: GenericHttpConfig
}

type CreateAccountInput = {
  providerId: string
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
  createWorkspace: (input: CreateWorkspaceInput) => { workspace: ApiWorkspace; primaryKey: ApiKey } | { error: string }
  updateWorkspace: (id: string, patch: Partial<Pick<ApiWorkspace, 'name' | 'description'>>) => void
  deleteWorkspace: (id: string) => void
  addAllowedClient: (workspaceId: string, client: Omit<AllowedClient, 'id'>) => void
  removeAllowedClient: (workspaceId: string, clientId: string) => void
  createApiKey: (input: CreateKeyInput) => ApiKey | { error: string }
  regenerateApiKey: (keyId: string) => ApiKey | { error: string }
  revokeApiKey: (keyId: string) => void
  createRoute: (input: CreateRouteInput) => ApiRoute | { error: string }
  updateRoute: (routeId: string, patch: Partial<Pick<ApiRoute, 'name' | 'path' | 'description'>>) => { error?: string }
  deleteRoute: (workspaceId: string, routeId: string) => void
  createCustomProvider: (input: CreateCustomProviderInput) => ExternalProvider | { error: string }
  updateCustomProvider: (id: string, patch: UpdateCustomProviderInput) => { error?: string }
  deleteCustomProvider: (id: string) => { error?: string }
  createAccount: (input: CreateAccountInput) => ProviderAccount | { error: string }
  updateAccount: (id: string, patch: UpdateAccountInput) => { error?: string }
  deleteAccount: (id: string) => { error?: string }
  accountsForProvider: (providerId: string) => ProviderAccount[]
  addProviderToRoute: (
    routeId: string,
    providerId: string,
    accountId?: string | null,
  ) => { error?: string }
  removeProviderFromRoute: (routeId: string, bindingId: string) => void
  updateBinding: (
    routeId: string,
    bindingId: string,
    patch: Partial<
      Pick<
        RouteProviderBinding,
        'enabled' | 'isDefault' | 'maxRequests' | 'quotaPeriod' | 'accountId'
      >
    >,
  ) => void
  moveBinding: (routeId: string, bindingId: string, direction: 'up' | 'down') => void
  pathConflict: (path: string, excludeRouteId?: string) => boolean
  getWorkspace: (id: string) => ApiWorkspace | undefined
  getRoute: (id: string) => ApiRoute | undefined
  keysForWorkspace: (workspaceId: string) => ApiKey[]
  routesForWorkspace: (workspaceId: string) => ApiRoute[]
  mockRequestsThisMonth: () => number
}

const MockStoreContext = createContext<MockStoreValue | null>(null)

type LegacyBinding = RouteProviderBinding & {
  maxRequestsPerMonth?: number | null
  usedRequestsThisMonth?: number
  http?: GenericHttpConfig
  upstreamApiKey?: string
}

const PLATFORM_IDS = new Set(SEED_PROVIDERS.map((p) => p.id))
const REMOVED_GENERIC_HTTP_ID = 'prov_generic_http'
const PLATFORM_BY_ID = new Map(SEED_PROVIDERS.map((p) => [p.id, p]))

function normalizeBinding(raw: LegacyBinding): RouteProviderBinding | null {
  if (raw.providerId === REMOVED_GENERIC_HTTP_ID) return null

  const maxRequests =
    raw.maxRequests !== undefined
      ? raw.maxRequests
      : raw.maxRequestsPerMonth !== undefined
        ? raw.maxRequestsPerMonth
        : null
  const usedRequests =
    raw.usedRequests !== undefined
      ? raw.usedRequests
      : raw.usedRequestsThisMonth !== undefined
        ? raw.usedRequestsThisMonth
        : 0
  const quotaPeriod = raw.quotaPeriod ?? 'day'

  return {
    id: raw.id,
    providerId: raw.providerId,
    accountId: raw.accountId ?? null,
    priority: raw.priority,
    enabled: raw.enabled,
    isDefault: raw.isDefault,
    maxRequests,
    quotaPeriod,
    usedRequests,
  }
}

function normalizeCustomProvider(
  raw: ExternalProvider & { http?: GenericHttpConfig },
): ExternalProvider | null {
  if (PLATFORM_IDS.has(raw.id) || raw.id === REMOVED_GENERIC_HTTP_ID) return null
  if (raw.origin !== 'custom' && !raw.http) return null
  return {
    id: raw.id,
    name: raw.name?.trim() || 'Custom provider',
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

function normalizeAccount(raw: ProviderAccount): ProviderAccount | null {
  if (!raw?.id || !raw.providerId) return null
  if (!PLATFORM_IDS.has(raw.providerId)) return null
  const name = raw.name?.trim()
  const apiKey = raw.apiKey?.trim()
  if (!name || !apiKey) return null
  return {
    id: raw.id,
    providerId: raw.providerId,
    name,
    apiKey,
    createdAt: raw.createdAt || nowIso(),
    updatedAt: raw.updatedAt || raw.createdAt || nowIso(),
  }
}

function normalizeRoutes(routes: ApiRoute[] | undefined): ApiRoute[] {
  if (!routes?.length) return createSeedState().routes
  return routes.map((route) => ({
    ...route,
    providers: ((route.providers as LegacyBinding[] | undefined) ?? [])
      .map(normalizeBinding)
      .filter((b): b is RouteProviderBinding => Boolean(b)),
  }))
}

function mergeProviders(parsed: AppState | undefined): ExternalProvider[] {
  const platform = structuredClone(SEED_PROVIDERS)
  const customs = (parsed?.providers ?? [])
    .map((p) => normalizeCustomProvider(p))
    .filter((p): p is ExternalProvider => Boolean(p))
  return [...platform, ...customs]
}

/** Lift legacy binding.upstreamApiKey into ProviderAccount rows. */
function migrateAccountsFromBindings(
  existing: ProviderAccount[],
  routes: ApiRoute[],
  legacyBindings: { routeId: string; binding: LegacyBinding }[],
): { accounts: ProviderAccount[]; routes: ApiRoute[] } {
  const accounts = [...existing]
  const accountIdByBindingId = new Map<string, string>()
  const nextIndexByProvider = new Map<string, number>()

  for (const { binding } of legacyBindings) {
    if (binding.accountId || !binding.upstreamApiKey?.trim()) continue
    const provider = PLATFORM_BY_ID.get(binding.providerId)
    if (!provider?.requiresApiKey) continue
    const id = uid('acc')
    const n = (nextIndexByProvider.get(binding.providerId) ?? 0) + 1
    nextIndexByProvider.set(binding.providerId, n)
    accounts.push({
      id,
      providerId: binding.providerId,
      name: n === 1 ? 'Primary' : `Account ${n}`,
      apiKey: binding.upstreamApiKey.trim(),
      createdAt: nowIso(),
      updatedAt: nowIso(),
    })
    accountIdByBindingId.set(binding.id, id)
  }

  const nextRoutes = routes.map((route) => ({
    ...route,
    providers: route.providers.map((b) => {
      const migrated = accountIdByBindingId.get(b.id)
      if (!migrated) return b
      return { ...b, accountId: migrated }
    }),
  }))

  return { accounts, routes: nextRoutes }
}

function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return createSeedState()
    const parsed = JSON.parse(raw) as AppState & {
      routes?: ApiRoute[]
    }
    const seed = createSeedState()
    const providers = mergeProviders(parsed)
    let routes = normalizeRoutes(parsed.routes)
    const existingAccounts = (parsed.accounts ?? [])
      .map(normalizeAccount)
      .filter((a): a is ProviderAccount => Boolean(a))

    const legacyPairs: { routeId: string; binding: LegacyBinding }[] = []
    for (const route of parsed.routes ?? []) {
      for (const b of (route.providers as LegacyBinding[] | undefined) ?? []) {
        legacyPairs.push({ routeId: route.id, binding: b })
      }
    }

    const migrated = migrateAccountsFromBindings(existingAccounts, routes, legacyPairs)
    routes = migrated.routes

    return {
      ...seed,
      ...parsed,
      providers,
      accounts: migrated.accounts,
      routes,
      operator: parsed.operator ?? null,
      sidebarCollapsed: Boolean(parsed.sidebarCollapsed),
    }
  } catch {
    return createSeedState()
  }
}

function reorderBindings(bindings: RouteProviderBinding[]): RouteProviderBinding[] {
  const enabled = bindings
    .filter((b) => b.enabled)
    .sort((a, b) => a.priority - b.priority)
    .map((b, i) => ({ ...b, priority: i + 1 }))
  const disabled = bindings
    .filter((b) => !b.enabled)
    .map((b, i) => ({ ...b, priority: enabled.length + i + 1, isDefault: false }))
  const merged = [...enabled, ...disabled]
  if (enabled.length > 0 && !enabled.some((b) => b.isDefault)) {
    return merged.map((b) =>
      b.id === enabled[0].id ? { ...b, isDefault: true } : { ...b, isDefault: false },
    )
  }
  return merged
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

  const pathConflict = useCallback(
    (path: string, excludeRouteId?: string) =>
      state.routes.some(
        (p) => p.path === path && p.id !== excludeRouteId,
      ),
    [state.routes],
  )

  const createWorkspace = useCallback(
    (input: CreateWorkspaceInput) => {
      if (state.workspaces.length >= COMMUNITY_MAX_WORKSPACES) {
        pushToast(
          'warning',
          'Portable Community limit — upgrade for more workspaces.',
        )
        return { error: 'community_limit' }
      }
      if (!input.name.trim()) return { error: 'Name is required.' }

      const wsId = uid('ws')
      const keyId = uid('key')
      const createdAt = nowIso()
      const primaryKey: ApiKey = {
        id: keyId,
        apiWorkspaceId: wsId,
        name: 'Primary',
        key: mockApiKeySecret(),
        createdAt,
        rotatedAt: null,
        expiresAt: null,
        status: 'active',
      }
      const workspace: ApiWorkspace = {
        id: wsId,
        name: input.name.trim(),
        description: input.description?.trim() || undefined,
        allowedClients: input.allowedClients.map((c) => ({
          ...c,
          id: uid('cli'),
        })),
        apiKeyIds: [keyId],
        routeIds: [],
        createdAt,
        updatedAt: createdAt,
      }

      setState((prev) => ({
        ...prev,
        workspaces: [...prev.workspaces, workspace],
        apiKeys: [...prev.apiKeys, primaryKey],
        activity: [
          {
            id: uid('act'),
            at: createdAt,
            kind: 'workspace',
            message: `Workspace “${workspace.name}” created with Primary API key.`,
          },
          ...prev.activity,
        ],
      }))
      return { workspace, primaryKey }
    },
    [pushToast, state.workspaces.length],
  )

  const updateWorkspace = useCallback(
    (id: string, patch: Partial<Pick<ApiWorkspace, 'name' | 'description'>>) => {
      setState((prev) => ({
        ...prev,
        workspaces: prev.workspaces.map((w) =>
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

  const deleteWorkspace = useCallback((id: string) => {
    setState((prev) => {
      const ws = prev.workspaces.find((w) => w.id === id)
      if (!ws) return prev
      return {
        ...prev,
        workspaces: prev.workspaces.filter((w) => w.id !== id),
        apiKeys: prev.apiKeys.filter((k) => k.apiWorkspaceId !== id),
        routes: prev.routes.filter((p) => !ws.routeIds.includes(p.id)),
        activity: [
          {
            id: uid('act'),
            at: nowIso(),
            kind: 'workspace',
            message: `Workspace “${ws.name}” deleted.`,
          },
          ...prev.activity,
        ],
      }
    })
  }, [])

  const addAllowedClient = useCallback(
    (workspaceId: string, client: Omit<AllowedClient, 'id'>) => {
      const value = client.value.trim()
      if (!value) return
      setState((prev) => ({
        ...prev,
        workspaces: prev.workspaces.map((w) =>
          w.id === workspaceId
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

  const removeAllowedClient = useCallback((workspaceId: string, clientId: string) => {
    setState((prev) => ({
      ...prev,
      workspaces: prev.workspaces.map((w) =>
        w.id === workspaceId
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
        (k) => k.apiWorkspaceId === input.workspaceId && k.status === 'active',
      )
      if (existing.length >= COMMUNITY_MAX_KEYS) {
        pushToast('warning', `Community edition allows at most ${COMMUNITY_MAX_KEYS} API keys per workspace.`)
        return { error: 'max_keys' }
      }
      const key: ApiKey = {
        id: uid('key'),
        apiWorkspaceId: input.workspaceId,
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
        workspaces: prev.workspaces.map((w) =>
          w.id === input.workspaceId
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

  const createRoute = useCallback(
    (input: CreateRouteInput) => {
      const path = input.path.trim()
      if (!input.name.trim()) return { error: 'Name is required.' }
      if (!path.startsWith('/')) return { error: 'Path must start with /.' }
      if (pathConflict(path)) return { error: 'Path must be unique across routes.' }

      const workspace = state.workspaces.find((w) => w.id === input.workspaceId)
      if (!workspace) return { error: 'Workspace not found.' }
      if (workspace.routeIds.length >= COMMUNITY_MAX_ROUTES) {
        pushToast(
          'warning',
          `Community edition allows at most ${COMMUNITY_MAX_ROUTES} API routes per workspace.`,
        )
        return { error: 'max_routes' }
      }

      const route: ApiRoute = {
        id: uid('route'),
        name: input.name.trim(),
        slug: slugify(input.name),
        path,
        description: input.description?.trim() || undefined,
        providers: [],
        createdAt: nowIso(),
        updatedAt: nowIso(),
      }
      setState((prev) => ({
        ...prev,
        routes: [...prev.routes, route],
        workspaces: prev.workspaces.map((w) =>
          w.id === input.workspaceId
            ? { ...w, routeIds: [...w.routeIds, route.id], updatedAt: nowIso() }
            : w,
        ),
        activity: [
          {
            id: uid('act'),
            at: nowIso(),
            kind: 'route_updated',
            message: `Route “${route.name}” created at ${route.path}.`,
          },
          ...prev.activity,
        ],
      }))
      return route
    },
    [pathConflict, pushToast, state.workspaces],
  )

  const updateRoute = useCallback(
    (routeId: string, patch: Partial<Pick<ApiRoute, 'name' | 'path' | 'description'>>) => {
      if (patch.path !== undefined) {
        const path = patch.path.trim()
        if (!path.startsWith('/')) return { error: 'Path must start with /.' }
        if (pathConflict(path, routeId)) return { error: 'Path must be unique across routes.' }
      }
      setState((prev) => ({
        ...prev,
        routes: prev.routes.map((p) =>
          p.id === routeId
            ? {
                ...p,
                name: patch.name?.trim() ?? p.name,
                path: patch.path?.trim() ?? p.path,
                description:
                  patch.description !== undefined
                    ? patch.description.trim() || undefined
                    : p.description,
                slug: patch.name ? slugify(patch.name) : p.slug,
                updatedAt: nowIso(),
              }
            : p,
        ),
      }))
      pushActivity('route_updated', `Route updated.`)
      return {}
    },
    [pathConflict, pushActivity],
  )

  const deleteRoute = useCallback((workspaceId: string, routeId: string) => {
    setState((prev) => ({
      ...prev,
      routes: prev.routes.filter((p) => p.id !== routeId),
      workspaces: prev.workspaces.map((w) =>
        w.id === workspaceId
          ? { ...w, routeIds: w.routeIds.filter((id) => id !== routeId), updatedAt: nowIso() }
          : w,
      ),
    }))
  }, [])

  const mutateRouteBindings = useCallback(
    (routeId: string, mutator: (bindings: RouteProviderBinding[]) => RouteProviderBinding[]) => {
      setState((prev) => ({
        ...prev,
        routes: prev.routes.map((p) => {
          if (p.id !== routeId) return p
          return {
            ...p,
            providers: reorderBindings(mutator(p.providers)),
            updatedAt: nowIso(),
          }
        }),
      }))
    },
    [],
  )

  const createCustomProvider = useCallback(
    (input: CreateCustomProviderInput): ExternalProvider | { error: string } => {
      const name = input.name.trim()
      if (!name) return { error: 'Name is required.' }
      const http = normalizeHttpConfig(input.http)
      if (!http.url.trim()) return { error: 'URL is required.' }

      const provider: ExternalProvider = {
        id: uid('prov'),
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
        providers: [...prev.providers, provider],
      }))
      pushActivity('provider', `Custom provider “${name}” created.`)
      return provider
    },
    [pushActivity],
  )

  const updateCustomProvider = useCallback(
    (id: string, patch: UpdateCustomProviderInput): { error?: string } => {
      let error: string | undefined
      setState((prev) => {
        const existing = prev.providers.find((p) => p.id === id)
        if (!existing) {
          error = 'Provider not found.'
          return prev
        }
        if (existing.origin !== 'custom') {
          error = 'Platform providers cannot be edited.'
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
          providers: prev.providers.map((p) =>
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
      if (!error) pushActivity('provider', 'Custom provider updated.')
      return error ? { error } : {}
    },
    [pushActivity],
  )

  const deleteCustomProvider = useCallback(
    (id: string): { error?: string } => {
      let error: string | undefined
      let removedName = ''
      setState((prev) => {
        const existing = prev.providers.find((p) => p.id === id)
        if (!existing) {
          error = 'Provider not found.'
          return prev
        }
        if (existing.origin !== 'custom') {
          error = 'Platform providers cannot be deleted.'
          return prev
        }
        removedName = existing.name
        return {
          ...prev,
          providers: prev.providers.filter((p) => p.id !== id),
          routes: prev.routes.map((route) => ({
            ...route,
            providers: reorderBindings(
              route.providers.filter((b) => b.providerId !== id),
            ),
            updatedAt: nowIso(),
          })),
        }
      })
      if (!error) pushActivity('provider', `Custom provider “${removedName}” removed.`)
      return error ? { error } : {}
    },
    [pushActivity],
  )

  const createAccount = useCallback(
    (input: CreateAccountInput): ProviderAccount | { error: string } => {
      const provider = state.providers.find((p) => p.id === input.providerId)
      if (!provider) return { error: 'Provider not found.' }
      if (provider.origin !== 'platform') {
        return { error: 'Accounts are only for platform providers.' }
      }
      if (!provider.requiresApiKey) {
        return { error: 'This provider does not use API key accounts.' }
      }
      const name = input.name.trim()
      const apiKey = input.apiKey.trim()
      if (!name) return { error: 'Account name is required.' }
      if (!apiKey) return { error: `${provider.credentialLabel ?? 'API key'} is required.` }

      const account: ProviderAccount = {
        id: uid('acc'),
        providerId: input.providerId,
        name,
        apiKey,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      }
      setState((prev) => ({
        ...prev,
        accounts: [...prev.accounts, account],
      }))
      pushActivity('account', `Connected account “${name}” added for ${provider.name}.`)
      return account
    },
    [pushActivity, state.providers],
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
      const inUse = state.routes.some((r) =>
        r.providers.some((b) => b.accountId === id),
      )
      if (inUse) {
        return { error: 'Account is attached to one or more routes. Remove those bindings first.' }
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
    [pushActivity, state.routes],
  )

  const accountsForProvider = useCallback(
    (providerId: string) => state.accounts.filter((a) => a.providerId === providerId),
    [state.accounts],
  )

  const addProviderToRoute = useCallback(
    (routeId: string, providerId: string, accountId?: string | null): { error?: string } => {
      const provider = state.providers.find((p) => p.id === providerId)
      if (!provider) return { error: 'Provider not found.' }

      if (provider.requiresApiKey) {
        if (!accountId) {
          return { error: 'Select a connected account for this provider.' }
        }
        const account = state.accounts.find(
          (a) => a.id === accountId && a.providerId === providerId,
        )
        if (!account) return { error: 'Account not found for this provider.' }
      }

      mutateRouteBindings(routeId, (bindings) => {
        const enabledCount = bindings.filter((b) => b.enabled).length
        const binding: RouteProviderBinding = {
          id: uid('bind'),
          providerId,
          accountId: provider.requiresApiKey ? accountId : null,
          priority: enabledCount + 1,
          enabled: true,
          isDefault: bindings.filter((b) => b.enabled).length === 0,
          maxRequests: 10000,
          quotaPeriod: 'day',
          usedRequests: 0,
        }
        return [...bindings, binding]
      })
      pushActivity('route_updated', 'Provider added to route.')
      return {}
    },
    [mutateRouteBindings, pushActivity, state.accounts, state.providers],
  )

  const removeProviderFromRoute = useCallback(
    (routeId: string, bindingId: string) => {
      mutateRouteBindings(routeId, (bindings) => bindings.filter((b) => b.id !== bindingId))
    },
    [mutateRouteBindings],
  )

  const updateBinding = useCallback(
    (
      routeId: string,
      bindingId: string,
      patch: Partial<
        Pick<
          RouteProviderBinding,
          'enabled' | 'isDefault' | 'maxRequests' | 'quotaPeriod' | 'accountId'
        >
      >,
    ) => {
      mutateRouteBindings(routeId, (bindings) => {
        let next = bindings.map((b) => {
          if (b.id !== bindingId) return b
          return { ...b, ...patch }
        })

        if (patch.isDefault === true) {
          next = next.map((b) => ({
            ...b,
            isDefault: b.id === bindingId && b.enabled,
          }))
        }

        if (patch.enabled === false) {
          next = next.map((b) => {
            if (b.id !== bindingId) return b
            return { ...b, enabled: false, isDefault: false }
          })
        }

        if (patch.enabled === true) {
          const others = next.filter((b) => b.id !== bindingId)
          const target = next.find((b) => b.id === bindingId)
          if (!target) return bindings
          const enabled = others.filter((b) => b.enabled)
          const disabled = others.filter((b) => !b.enabled)
          const reinserted: RouteProviderBinding = {
            ...target,
            enabled: true,
            priority: enabled.length + 1,
            isDefault: enabled.length === 0 ? true : target.isDefault,
          }
          next = [...enabled, reinserted, ...disabled]
        }

        return next
      })
    },
    [mutateRouteBindings],
  )

  const moveBinding = useCallback(
    (routeId: string, bindingId: string, direction: 'up' | 'down') => {
      mutateRouteBindings(routeId, (bindings) => {
        const enabled = bindings
          .filter((b) => b.enabled)
          .sort((a, b) => a.priority - b.priority)
        const disabled = bindings.filter((b) => !b.enabled)
        const idx = enabled.findIndex((b) => b.id === bindingId)
        if (idx < 0) return bindings
        const swapWith = direction === 'up' ? idx - 1 : idx + 1
        if (swapWith < 0 || swapWith >= enabled.length) return bindings
        const copy = [...enabled]
        ;[copy[idx], copy[swapWith]] = [copy[swapWith], copy[idx]]
        return [...copy, ...disabled]
      })
    },
    [mutateRouteBindings],
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
      createWorkspace,
      updateWorkspace,
      deleteWorkspace,
      addAllowedClient,
      removeAllowedClient,
      createApiKey,
      regenerateApiKey,
      revokeApiKey,
      createRoute,
      updateRoute,
      deleteRoute,
      createCustomProvider,
      updateCustomProvider,
      deleteCustomProvider,
      createAccount,
      updateAccount,
      deleteAccount,
      accountsForProvider,
      addProviderToRoute,
      removeProviderFromRoute,
      updateBinding,
      moveBinding,
      pathConflict,
      getWorkspace: (id) => state.workspaces.find((w) => w.id === id),
      getRoute: (id) => state.routes.find((p) => p.id === id),
      keysForWorkspace: (workspaceId) =>
        state.apiKeys.filter((k) => k.apiWorkspaceId === workspaceId),
      routesForWorkspace: (workspaceId) => {
        const ws = state.workspaces.find((w) => w.id === workspaceId)
        if (!ws) return []
        return ws.routeIds
          .map((id) => state.routes.find((p) => p.id === id))
          .filter((p): p is ApiRoute => Boolean(p))
      },
      mockRequestsThisMonth: () =>
        state.routes.reduce(
          (sum, p) =>
            sum + p.providers.reduce((s, b) => s + (b.usedRequests ?? 0), 0),
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
      createWorkspace,
      updateWorkspace,
      deleteWorkspace,
      addAllowedClient,
      removeAllowedClient,
      createApiKey,
      regenerateApiKey,
      revokeApiKey,
      createRoute,
      updateRoute,
      deleteRoute,
      createCustomProvider,
      updateCustomProvider,
      deleteCustomProvider,
      createAccount,
      updateAccount,
      deleteAccount,
      accountsForProvider,
      addProviderToRoute,
      removeProviderFromRoute,
      updateBinding,
      moveBinding,
      pathConflict,
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
