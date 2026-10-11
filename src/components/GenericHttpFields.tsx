import { HTTP_AUTH_TYPES, HTTP_METHODS, normalizeHttpConfig } from '@/lib/httpConfig'
import type { GenericHttpConfig, HttpAuthType, HttpMethod } from '@/types'
import { KeyValueEditor } from '@/components/KeyValueEditor'

type Props = {
  idPrefix: string
  value?: GenericHttpConfig
  onChange: (next: GenericHttpConfig) => void
  revealSecret: boolean
  onToggleReveal: () => void
}

export function GenericHttpFields({
  idPrefix,
  value,
  onChange,
  revealSecret,
  onToggleReveal,
}: Props) {
  const http = normalizeHttpConfig(value)

  function patch(partial: Partial<GenericHttpConfig>) {
    onChange({ ...http, ...partial })
  }

  return (
    <div className="stack generic-http-fields" style={{ gap: '0.55rem' }}>
      <div className="field">
        <label htmlFor={`http-url-${idPrefix}`}>URL</label>
        <input
          id={`http-url-${idPrefix}`}
          className="mono"
          type="url"
          required
          placeholder="https://api.example.com/webhook"
          value={http.url}
          onChange={(e) => patch({ url: e.target.value })}
        />
        {!http.url.trim() ? (
          <span className="field-error">URL is required.</span>
        ) : null}
      </div>

      <div className="field">
        <label htmlFor={`http-method-${idPrefix}`}>Method</label>
        <select
          id={`http-method-${idPrefix}`}
          value={http.method}
          onChange={(e) => patch({ method: e.target.value as HttpMethod })}
        >
          {HTTP_METHODS.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <label htmlFor={`http-auth-${idPrefix}`}>Auth</label>
        <select
          id={`http-auth-${idPrefix}`}
          value={http.authType}
          onChange={(e) => patch({ authType: e.target.value as HttpAuthType })}
        >
          {HTTP_AUTH_TYPES.map((a) => (
            <option key={a.value} value={a.value}>
              {a.label}
            </option>
          ))}
        </select>
      </div>

      {http.authType === 'api_key_header' ? (
        <div className="field">
          <label htmlFor={`http-key-name-${idPrefix}`}>API key header name</label>
          <input
            id={`http-key-name-${idPrefix}`}
            className="mono"
            value={http.apiKeyHeaderName ?? 'X-Api-Key'}
            onChange={(e) => patch({ apiKeyHeaderName: e.target.value })}
            placeholder="X-Api-Key"
          />
        </div>
      ) : null}

      {http.authType === 'basic' ? (
        <div className="field">
          <label htmlFor={`http-user-${idPrefix}`}>Username</label>
          <input
            id={`http-user-${idPrefix}`}
            value={http.basicUsername ?? ''}
            onChange={(e) => patch({ basicUsername: e.target.value })}
            autoComplete="off"
          />
        </div>
      ) : null}

      {http.authType !== 'none' ? (
        <div className="field">
          <label htmlFor={`http-secret-${idPrefix}`}>
            {http.authType === 'bearer'
              ? 'Bearer token'
              : http.authType === 'basic'
                ? 'Password'
                : 'API key value'}
          </label>
          <div className="row">
            <input
              id={`http-secret-${idPrefix}`}
              type={revealSecret ? 'text' : 'password'}
              value={http.authSecret ?? ''}
              onChange={(e) => patch({ authSecret: e.target.value })}
              style={{ flex: 1 }}
              autoComplete="off"
            />
            <button type="button" className="btn btn-sm" onClick={onToggleReveal}>
              {revealSecret ? 'Hide' : 'Reveal'}
            </button>
          </div>
        </div>
      ) : null}

      <KeyValueEditor
        label="Headers"
        rows={http.headers}
        onChange={(headers) => patch({ headers })}
      />

      <KeyValueEditor
        label="Query params"
        rows={http.queryParams}
        onChange={(queryParams) => patch({ queryParams })}
      />
    </div>
  )
}
