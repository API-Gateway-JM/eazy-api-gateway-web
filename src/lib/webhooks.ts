import { nowIso, uid } from '@/lib/ids'
import type { ApiWebhook, MappedValue, WebhookInput, WebhookResponse } from '@/types'

export function emptyMappedObject(): Extract<MappedValue, { kind: 'object' }> {
  return { kind: 'object', fields: [] }
}

export function defaultWebhookInput(): WebhookInput {
  return {
    methods: ['POST'],
    queryParams: [],
    headers: [],
    bodyMode: 'json',
    bodyFields: [
      { id: uid('fld'), name: 'html', type: 'string' },
    ],
  }
}

export function defaultWebhookResponse(): WebhookResponse {
  return {
    sourceFlowId: null,
    contentType: 'application/json',
    headers: [],
    body: emptyMappedObject(),
  }
}

export function normalizeWebhook(raw: Partial<ApiWebhook> & { id: string }): ApiWebhook {
  const input = { ...defaultWebhookInput(), ...raw.input }
  if (!Array.isArray(input.bodyFields)) input.bodyFields = []
  const response = { ...defaultWebhookResponse(), ...raw.response }
  if (!response.body || response.body.kind !== 'object') response.body = emptyMappedObject()
  return {
    id: raw.id,
    name: raw.name?.trim() || 'Untitled webhook',
    description: raw.description,
    allowedClients: Array.isArray(raw.allowedClients) ? raw.allowedClients : [],
    apiKeyIds: Array.isArray(raw.apiKeyIds) ? raw.apiKeyIds : [],
    flowIds: Array.isArray(raw.flowIds) ? raw.flowIds : [],
    input,
    response,
    createdAt: raw.createdAt || nowIso(),
    updatedAt: raw.updatedAt || raw.createdAt || nowIso(),
  }
}
