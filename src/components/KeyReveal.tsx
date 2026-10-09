import { useState } from 'react'
import { maskKey } from '@/lib/ids'
import { useMockStore } from '@/store/MockStore'

type Props = {
  secret: string
  initiallyRevealed?: boolean
}

export function KeyReveal({ secret, initiallyRevealed = false }: Props) {
  const [revealed, setRevealed] = useState(initiallyRevealed)
  const { pushToast } = useMockStore()

  async function copy() {
    try {
      await navigator.clipboard.writeText(secret)
      pushToast('success', 'API key copied to clipboard.')
    } catch {
      pushToast('danger', 'Could not copy to clipboard.')
    }
  }

  return (
    <div className="stack" style={{ gap: '0.5rem' }}>
      <code className="mono" style={{ wordBreak: 'break-all' }}>
        {maskKey(secret, revealed)}
      </code>
      <div className="row">
        <button type="button" className="btn btn-sm" onClick={() => setRevealed((v) => !v)}>
          {revealed ? 'Hide' : 'Reveal'}
        </button>
        <button type="button" className="btn btn-sm btn-primary" onClick={copy}>
          Copy
        </button>
      </div>
    </div>
  )
}
