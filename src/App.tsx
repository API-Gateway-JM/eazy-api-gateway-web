import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { WebhookLayout } from '@/components/layout/WebhookLayout'
import { MockStoreProvider, useMockStore } from '@/store/MockStore'
import { DashboardPage } from '@/pages/DashboardPage'
import { LoginPage } from '@/pages/LoginPage'
import { HttpConnectionAccountsPage } from '@/pages/HttpConnectionAccountsPage'
import { HttpConnectionsPage } from '@/pages/HttpConnectionsPage'
import { OperatorsPage } from '@/pages/OperatorsPage'
import { SettingsPage } from '@/pages/SettingsPage'
import { UpgradePage } from '@/pages/UpgradePage'
import { FlowEditorPage } from '@/pages/webhooks/FlowEditorPage'
import { WebhookClientsPage } from '@/pages/webhooks/WebhookClientsPage'
import { WebhookCreatePage } from '@/pages/webhooks/WebhookCreatePage'
import { WebhookKeysPage } from '@/pages/webhooks/WebhookKeysPage'
import { WebhookInputPage } from '@/pages/webhooks/WebhookInputPage'
import { WebhookOutputPage } from '@/pages/webhooks/WebhookOutputPage'
import { WebhookListPage } from '@/pages/webhooks/WebhookListPage'
import { WebhookOverviewPage } from '@/pages/webhooks/WebhookOverviewPage'
import { WebhookFlowsPage } from '@/pages/webhooks/WebhookFlowsPage'
import type { ReactNode } from 'react'

function RequireAuth({ children }: { children: ReactNode }) {
  const { state } = useMockStore()
  if (!state.operator) return <Navigate to="/login" replace />
  return children
}

// Legacy redirect: /workspaces* -> /webhooks* (flows renamed, keep old URLs working)
function LegacyWorkspacesRedirect() {
  const { pathname } = useLocation()
  return <Navigate to={pathname.replace(/^\/workspaces/, '/webhooks')} replace />
}

// Legacy redirect: /providers* -> /connections* (renamed to HTTP Connections)
function LegacyProvidersRedirect() {
  const { pathname } = useLocation()
  return <Navigate to={pathname.replace(/^\/providers/, '/connections')} replace />
}

// Legacy redirect: nested /routes* -> /flows* (renamed to HTTP Flows)
function LegacyFlowRoutesRedirect() {
  const { pathname } = useLocation()
  return <Navigate to={pathname.replace('/routes', '/flows')} replace />
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
        <Route path="webhooks" element={<WebhookListPage />} />
        <Route path="webhooks/new" element={<WebhookCreatePage />} />
        <Route path="webhooks/:webhookId" element={<WebhookLayout />}>
          <Route index element={<WebhookOverviewPage />} />
          <Route path="keys" element={<WebhookKeysPage />} />
          <Route path="flows" element={<WebhookFlowsPage />} />
          <Route path="flows/:flowId" element={<FlowEditorPage />} />
          <Route path="input" element={<WebhookInputPage />} />
          <Route path="output" element={<WebhookOutputPage />} />
          <Route path="clients" element={<WebhookClientsPage />} />
        </Route>
        <Route path="webhooks/:webhookId/routes/*" element={<LegacyFlowRoutesRedirect />} />
        <Route path="workspaces/*" element={<LegacyWorkspacesRedirect />} />
        <Route path="connections" element={<HttpConnectionsPage />} />
        <Route path="connections/:connectionId/accounts" element={<HttpConnectionAccountsPage />} />
        <Route path="operators" element={<OperatorsPage />} />
        <Route path="providers/*" element={<LegacyProvidersRedirect />} />
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
