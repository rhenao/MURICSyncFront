# Resultado — Plan 1, Tarea 4: Servicios RoleService y PermissionService

**Fecha:** 2026-06-08  
**Estado:** Completada

---

## Archivos creados

### `src/features/security/services/PermissionService.ts`

Objeto exportado (no clase) con 6 funciones async:

| Función | Método HTTP | Endpoint |
|---|---|---|
| `getAll()` | GET | `/api/permissions` |
| `getById(id)` | GET | `/api/permissions/{id}` |
| `getByModule(module)` | GET | `/api/permissions/module/{module}` |
| `create(dto)` | POST | `/api/permissions` |
| `update(id, dto)` | PUT | `/api/permissions/{id}` |
| `remove(id)` | DELETE | `/api/permissions/{id}` |

Todas las funciones extraen `response.data.data` para retornar el payload limpio.
`remove` retorna `void` (sin cuerpo de respuesta relevante).

---

### `src/features/security/services/RoleService.ts`

Objeto exportado con 9 funciones async:

| Función | Método HTTP | Endpoint |
|---|---|---|
| `getAll()` | GET | `/api/roles` |
| `getById(id)` | GET | `/api/roles/{id}` |
| `create(dto)` | POST | `/api/roles` |
| `update(id, dto)` | PUT | `/api/roles/{id}` |
| `remove(id)` | DELETE | `/api/roles/{id}` |
| `getPermissions(roleId)` | GET | `/api/roles/{id}/permissions` |
| `assignPermissions(roleId, dto)` | POST | `/api/roles/{id}/permissions` |
| `replacePermissions(roleId, dto)` | PUT | `/api/roles/{id}/permissions` |
| `removePermission(roleId, permissionId)` | DELETE | `/api/roles/{id}/permissions/{permissionId}` |

---

## Decisiones de diseño

- **Objetos literales en lugar de clases**: consistente con el patrón `AuthService` del proyecto
  (que exporta `new AuthService()`). Los objetos literales son más simples y directos
  cuando no hay estado interno ni herencia.

- **Sin manejo de errores interno**: los errores se re-lanzan automáticamente (no hay try/catch).
  Los errores HTTP son capturados por el interceptor de `axiosSecurityAPIClient`, que ya
  maneja el 401/403 con redirección. Los errores de negocio (400, 404, 409) llegarán
  al componente que llama al servicio para mostrar el mensaje al usuario.

- **Tipo genérico en el get**: se usa `axiosSecurityAPIClient.get<{ data: T }>()` para
  tipar la respuesta directamente y evitar casteos explícitos.

---

## Verificación

```
npx tsc --noEmit → 0 errores, 0 warnings
```
