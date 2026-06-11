# Resultado — Plan 1, Tarea 3: Hook usePermission

**Fecha:** 2026-06-08  
**Estado:** Completada

---

## Archivo creado

### `src/features/auth/hooks/usePermission.ts`

Hook de conveniencia sobre `useAuth` que expone tres funciones de verificación de permisos:

| Función | Descripción |
|---|---|
| `hasPermission(code)` | `true` si el usuario tiene el permiso exacto |
| `hasAnyPermission(codes[])` | `true` si tiene al menos uno de los permisos de la lista |
| `hasAllPermissions(codes[])` | `true` si tiene TODOS los permisos de la lista |

`hasPermission` y `hasAnyPermission` vienen de `useAuth` (implementados en `AuthProvider`
con `useCallback`). `hasAllPermissions` se define localmente como composición de `hasPermission`.

---

## Decisiones de diseño

- **`hasAllPermissions` no usa `useCallback`**: se define como función inline dentro del
  hook. Cada renderizado que consuma `usePermission` recibe una nueva referencia, pero
  esto es aceptable porque `hasAllPermissions` raramente se pasa como prop a componentes
  hijo — su uso típico es evaluación directa en el cuerpo del componente (ej. guardas de ruta).

- **No duplica lógica**: delega en `hasPermission` de `useAuth` en lugar de acceder
  directamente a `user.permissions`, para que la lógica de evaluación esté en un solo lugar.

---

## Uso típico

```tsx
// Guarda de ruta
const { hasPermission } = usePermission();
if (!hasPermission('roles.manage')) return <Navigate to="/app" />;

// Visibilidad condicional
const { hasAnyPermission } = usePermission();
{hasAnyPermission(['usuarios.read', 'usuarios.write']) && <MenuItem />}

// Requerir todos los permisos
const { hasAllPermissions } = usePermission();
const canManageAll = hasAllPermissions(['roles.manage', 'seguridad.manage']);
```

---

## Verificación

```
npx tsc --noEmit → 0 errores, 0 warnings
```
