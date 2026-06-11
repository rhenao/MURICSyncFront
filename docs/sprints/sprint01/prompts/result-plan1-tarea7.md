# Resultado — Plan 1, Tarea 7: Rutas y Menú

**Fecha:** 2026-06-08  
**Estado:** Completada ✅ — Plan 1 completo

---

## Archivos modificados

### `src/AppRoutes.tsx`

Dos nuevos imports y dos nuevas rutas agregadas junto al bloque de rutas de seguridad:

```tsx
// Imports añadidos
import ListRoles from "./features/security/components/ListRoles";
import ListPermissions from "./features/security/components/ListPermissions";

// Rutas añadidas (dentro del bloque protegido RequireAuth)
<Route path="/app/lista-roles" element={<ListRoles />} />
<Route path="/app/lista-permisos" element={<ListPermissions />} />
```

Las rutas usan la convención `/app/lista-*` consistente con el resto de rutas del proyecto.

---

### `src/components/Menu.tsx`

**Cambio 1 — Nuevo import:**
```tsx
import { usePermission } from "../features/auth/hooks/usePermission";
```

**Cambio 2 — Nueva variable de permiso y actualización de `canSeguridad`:**
```tsx
const { hasPermission } = usePermission();
const canGestionRoles = hasPermission("roles.manage");
const canSeguridad = canAdminUsuarios || canCambioContrasena || canGestionRoles;
```
`canSeguridad` ahora incluye `canGestionRoles` para que el accordeón "Seguridad" 
sea visible también para usuarios que solo tienen `roles.manage` (sin rol ADMIN/SEGURIDAD clásico).

**Cambio 3 — Dos nuevos ítems dentro del `Collapse` "Seguridad":**

| Ítem | Ruta | Ícono | Condición |
|---|---|---|---|
| Gestión de Roles | `/app/lista-roles` | `AdminPanelSettings` | `canGestionRoles` |
| Gestión de Permisos | `/app/lista-permisos` | `VpnKey` | `canGestionRoles` |

Ambos ítems usan `NavLink` (mismo patrón que los ítems existentes) y se muestran 
solo si el usuario tiene el permiso `roles.manage`.

---

## Decisiones de diseño

- **Iconos reutilizados**: `AdminPanelSettings` y `VpnKey` ya estaban importados en 
  `Menu.tsx`. No se importaron íconos nuevos.

- **`canGestionRoles` separado de `canAdminUsuarios`**: permite control independiente 
  de visibilidad. Un usuario podría tener `roles.manage` sin tener rol `ADMIN` o 
  `SEGURIDAD` (si en el futuro se crea un rol específico de gestión de accesos).

- **Posición en el menú**: los ítems de Gestión de Roles y Permisos se añadieron 
  después de "Cambio de contraseña", agrupando todo el contenido de administración 
  de accesos en la sección "Seguridad" existente, sin crear una sección nueva.

---

## Verificación

```
npx tsc --noEmit → 0 errores, 0 warnings
```

---

## Resumen del Plan 1 completo

| Tarea | Archivo(s) | Estado |
|---|---|---|
| 1 | UserInfoDto, Permission.model, Role.model | ✅ |
| 2 | AuthProvider, AuthService, useAuth | ✅ |
| 3 | usePermission hook | ✅ |
| 4 | PermissionService, RoleService | ✅ |
| 5 | ListRoles, DialogRole, DialogAssignPermissions | ✅ |
| 6 | ListPermissions, DialogPermission | ✅ |
| 7 | AppRoutes, Menu | ✅ |
