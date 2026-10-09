import { uid } from '@/lib/ids'
import type { GenericHttpConfig, HttpAuthType, HttpKeyValue, HttpMethod } from '@/types'

export const HTTP_METHODS: HttpMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']

export const HTTP_AUTH_TYPES: { value: HttpAuthType; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'bearer', label: 'Bearer token' },
  { value: 'api_key_header', label: 'API key header' },
  { value: 'basic', label: 'Basic auth' },
]

export function createEmptyKeyValue(): HttpKeyValue {
  return { id: uid('kv'), key: '', value: '' }
}

export function createDefaultHttpConfig(): GenericHttpConfig {
  return {
    url: '',
    method: 'POST',
    authType: 'none',
    apiKeyHeaderName: 'X-Api-Key',
    basicUsername: '',
    authSecret: '',
    headers: [],
    queryParams: [],
  }
}

export function normalizeHttpConfig(http?: GenericHttpConfig | null): GenericHttpConfig {
  const base = createDefaultHttpConfig()
  if (!http) return base
  return {
    url: http.url ?? '',
    method: http.method ?? 'POST',
    authType: http.authType ?? 'none',
    apiKeyHeaderName: http.apiKeyHeaderName ?? 'X-Api-Key',
    basicUsername: http.basicUsername ?? '',
    authSecret: http.authSecret ?? '',
    headers: Array.isArray(http.headers) ? http.headers : [],
    queryParams: Array.isArray(http.queryParams) ? http.queryParams : [],
  }
}
