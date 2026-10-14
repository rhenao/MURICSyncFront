# Resultado — Plan 1, Tarea 5: ListRoles, DialogRole, DialogAssignPermissions

**Fecha:** 2026-06-08  
**Estado:** Completada

---

## Archivos creados

### `src/features/security/components/ListRoles.tsx`

Pantalla de gestión de roles. Sigue el patrón de `ListUsers.tsx`.

**Características:**
- Control de acceso: `usePermission` → `<Navigate to="/app" replace />` si no tiene `roles.manage`.
- Carga datos con `RoleService.getAll()` en `useCallback` + `useEffect`.
- Tabla con 5 columnas: Nombre, Descripción, Activo (chip), Permisos (contador), Creado (fecha).
- Columna Acciones con tres botones por fila: **Editar**, **Permisos**, **Eliminar**.
- Botón **Nuevo rol** en el toolbar de MRT.
- Diálogo de confirmación de eliminación inline con manejo de error del backend.
- Refresca llamando `loadRoles()` (sin `window.location.reload()`).

**Nota sobre hooks:** todos los hooks (`usePermission`, `useState`, `useCallback`, `useEffect`) 
se invocan incondicionalmente antes del early return con `<Navigate>`, cumpliendo las reglas 
de hooks de React.

---

### `src/features/security/components/DialogRole.tsx`

Diálogo para crear o editar un rol.

**Características:**
- Modo creación (`role == null`) vs. edición (`role != null`) determinado por la prop.
- `useEffect` con `[open, role]` resetea el formulario cada vez que el diálogo se abre.
- Switch "Activo" solo visible en modo edición.
- Validación frontend: nombre requerido (max 256), descripción max 500.
- Extrae y muestra errores del backend (`errors[]` o `message` del response).
- Estado `saving` con spinner en el botón y campos deshabilitados.
- Envía `description: undefined` en lugar de cadena vacía cuando el campo está en blanco.

---

### `src/features/security/components/DialogAssignPermissions.tsx`

Diálogo para asignar permisos a un rol.

**Características:**
- Carga todos los permisos con `PermissionService.getAll()` cuando `open && role` cambian.
- Inicializa `selectedIds` (Set<string>) con los IDs de `role.permissions`.
- Agrupa permisos por `module` con `groupByModule()` → `Record<string, Permission[]>`.
- Permisos sin módulo caen en el grupo "Sin módulo".
- Cada checkbox está envuelto en un `Tooltip` que muestra `code` y `description`.
- Guarda con `RoleService.replacePermissions()` (reemplaza todos los permisos del rol).
- Spinner de carga inicial y estado `saving` durante el guardado.

---

## Decisiones de diseño

- **`extractErrorMessage` en cada archivo**: no se creó una utilidad compartida para mantener 
  la independencia entre archivos. Es una función pequeña de 6 líneas.

- **`Set<string>` para selectedIds**: eficiente para toggle y lookup O(1), a diferencia de 
  un array. Se convierte a array solo al llamar `replacePermissions`.

- **Sin `window.location.reload()`**: `ListRoles` llama `loadRoles()` directamente, lo que 
  refresca solo los datos sin recargar el HTML/JS, mejorando la experiencia.

- **Diálogo de eliminación inline en `ListRoles`**: evita crear un componente adicional 
  para un diálogo de confirmación simple.

---

## Verificación

```
npx tsc --noEmit → 0 errores, 0 warnings
```
