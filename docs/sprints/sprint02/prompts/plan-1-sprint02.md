# Plan de cambios — Auditoría de aplicación (Frontend)

**Sprint:** 02  
**Fecha:** 2026-06-11  
**Autor:** Rolando Henao  

---

## Resumen ejecutivo

El plan cubre dos capacidades independientes que se implementan en paralelo
conceptualmente pero tienen una dependencia de entrega: primero los headers
de contexto (paso 1-3) y luego el módulo de consulta de logs (pasos 4-14).

---

## Inventario de archivos

### Parte 1 — Enriquecimiento de requests HTTP

| # | Ruta | Tipo | Responsabilidad |
| - | ---- | ---- | --------------- |
| 1 | `src/api/auditHeaders.ts` | **Nuevo** | Exporta la función `getAuditContextHeaders()` que retorna `X-Timezone` y `X-Screen-Size`. Centraliza el cálculo en un único lugar para que ambos clientes Axios lo consuman. |
| 2 | `src/api/axiosOdataAPIClient.ts` | **Modificar** | Importar `getAuditContextHeaders` e inyectar los headers en el interceptor `request.use` existente, junto al `Authorization`. |
| 3 | `src/api/axiosSecurityAPIClient.ts` | **Modificar** | Ídem al anterior. Los headers de auditoría se agregan a **todos** los requests, incluido `/auth/login` (no contienen información sensible y el backend los necesita para registrar el intento de login). |

#### Interfaces TypeScript — Parte 1

```typescript
// src/api/auditHeaders.ts
export interface AuditContextHeaders {
  'X-Timezone':    string;   // Intl.DateTimeFormat().resolvedOptions().timeZone
  'X-Screen-Size': string;   // "{width}x{height}"
}
```

#### Dependencias — Parte 1

- El archivo `auditHeaders.ts` no tiene dependencias internas.
- Los clientes Axios dependen de `auditHeaders.ts`.

---

### Parte 2 — Módulo de consulta de auditoría

#### 2.1 Capa de modelos

| # | Ruta | Tipo | Responsabilidad |
|---|------|------|-----------------|
| 4 | `src/features/audit/models/AuditLog.model.ts` | **Nuevo** | Define todas las interfaces y tipos del dominio de auditoría: `AuditAction`, `AuditModule`, `AuditLogEntry`, `AuditLogFilter`, `AuditLogPage`. Base de todo el módulo. |

```typescript
// src/features/audit/models/AuditLog.model.ts

export type AuditAction =
  | 'LOGIN'
  | 'LOGIN_FAILED'
  | 'INSERT'
  | 'UPDATE'
  | 'DELETE';

export type AuditModule =
  | 'MURIC_001_001'
  | 'MURIC_001_002'
  | 'MURIC_001_003'
  | 'TRANSMISION'
  | 'AUTH';

export interface AuditLogEntry {
  id:            number;
  timestamp:     string;
  userId:        string | null;
  userName:      string | null;
  ipAddress:     string | null;
  action:        AuditAction;
  module:        AuditModule | null;
  entityType:    string | null;
  entityId:      string | null;
  httpMethod:    string | null;
  endpoint:      string | null;
  statusCode:    number | null;
  durationMs:    number | null;
  oldValues:     Record<string, unknown> | null;
  newValues:     Record<string, unknown> | null;
  correlationId: string | null;
  periodoCorte:  string | null;
}

export interface AuditLogFilter {
  userId?:    string;
  action?:    AuditAction;
  module?:    AuditModule;
  dateFrom?:  string;   // ISO 8601
  dateTo?:    string;   // ISO 8601
  ipAddress?: string;
  page?:      number;   // base 1
  pageSize?:  number;   // máximo 100
}

export interface AuditLogPage {
  items:      AuditLogEntry[];
  totalCount: number;
  page:       number;
  pageSize:   number;
}
```

#### 2.2 Capa de servicio

| # | Ruta | Tipo | Responsabilidad |
|---|------|------|-----------------|
| 5 | `src/features/audit/services/AuditLogService.ts` | **Nuevo** | Encapsula la llamada `GET /api/audit-logs` usando `axiosSecurityAPIClient`. Transforma `AuditLogFilter` en query params y retorna `AuditLogPage`. Módulo de solo lectura: no expone ningún método de escritura. |

```typescript
// Firma pública esperada
import type { AuditLogFilter, AuditLogPage } from '../models/AuditLog.model';

const AuditLogService = {
  getAuditLogs: (filter: AuditLogFilter): Promise<AuditLogPage> => { ... }
};

export default AuditLogService;
```

**Dependencias:** `axiosSecurityAPIClient`, `AuditLog.model.ts`

#### 2.3 Hook de datos con sincronización de URL

| # | Ruta | Tipo | Responsabilidad |
|---|------|------|-----------------|
| 6 | `src/features/audit/hooks/useAuditLogs.ts` | **Nuevo** | Hook que gestiona el ciclo completo: lee los filtros desde los query params de la URL (`useSearchParams`), llama a `AuditLogService.getAuditLogs`, y expone `{ data, loading, error, filters, setFilters, resetFilters }`. Al cambiar los filtros, actualiza la URL para que el resultado sea compartible por enlace. |

```typescript
// Firma pública esperada
interface UseAuditLogsResult {
  data:         AuditLogPage | null;
  loading:      boolean;
  error:        string | null;
  filters:      AuditLogFilter;
  setFilters:   (partial: Partial<AuditLogFilter>) => void;
  resetFilters: () => void;
}

export function useAuditLogs(): UseAuditLogsResult { ... }
```

**Dependencias:** `AuditLogService`, `AuditLog.model.ts`, `react-router-dom/useSearchParams`

#### 2.4 Guardia de roles y página de acceso denegado

| # | Ruta | Tipo | Responsabilidad |
|---|------|------|-----------------|
| 7 | `src/features/auth/components/RequireRole.tsx` | **Nuevo** | Componente wrapper que recibe `allowedRoles: string[]`. Usa `usePermission` (ya existe en `src/features/auth/hooks/usePermission.ts`). Si el usuario no tiene ninguno de los roles requeridos, redirige a `/app/forbidden`. Si la sesión no está autenticada, deja que `RequireAuth` lo maneje. |
| 8 | `src/components/Forbidden.tsx` | **Nuevo** | Página de error 403 estilizada con MUI. Muestra un mensaje claro ("No tienes permisos para acceder a esta sección") y un botón para volver al inicio (`/app`). Sin lógica de negocio. |

```typescript
// RequireRole — firma esperada
interface RequireRoleProps {
  allowedRoles: string[];
  children:     ReactElement;
}
```

**Dependencias:** `RequireRole` depende de `usePermission.ts`. `Forbidden` no tiene dependencias internas.

#### 2.5 Componentes de presentación

| # | Ruta | Tipo | Responsabilidad |
|---|------|------|-----------------|
| 9  | `src/features/audit/components/ValueDiff.tsx` | **Nuevo** | Renderiza la diferencia visual entre `oldValues` y `newValues`. Campos eliminados en rojo, agregados en verde, modificados con valor anterior y nuevo lado a lado. Recibe `{ oldValues, newValues }` como props y no realiza ninguna mutación sobre los objetos. |
| 10 | `src/features/audit/components/AuditLogDetail.tsx` | **Nuevo** | Panel de detalle para un `AuditLogEntry` seleccionado. Muestra todos los campos del registro en formato clave-valor. Delega el diff a `ValueDiff`. Incluye botón "Copiar" para `correlationId` usando la Clipboard API. |
| 11 | `src/features/audit/components/AuditLogTable.tsx` | **Nuevo** | Tabla paginada (paginación server-side) con las 8 columnas requeridas. Recibe `{ data: AuditLogPage, loading, onPageChange, onRowSelect }`. Renderiza badges por `action` y `statusCode`. Al hacer clic en "Detalle" de una fila, expande `AuditLogDetail` o llama a `onRowSelect`. No implementa ordenamiento por columna. Maneja los tres estados: cargando (skeleton/spinner), error (mensaje con retry), lista vacía (mensaje informativo). |
| 12 | `src/features/audit/components/AuditLogFilters.tsx` | **Nuevo** | Panel de filtros con los 5 controles requeridos (rango de fechas, acción, módulo, userId/userName, ipAddress) y los botones "Aplicar" y "Limpiar". Recibe `{ filters, onApply, onReset }` como props. Es un componente controlado: no llama directamente al hook ni al servicio. |
| 13 | `src/features/audit/components/AuditLogPage.tsx` | **Nuevo** | Página principal del módulo. Orquesta `AuditLogFilters`, `AuditLogTable` y `AuditLogDetail`. Usa `useAuditLogs` para el estado y la sincronización de URL. Envuelta internamente por `RequireRole` con `allowedRoles={['AuditViewer', 'Admin']}`. |

**Dependencias de componentes (en orden):**

```
ValueDiff
  └── (sin dependencias internas)

AuditLogDetail
  └── ValueDiff

AuditLogTable
  └── AuditLogDetail (inline expand)
      AuditLog.model.ts

AuditLogFilters
  └── AuditLog.model.ts

AuditLogPage
  └── useAuditLogs
      AuditLogFilters
      AuditLogTable
      RequireRole
```

#### 2.6 Registro de rutas

| # | Ruta | Tipo | Responsabilidad |
|---|------|------|-----------------|
| 14 | `src/AppRoutes.tsx` | **Modificar** | Agregar dos nuevas rutas dentro del bloque `<RequireAuth>`: `/app/audit-logs` → `<AuditLogPage />` y `/app/forbidden` → `<Forbidden />`. |

> **Nota sobre la ruta:** El diseño aprobado especifica `/audit-logs` como ruta del módulo.
> En este proyecto todas las rutas protegidas siguen la convención `/app/<ruta>` (ver rutas
> existentes en `AppRoutes.tsx`). Se usa `/app/audit-logs` para mantener consistencia.
> Si el backend o los enlaces externos esperan literalmente `/audit-logs` sin prefijo,
> se deberá mover la ruta fuera del bloque `<RequireAuth>` y envolver solo `<AuditLogPage>`
> con `<RequireAuth>` + `<RequireRole>` directamente.

---

## Resumen del inventario

| # | Archivo | Tipo |
|---|---------|------|
| 1 | `src/api/auditHeaders.ts` | Nuevo |
| 2 | `src/api/axiosOdataAPIClient.ts` | Modificar |
| 3 | `src/api/axiosSecurityAPIClient.ts` | Modificar |
| 4 | `src/features/audit/models/AuditLog.model.ts` | Nuevo |
| 5 | `src/features/audit/services/AuditLogService.ts` | Nuevo |
| 6 | `src/features/audit/hooks/useAuditLogs.ts` | Nuevo |
| 7 | `src/features/auth/components/RequireRole.tsx` | Nuevo |
| 8 | `src/components/Forbidden.tsx` | Nuevo |
| 9 | `src/features/audit/components/ValueDiff.tsx` | Nuevo |
| 10 | `src/features/audit/components/AuditLogDetail.tsx` | Nuevo |
| 11 | `src/features/audit/components/AuditLogTable.tsx` | Nuevo |
| 12 | `src/features/audit/components/AuditLogFilters.tsx` | Nuevo |
| 13 | `src/features/audit/components/AuditLogPage.tsx` | Nuevo |
| 14 | `src/AppRoutes.tsx` | Modificar |

**Total:** 12 archivos nuevos, 3 modificaciones.

---

## Orden de implementación paso a paso

```text
Paso 1  — src/api/auditHeaders.ts
          Sin dependencias. Punto de arranque de la Parte 1.

Paso 2  — src/api/axiosOdataAPIClient.ts  (modificar)
          Requiere: Paso 1

Paso 3  — src/api/axiosSecurityAPIClient.ts  (modificar)
          Requiere: Paso 1
          [Pasos 2 y 3 pueden ejecutarse en paralelo]

Paso 4  — src/features/audit/models/AuditLog.model.ts
          Sin dependencias. Punto de arranque de la Parte 2.

Paso 5  — src/features/audit/services/AuditLogService.ts
          Requiere: Paso 4

Paso 6  — src/features/audit/hooks/useAuditLogs.ts
          Requiere: Pasos 4, 5

Paso 7  — src/features/auth/components/RequireRole.tsx
          Requiere: usePermission.ts (ya existe)

Paso 8  — src/components/Forbidden.tsx
          Sin dependencias internas. Puede ejecutarse en paralelo con Paso 7.

Paso 9  — src/features/audit/components/ValueDiff.tsx
          Sin dependencias internas de este módulo.

Paso 10 — src/features/audit/components/AuditLogDetail.tsx
          Requiere: Paso 9

Paso 11 — src/features/audit/components/AuditLogTable.tsx
          Requiere: Pasos 4, 10
          [Pasos 9-11 pueden avanzar en paralelo con Pasos 7-8]

Paso 12 — src/features/audit/components/AuditLogFilters.tsx
          Requiere: Paso 4

Paso 13 — src/features/audit/components/AuditLogPage.tsx
          Requiere: Pasos 6, 7, 11, 12

Paso 14 — src/AppRoutes.tsx  (modificar)
          Requiere: Pasos 8, 13 (ambos componentes deben existir antes de registrar rutas)
```

### Diagrama de dependencias

```text
auditHeaders.ts
    ├── axiosOdataAPIClient.ts
    └── axiosSecurityAPIClient.ts

AuditLog.model.ts
    └── AuditLogService.ts
            └── useAuditLogs.ts
                    └── AuditLogPage.tsx ──────────────────┐
                                                           │
usePermission.ts (existente)                               │
    └── RequireRole.tsx ────────────────────────────────► AuditLogPage.tsx
                                                           │
ValueDiff.tsx                                              │
    └── AuditLogDetail.tsx                                 │
            └── AuditLogTable.tsx ──────────────────────► AuditLogPage.tsx
                                                           │
AuditLogFilters.tsx ────────────────────────────────────► AuditLogPage.tsx
                                                           │
Forbidden.tsx ─────────────────────────────────────────► AppRoutes.tsx
AuditLogPage.tsx ──────────────────────────────────────► AppRoutes.tsx
```

---

## Notas de implementación

### Headers de auditoría

- `getAuditContextHeaders()` se evalúa en tiempo de ejecución del request, no al
  importar el módulo. `window.screen` y `Intl.DateTimeFormat` pueden cambiar entre
  requests (ej.: el usuario cambia la resolución o la zona horaria del SO).
- El frontend **no** envía timestamp propio. El backend es la única fuente de verdad
  para el campo `timestamp` del log.
- El frontend **no** llama a ningún endpoint de escritura de logs. La auditoría es
  responsabilidad exclusiva del backend.

### Módulo de auditoría

- **Solo lectura**: ningún componente expone acciones de escritura, edición o eliminación.
- `oldValues` y `newValues` se parsean y renderizan en `ValueDiff` pero **nunca se
  modifican**.
- El hook `useAuditLogs` sincroniza los filtros con los query params de la URL usando
  `useSearchParams` de React Router. Esto hace que el resultado sea compartible por enlace.
- La paginación es **server-side**: la tabla envía `page` y `pageSize` al backend y
  renderiza únicamente los items de la página actual.
- Estado vacío: mostrar mensaje informativo cuando `totalCount === 0`.
- Estado de error: mostrar mensaje de error con botón de reintentar.
- Estado de carga: mostrar spinner o skeleton mientras `loading === true`.
- El badge de `statusCode` usa verde para 2xx y rojo para 4xx/5xx.
- `correlationId` se copia al portapapeles usando `navigator.clipboard.writeText()`.
- El rol `Admin` debe estar alineado con el string exacto que devuelve el backend en
  `user.roles` o `user.permissions`. Verificar con el equipo backend antes de hardcodear
  `'AuditViewer'` y `'Admin'`.


## resultado de ejecución

---
  Lo que se implementó

  Parte 1 — Headers HTTP (pasos 1-3)
  - src/api/auditHeaders.ts — función getAuditContextHeaders() que calcula X-Timezone y X-Screen-Size en tiempo de ejecución de
  cada request
  - axiosOdataAPIClient.ts y axiosSecurityAPIClient.ts — ambos interceptores inyectan los headers automáticamente; los headers van
  en todos los requests incluido /auth/login

  Parte 2 — Módulo de auditoría (pasos 4-14)

  ┌─────────────────────┬─────────────────────────────────────────────────────────────────────────────────────────────┐
  │       Archivo       │                                             Rol                                             │
  ├─────────────────────┼─────────────────────────────────────────────────────────────────────────────────────────────┤
  │ AuditLog.model.ts   │ Todos los tipos: AuditAction, AuditModule, AuditLogEntry, AuditLogFilter, AuditLogPage      │
  ├─────────────────────┼─────────────────────────────────────────────────────────────────────────────────────────────┤
  │ AuditLogService.ts  │ GET /api/audit-logs vía axiosSecurityAPIClient, solo lectura                                │
  ├─────────────────────┼─────────────────────────────────────────────────────────────────────────────────────────────┤
  │ useAuditLogs.ts     │ Hook con estado, paginación server-side y sincronización bidireccional con URL query params │
  ├─────────────────────┼─────────────────────────────────────────────────────────────────────────────────────────────┤
  │ RequireRole.tsx     │ Guard que redirige a /app/forbidden si el usuario no tiene los roles requeridos             │
  ├─────────────────────┼─────────────────────────────────────────────────────────────────────────────────────────────┤
  │ Forbidden.tsx       │ Página 403 con botón de retorno al inicio                                                   │
  ├─────────────────────┼─────────────────────────────────────────────────────────────────────────────────────────────┤
  │ ValueDiff.tsx       │ Diff visual: eliminados en rojo, agregados en verde, modificados lado a lado                │
  ├─────────────────────┼─────────────────────────────────────────────────────────────────────────────────────────────┤
  │ AuditLogDetail.tsx  │ Panel expandible con todos los campos + diff + copia de correlationId                       │
  ├─────────────────────┼─────────────────────────────────────────────────────────────────────────────────────────────┤
  │ AuditLogTable.tsx   │ Tabla MUI con filas expandibles, badges de acción/estado HTTP y paginación                  │
  ├─────────────────────┼─────────────────────────────────────────────────────────────────────────────────────────────┤
  │ AuditLogFilters.tsx │ Panel de 5 filtros controlado; llama onApply al hacer clic en "Aplicar"                     │
  ├─────────────────────┼─────────────────────────────────────────────────────────────────────────────────────────────┤
  │ AuditLogPage.tsx    │ Orquesta todo, protegida con RequireRole(['AuditViewer', 'Admin'])                          │
  ├─────────────────────┼─────────────────────────────────────────────────────────────────────────────────────────────┤
  │ AppRoutes.tsx       │ Rutas /app/audit-logs y /app/forbidden registradas                                          │
  └─────────────────────┴─────────────────────────────────────────────────────────────────────────────────────────────┘

  