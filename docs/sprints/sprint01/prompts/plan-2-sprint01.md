# Plan Sprint 01 — Reporte de Usuarios (Frontend)

**Proyecto:** MURICSyncFront  
**Fecha:** 2026-06-08  
**Rama:** `rhenao-sprint04`

---

## Resumen Ejecutivo

El backend implementó un endpoint de reporte de usuarios con filtrado, paginación y exportación a CSV. El frontend debe consumir esos endpoints y presentar una pantalla de reporte con:

- Panel de filtros (estado activo/inactivo, rol, búsqueda por nombre/email, rango de fechas de último login).
- Tabla paginada con los usuarios y sus datos (nombre, apellido, email, estado, último login, fecha creación, roles).
- Botón de exportación a CSV que descarga el archivo directamente desde el backend.

### Endpoints del backend

| Método | Ruta | Permiso | Descripción |
| ------ | ---- | ------- | ----------- |
| GET | `/api/users/report` | `usuarios.read` | Reporte paginado con filtros |
| GET | `/api/users/report/export` | `usuarios.read` | Descarga CSV del reporte |

### Parámetros de filtrado (`UserReportFilterDto`)

| Campo | Tipo | Descripción |
| ----- | ---- | ----------- |
| `isActive` | `boolean?` | null = todos |
| `role` | `string?` | nombre del rol |
| `search` | `string?` | busca en nombre, apellido, email |
| `lastLoginFrom` | `string?` | ISO 8601 UTC |
| `lastLoginTo` | `string?` | ISO 8601 UTC |
| `page` | `number` | default 1 |
| `pageSize` | `number` | default 50, máx 200 |
| `sortBy` | `string` | lastName \| email \| lastLoginAt \| createdAt |
| `sortDir` | `string` | asc \| desc |

### Forma de la respuesta paginada

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "...",
        "email": "...",
        "firstName": "...",
        "lastName": "...",
        "fullName": "...",
        "isActive": true,
        "lastLoginAt": "2026-06-07T21:14:36Z",
        "createdAt": "2025-01-15T10:00:00Z",
        "roles": ["ADMIN", "OPERADOR"]
      }
    ],
    "totalCount": 42,
    "page": 1,
    "pageSize": 50,
    "totalPages": 1
  }
}
```

---

## Tareas del Plan

### Tarea 1 — Modelos del reporte de usuarios

**Archivos a crear:**
- `src/features/security/models/UserReport.model.ts`

---

**Prompt de ejecución:**

```
Estás trabajando en MURICSyncFront (React 19 + TypeScript + Vite).
El proyecto está en E:\newprojects\titularice\muric\muricsyncfront.

Lee estos archivos antes de empezar:
- src/features/security/models/UserInfoDto.ts  (para ver el estilo)
- src/features/security/models/User.model.ts

## Tarea

Crea `src/features/security/models/UserReport.model.ts` con las siguientes interfaces:

### `UserReportItemDto`

Representa una fila del reporte:

```typescript
export interface UserReportItemDto {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  fullName: string;
  isActive: boolean;
  lastLoginAt?: string;     // ISO 8601 UTC, puede ser null
  createdAt: string;        // ISO 8601 UTC
  roles: string[];
}
```

### `UserReportFilterDto`

Parámetros de filtrado y paginación que se envían como query string:

```typescript
export interface UserReportFilterDto {
  isActive?: boolean;
  role?: string;
  search?: string;
  lastLoginFrom?: string;   // ISO 8601 UTC
  lastLoginTo?: string;     // ISO 8601 UTC
  page?: number;            // default 1
  pageSize?: number;        // default 50
  sortBy?: 'lastName' | 'email' | 'lastLoginAt' | 'createdAt';
  sortDir?: 'asc' | 'desc';
}
```

### `UserReportResponseDto`

Envelope paginado de respuesta:

```typescript
export interface UserReportResponseDto {
  items: UserReportItemDto[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
```

## Formato de entrega

Crea el archivo `E:\newprojects\titularice\muric\muricsyncfront\docs\prompts\sprint01\result-plan2-tarea1.md`
con un resumen de los cambios realizados.
```

---

### Tarea 2 — Servicio de reporte de usuarios

**Archivos a crear:**
- `src/features/security/services/UserReportService.ts`

---

**Prompt de ejecución:**

```
Estás trabajando en MURICSyncFront (React 19 + TypeScript + Vite).
El proyecto está en E:\newprojects\titularice\muric\muricsyncfront.

Lee estos archivos antes de empezar:
- src/api/axiosSecurityAPIClient.ts
- src/features/security/models/UserReport.model.ts
- src/features/security/services/AuthService.ts  (para ver el estilo)

## Contexto de los endpoints

BASE: VITE_API_URL_SECURITY (axiosSecurityAPIClient)

GET /api/users/report        — retorna { success: true, data: UserReportResponseDto }
GET /api/users/report/export — retorna un archivo CSV (blob)

## Tarea

Crea `src/features/security/services/UserReportService.ts`.

### `getReport(filter: UserReportFilterDto): Promise<UserReportResponseDto>`

Llama `GET /api/users/report` pasando los parámetros de filtro como `params` de Axios.
Extrae y retorna `response.data.data`.

Omite los campos undefined/null del objeto filter antes de pasarlos como params para
evitar que Axios envíe parámetros vacíos.

### `exportCsv(filter: Omit<UserReportFilterDto, 'page' | 'pageSize'>): Promise<void>`

Llama `GET /api/users/report/export` con `responseType: 'blob'`.
Usa el mismo mecanismo de descarga de archivos en el browser:

```typescript
const url = window.URL.createObjectURL(new Blob([response.data]));
const link = document.createElement('a');
link.href = url;
const fecha = new Date().toISOString().slice(0, 10).replace(/-/g, '');
link.setAttribute('download', `reporte-usuarios-${fecha}.csv`);
document.body.appendChild(link);
link.click();
link.remove();
window.URL.revokeObjectURL(url);
```

## Formato de entrega

Crea el archivo `E:\newprojects\titularice\muric\muricsyncfront\docs\prompts\sprint01\result-plan2-tarea2.md`
con un resumen de los cambios realizados.
```

---

### Tarea 3 — Componente ReporteUsuarios

**Archivos a crear:**
- `src/features/security/components/ReporteUsuarios.tsx`

---

**Prompt de ejecución:**

```
Estás trabajando en MURICSyncFront (React 19 + TypeScript + Vite, MUI, MaterialReactTable v2).
El proyecto está en E:\newprojects\titularice\muric\muricsyncfront.

Lee estos archivos antes de empezar:
- src/features/security/components/ListUsers.tsx   (patrón de tabla con MRT)
- src/features/security/services/UserReportService.ts
- src/features/security/models/UserReport.model.ts
- src/features/auth/hooks/usePermission.ts
- src/features/auth/hooks/useAuth.ts

## Tarea

Crea `src/features/security/components/ReporteUsuarios.tsx`.

### Panel de filtros

En la parte superior, muestra un panel de filtros con los siguientes controles de MUI:

| Control | Campo | Tipo |
|---|---|---|
| Select | Estado | Todos / Activo / Inactivo |
| TextField | Rol | texto libre (nombre de rol) |
| TextField | Búsqueda | nombre, apellido o email |
| TextField | Último login desde | type="date" |
| TextField | Último login hasta | type="date" |
| Button | Buscar | aplica filtros |
| Button | Limpiar | resetea filtros al estado inicial |

### Tabla principal (MaterialReactTable)

Columnas:
- **Nombre** — `firstName`
- **Apellido** — `lastName`
- **Email** — `email`
- **Estado** — chip Verde "Activo" / Rojo "Inactivo" según `isActive`
- **Último Login** — `lastLoginAt` formateado como fecha/hora local; "Nunca" si null
- **Creado** — `createdAt` formateado como fecha local
- **Roles** — chips por cada rol en el array `roles`

La paginación es **del lado del servidor** (`manualPagination: true`).
El estado de paginación de MRT (page index, page size) debe mapearse a `page` y `pageSize`
del filtro. Recuerda que MRT usa índice base 0 y el backend espera base 1.

Al cambiar página o tamaño de página en MRT, ejecuta la query con los nuevos valores.

### Botón Exportar CSV

Sobre la tabla (o en el toolbar de MRT), muestra un botón "Exportar CSV".
Al hacer click llama `UserReportService.exportCsv(filter)` con los filtros actuales
(sin page ni pageSize). Muestra un indicador de carga mientras descarga.

### Control de acceso

Solo usuarios con permiso `usuarios.read` pueden ver esta pantalla.
Si el usuario no tiene el permiso, redirige a `/app`.

## Formato de entrega

Crea el archivo `E:\newprojects\titularice\muric\muricsyncfront\docs\prompts\sprint01\result-plan2-tarea3.md`
con un resumen de los cambios realizados.
```

---

### Tarea 4 — Registrar ruta y actualizar Menu.tsx

**Archivos a modificar:**
- `src/AppRoutes.tsx`
- `src/components/Menu.tsx`

---

**Prompt de ejecución:**

```
Estás trabajando en MURICSyncFront (React 19 + TypeScript + Vite).
El proyecto está en E:\newprojects\titularice\muric\muricsyncfront.

Lee estos archivos antes de empezar:
- src/AppRoutes.tsx
- src/components/Menu.tsx

## Tarea

### 1. Modificar `src/AppRoutes.tsx`

Agrega la nueva ruta protegida dentro del bloque `/app/*`:

```tsx
<Route path="reporte-usuarios" element={<ReporteUsuarios />} />
```

Importa el componente desde `src/features/security/components/ReporteUsuarios`.

### 2. Modificar `src/components/Menu.tsx`

Agrega el ítem **Reporte de Usuarios** → `/app/reporte-usuarios` en la sección
de administración de usuarios del menú.

Visibilidad: solo usuarios con permiso `usuarios.read`.
Sigue el mismo patrón de visibilidad condicional que ya usa `Menu.tsx`.
Ícono sugerido: `AssessmentOutlined` o `PeopleAlt` de MUI icons.

## Formato de entrega

Crea el archivo `E:\newprojects\titularice\muric\muricsyncfront\docs\prompts\sprint01\result-plan2-tarea4.md`
con un resumen de los cambios realizados.
```

---

## Orden de Ejecución

```
Tarea 1 (Modelos) → Tarea 2 (Servicio) → Tarea 3 (Componente) → Tarea 4 (Ruta + Menú)
```

---

## Checklist de Verificación Final

- [ ] `npm run build` sin errores de TypeScript
- [ ] Modelos `UserReportItemDto`, `UserReportFilterDto`, `UserReportResponseDto` creados
- [ ] `UserReportService.getReport()` llama al endpoint correcto con los filtros
- [ ] `UserReportService.exportCsv()` descarga el archivo CSV correctamente
- [ ] Pantalla `/app/reporte-usuarios` carga la tabla con datos reales del backend
- [ ] Filtro por estado (Activo/Inactivo/Todos) funciona
- [ ] Filtro por rol funciona
- [ ] Filtro por búsqueda (nombre/apellido/email) funciona
- [ ] Filtro por rango de último login funciona
- [ ] La paginación es del lado del servidor y funciona correctamente
- [ ] El botón "Exportar CSV" descarga el archivo con el nombre correcto
- [ ] El CSV abierto en Excel muestra tildes correctamente (BOM UTF-8)
- [ ] La pantalla solo es accesible para usuarios con permiso `usuarios.read`
- [ ] El ítem de menú "Reporte de Usuarios" aparece solo con el permiso correcto
