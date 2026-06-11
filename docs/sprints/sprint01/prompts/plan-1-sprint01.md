# Plan Sprint 01 — RBAC con Permisos Granulares (Frontend)

**Proyecto:** MURICSyncFront  
**Fecha:** 2026-06-08  
**Rama:** `rhenao-sprint04`

---

## Resumen Ejecutivo

El backend ya implementó permisos granulares: el JWT ahora incluye claims `permission`, el endpoint `/me` retorna `Permissions: string[]`, y existen nuevos endpoints REST para gestionar roles (`/api/roles`) y permisos (`/api/permissions`). El objetivo en el frontend es:

1. Actualizar los modelos y el contexto de autenticación para consumir los permisos del JWT.
2. Crear una capa de autorización basada en permisos (`usePermission`).
3. Construir las pantallas de gestión de roles y permisos.
4. Reemplazar la visibilidad de menú y rutas basada en roles por una basada en permisos.

### Permisos definidos en el backend

| Código | Módulo | Descripción |
| ------ | ------ | ----------- |
| `params.read` | params | Consultar parámetros |
| `params.write` | params | Gestionar parámetros |
| `cargas.read` | cargas | Ver cargas |
| `cargas.write` | cargas | Procesar cargas |
| `usuarios.read` | usuarios | Ver lista de usuarios |
| `usuarios.write` | usuarios | Gestionar usuarios |
| `usuarios.unlock` | usuarios | Desbloquear cuentas |
| `roles.manage` | roles | Gestionar roles y permisos |
| `seguridad.manage` | seguridad | Gestionar políticas de seguridad |

### Nuevos endpoints del backend

| Método | Ruta | Permiso requerido |
| ------ | ---- | ----------------- |
| GET | `/api/permissions` | `roles.manage` |
| GET | `/api/permissions/{id}` | `roles.manage` |
| GET | `/api/permissions/module/{module}` | `roles.manage` |
| POST | `/api/permissions` | `roles.manage` |
| PUT | `/api/permissions/{id}` | `roles.manage` |
| DELETE | `/api/permissions/{id}` | `roles.manage` |
| GET | `/api/roles` | `roles.manage` |
| GET | `/api/roles/{id}` | `roles.manage` |
| POST | `/api/roles` | `roles.manage` |
| PUT | `/api/roles/{id}` | `roles.manage` |
| DELETE | `/api/roles/{id}` | `roles.manage` |
| GET | `/api/roles/{id}/permissions` | `roles.manage` |
| POST | `/api/roles/{id}/permissions` | `roles.manage` |
| PUT | `/api/roles/{id}/permissions` | `roles.manage` |
| DELETE | `/api/roles/{id}/permissions/{permissionId}` | `roles.manage` |

---

## Tareas del Plan

### Tarea 1 — Actualizar modelos: UserInfoDto + nuevos modelos Permission y Role

**Archivos a modificar/crear:**

- `src/features/security/models/UserInfoDto.ts` *(modificar)*
- `src/features/security/models/Permission.model.ts` *(nuevo)*
- `src/features/security/models/Role.model.ts` *(modificar)*

---

**Prompt de ejecución:**

``` text
Estás trabajando en MURICSyncFront (React 19 + TypeScript + Vite).
El proyecto está en E:\newprojects\titularice\muric\muricsyncfront.

Lee estos archivos antes de empezar:
- src/features/security/models/UserInfoDto.ts
- src/features/security/models/Role.model.ts
- src/features/security/models/AuthResponseDto.ts

## Tarea

### 1. Modificar `src/features/security/models/UserInfoDto.ts`

Agrega la propiedad `permissions` al tipo existente `UserInfoDto`:

```typescript
permissions: string[];   // códigos de permiso, ej. ["params.read", "cargas.write"]
```

Asegúrate de que los lugares donde se construye un `UserInfoDto` vacío o por defecto
inicialicen `permissions` como arreglo vacío `[]`.

### 2. Crear `src/features/security/models/Permission.model.ts`

```typescript
export interface Permission {
  id: string;          // Guid
  code: string;        // "params.read"
  name: string;
  description?: string;
  module?: string;     // "params", "cargas", etc.
}

export interface CreatePermissionDto {
  code: string;
  name: string;
  description?: string;
  module?: string;
}

export interface UpdatePermissionDto {
  name?: string;
  description?: string;
  module?: string;
}
```

### 3. Modificar `src/features/security/models/Role.model.ts`

Añade al archivo las siguientes interfaces (sin eliminar las existentes):

```typescript
export interface RoleWithPermissions {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  permissions: Permission[];
}

export interface CreateRoleDto {
  name: string;
  description?: string;
}

export interface UpdateRoleDto {
  name?: string;
  description?: string;
  isActive?: boolean;
}

export interface AssignPermissionsDto {
  permissionIds: string[];  // lista de Guids
}
```

Importa `Permission` desde `./Permission.model`.

## Formato de entrega

Crea el archivo `E:\newprojects\titularice\muric\muricsyncfront\docs\prompts\sprint01\result-plan1-tarea1.md`
con un resumen de los cambios realizados: archivos modificados/creados, decisiones de diseño relevantes.
```

---

### Tarea 2 — Actualizar AuthService y AuthProvider para exponer permisos

**Archivos a modificar:**
- `src/features/security/services/AuthService.ts`
- `src/features/auth/components/AuthProvider.tsx`
- `src/features/auth/hooks/useAuth.ts`

---

**Prompt de ejecución:**

```
Estás trabajando en MURICSyncFront (React 19 + TypeScript + Vite).
El proyecto está en E:\newprojects\titularice\muric\muricsyncfront.

Lee estos archivos antes de empezar:
- src/features/security/services/AuthService.ts
- src/features/auth/components/AuthProvider.tsx
- src/features/auth/hooks/useAuth.ts
- src/features/security/models/UserInfoDto.ts  (ya tiene el campo permissions: string[])

## Contexto

El backend ahora devuelve en la respuesta del login y en el endpoint /me
el campo `permissions: string[]` dentro de `UserInfoDto`. El JWT también incluye
claims de tipo `"permission"` (uno por código). En el frontend necesitamos
exponer `hasPermission(code)` desde el contexto de autenticación.

## Tarea

### 1. Modificar `AuthService.ts`

El método `login()` ya guarda el usuario en localStorage. Verifica que el objeto
guardado incluya ahora el campo `permissions` que llega en la respuesta del backend.
Si la respuesta de login mapea el usuario a un tipo, asegúrate de que `permissions`
se incluya sin transformación.

El método `getUser()` retorna el usuario desde localStorage — no requiere cambios
siempre que el objeto guardado incluya `permissions`.

### 2. Modificar `AuthProvider.tsx`

Agrega `hasPermission` y `hasAnyPermission` al contexto:

```typescript
// En AuthContextValue agrega:
hasPermission: (code: string) => boolean;
hasAnyPermission: (codes: string[]) => boolean;
```

Implementación dentro del provider:

```typescript
const hasPermission = (code: string): boolean => {
  return user?.permissions?.includes(code) ?? false;
};

const hasAnyPermission = (codes: string[]): boolean => {
  return codes.some(code => user?.permissions?.includes(code) ?? false);
};
```

Expón ambas funciones en el objeto de contexto que retorna el provider.

### 3. Modificar `useAuth.ts`

`useAuth` retorna el valor del contexto — no requiere cambios de lógica,
pero actualiza el tipo de retorno si hay un tipo explícito declarado para
que `hasPermission` y `hasAnyPermission` estén disponibles con autocompletado.

## Formato de entrega

Crea el archivo `E:\newprojects\titularice\muric\muricsyncfront\docs\prompts\sprint01\result-plan1-tarea2.md`
con un resumen de los cambios realizados.
```

---

### Tarea 3 — Hook `usePermission`

**Archivos a crear:**
- `src/features/auth/hooks/usePermission.ts`

---

**Prompt de ejecución:**

```
Estás trabajando en MURICSyncFront (React 19 + TypeScript + Vite).
El proyecto está en E:\newprojects\titularice\muric\muricsyncfront.

Lee estos archivos antes de empezar:
- src/features/auth/hooks/useAuth.ts
- src/features/auth/components/AuthProvider.tsx  (ya expone hasPermission y hasAnyPermission)

## Tarea

Crea `src/features/auth/hooks/usePermission.ts`.

Este hook es una conveniencia sobre `useAuth` para casos donde sólo se necesita
verificar permisos, sin acceder al usuario completo.

```typescript
export function usePermission() {
  const { hasPermission, hasAnyPermission } = useAuth();

  // Retorna true si el usuario tiene TODOS los permisos indicados
  const hasAllPermissions = (codes: string[]): boolean =>
    codes.every(code => hasPermission(code));

  return { hasPermission, hasAnyPermission, hasAllPermissions };
}
```

Úsalo en componentes así:
```tsx
const { hasPermission } = usePermission();
if (!hasPermission('roles.manage')) return <Navigate to="/app" />;
```

## Formato de entrega

Crea el archivo `E:\newprojects\titularice\muric\muricsyncfront\docs\prompts\sprint01\result-plan1-tarea3.md`
con un resumen de los cambios realizados.
```

---

### Tarea 4 — Servicios: RoleService y PermissionService

**Archivos a crear:**
- `src/features/security/services/RoleService.ts`
- `src/features/security/services/PermissionService.ts`

---

**Prompt de ejecución:**

```
Estás trabajando en MURICSyncFront (React 19 + TypeScript + Vite).
El proyecto está en E:\newprojects\titularice\muric\muricsyncfront.

Lee estos archivos antes de empezar:
- src/api/axiosSecurityAPIClient.ts
- src/features/security/models/Permission.model.ts
- src/features/security/models/Role.model.ts  (incluye RoleWithPermissions, CreateRoleDto, UpdateRoleDto, AssignPermissionsDto)
- src/features/security/services/AuthService.ts  (para ver el estilo)

## Contexto de los endpoints del backend

BASE: VITE_API_URL_SECURITY (axiosSecurityAPIClient)

Permisos: GET /api/permissions, GET /api/permissions/{id}, GET /api/permissions/module/{module},
          POST /api/permissions, PUT /api/permissions/{id}, DELETE /api/permissions/{id}

Roles:    GET /api/roles, GET /api/roles/{id}, POST /api/roles, PUT /api/roles/{id},
          DELETE /api/roles/{id}
          GET /api/roles/{id}/permissions
          POST /api/roles/{id}/permissions    — agrega permisos (sin quitar existentes)
          PUT /api/roles/{id}/permissions     — reemplaza TODOS los permisos
          DELETE /api/roles/{id}/permissions/{permissionId}

Las respuestas del backend tienen el formato:
{ success: boolean, data: T }
o en listas:
{ success: boolean, data: T[] }

## Tarea

### `src/features/security/services/PermissionService.ts`

Crea un objeto `PermissionService` (no clase) con las siguientes funciones async:

```typescript
getAll(): Promise<Permission[]>
getById(id: string): Promise<Permission>
getByModule(module: string): Promise<Permission[]>
create(dto: CreatePermissionDto): Promise<Permission>
update(id: string, dto: UpdatePermissionDto): Promise<Permission>
remove(id: string): Promise<void>
```

Cada función usa `axiosSecurityAPIClient` y extrae `response.data.data`.
Maneja errores rethrowing el error original para que el componente lo capture.

### `src/features/security/services/RoleService.ts`

Crea un objeto `RoleService` con las siguientes funciones async:

```typescript
getAll(): Promise<RoleWithPermissions[]>
getById(id: string): Promise<RoleWithPermissions>
create(dto: CreateRoleDto): Promise<RoleWithPermissions>
update(id: string, dto: UpdateRoleDto): Promise<RoleWithPermissions>
remove(id: string): Promise<void>
getPermissions(roleId: string): Promise<Permission[]>
assignPermissions(roleId: string, dto: AssignPermissionsDto): Promise<void>
replacePermissions(roleId: string, dto: AssignPermissionsDto): Promise<void>
removePermission(roleId: string, permissionId: string): Promise<void>
```

## Formato de entrega

Crea el archivo `E:\newprojects\titularice\muric\muricsyncfront\docs\prompts\sprint01\result-plan1-tarea4.md`
con un resumen de los cambios realizados.
```

---

### Tarea 5 — Componentes: ListRoles y DialogRole

**Archivos a crear:**
- `src/features/security/components/ListRoles.tsx`
- `src/features/security/components/DialogRole.tsx`
- `src/features/security/components/DialogAssignPermissions.tsx`

---

**Prompt de ejecución:**

```
Estás trabajando en MURICSyncFront (React 19 + TypeScript + Vite, MUI, MaterialReactTable).
El proyecto está en E:\newprojects\titularice\muric\muricsyncfront.

Lee estos archivos antes de empezar:
- src/features/security/components/ListUsers.tsx           (patrón de tabla)
- src/features/security/components/DialogUser.tsx          (patrón de diálogo)
- src/features/security/services/RoleService.ts
- src/features/security/services/PermissionService.ts
- src/features/security/models/Role.model.ts
- src/features/security/models/Permission.model.ts
- src/features/auth/hooks/usePermission.ts

## Tarea

### `src/features/security/components/ListRoles.tsx`

Pantalla de gestión de roles. Sigue el mismo patrón visual que `ListUsers.tsx`.

Columnas de la tabla:
- Nombre
- Descripción
- Activo (chip verde/rojo)
- Permisos (número de permisos asignados, ej. "5 permisos")
- Fecha de creación (formateada)

Acciones por fila:
- **Editar** — abre `DialogRole` en modo edición
- **Permisos** — abre `DialogAssignPermissions`
- **Eliminar** — confirmación y llama `RoleService.remove()`

Acción global:
- Botón **Nuevo rol** — abre `DialogRole` en modo creación

Al inicio, carga los roles con `RoleService.getAll()`. Maneja estado `loading` y errores.
Refresca la tabla tras cada operación exitosa.

Solo usuarios con permiso `roles.manage` pueden ver esta pantalla
(usa `usePermission` para redirigir si no tienen el permiso).

### `src/features/security/components/DialogRole.tsx`

Diálogo para crear o editar un rol.

Props:
```typescript
interface DialogRoleProps {
  open: boolean;
  role?: RoleWithPermissions | null;  // null = modo creación
  onClose: () => void;
  onSaved: () => void;
}
```

Campos del formulario:
- **Nombre** (requerido, max 256 caracteres)
- **Descripción** (opcional, multiline, max 500 caracteres)
- **Activo** (switch, solo visible en modo edición)

Al guardar:
- Creación: `RoleService.create(dto)`
- Edición: `RoleService.update(role.id, dto)`

Maneja errores del backend (mensajes del servidor) y estado `saving`.

### `src/features/security/components/DialogAssignPermissions.tsx`

Diálogo para asignar permisos a un rol.

Props:
```typescript
interface DialogAssignPermissionsProps {
  open: boolean;
  role: RoleWithPermissions | null;
  onClose: () => void;
  onSaved: () => void;
}
```

Al abrirse:
1. Carga todos los permisos con `PermissionService.getAll()`
2. Los permisos actuales del rol están en `role.permissions`
3. Inicializa el estado local con los IDs de permisos ya asignados

Presentación:
- Agrupa los permisos por `module`
- Por cada módulo: título del módulo + lista de checkboxes con el nombre del permiso
- Tooltip en cada checkbox con el campo `code` y `description`

Al guardar:
- Llama `RoleService.replacePermissions(role.id, { permissionIds: [...selectedIds] })`

## Formato de entrega

Crea el archivo `E:\newprojects\titularice\muric\muricsyncfront\docs\prompts\sprint01\result-plan1-tarea5.md`
con un resumen de los cambios realizados.
```

---

### Tarea 6 — Componente ListPermissions

**Archivos a crear:**
- `src/features/security/components/ListPermissions.tsx`
- `src/features/security/components/DialogPermission.tsx`

---

**Prompt de ejecución:**

```
Estás trabajando en MURICSyncFront (React 19 + TypeScript + Vite, MUI, MaterialReactTable).
El proyecto está en E:\newprojects\titularice\muric\muricsyncfront.

Lee estos archivos antes de empezar:
- src/features/security/components/ListRoles.tsx  (sigue el mismo patrón)
- src/features/security/services/PermissionService.ts
- src/features/security/models/Permission.model.ts
- src/features/auth/hooks/usePermission.ts

## Tarea

### `src/features/security/components/ListPermissions.tsx`

Pantalla de gestión de permisos. Sigue el mismo patrón visual que `ListRoles.tsx`.

Columnas de la tabla:
- Código (ej. "params.read")
- Nombre
- Módulo (chip de color)
- Descripción

Acciones por fila:
- **Editar** — abre `DialogPermission` en modo edición
- **Eliminar** — confirmación y llama `PermissionService.remove()`

Acción global:
- Botón **Nuevo permiso** — abre `DialogPermission` en modo creación

Al inicio, carga los permisos con `PermissionService.getAll()`. Maneja loading y errores.
Refresca la tabla tras cada operación exitosa.

Solo usuarios con permiso `roles.manage` pueden ver esta pantalla.

### `src/features/security/components/DialogPermission.tsx`

Diálogo para crear o editar un permiso.

Props:
```typescript
interface DialogPermissionProps {
  open: boolean;
  permission?: Permission | null;  // null = modo creación
  onClose: () => void;
  onSaved: () => void;
}
```

Campos del formulario:
- **Código** (requerido, max 200 chars — solo editable en creación, readonly en edición)
- **Nombre** (requerido, max 200 chars)
- **Módulo** (opcional, max 100 chars, con sugerencias: params, cargas, usuarios, roles, seguridad)
- **Descripción** (opcional, multiline)

Al guardar:
- Creación: `PermissionService.create(dto)`
- Edición: `PermissionService.update(permission.id, dto)`

## Formato de entrega

Crea el archivo `E:\newprojects\titularice\muric\muricsyncfront\docs\prompts\sprint01\result-plan1-tarea6.md`
con un resumen de los cambios realizados.
```

---

### Tarea 7 — Registrar rutas y actualizar Menu.tsx

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
- src/features/auth/hooks/usePermission.ts

## Tarea

### 1. Modificar `src/AppRoutes.tsx`

Agrega dos nuevas rutas protegidas dentro del bloque `/app/*`:

```tsx
<Route path="lista-roles" element={<ListRoles />} />
<Route path="lista-permisos" element={<ListPermissions />} />
```

Importa los componentes desde:
- `src/features/security/components/ListRoles`
- `src/features/security/components/ListPermissions`

### 2. Modificar `src/components/Menu.tsx`

Agrega una nueva sección "Seguridad" (o agrupa dentro de la sección de administración
existente) con los ítems:

- **Gestión de Roles** → `/app/lista-roles` (visible solo con permiso `roles.manage`)
- **Gestión de Permisos** → `/app/lista-permisos` (visible solo con permiso `roles.manage`)

Para controlar la visibilidad, usa `usePermission` del contexto de autenticación.
Sigue el mismo patrón que usa `Menu.tsx` actualmente para ocultar ítems según el rol del usuario.

Asegúrate de que el ícono sea consistente con el resto del menú (MUI icons).
Sugerencias: `AdminPanelSettings` para Roles, `VpnKey` para Permisos.

## Formato de entrega

Crea el archivo `E:\newprojects\titularice\muric\muricsyncfront\docs\prompts\sprint01\result-plan1-tarea7.md`
con un resumen de los cambios realizados.
```

---

## Orden de Ejecución

```
Tarea 1 (Modelos)
    ↓
Tarea 2 (AuthProvider + AuthService)
    ↓
Tarea 3 (usePermission hook)
    ↓
Tarea 4 (Servicios RoleService + PermissionService)
    ↓
Tarea 5 (ListRoles + DialogRole + DialogAssignPermissions)
    ↓
Tarea 6 (ListPermissions + DialogPermission)
    ↓
Tarea 7 (Rutas + Menú)
```

---

## Checklist de Verificación Final

- [ ] `npm run build` sin errores de TypeScript
- [ ] `UserInfoDto` tiene campo `permissions: string[]`
- [ ] `AuthProvider` expone `hasPermission` y `hasAnyPermission`
- [ ] `usePermission` hook disponible y funcional
- [ ] Login exitoso: el objeto usuario en localStorage incluye `permissions`
- [ ] Menú muestra "Gestión de Roles" y "Gestión de Permisos" solo con `roles.manage`
- [ ] `ListRoles` carga y muestra los roles con sus permisos
- [ ] `DialogRole` crea y edita roles correctamente
- [ ] `DialogAssignPermissions` muestra checkboxes agrupados por módulo y guarda correctamente
- [ ] `ListPermissions` carga y muestra permisos
- [ ] `DialogPermission` crea y edita permisos
- [ ] Rutas `/app/lista-roles` y `/app/lista-permisos` funcionan
