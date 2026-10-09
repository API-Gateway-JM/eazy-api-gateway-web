import { useMockStore } from '@/store/MockStore'

export function SettingsPage() {
  const { state, setTheme, resetDemoData } = useMockStore()

  return (
    <div className="stack">
      <div className="page-header">
        <div>
          <h1>Settings</h1>
          <p>Portable Community edition preferences (all local / mock).</p>
        </div>
        <span className="badge badge-accent">Portable Community</span>
      </div>

      <div className="card stack">
        <h2 style={{ margin: 0, fontSize: '1.05rem' }}>Gateway base URL</h2>
        <p className="muted">
          Future local gateway base. Clients call this URL plus a route path with one API key.
        </p>
        <div className="field">
          <input
            id="baseUrl"
            value={state.mockBaseUrl}
            readOnly
            aria-label="Gateway base URL"
          />
        </div>
      </div>

      <div className="card stack">
        <h2 style={{ margin: 0, fontSize: '1.05rem' }}>Appearance</h2>
        <p className="muted">
          Grafana-inspired palette. Dark is the default (same as Grafana’s default UI).
        </p>
        <div className="row">
          <button
            type="button"
            className={`btn btn-sm${state.theme === 'dark' ? ' btn-primary' : ''}`}
            onClick={() => setTheme('dark')}
          >
            Dark
          </button>
          <button
            type="button"
            className={`btn btn-sm${state.theme === 'light' ? ' btn-primary' : ''}`}
            onClick={() => setTheme('light')}
          >
            Light
          </button>
        </div>
      </div>

      <div className="danger-zone">
        <h2 style={{ margin: 0, fontSize: '1.05rem' }}>Danger Zone</h2>
        <div className="danger-zone-row">
          <div>
            <h3>Restore default settings</h3>
            <p className="muted" style={{ fontSize: '0.85rem' }}>
              Clears local demo changes and restores the seeded Demo App workspace, keys, and
              routes. This cannot be undone.
            </p>
          </div>
          <button type="button" className="btn btn-danger-outline" onClick={resetDemoData}>
            Restore default settings
          </button>
        </div>
      </div>
    </div>
  )
}
