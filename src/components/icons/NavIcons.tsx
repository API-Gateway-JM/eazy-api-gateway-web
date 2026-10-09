import type { ReactNode } from 'react'

type IconProps = {
  className?: string
  title?: string
}

function Svg({
  className,
  title,
  children,
  viewBox = '0 0 24 24',
}: IconProps & { children: ReactNode; viewBox?: string }) {
  return (
    <svg
      className={className}
      viewBox={viewBox}
      width="1.25em"
      height="1.25em"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={title ? undefined : true}
      role={title ? 'img' : undefined}
    >
      {title ? <title>{title}</title> : null}
      {children}
    </svg>
  )
}

/** Distinctive brand mark — gateway arch + route node, accent-filled. */
export function BrandMark({ className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 32 32"
      width="28"
      height="28"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="brand-mark-grad" x1="6" y1="4" x2="26" y2="28">
          <stop offset="0%" stopColor="var(--accent-hover)" />
          <stop offset="100%" stopColor="var(--accent)" />
        </linearGradient>
      </defs>
      <rect
        x="2"
        y="2"
        width="28"
        height="28"
        rx="7"
        fill="var(--accent-soft)"
        stroke="var(--accent)"
        strokeWidth="1.25"
      />
      <path
        d="M10 22V12.5c0-1.4 1.1-2.5 2.5-2.5H19c1.7 0 3 1.3 3 3v1"
        fill="none"
        stroke="url(#brand-mark-grad)"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M10 18h7.5c1.4 0 2.5 1.1 2.5 2.5V22"
        fill="none"
        stroke="url(#brand-mark-grad)"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="22" cy="11" r="2.4" fill="var(--accent-ink)" />
      <circle cx="22" cy="21" r="2.4" fill="var(--accent)" />
      <path
        d="M22 13.4v5.2"
        stroke="var(--accent-ink)"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.85"
      />
    </svg>
  )
}

export function IconDashboard(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.2" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1.2" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.2" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1.2" />
    </Svg>
  )
}

export function IconWorkspaces(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M4 8.5 12 4l8 4.5v9L12 22l-8-4.5v-9Z" />
      <path d="M12 12v10" />
      <path d="M4 8.5 12 13l8-4.5" />
    </Svg>
  )
}

export function IconProviders(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="6.5" cy="12" r="2.5" />
      <circle cx="17.5" cy="6.5" r="2.5" />
      <circle cx="17.5" cy="17.5" r="2.5" />
      <path d="M9 12h4.2" />
      <path d="M13.2 12 15.5 8.2" />
      <path d="M13.2 12 15.5 15.8" />
    </Svg>
  )
}

export function IconSettings(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="3.2" />
      <path d="M12 3.5v2.2M12 18.3v2.2M3.5 12h2.2M18.3 12h2.2M6 6l1.6 1.6M16.4 16.4 18 18M18 6l-1.6 1.6M7.6 16.4 6 18" />
    </Svg>
  )
}

export function IconUpgrade(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 19V6.5" />
      <path d="M7.5 11 12 6.5 16.5 11" />
      <path d="M5 19h14" />
    </Svg>
  )
}

function PanelToggleSvg({
  className,
  children,
}: {
  className?: string
  children: ReactNode
}) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      width="22"
      height="22"
      fill="none"
      aria-hidden="true"
    >
      {children}
    </svg>
  )
}

/** Panel with left sidebar strip only (no chevron). */
export function IconPanelLeft({ className }: IconProps) {
  return (
    <PanelToggleSvg className={className}>
      <rect
        x="2.5"
        y="3.25"
        width="19"
        height="17.5"
        rx="2.5"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path d="M9 3.25v17.5" stroke="currentColor" strokeWidth="2" />
    </PanelToggleSvg>
  )
}

export function IconMenu({ className }: IconProps) {
  return (
    <PanelToggleSvg className={className}>
      <path
        d="M4.5 7.5h15"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <path
        d="M4.5 12h15"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <path
        d="M4.5 16.5h15"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </PanelToggleSvg>
  )
}
