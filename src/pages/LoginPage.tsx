import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { useMockStore } from '@/store/MockStore'
import { ToastHost } from '@/components/ToastHost'

export function LoginPage() {
  const { state, login } = useMockStore()
  const [email, setEmail] = useState('admin@local')
  const [password, setPassword] = useState('')

  if (state.operator) return <Navigate to="/" replace />

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    login(email.trim() || 'admin@local')
  }

  return (
    <div className="login-page">
      <div className="login-card stack">
        <div>
          <h1 style={{ margin: '0 0 0.35rem', letterSpacing: '-0.03em' }}>Eazy API Gateway</h1>
          <p className="muted">Portable Community — local administrator sign-in (mock).</p>
        </div>
        <form className="stack" onSubmit={onSubmit}>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@local"
            />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Any password works in this demo"
            />
            <span className="field-hint">Demo accepts any password for the local admin.</span>
          </div>
          <button type="submit" className="btn btn-primary">
            Sign in
          </button>
        </form>
        <button type="button" className="btn" onClick={() => login('admin@local')}>
          Continue as local admin
        </button>
      </div>
      <ToastHost />
    </div>
  )
}
