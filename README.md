# Eazy API Gateway (`eazy-api-gateway-web`)

Portable / Community Edition **frontend-only PoC** for an API-agnostic multi-provider gateway manager.

This demo runs entirely in the browser. Workspaces, API keys, routes, providers, and activity are mocked in memory and persisted to `localStorage`. A future Go + SQLite backend will replace these mocks.

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
- API Workspaces (Community soft-cap: 2)
- API Keys (max 2, Azure-style reveal / copy / regenerate)
- API Routes with custom paths and provider fallback order (Community: max 3 per workspace)
- Free providers catalog (self-hosted and cloud APIs)
- Activity feed and monthly usage meters

Use **Settings → Reset demo data** to restore the seeded Demo App.

## Product map (demo)

1. **Dashboard** — summary + how-it-works + activity  
2. **API Workspaces** — create/open a space  
3. Inside a workspace: **Overview · API Keys · API Routes · Allowed Clients**  
4. **Providers** — read-mostly catalog  
5. **Settings** — edition, mock base URL, theme, reset  

API Routes are **not** a top-level sidebar item; they live under a workspace.

## Out of scope

- Real gateway proxy / provider HTTP calls  
- Go services, SQLite, Docker for this demo  
- Multi-user admin, RBAC, billing enforcement  
