import type {
  ActivityEvent,
  ApiKey,
  ApiWebhook,
  AppState,
  ConditionGroup,
  ConnectionAccount,
  EndNode,
  ExternalHttpConnection,
  FlowEdge,
  FlowNode,
  HttpFlow,
  HttpNode,
  MappedValue,
  OperatorDef,
  SchemaField,
} from '@/types'

const NOW = new Date()
const daysAgo = (n: number) => {
  const d = new Date(NOW)
  d.setDate(d.getDate() - n)
  return d.toISOString()
}

export const SEED_CONNECTIONS: ExternalHttpConnection[] = [
  {
    id: 'conn_deepl',
    name: 'DeepL',
    kind: 'translation',
    description: 'High-quality neural machine translation.',
    requiresApiKey: true,
    isSelfHosted: false,
    credentialLabel: 'API Key',
    origin: 'platform',
  },
  {
    id: 'conn_google',
    name: 'Google Translate',
    kind: 'translation',
    description: 'Google Cloud Translation API connector.',
    requiresApiKey: true,
    isSelfHosted: false,
    credentialLabel: 'API Key',
    origin: 'platform',
  },
  {
    id: 'conn_azure',
    name: 'Azure Translator',
    kind: 'translation',
    description: 'Microsoft Azure Cognitive Services Translator.',
    requiresApiKey: true,
    isSelfHosted: false,
    credentialLabel: 'Subscription Key',
    origin: 'platform',
  },
  {
    id: 'conn_langbly',
    name: 'Langbly',
    kind: 'translation',
    description: 'Langbly translation connector.',
    requiresApiKey: true,
    isSelfHosted: false,
    credentialLabel: 'API Key',
    origin: 'platform',
  },
  {
    id: 'conn_bergamot',
    name: 'Bergamot',
    kind: 'translation',
    description: 'Self-hosted neural MT (Mozilla Bergamot).',
    requiresApiKey: false,
    isSelfHosted: true,
    origin: 'platform',
  },
  {
    id: 'conn_fasttext',
    name: 'fastText',
    kind: 'custom',
    description: 'Self-hosted language identification (fastText).',
    requiresApiKey: false,
    isSelfHosted: true,
    origin: 'platform',
  },
]

const WH_ID = 'wh_demo_app'
const KEY_PRIMARY = 'key_primary_demo'
const KEY_SECONDARY = 'key_secondary_demo'
const FLOW_DETECT = 'flow_detect_lang'
const FLOW_TRANSLATE = 'flow_translate'
const FLOW_HTML = 'flow_translate_html'

const ACC_DEEPL_A = 'acc_deepl_a'
const ACC_DEEPL_B = 'acc_deepl_b'
const ACC_GOOGLE_PRIMARY = 'acc_google_primary'
const ACC_GOOGLE_HTML = 'acc_google_html'
const ACC_AZURE_PRIMARY = 'acc_azure_primary'
const ACC_AZURE_HTML = 'acc_azure_html'
const ACC_LANGBLY = 'acc_langbly'

const OP_HTML = 'op_html_to_text'
const OP_EXCERPT = 'op_two_sentence'

export const SEED_ACCOUNTS: ConnectionAccount[] = [
  {
    id: ACC_DEEPL_A,
    connectionId: 'conn_deepl',
    name: 'Personal free tier',
    apiKey: 'deepl-mock-key-a',
    createdAt: daysAgo(12),
    updatedAt: daysAgo(2),
  },
  {
    id: ACC_DEEPL_B,
    connectionId: 'conn_deepl',
    name: 'Work free tier',
    apiKey: 'deepl-mock-key-b',
    createdAt: daysAgo(10),
    updatedAt: daysAgo(1),
  },
  {
    id: ACC_GOOGLE_PRIMARY,
    connectionId: 'conn_google',
    name: 'Detect pipeline',
    apiKey: 'google-mock-key-detect',
    createdAt: daysAgo(12),
    updatedAt: daysAgo(4),
  },
  {
    id: ACC_GOOGLE_HTML,
    connectionId: 'conn_google',
    name: 'HTML pipeline',
    apiKey: 'google-html-key',
    createdAt: daysAgo(10),
    updatedAt: daysAgo(3),
  },
  {
    id: ACC_AZURE_PRIMARY,
    connectionId: 'conn_azure',
    name: 'Primary subscription',
    apiKey: 'azure-mock-key',
    createdAt: daysAgo(11),
    updatedAt: daysAgo(5),
  },
  {
    id: ACC_AZURE_HTML,
    connectionId: 'conn_azure',
    name: 'HTML subscription',
    apiKey: 'azure-html-key',
    createdAt: daysAgo(10),
    updatedAt: daysAgo(3),
  },
  {
    id: ACC_LANGBLY,
    connectionId: 'conn_langbly',
    name: 'Default',
    apiKey: 'langbly-mock-key',
    createdAt: daysAgo(12),
    updatedAt: daysAgo(1),
  },
]

export const SEED_OPERATORS: OperatorDef[] = [
  {
    id: OP_HTML,
    name: 'HTML to Text',
    kind: 'text',
    description: 'Strip markup and keep the readable text.',
    config: { operation: 'html-to-text' },
    createdAt: daysAgo(30),
    updatedAt: daysAgo(30),
  },
  {
    id: OP_EXCERPT,
    name: 'Two Sentence Excerpt',
    kind: 'regex',
    description: 'Keep the first two sentences.',
    config: {
      pattern: '^[^.!?]+[.!?](?:\\s+[^.!?]+[.!?])?',
      flags: '',
      mode: 'extract',
    },
    createdAt: daysAgo(30),
    updatedAt: daysAgo(30),
  },
]

const detectLanguageSchema: SchemaField[] = [
  {
    id: 'fld_data',
    name: 'data',
    type: 'object',
    children: [
      {
        id: 'fld_detections',
        name: 'detections',
        type: 'array',
        itemType: 'object',
        children: [{ id: 'fld_language', name: 'language', type: 'string' }],
      },
    ],
  },
]

function httpNode(input: Omit<HttpNode, 'type' | 'requestBody' | 'responseBody' | 'enabled' | 'maxRequests' | 'quotaPeriod' | 'usedRequests'> & Partial<Pick<HttpNode, 'requestBody' | 'responseBody' | 'enabled' | 'maxRequests' | 'quotaPeriod' | 'usedRequests'>>): HttpNode {
  return {
    type: 'http',
    enabled: true,
    maxRequests: null,
    quotaPeriod: 'day',
    usedRequests: 0,
    requestBody: { kind: 'object', fields: [] },
    responseBody: [],
    ...input,
  }
}

function successBody(name: string, nodeId: string, path: string[]): MappedValue {
  return {
    kind: 'object',
    fields: [{ id: `map_${name}`, name, value: { kind: 'field', nodeId, path } }],
  }
}

function successLanguage(nodeId: string): MappedValue {
  return {
    kind: 'object',
    fields: [
      {
        id: `map_lang_${nodeId}`,
        name: 'language',
        value: { kind: 'field', nodeId, path: ['body', 'data', 'detections', '0', 'language'] },
      },
      {
        id: `map_text_${nodeId}`,
        name: 'text',
        value: { kind: 'field', nodeId: N.excerpt, path: ['text'] },
      },
    ],
  }
}

function languageRules(nodeId: string): ConditionGroup {
  return {
    op: 'or',
    rules: [
      {
        id: `rule_${nodeId}_en`,
        left: { kind: 'field', nodeId, path: ['body', 'data', 'detections', '0', 'language'] },
        cmp: 'eq',
        right: { kind: 'literal', value: 'en' },
      },
      {
        id: `rule_${nodeId}_es`,
        left: { kind: 'field', nodeId, path: ['body', 'data', 'detections', '0', 'language'] },
        cmp: 'eq',
        right: { kind: 'literal', value: 'es' },
      },
    ],
  }
}

function httpErrorRules(nodeId: string): ConditionGroup {
  return {
    op: 'or',
    rules: [
      {
        id: `rule_${nodeId}_ok`,
        left: { kind: 'field', nodeId, path: ['ok'] },
        cmp: 'eq',
        right: { kind: 'literal', value: false },
      },
    ],
  }
}

function edge(id: string, source: string, target: string, when?: FlowEdge['when']): FlowEdge {
  return { id, source, target, when }
}

const N = {
  start: 'n_start',
  html: 'n_html',
  excerpt: 'n_excerpt',
  google: 'n_google',
  ifHttp: 'n_if_http',
  ifLang: 'n_if_lang',
  okGoogle: 'n_ok_google',
  badGoogle: 'n_bad_google',
  azure: 'n_azure',
  ifHttpAz: 'n_if_http_az',
  ifLangAz: 'n_if_lang_az',
  okAzure: 'n_ok_azure',
  errAzure: 'n_err_azure',
  badAzure: 'n_bad_azure',
}

const detectNodes: FlowNode[] = [
  { id: N.start, type: 'start', position: { x: 40, y: 70 }, input: { from: 'webhook' } },
  {
    id: N.html,
    type: 'operator',
    position: { x: 220, y: 60 },
    operatorId: OP_HTML,
    input: { kind: 'field', nodeId: N.start, path: ['body', 'html'] },
  },
  {
    id: N.excerpt,
    type: 'operator',
    position: { x: 420, y: 60 },
    operatorId: OP_EXCERPT,
    input: { kind: 'field', nodeId: N.html, path: ['text'] },
  },
  httpNode({
    id: N.google,
    position: { x: 660, y: 40 },
    name: 'Google Translate',
    connectionId: 'conn_google',
    accountId: ACC_GOOGLE_PRIMARY,
    maxRequests: 600,
    quotaPeriod: 'hour',
    usedRequests: 552,
    requestBody: {
      kind: 'object',
      fields: [
        { id: 'map_q', name: 'q', value: { kind: 'field', nodeId: N.excerpt, path: ['text'] } },
        { id: 'map_target', name: 'target', value: { kind: 'literal', value: 'en' } },
      ],
    },
    responseBody: detectLanguageSchema,
  }),
  {
    id: N.ifHttp,
    type: 'condition',
    position: { x: 660, y: 240 },
    name: 'If HTTP Error',
    when: httpErrorRules(N.google),
  },
  {
    id: N.ifLang,
    type: 'condition',
    position: { x: 920, y: 240 },
    name: 'If EN or ES',
    when: languageRules(N.google),
  },
  {
    id: N.okGoogle,
    type: 'end',
    position: { x: 1160, y: 140 },
    role: 'success',
    status: 200,
    body: successLanguage(N.google),
  },
  {
    id: N.badGoogle,
    type: 'end',
    position: { x: 920, y: 420 },
    role: 'error',
    status: 422,
    body: {
      kind: 'object',
      fields: [
        { id: 'map_err_g', name: 'error', value: { kind: 'literal', value: 'unsupported_language' } },
      ],
    },
  },
  httpNode({
    id: N.azure,
    position: { x: 420, y: 430 },
    name: 'Azure Translator',
    connectionId: 'conn_azure',
    accountId: ACC_AZURE_PRIMARY,
    maxRequests: null,
    usedRequests: 0,
    requestBody: {
      kind: 'object',
      fields: [
        { id: 'map_az_q', name: 'q', value: { kind: 'field', nodeId: N.excerpt, path: ['text'] } },
      ],
    },
    responseBody: structuredClone(detectLanguageSchema),
  }),
  {
    id: N.ifHttpAz,
    type: 'condition',
    position: { x: 680, y: 450 },
    name: 'If HTTP Error',
    when: httpErrorRules(N.azure),
  },
  {
    id: N.ifLangAz,
    type: 'condition',
    position: { x: 940, y: 450 },
    name: 'If EN or ES',
    when: languageRules(N.azure),
  },
  {
    id: N.okAzure,
    type: 'end',
    position: { x: 1160, y: 360 },
    role: 'success',
    status: 200,
    body: successLanguage(N.azure),
  },
  {
    id: N.errAzure,
    type: 'end',
    position: { x: 680, y: 640 },
    role: 'error',
    status: 500,
    body: {
      kind: 'object',
      fields: [{ id: 'map_err_az', name: 'error', value: { kind: 'literal', value: 'upstream_unavailable' } }],
    },
  },
  {
    id: N.badAzure,
    type: 'end',
    position: { x: 940, y: 640 },
    role: 'error',
    status: 422,
    body: {
      kind: 'object',
      fields: [
        { id: 'map_err_az_lang', name: 'error', value: { kind: 'literal', value: 'unsupported_language' } },
      ],
    },
  },
]

const detectEdges: FlowEdge[] = [
  edge('e1', N.start, N.html),
  edge('e2', N.html, N.excerpt),
  edge('e3', N.excerpt, N.google),
  edge('e4', N.google, N.ifHttp),
  edge('e5', N.ifHttp, N.azure, 'true'),
  edge('e6', N.ifHttp, N.ifLang, 'false'),
  edge('e7', N.ifLang, N.okGoogle, 'true'),
  edge('e8', N.ifLang, N.badGoogle, 'false'),
  edge('e9', N.azure, N.ifHttpAz),
  edge('e10', N.ifHttpAz, N.errAzure, 'true'),
  edge('e11', N.ifHttpAz, N.ifLangAz, 'false'),
  edge('e12', N.ifLangAz, N.okAzure, 'true'),
  edge('e13', N.ifLangAz, N.badAzure, 'false'),
]

const T = { start: 't_start', deepl: 't_deepl', end: 't_end' }
const H = { start: 'h_start', azure: 'h_azure', end: 'h_end' }

export const SEED_WEBHOOK: ApiWebhook = {
  id: WH_ID,
  name: 'Demo Webhook',
  description: 'Sample webhook for the Portable Community demo.',
  allowedClients: [
    { id: 'cli_1', type: 'domain', value: 'app.example.com' },
    { id: 'cli_2', type: 'ip', value: '203.0.113.10' },
  ],
  apiKeyIds: [KEY_PRIMARY, KEY_SECONDARY],
  flowIds: [FLOW_DETECT, FLOW_TRANSLATE, FLOW_HTML],
  input: {
    methods: ['POST'],
    queryParams: [],
    headers: [],
    bodyMode: 'json',
    bodyFields: [{ id: 'fld_html', name: 'html', type: 'string' }],
  },
  response: {
    sourceFlowId: FLOW_TRANSLATE,
    contentType: 'application/json',
    headers: [],
    body: {
      kind: 'object',
      fields: [
        { id: 'map_public_text', name: 'text', value: { kind: 'flow', flowId: FLOW_TRANSLATE, path: ['text'] } },
      ],
    },
  },
  createdAt: daysAgo(14),
  updatedAt: daysAgo(1),
}

export const SEED_KEYS: ApiKey[] = [
  {
    id: KEY_PRIMARY,
    apiWebhookId: WH_ID,
    name: 'Primary',
    key: 'eam_demoPrimaryKey9xK2mQ7vLp4nR8sT1uW3yZ5aB6cD',
    createdAt: daysAgo(14),
    rotatedAt: null,
    expiresAt: null,
    status: 'active',
  },
  {
    id: KEY_SECONDARY,
    apiWebhookId: WH_ID,
    name: 'Secondary',
    key: 'eam_demoSecondaryKey4hJ8nP2qR6tV0wX3yZ7aC9dE1fG',
    createdAt: daysAgo(7),
    rotatedAt: null,
    expiresAt: daysAgo(-90),
    status: 'active',
  },
]

export const SEED_FLOWS: HttpFlow[] = [
  {
    id: FLOW_DETECT,
    name: 'Detect Language',
    description: 'Turn HTML into text, then detect whether the language is English or Spanish.',
    createdAt: daysAgo(12),
    updatedAt: daysAgo(2),
    nodes: detectNodes,
    edges: detectEdges,
  },
  {
    id: FLOW_TRANSLATE,
    name: 'Translate Text',
    description: 'Translate the excerpt with DeepL and publish the text.',
    createdAt: daysAgo(12),
    updatedAt: daysAgo(1),
    nodes: [
      { id: T.start, type: 'start', position: { x: 80, y: 140 }, input: { from: 'flow', flowId: FLOW_DETECT } },
      httpNode({
        id: T.deepl,
        position: { x: 340, y: 120 },
        name: 'DeepL',
        connectionId: 'conn_deepl',
        accountId: ACC_DEEPL_A,
        maxRequests: 25000,
        quotaPeriod: 'month',
        usedRequests: 25000,
        requestBody: {
          kind: 'object',
          fields: [
            { id: 'map_tr_q', name: 'text', value: { kind: 'field', nodeId: T.start, path: ['text'] } },
          ],
        },
        responseBody: [{ id: 'fld_tr_text', name: 'text', type: 'string' }],
      }),
      {
        id: T.end,
        type: 'end',
        position: { x: 640, y: 130 },
        role: 'success',
        status: 200,
        body: successBody('text', T.deepl, ['body', 'text']),
      } satisfies EndNode,
    ],
    edges: [edge('te1', T.start, T.deepl), edge('te2', T.deepl, T.end)],
  },
  {
    id: FLOW_HTML,
    name: 'Translate HTML',
    description: 'Send the original HTML to Azure and publish the translated markup.',
    createdAt: daysAgo(10),
    updatedAt: daysAgo(3),
    nodes: [
      { id: H.start, type: 'start', position: { x: 80, y: 140 }, input: { from: 'webhook' } },
      httpNode({
        id: H.azure,
        position: { x: 340, y: 120 },
        name: 'Azure Translator',
        connectionId: 'conn_azure',
        accountId: ACC_AZURE_HTML,
        maxRequests: 1500,
        quotaPeriod: 'day',
        usedRequests: 640,
        requestBody: {
          kind: 'object',
          fields: [
            { id: 'map_html_q', name: 'html', value: { kind: 'field', nodeId: H.start, path: ['body', 'html'] } },
          ],
        },
        responseBody: [{ id: 'fld_html_out', name: 'html', type: 'string' }],
      }),
      {
        id: H.end,
        type: 'end',
        position: { x: 640, y: 130 },
        role: 'success',
        status: 200,
        body: successBody('html', H.azure, ['body', 'html']),
      },
    ],
    edges: [edge('he1', H.start, H.azure), edge('he2', H.azure, H.end)],
  },
]

export const SEED_ACTIVITY: ActivityEvent[] = [
  {
    id: 'act_1',
    at: daysAgo(0),
    kind: 'fallback',
    message: 'Detect Language: Google Translate HTTP error would continue to Azure Translator.',
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
    message: 'Secondary API key created for Demo Webhook.',
  },
  {
    id: 'act_4',
    at: daysAgo(3),
    kind: 'client',
    message: 'Allowed client 203.0.113.10 added to Demo Webhook.',
  },
  {
    id: 'act_5',
    at: daysAgo(5),
    kind: 'webhook',
    message: 'Webhook “Demo Webhook” seeded for Portable Community demo.',
  },
]

export function createSeedState(): AppState {
  return {
    operator: null,
    webhooks: [structuredClone(SEED_WEBHOOK)],
    apiKeys: structuredClone(SEED_KEYS),
    flows: structuredClone(SEED_FLOWS),
    connections: structuredClone(SEED_CONNECTIONS),
    accounts: structuredClone(SEED_ACCOUNTS),
    operators: structuredClone(SEED_OPERATORS),
    activity: structuredClone(SEED_ACTIVITY),
    mockBaseUrl: 'http://localhost:8080',
    theme: 'dark',
    sidebarCollapsed: false,
  }
}
