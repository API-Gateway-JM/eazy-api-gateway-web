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

export type ApiWorkspace = {
  id: string
  name: string
  description?: string
  allowedClients: AllowedClient[]
  apiKeyIds: string[]
  routeIds: string[]
  createdAt: string
  updatedAt: string
}

export type ApiKey = {
  id: string
  apiWorkspaceId: string
  name: string
  key: string
  createdAt: string
  rotatedAt?: string | null
  expiresAt: string | null
  status: 'active' | 'revoked'
}

export type ProviderKind = 'http' | 'translation' | 'llm' | 'custom'

export type ProviderOrigin = 'platform' | 'custom'

export type QuotaPeriod = 'minute' | 'hour' | 'day' | 'month'

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

export type HttpAuthType = 'none' | 'bearer' | 'api_key_header' | 'basic'

export type HttpKeyValue = {
  id: string
  key: string
  value: string
}

/** HTTP recipe for custom providers (user-maintained). */
export type GenericHttpConfig = {
  url: string
  method: HttpMethod
  authType: HttpAuthType
  /** Header name when authType is api_key_header (e.g. X-Api-Key). */
  apiKeyHeaderName?: string
  /** Username when authType is basic. */
  basicUsername?: string
  /** Bearer token, API key value, or basic password depending on authType. */
  authSecret?: string
  headers: HttpKeyValue[]
  queryParams: HttpKeyValue[]
}

export type ExternalProvider = {
  id: string
  name: string
  kind: ProviderKind
  description?: string
  requiresApiKey: boolean
  isSelfHosted: boolean
  credentialLabel?: string
  origin: ProviderOrigin
  /** Present when origin is custom. */
  http?: GenericHttpConfig
  createdAt?: string
  updatedAt?: string
}

/**
 * Named credential for a platform provider (API key auth).
 * Reusable across routes; multiple accounts per provider are allowed.
 */
export type ProviderAccount = {
  id: string
  providerId: string
  name: string
  apiKey: string
  createdAt: string
  updatedAt: string
}

export type RouteProviderBinding = {
  id: string
  providerId: string
  /** Required when the provider requires an API key. */
  accountId?: string | null
  priority: number
  enabled: boolean
  isDefault: boolean
  /** null = unlimited */
  maxRequests: number | null
  quotaPeriod: QuotaPeriod
  usedRequests: number
}

export type ApiRoute = {
  id: string
  name: string
  slug: string
  path: string
  description?: string
  providers: RouteProviderBinding[]
  createdAt: string
  updatedAt: string
}

export type ActivityEvent = {
  id: string
  at: string
  kind:
    | 'key_created'
    | 'key_rotated'
    | 'route_updated'
    | 'fallback'
    | 'workspace'
    | 'client'
    | 'provider'
    | 'account'
  message: string
}

export type AppState = {
  operator: Operator | null
  workspaces: ApiWorkspace[]
  apiKeys: ApiKey[]
  routes: ApiRoute[]
  providers: ExternalProvider[]
  accounts: ProviderAccount[]
  activity: ActivityEvent[]
  mockBaseUrl: string
  theme: 'light' | 'dark'
  sidebarCollapsed: boolean
}

export type ExpirationOption = 'never' | '30' | '90' | '180' | '365'

export const COMMUNITY_MAX_WORKSPACES = 2
export const COMMUNITY_MAX_KEYS = 2
export const COMMUNITY_MAX_ROUTES = 3
export const STORAGE_KEY = 'eazy-api-gateway-demo-v7'
