# Resultado — Plan 1, Tarea 1: Actualizar modelos

**Fecha:** 2026-06-08  
**Estado:** Completada

---

## Archivos modificados

### `src/features/security/models/UserInfoDto.ts` *(modificado)*

Agregada la propiedad `permissions: string[]` al final de la interfaz.

No se requirió actualizar ninguna construcción de objeto vacío porque `UserInfoDto`
siempre se obtiene del backend (respuesta de login o endpoint `/me`) o de localStorage
como JSON deserializado — nunca se construye manualmente en el frontend.

```typescript
// Antes
roles: string[];

// Después
roles: string[];
permissions: string[];
```

---

### `src/features/security/models/Permission.model.ts` *(nuevo)*

Tres interfaces creadas:

| Interface | Uso |
|---|---|
| `Permission` | Lectura — respuesta del backend |
| `CreatePermissionDto` | Creación de nuevo permiso |
| `UpdatePermissionDto` | Actualización parcial de permiso |

Campos de `Permission`: `id` (Guid como string), `code`, `name`, `description?`, `module?`.

---

### `src/features/security/models/Role.model.ts` *(modificado)*

Agregado import de `Permission` desde `./Permission.model`.

Cuatro interfaces nuevas añadidas (la interfaz `Role` original no fue modificada):

| Interface | Uso |
|---|---|
| `RoleWithPermissions` | Respuesta del backend con lista de permisos incluida |
| `CreateRoleDto` | Creación de nuevo rol |
| `UpdateRoleDto` | Actualización parcial de rol (incluye `isActive`) |
| `AssignPermissionsDto` | Payload para asignar/reemplazar permisos a un rol |

---

## Decisiones de diseño

- **`permissions` no es opcional en `UserInfoDto`**: se declaró como `string[]` (no `string[]?`) porque el backend siempre lo incluye (puede ser arreglo vacío pero nunca `null`/`undefined`). Esto evita chequeos de null innecesarios en el código que lo consuma.

- **`Role` original conservada sin cambios**: la interfaz `Role` existente se usa en `ListUsers` y otros componentes para mostrar roles simples. Se creó `RoleWithPermissions` como tipo separado para la respuesta completa del nuevo endpoint `/api/roles`, evitando romper el código existente.

- **`Role.model.ts` ahora tiene `import` (antes no tenía ninguno)**: es el único cambio que podría romper compilación si algo importaba el módulo con `import type Role from` — verificado con `tsc --noEmit`, sin errores.

---

## Verificación

```
npx tsc --noEmit → 0 errores, 0 warnings
```
