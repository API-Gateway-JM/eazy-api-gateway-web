import { Link, NavLink, Outlet } from 'react-router-dom'
import {
  BrandMark,
  IconDashboard,
  IconMenu,
  IconPanelLeft,
  IconProviders,
  IconSettings,
  IconUpgrade,
  IconWorkspaces,
} from '@/components/icons/NavIcons'
import { ToastHost } from '@/components/ToastHost'
import { useMockStore } from '@/store/MockStore'
import type { ReactNode } from 'react'

const NAV: {
  to: string
  label: string
  end?: boolean
  icon: ReactNode
}[] = [
  { to: '/', label: 'Dashboard', end: true, icon: <IconDashboard /> },
  { to: '/workspaces', label: 'API Workspaces', icon: <IconWorkspaces /> },
  { to: '/providers', label: 'Providers', icon: <IconProviders /> },
  { to: '/settings', label: 'Settings', icon: <IconSettings /> },
]

export function AppShell() {
  const { state, logout, setSidebarCollapsed } = useMockStore()
  const op = state.operator
  const collapsed = state.sidebarCollapsed

  return (
    <div className={`app-shell${collapsed ? ' sidebar-collapsed' : ''}`}>
      <header className="topbar">
        <div className="topbar-start">
          <div className="sidebar-toggle-slot">
            <button
              type="button"
              className="btn btn-sm sidebar-toggle"
              onClick={() => setSidebarCollapsed(!collapsed)}
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              aria-expanded={!collapsed}
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {collapsed ? <IconMenu /> : <IconPanelLeft />}
            </button>
          </div>
          <Link
            to="/"
            className="brand-link"
            title="Eazy API Gateway"
            aria-label="Eazy API Gateway home"
          >
            <BrandMark className="brand-mark" />
            <span className="brand-text">
              <span className="brand-name">Eazy API Gateway</span>
              <span className="badge badge-accent brand-edition">Portable Community</span>
            </span>
          </Link>
        </div>
        <div className="topbar-end">
          <span className="muted topbar-email">{op?.email ?? '—'}</span>
          <span className="badge badge-accent" aria-label="Operator">
            {op?.displayName?.slice(0, 1) ?? 'A'}
          </span>
          <button type="button" className="btn btn-sm" onClick={logout}>
            Sign out
          </button>
        </div>
      </header>

      <div className="shell-body">
        <aside className={`sidebar${collapsed ? ' collapsed' : ''}`}>
          <nav aria-label="Main">
            <ul className="nav-list">
              {NAV.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
                    title={item.label}
                    aria-label={item.label}
                  >
                    <span className="nav-icon" aria-hidden="true">
                      {item.icon}
                    </span>
                    <span className="nav-label">{item.label}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          <div className="upsell">
            <Link
              to="/upgrade"
              className="btn btn-primary upsell-btn"
              title="Upgrade"
              aria-label="Upgrade"
            >
              <span className="nav-icon" aria-hidden="true">
                <IconUpgrade />
              </span>
              <span className="nav-label">Upgrade</span>
            </Link>
          </div>
        </aside>

        <main className="page">
          <Outlet />
        </main>
      </div>
      <ToastHost />
    </div>
  )
}
