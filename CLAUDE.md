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
- **`param`** — ~30 catalog/reference-data tables (parameter lists for the credit portfolio domain). The SFC catalogs are read-only and use the shared `ListaGeneralConsulta` component. This includes `CatalogoAtributos`, the 40 attributes of insumo 001-002. `Universalidades` (company-owned) is the only table meant to get create/edit (see `docs/prompts/plan-crud-universalidades.md`).
- **`upload`** — Portfolio load batches (`ListLotes` + `CargaArchivos`: create → upload → validate → promote) and load templates (`plantillas`).
- **`submission`** — *Envío a MURIC* (`EnviaMURIC`, `/app/envio-muric`, `cargas.write`): generates and transmits **one AVRO per cut-off date** with every universalidad (`TransmisionService`, `/transmisiones`; backend ADR 0008). It only enables download/transmit when every non-cancelled batch of the cut-off is `Promovido` (the backend answers `409` with `lotesPendientes` otherwise), and accepts `?fechaCorte=`.
- **`home`** — Landing page shown after login.
- **`configuracion`** — Read-only backend configuration. `ChipEntidadReportante` shows the reporting entity (Titularice, `GET /configuracion/entidad-reportante`, cached once per page load) on *Cargue de archivos* and *Envío MURIC*; the backend refuses to start without `EntidadReportante:CodigoEntidad`.

Shared layout components (`Layout`, `Menu`, `TopBar`, `Logo`, `UserAvatar`) live in `src/components/`.

### Two Axios clients

| Client | File | Used for |
|---|---|---|
| `axiosOdataAPIClient` | `src/api/axiosOdataAPIClient.ts` | OData param endpoints |
| `axiosSecurityAPIClient` | `src/api/axiosSecurityAPIClient.ts` | Auth + user management endpoints |

Both clients attach the JWT Bearer token automatically via request interceptors and redirect to `/login` on 401/403. The security client skips token injection for `/auth/login`.

Where axios does not fit (multipart uploads, where the browser must set the boundary, and file downloads), use `fetchConToken(path, init)` from `src/api/fetchConToken.ts`: native `fetch` against the Security API with the same session handling (expired token or 401/403 → clear session and go to `/login`).

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

**Write-enabled lists (`ListaGeneralCrud`).** Only for company-owned tables — today just `Universalidades`; SFC catalogs stay on `ListaGeneralConsulta`. Same `endpoint`/`title`/`columns` props plus `keyField` (default `"Codigo"`), `keyType` (`"number"` | `"string"`), `keyMaxLength`, `allowCreate`, `allowEdit`, `allowDelete`, `filaInactiva` (dims inactive rows) and `writePermission` (default `"params.write"`). `ColumnConfig` accepts form metadata (`fieldType`, `required`, `maxLength`, `options` — an option with `color` renders as a `Chip` —, `hideInForm`, `defaultValue`); `buildParamSchema` turns it into a `yup` schema, `DialogParamForm` renders the form, and `DialogConfirmDelete` confirms deletes, and `ParamCrudService` does `POST`/`PUT {endpoint}(key)` (full entity)/`DELETE`. `Universalidades` uses `allowDelete={false}`: it is retired logically with `Estado = "I"` because load batches and credits reference it by FK (`Restrict`). Its optional `PrefijoCredito` (letters, digits, `-`, `_`, max 20) is prepended by the backend to every credit id loaded for that universalidad, so two originators with the same credit number do not collide; the backend rejects changing it once the universalidad has transmissions. Actions are **not rendered** without the write permission, because the OData client's interceptor logs the user out on a 403. Plan and pending phases: `docs/prompts/plan-crud-universalidades.md`.

After adding a new param list component, register its route in `src/AppRoutes.tsx`.

### Upload flow (`src/features/upload/`)

`CargaArchivos` drives the batch (`lote`) lifecycle against the Security API (`/cargas`): create → upload one file per insumo → validate → promote, or cancel. The **backend** parses the files (ADR 0004). Uploads go through `fetchConToken`. A promoted batch links to *Envío a MURIC* for its cut-off date: there is no per-batch AVRO or transmission any more. Plan: `docs/prompts/plan-cargue-archivos.md`.

- **A batch belongs to a universalidad.** It is created with `{ fechaCorte, universalidadCodigo, observaciones }`. The reporting entity's type and code are Titularice's and are never sent by the front (`docs/prompts/plan-entidad-reportante-universalidad.md`, phases A, B1, B2, C and D done; E pending). Credits also belong to a universalidad; their id is unique across Titularice, and promotion fails if a batch's credit id already exists in another universalidad.
- **One active batch** (`Iniciado`, `Parseado` or `Validado`) per cut-off date and universalidad: creating another returns `409` with `loteIdExistente`, and the error offers "Abrir lote #N". If a `Promovido` batch already exists for that cut-off, creation succeeds and the response carries `advertencia`. There is no `Fallido` batch state (the file history still has `Fallido` rows).
- **`ListLotes`** (`/app/lotes-carga`, `cargas.read`) lists batches with per-insumo row counts and error summary (`GET /cargas` returns the same shape as the detail). Status chips filter on the backend (`estado` repeated, via `LoteService`); universalidad and cut-off filter client-side from the loaded rows, so the list needs no OData call. States and colors: `Lote.model.ts`.
- **`CargaArchivos`** lives at `/app/carga-archivos/:id?` (`cargas.read`): no id creates a batch, an id opens it, and after creating it navigates to the batch URL so a page reload keeps it. It only holds state and API calls; the panels are in `components/cargue/`. Without `cargas.write` it is read-only (no form, uploads, validate/promote/cancel or transmit). Promote and cancel ask for confirmation. Files can be uploaded to a `Validado` batch, which goes back to `Parseado`.
- **Validation** (`POST /cargas/{id}/validar`) runs the backend rule engine (`IReglaValidacion`) and stores cell-level errors (ADR 0007). Today there is one rule: `identificacion_negocio_vehiculo_universalidad` required, 21 characters, starting with the reporting entity's `TTTCCC` (`600003`), severity `Error`. `PanelErrores` lists them (`GET /cargas/{id}/errores`, CSV export) and *Promover* stays disabled while there are `Error`-severity rows; the backend also refuses to promote.
- The new-batch form and *Envío MURIC* query `/Universalidades` only with `params.read` (`useEntidades(endpoint, { enabled })`).

**Load templates (`plantillas`).** `ListPlantillas`/`FormPlantilla` and `PlantillaService` (`/plantillas`, permissions `cargas.read`/`cargas.write`) manage templates that map file columns to staging fields (`CAMPOS_POR_INSUMO` in `Plantilla.model.ts`). Plan: `docs/prompts/plan-plantillas-carga.md`.

- Templates are **global**: no entity type or code.
- A default value fills empty cells, and missing columns, of a mapped field.
- **001-002 attributes** can come one column per attribute (`claveAtributo`, plus `ordinalPoliza` for 29–32). The form picks attributes from the read-only `CatalogoAtributos` param table. It only queries that table with `params.read`, via `useEntidades(endpoint, { enabled })`, because a 403 from the OData client logs the user out.
- **001-999 "Todos"** is one combined file that fills the slots whose own fields the template maps (`insumosGeneradosTodos`). It is upload-only with a mandatory template (backend ADR 0009) and has no preview. `CargaArchivos` asks for confirmation before it replaces slots that already hold data.

### Auth flow

1. `AuthProvider` wraps the app and exposes `{ isAuthenticated, user, login, logout }` via context.
2. `RequireAuth` wraps all protected routes — redirects to `/login` if not authenticated. `RequireRole` (role-based) and `RequirePermission` (permission-code-based) wrap individual sensitive routes in `AppRoutes.tsx` — see the route table there for which routes use which.
3. `AuthService` is a singleton class that handles the actual API call and `localStorage` persistence.
4. `user.roles` (array of strings) and `user.permissions` (array of permission codes, decoded from the JWT at login) control role/permission-gated UI (menu items in `Menu.tsx` and the route guards above). Load, submission and batch-query menu items use the same permission as their route (`cargas.read`/`cargas.write`), not roles.

**Security note:** the token, user object, and `tokenExpiry` all live in `localStorage` as plain, editable JSON. Session-expiry checks in `AuthService.isAuthenticated()` and the two Axios client interceptors compare against `tokenExpiry` from `localStorage` — this is a UX convenience only, not a real security boundary, since a user can edit it (or `user.roles`/`user.permissions`) from DevTools. The backend must independently validate the JWT's signature, expiry, and claims on every request; never treat client-side auth/role/permission checks as authoritative. If the backend ever exposes `httpOnly` + `SameSite` cookies for session storage, revisit moving off `localStorage`.
