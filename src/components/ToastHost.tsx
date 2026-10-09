import { useMockStore } from '@/store/MockStore'

export function ToastHost() {
  const { toasts, dismissToast } = useMockStore()
  return (
    <div className="toast-host" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`toast ${t.tone}`} role="status">
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <span>{t.message}</span>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => dismissToast(t.id)} aria-label="Dismiss">
              ×
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
