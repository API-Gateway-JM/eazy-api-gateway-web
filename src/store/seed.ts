import type {
  ActivityEvent,
  ApiKey,
  ApiRoute,
  ApiWorkspace,
  AppState,
  ExternalProvider,
  ProviderAccount,
} from '@/types'

const NOW = new Date()
const daysAgo = (n: number) => {
  const d = new Date(NOW)
  d.setDate(d.getDate() - n)
  return d.toISOString()
}

export const SEED_PROVIDERS: ExternalProvider[] = [
  {
    id: 'prov_deepl',
    name: 'DeepL',
    kind: 'translation',
    description: 'High-quality neural machine translation.',
    requiresApiKey: true,
    isSelfHosted: false,
    credentialLabel: 'API Key',
    origin: 'platform',
  },
  {
    id: 'prov_google',
    name: 'Google Translate',
    kind: 'translation',
    description: 'Google Cloud Translation API connector.',
    requiresApiKey: true,
    isSelfHosted: false,
    credentialLabel: 'API Key',
    origin: 'platform',
  },
  {
    id: 'prov_azure',
    name: 'Azure Translator',
    kind: 'translation',
    description: 'Microsoft Azure Cognitive Services Translator.',
    requiresApiKey: true,
    isSelfHosted: false,
    credentialLabel: 'Subscription Key',
    origin: 'platform',
  },
  {
    id: 'prov_langbly',
    name: 'Langbly',
    kind: 'translation',
    description: 'Langbly translation connector.',
    requiresApiKey: true,
    isSelfHosted: false,
    credentialLabel: 'API Key',
    origin: 'platform',
  },
  {
    id: 'prov_bergamot',
    name: 'Bergamot',
    kind: 'translation',
    description: 'Self-hosted neural MT (Mozilla Bergamot).',
    requiresApiKey: false,
    isSelfHosted: true,
    origin: 'platform',
  },
  {
    id: 'prov_fasttext',
    name: 'fastText',
    kind: 'custom',
    description: 'Self-hosted language identification (fastText).',
    requiresApiKey: false,
    isSelfHosted: true,
    origin: 'platform',
  },
]

const WS_ID = 'ws_demo_app'
const KEY_PRIMARY = 'key_primary_demo'
const KEY_SECONDARY = 'key_secondary_demo'
const ROUTE_DETECT = 'route_detect_lang'
const ROUTE_TRANSLATE = 'route_translate'
const ROUTE_HTML = 'route_translate_html'

const ACC_DEEPL_A = 'acc_deepl_a'
const ACC_DEEPL_B = 'acc_deepl_b'
const ACC_GOOGLE_PRIMARY = 'acc_google_primary'
const ACC_GOOGLE_HTML = 'acc_google_html'
const ACC_AZURE_PRIMARY = 'acc_azure_primary'
const ACC_AZURE_HTML = 'acc_azure_html'
const ACC_LANGBLY = 'acc_langbly'

export const SEED_ACCOUNTS: ProviderAccount[] = [
  {
    id: ACC_DEEPL_A,
    providerId: 'prov_deepl',
    name: 'Personal free tier',
    apiKey: 'deepl-mock-key-a',
    createdAt: daysAgo(12),
    updatedAt: daysAgo(2),
  },
  {
    id: ACC_DEEPL_B,
    providerId: 'prov_deepl',
    name: 'Work free tier',
    apiKey: 'deepl-mock-key-b',
    createdAt: daysAgo(10),
    updatedAt: daysAgo(1),
  },
  {
    id: ACC_GOOGLE_PRIMARY,
    providerId: 'prov_google',
    name: 'Detect pipeline',
    apiKey: 'google-mock-key-detect',
    createdAt: daysAgo(12),
    updatedAt: daysAgo(4),
  },
  {
    id: ACC_GOOGLE_HTML,
    providerId: 'prov_google',
    name: 'HTML pipeline',
    apiKey: 'google-html-key',
    createdAt: daysAgo(10),
    updatedAt: daysAgo(3),
  },
  {
    id: ACC_AZURE_PRIMARY,
    providerId: 'prov_azure',
    name: 'Primary subscription',
    apiKey: 'azure-mock-key',
    createdAt: daysAgo(11),
    updatedAt: daysAgo(5),
  },
  {
    id: ACC_AZURE_HTML,
    providerId: 'prov_azure',
    name: 'HTML subscription',
    apiKey: 'azure-html-key',
    createdAt: daysAgo(10),
    updatedAt: daysAgo(3),
  },
  {
    id: ACC_LANGBLY,
    providerId: 'prov_langbly',
    name: 'Default',
    apiKey: 'langbly-mock-key',
    createdAt: daysAgo(12),
    updatedAt: daysAgo(1),
  },
]

export const SEED_WORKSPACE: ApiWorkspace = {
  id: WS_ID,
  name: 'Demo App',
  description: 'Sample workspace for the Portable Community demo.',
  allowedClients: [
    { id: 'cli_1', type: 'domain', value: 'app.example.com' },
    { id: 'cli_2', type: 'ip', value: '203.0.113.10' },
  ],
  apiKeyIds: [KEY_PRIMARY, KEY_SECONDARY],
  routeIds: [ROUTE_DETECT, ROUTE_TRANSLATE, ROUTE_HTML],
  createdAt: daysAgo(14),
  updatedAt: daysAgo(1),
}

export const SEED_KEYS: ApiKey[] = [
  {
    id: KEY_PRIMARY,
    apiWorkspaceId: WS_ID,
    name: 'Primary',
    key: 'eam_demoPrimaryKey9xK2mQ7vLp4nR8sT1uW3yZ5aB6cD',
    createdAt: daysAgo(14),
    rotatedAt: null,
    expiresAt: null,
    status: 'active',
  },
  {
    id: KEY_SECONDARY,
    apiWorkspaceId: WS_ID,
    name: 'Secondary',
    key: 'eam_demoSecondaryKey4hJ8nP2qR6tV0wX3yZ7aC9dE1fG',
    createdAt: daysAgo(7),
    rotatedAt: null,
    expiresAt: daysAgo(-90),
    status: 'active',
  },
]

export const SEED_ROUTES: ApiRoute[] = [
  {
    id: ROUTE_DETECT,
    name: 'Detect Language',
    slug: 'detect-language',
    path: '/detect-lang',
    description: 'Identify the language of incoming text.',
    createdAt: daysAgo(12),
    updatedAt: daysAgo(2),
    providers: [
      {
        id: 'bind_dl_ft',
        providerId: 'prov_fasttext',
        priority: 1,
        enabled: true,
        isDefault: true,
        maxRequests: 5000,
        quotaPeriod: 'day',
        usedRequests: 1248,
      },
      {
        id: 'bind_dl_google',
        providerId: 'prov_google',
        accountId: ACC_GOOGLE_PRIMARY,
        priority: 2,
        enabled: true,
        isDefault: false,
        maxRequests: 600,
        quotaPeriod: 'hour',
        usedRequests: 552,
      },
      {
        id: 'bind_dl_azure',
        providerId: 'prov_azure',
        accountId: ACC_AZURE_PRIMARY,
        priority: 3,
        enabled: false,
        isDefault: false,
        maxRequests: null,
        quotaPeriod: 'day',
        usedRequests: 0,
      },
    ],
  },
  {
    id: ROUTE_TRANSLATE,
    name: 'Translate Text',
    slug: 'translate-text',
    path: '/translate',
    description: 'Plain-text translation via ordered providers (two DeepL free accounts).',
    createdAt: daysAgo(12),
    updatedAt: daysAgo(1),
    providers: [
      {
        id: 'bind_tr_deepl_a',
        providerId: 'prov_deepl',
        accountId: ACC_DEEPL_A,
        priority: 1,
        enabled: true,
        isDefault: true,
        maxRequests: 25000,
        quotaPeriod: 'month',
        usedRequests: 25000,
      },
      {
        id: 'bind_tr_deepl_b',
        providerId: 'prov_deepl',
        accountId: ACC_DEEPL_B,
        priority: 2,
        enabled: true,
        isDefault: false,
        maxRequests: 25000,
        quotaPeriod: 'month',
        usedRequests: 4200,
      },
      {
        id: 'bind_tr_bergamot',
        providerId: 'prov_bergamot',
        priority: 3,
        enabled: true,
        isDefault: false,
        maxRequests: null,
        quotaPeriod: 'day',
        usedRequests: 410,
      },
      {
        id: 'bind_tr_langbly',
        providerId: 'prov_langbly',
        accountId: ACC_LANGBLY,
        priority: 4,
        enabled: true,
        isDefault: false,
        maxRequests: 120,
        quotaPeriod: 'minute',
        usedRequests: 120,
      },
    ],
  },
  {
    id: ROUTE_HTML,
    name: 'Translate HTML',
    slug: 'translate-html',
    path: '/translate-html',
    description: 'HTML-aware translation with markup preservation.',
    createdAt: daysAgo(10),
    updatedAt: daysAgo(3),
    providers: [
      {
        id: 'bind_html_azure',
        providerId: 'prov_azure',
        accountId: ACC_AZURE_HTML,
        priority: 1,
        enabled: true,
        isDefault: false,
        maxRequests: 1500,
        quotaPeriod: 'day',
        usedRequests: 640,
      },
      {
        id: 'bind_html_deepl',
        providerId: 'prov_deepl',
        accountId: ACC_DEEPL_A,
        priority: 2,
        enabled: true,
        isDefault: true,
        maxRequests: 2000,
        quotaPeriod: 'hour',
        usedRequests: 1120,
      },
      {
        id: 'bind_html_google',
        providerId: 'prov_google',
        accountId: ACC_GOOGLE_HTML,
        priority: 3,
        enabled: true,
        isDefault: false,
        maxRequests: 8000,
        quotaPeriod: 'month',
        usedRequests: 2100,
      },
    ],
  },
]

export const SEED_ACTIVITY: ActivityEvent[] = [
  {
    id: 'act_1',
    at: daysAgo(0),
    kind: 'fallback',
    message:
      'Translate Text: Personal free tier skipped (quota exceeded) → Work free tier would receive traffic.',
  },
  {
    id: 'act_2',
    at: daysAgo(1),
    kind: 'account',
    message: 'Connected account “Work free tier” added for DeepL.',
  },
  {
    id: 'act_3',
    at: daysAgo(2),
    kind: 'key_created',
    message: 'Secondary API key created for Demo App.',
  },
  {
    id: 'act_4',
    at: daysAgo(3),
    kind: 'client',
    message: 'Allowed client 203.0.113.10 added to Demo App.',
  },
  {
    id: 'act_5',
    at: daysAgo(5),
    kind: 'workspace',
    message: 'Workspace “Demo App” seeded for Portable Community demo.',
  },
]

export function createSeedState(): AppState {
  return {
    operator: null,
    workspaces: [structuredClone(SEED_WORKSPACE)],
    apiKeys: structuredClone(SEED_KEYS),
    routes: structuredClone(SEED_ROUTES),
    providers: structuredClone(SEED_PROVIDERS),
    accounts: structuredClone(SEED_ACCOUNTS),
    activity: structuredClone(SEED_ACTIVITY),
    mockBaseUrl: 'http://localhost:8080',
    theme: 'dark',
    sidebarCollapsed: false,
  }
}
