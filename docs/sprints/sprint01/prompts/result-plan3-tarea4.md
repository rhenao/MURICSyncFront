# Resultado — Plan 3, Tarea 4: Ruta y menú FormConfigSeguridad

**Fecha:** 2026-06-08  
**Estado:** Completada

---

## Cambios realizados

### `src/AppRoutes.tsx`

- Import añadido:
  ```tsx
  import FormConfigSeguridad from "./features/security/components/FormConfigSeguridad";
  ```
- Ruta añadida dentro del bloque protegido (`RequireAuth` + `Layout`):
  ```tsx
  <Route path="/app/config-seguridad" element={<FormConfigSeguridad />} />
  ```

### `src/components/Menu.tsx`

- Import añadido: `Tune` de `@mui/icons-material`
- Variable añadida:
  ```ts
  const canConfigSeguridad = hasPermission("seguridad.manage");
  ```
- `canSeguridad` actualizado para incluir la nueva variable:
  ```ts
  const canSeguridad = canAdminUsuarios || canCambioContrasena || canGestionRoles || canReporteUsuarios || canConfigSeguridad;
  ```
- Ítem de menú añadido en el `Collapse` de Seguridad (después de "Reporte de Usuarios"):
  ```tsx
  {canConfigSeguridad && (
    <ListItemButton component={NavLink} to="/app/config-seguridad" sx={{ pl: 6, py: 0.1 }}>
      <ListItemIcon><Tune fontSize="small" color="primary" /></ListItemIcon>
      <ListItemText primary="Parámetros de Seguridad" />
    </ListItemButton>
  )}
  ```

---

## Decisiones de diseño

- **Ícono `Tune`**: representa ajuste/configuración, diferenciado de `Settings` (Administración) y `AdminPanelSettings` (encabezado Seguridad).
- **`canSeguridad` extendido**: un usuario con solo `seguridad.manage` (sin otros roles ni permisos) verá el grupo "Seguridad" y únicamente el ítem "Parámetros de Seguridad".
- **Path completo** `/app/config-seguridad`: consistente con todos los demás routes del archivo (no se usa path relativo).

---

## Verificación

```
npx tsc --noEmit → 0 errores, 0 warnings
```
