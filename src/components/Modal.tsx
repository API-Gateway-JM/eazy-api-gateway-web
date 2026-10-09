import type { ReactNode } from 'react'

type Props = {
  title: string
  children: ReactNode
  onClose: () => void
  footer?: ReactNode
}

export function Modal({ title, children, onClose, footer }: Props) {
  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
      >
        <h2>{title}</h2>
        <div className="stack">{children}</div>
        {footer ? <div className="row" style={{ marginTop: '1rem', justifyContent: 'flex-end' }}>{footer}</div> : null}
      </div>
    </div>
  )
}
