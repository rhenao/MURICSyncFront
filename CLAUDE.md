# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Start dev server (Vite HMR)
npm run build      # Type-check + production build (tsc -b && vite build)
npm run lint       # ESLint
npm run preview    # Serve the production build locally
```

There are no tests configured in this project.

## Environment Variables

Two `.env` files are tracked: `.env` (local dev) and `.env.production`.

| Variable | Purpose |
|---|---|
| `VITE_API_URL` | Base URL for OData API (e.g. `https://localhost:7167/odata/v1`) |
| `VITE_API_URL_SECURITY` | Base URL for Security/Auth API (e.g. `https://localhost:7167/api`) |

**Security note:** these files are intentionally committed and currently hold only base URLs, no secrets. Keep it that way — never add API keys, credentials, or tokens to `.env`/`.env.production`, since anything in them ships to git history. If a future value needs to be secret, inject it via the CI/CD pipeline instead of committing it here.

## Architecture

### Feature-based structure

Code is organized under `src/features/<feature>/`:

- **`auth`** — `AuthProvider` (React context), `RequireAuth` guard, `useAuth` hook. Auth state lives in `localStorage` (token, user, tokenExpiry) and is managed by `AuthService`.
- **`security`** — Login, password change/reset, user management (list/register/update). Calls the Security API.
- **`param`** — ~30 catalog/reference-data tables (parameter lists for the credit portfolio domain). The SFC catalogs are read-only and use the shared `ListaGeneralConsulta` component. `Universalidades` (company-owned) is the only table meant to get create/edit (see `docs/prompts/plan-crud-universalidades.md`).
- **`upload`** — File upload flow for loading portfolio data: select → load → validate → process → reverse.
- **`home`** — Landing page shown after login.

Shared layout components (`Layout`, `Menu`, `TopBar`, `Logo`, `UserAvatar`) live in `src/components/`.

### Two Axios clients

| Client | File | Used for |
|---|---|---|
| `axiosOdataAPIClient` | `src/api/axiosOdataAPIClient.ts` | OData param endpoints |
| `axiosSecurityAPIClient` | `src/api/axiosSecurityAPIClient.ts` | Auth + user management endpoints |

Both clients attach the JWT Bearer token automatically via request interceptors and redirect to `/login` on 401/403. The security client skips token injection for `/auth/login`.

### Param feature pattern

Every parameter list follows the same pattern — just configure and delegate to `ListaGeneralConsulta`:

```tsx
// src/features/param/components/ListFoo.tsx
import ListaGeneralConsulta, { type ColumnConfig } from "../shared/ListaGeneralConsulta";

const columns: ColumnConfig[] = [
  { accessorKey: "Codigo", header: "Código", size: 120 },
  { accessorKey: "Descripcion", header: "Descripción", size: 320 },
];

export default function ListFoo() {
  return <ListaGeneralConsulta endpoint="/Foo" title="Foo" columns={columns} />;
}
```

`ListaGeneralConsulta` calls `useEntidades(endpoint)` (GET via OData client, handles both plain arrays and OData `{ value: [] }` responses) and renders a `MaterialReactTable`. It has no row actions. `ColumnConfig`/`toMrtColumns`/`getRowKey` live in `shared/columnConfig.ts`, the shared table styling in `shared/tableStyles.ts`, and the title + record-count header in `shared/ListaHeader.tsx`, so a future CRUD list can reuse them. Row ids come from `Codigo` (the API returns PascalCase properties).

**Write-enabled lists (`ListaGeneralCrud`).** Only for company-owned tables — today just `Universalidades`; SFC catalogs stay on `ListaGeneralConsulta`. Same `endpoint`/`title`/`columns` props plus `keyField` (default `"Codigo"`), `keyType` (`"number"` | `"string"`), `keyMaxLength`, `allowEdit` and `writePermission` (default `"params.write"`). `ColumnConfig` accepts form metadata (`fieldType`, `required`, `maxLength`, `options`, `hideInForm`, `defaultValue`); `buildParamSchema` turns it into a `yup` schema, `DialogParamForm` renders the form, and `ParamCrudService` does `POST`/`PUT {endpoint}(key)` (full entity)/`DELETE`. Actions are **not rendered** without the write permission, because the OData client's interceptor logs the user out on a 403. Plan and pending phases: `docs/prompts/plan-crud-universalidades.md`.

After adding a new param list component, register its route in `src/AppRoutes.tsx`.

### Upload flow (`src/features/upload/`)

`CargaArchivos` handles the full lifecycle client-side. File parsing (CSV/TXT via `FileReader`, Excel via `xlsx`) happens in the browser. Backend integration points are all marked `// TODO` — the process/validate/reverse handlers currently simulate async delays.

### Auth flow

1. `AuthProvider` wraps the app and exposes `{ isAuthenticated, user, login, logout }` via context.
2. `RequireAuth` wraps all protected routes — redirects to `/login` if not authenticated. `RequireRole` (role-based) and `RequirePermission` (permission-code-based) wrap individual sensitive routes in `AppRoutes.tsx` — see the route table there for which routes use which.
3. `AuthService` is a singleton class that handles the actual API call and `localStorage` persistence.
4. `user.roles` (array of strings) and `user.permissions` (array of permission codes, decoded from the JWT at login) control role/permission-gated UI (menu items in `Menu.tsx` and the route guards above).

**Security note:** the token, user object, and `tokenExpiry` all live in `localStorage` as plain, editable JSON. Session-expiry checks in `AuthService.isAuthenticated()` and the two Axios client interceptors compare against `tokenExpiry` from `localStorage` — this is a UX convenience only, not a real security boundary, since a user can edit it (or `user.roles`/`user.permissions`) from DevTools. The backend must independently validate the JWT's signature, expiry, and claims on every request; never treat client-side auth/role/permission checks as authoritative. If the backend ever exposes `httpOnly` + `SameSite` cookies for session storage, revisit moving off `localStorage`.
