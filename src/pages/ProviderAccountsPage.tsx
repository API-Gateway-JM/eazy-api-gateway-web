import { useMemo, useState, type FormEvent } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { useMockStore } from '@/store/MockStore'
import type { ProviderAccount } from '@/types'

type AccountEditor =
  | { type: 'create' }
  | { type: 'edit'; account: ProviderAccount }
  | null

function maskKey(key: string) {
  if (key.length <= 8) return '••••••••'
  return `${key.slice(0, 4)}…${key.slice(-4)}`
}

export function ProviderAccountsPage() {
  const { providerId = '' } = useParams()
  const {
    state,
    createAccount,
    updateAccount,
    deleteAccount,
    accountsForProvider,
    pushToast,
  } = useMockStore()

  const provider = state.providers.find((p) => p.id === providerId)
  const accounts = accountsForProvider(providerId)

  const usageByAccount = useMemo(() => {
    const map = new Map<string, number>()
    for (const route of state.routes) {
      for (const b of route.providers) {
        if (!b.accountId) continue
        map.set(b.accountId, (map.get(b.accountId) ?? 0) + 1)
      }
    }
    return map
  }, [state.routes])

  const [editor, setEditor] = useState<AccountEditor>(null)
  const [accountName, setAccountName] = useState('')
  const [accountKey, setAccountKey] = useState('')
  const [revealAccountKey, setRevealAccountKey] = useState(false)
  const [deleteAccountId, setDeleteAccountId] = useState<string | null>(null)

  if (!provider) {
    return (
      <div className="card empty">
        <p>Provider not found.</p>
        <Link to="/providers" className="btn" style={{ marginTop: '0.75rem' }}>
          Back to providers
        </Link>
      </div>
    )
  }

  if (provider.origin !== 'platform' || !provider.requiresApiKey) {
    return <Navigate to="/providers" replace />
  }

  function openCreate() {
    setAccountName('')
    setAccountKey('')
    setRevealAccountKey(false)
    setEditor({ type: 'create' })
  }

  function openEdit(account: ProviderAccount) {
    setAccountName(account.name)
    setAccountKey(account.apiKey)
    setRevealAccountKey(false)
    setEditor({ type: 'edit', account })
  }

  function closeEditor() {
    setEditor(null)
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (editor?.type === 'create') {
      const result = createAccount({
        providerId,
        name: accountName,
        apiKey: accountKey,
      })
      if ('error' in result) {
        pushToast('danger', result.error)
        return
      }
      pushToast('success', `Account “${result.name}” connected.`)
      closeEditor()
      return
    }
    if (editor?.type === 'edit') {
      const result = updateAccount(editor.account.id, {
        name: accountName,
        apiKey: accountKey,
      })
      if (result.error) {
        pushToast('danger', result.error)
        return
      }
      pushToast('success', 'Account updated.')
      closeEditor()
    }
  }

  function onDelete(id: string) {
    const result = deleteAccount(id)
    if (result.error) {
      pushToast('danger', result.error)
      return
    }
    pushToast('success', 'Connected account deleted.')
    setDeleteAccountId(null)
  }

  return (
    <div className="stack">
      <div className="page-header">
        <div>
          <p className="muted" style={{ marginBottom: '0.25rem' }}>
            <Link to="/providers">Providers</Link>
            {' / '}
            <span>{provider.name}</span>
            {' / '}
            <span>Accounts</span>
          </p>
          <h1 style={{ margin: 0 }}>Connected accounts</h1>
          <p>
            Named {provider.credentialLabel?.toLowerCase() ?? 'API key'} credentials for{' '}
            {provider.name}. Reuse them across routes, or add several to stack free quotas in a
            cascade.
          </p>
        </div>
        <button type="button" className="btn btn-primary" onClick={openCreate}>
          Add account
        </button>
      </div>

      {accounts.length === 0 ? (
        <div className="card empty">
          <p>No accounts connected for {provider.name} yet.</p>
          <button
            type="button"
            className="btn btn-primary"
            style={{ marginTop: '0.75rem' }}
            onClick={openCreate}
          >
            Connect your first account
          </button>
        </div>
      ) : (
        <div className="stack">
          {accounts.map((a) => {
            const usage = usageByAccount.get(a.id) ?? 0
            return (
              <div key={a.id} className="card">
                <div
                  className="row"
                  style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}
                >
                  <div>
                    <strong style={{ fontSize: '1.05rem' }}>{a.name}</strong>
                    <p className="mono muted" style={{ marginTop: '0.35rem', fontSize: '0.85rem' }}>
                      {provider.credentialLabel ?? 'API Key'}: {maskKey(a.apiKey)}
                    </p>
                    <p className="field-hint" style={{ marginTop: '0.35rem' }}>
                      {usage === 0
                        ? 'Not used on any route binding.'
                        : `Used on ${usage} route binding${usage === 1 ? '' : 's'}.`}
                    </p>
                  </div>
                  <div className="row">
                    <button type="button" className="btn btn-sm" onClick={() => openEdit(a)}>
                      Edit
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-danger"
                      onClick={() => setDeleteAccountId(a.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <p className="field-hint">
        Attach these accounts from a <Link to="/workspaces">workspace</Link> route editor. Delete is
        blocked while an account is still attached to a route.
      </p>

      {editor ? (
        <div className="modal-backdrop" role="presentation" onClick={closeEditor}>
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="account-editor-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="account-editor-title">
              {editor.type === 'create'
                ? `Connect ${provider.name}`
                : `Edit ${provider.name} account`}
            </h2>
            <form className="stack" onSubmit={onSubmit}>
              <div className="field">
                <label htmlFor="acc-name">Account name</label>
                <input
                  id="acc-name"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  required
                  placeholder="e.g. Personal free tier"
                />
              </div>
              <div className="field">
                <label htmlFor="acc-key">{provider.credentialLabel ?? 'API Key'}</label>
                <div className="row">
                  <input
                    id="acc-key"
                    type={revealAccountKey ? 'text' : 'password'}
                    value={accountKey}
                    onChange={(e) => setAccountKey(e.target.value)}
                    required
                    style={{ flex: 1 }}
                    autoComplete="off"
                  />
                  <button
                    type="button"
                    className="btn btn-sm"
                    onClick={() => setRevealAccountKey((v) => !v)}
                  >
                    {revealAccountKey ? 'Hide' : 'Reveal'}
                  </button>
                </div>
              </div>
              <div className="row" style={{ justifyContent: 'flex-end' }}>
                <button type="button" className="btn" onClick={closeEditor}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editor.type === 'create' ? 'Connect' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {deleteAccountId ? (
        <div className="modal-backdrop" role="presentation" onClick={() => setDeleteAccountId(null)}>
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <h2>Delete connected account?</h2>
            <p className="muted">
              If this account is attached to any route, delete will be blocked until those bindings
              are removed.
            </p>
            <div className="row" style={{ justifyContent: 'flex-end', marginTop: '1rem' }}>
              <button type="button" className="btn" onClick={() => setDeleteAccountId(null)}>
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={() => onDelete(deleteAccountId)}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
