# Eazy API Gateway (`eazy-api-gateway-web`)

Portable / Community Edition **frontend-only PoC** for an API-agnostic multi-connection gateway manager.

This demo runs entirely in the browser. Webhooks, API keys, flows, connections, and activity are mocked in memory and persisted to `localStorage`. A future Go + SQLite backend will replace these mocks.

## Requirements

- Node.js 20+ recommended
- npm

## Setup

```bash
cd portable/frontend-portable/eazy-api-gateway-web
npm install
npm run dev
```

Open the URL printed by Vite (usually `http://localhost:5173`).

### Scripts

| Command        | Description              |
|----------------|--------------------------|
| `npm run dev`  | Start Vite dev server    |
| `npm run build`| Typecheck + production build |
| `npm run preview` | Preview production build |

## Mock login

- Email: `admin@local` (or any email)
- Password: any value
- Or click **Continue as local admin**

## What is mocked

- Local administrator auth (no OAuth / email verification)
- Webhooks (Community soft-cap: 2)
- API Keys (max 2, Azure-style reveal / copy / regenerate)
- HTTP Flows: visual pipelines (start, operators, HTTP connections, conditions, ends)
- Webhook input and output contracts (nested properties linked to flow fields)
- HTTP Connections catalog and connected accounts
- Operators library (regex and text)
- Flow import and export (`eazy.flow` v1 JSON)
- Activity feed and usage meters

Use **Settings → Restore default settings** to restore the seeded Demo Webhook.

## Product map (demo)

1. **Dashboard** — summary + how-it-works + activity  
2. **Webhooks** — create/open a webhook  
3. Inside a webhook: **Overview · HTTP Flows · Input Data · Output Data · API Keys · Allowed Clients**  
4. **HTTP Connections** — catalog and accounts  
5. **Operators** — reusable regex and text parsers  
6. **Settings** — edition, mock base URL, theme, reset  

HTTP Flows are **not** a top-level sidebar item; they live under a webhook. Open a flow to edit the canvas.

## Out of scope

- Real gateway proxy / connection HTTP calls  
- Go services, SQLite, Docker for this demo  
- Multi-user admin, RBAC, billing enforcement  
