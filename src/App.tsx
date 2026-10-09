import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { WorkspaceLayout } from '@/components/layout/WorkspaceLayout'
import { MockStoreProvider, useMockStore } from '@/store/MockStore'
import { DashboardPage } from '@/pages/DashboardPage'
import { LoginPage } from '@/pages/LoginPage'
import { ProviderAccountsPage } from '@/pages/ProviderAccountsPage'
import { ProvidersPage } from '@/pages/ProvidersPage'
import { SettingsPage } from '@/pages/SettingsPage'
import { UpgradePage } from '@/pages/UpgradePage'
import { RouteEditorPage } from '@/pages/workspaces/RouteEditorPage'
import { WorkspaceClientsPage } from '@/pages/workspaces/WorkspaceClientsPage'
import { WorkspaceCreatePage } from '@/pages/workspaces/WorkspaceCreatePage'
import { WorkspaceKeysPage } from '@/pages/workspaces/WorkspaceKeysPage'
import { WorkspaceListPage } from '@/pages/workspaces/WorkspaceListPage'
import { WorkspaceOverviewPage } from '@/pages/workspaces/WorkspaceOverviewPage'
import { WorkspaceRoutesPage } from '@/pages/workspaces/WorkspaceRoutesPage'
import type { ReactNode } from 'react'

function RequireAuth({ children }: { children: ReactNode }) {
  const { state } = useMockStore()
  if (!state.operator) return <Navigate to="/login" replace />
  return children
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        element={
          <RequireAuth>
            <AppShell />
          </RequireAuth>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="workspaces" element={<WorkspaceListPage />} />
        <Route path="workspaces/new" element={<WorkspaceCreatePage />} />
        <Route path="workspaces/:workspaceId" element={<WorkspaceLayout />}>
          <Route index element={<WorkspaceOverviewPage />} />
          <Route path="keys" element={<WorkspaceKeysPage />} />
          <Route path="routes" element={<WorkspaceRoutesPage />} />
          <Route path="routes/:routeId" element={<RouteEditorPage />} />
          <Route path="clients" element={<WorkspaceClientsPage />} />
        </Route>
        <Route path="providers" element={<ProvidersPage />} />
        <Route path="providers/:providerId/accounts" element={<ProviderAccountsPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="upgrade" element={<UpgradePage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <MockStoreProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </MockStoreProvider>
  )
}
