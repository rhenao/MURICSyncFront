# Resultado — Plan 2, Tarea 4: Ruta y menú ReporteUsuarios

**Fecha:** 2026-06-08  
**Estado:** Completada

---

## Cambios realizados

### `src/AppRoutes.tsx`

- Import añadido: `import ReporteUsuarios from "./features/security/components/ReporteUsuarios";`
- Ruta añadida dentro del bloque protegido (`RequireAuth` + `Layout`):
  ```tsx
  <Route path="/app/reporte-usuarios" element={<ReporteUsuarios />} />
  ```

### `src/components/Menu.tsx`

- Import añadido: `Assessment` de `@mui/icons-material`
- Variable añadida:
  ```ts
  const canReporteUsuarios = hasPermission("usuarios.read");
  ```
- `canSeguridad` actualizado para incluir la nueva variable:
  ```ts
  const canSeguridad = canAdminUsuarios || canCambioContrasena || canGestionRoles || canReporteUsuarios;
  ```
- Ítem de menú añadido en el `Collapse` de Seguridad (después de "Gestión de Permisos"):
  ```tsx
  {canReporteUsuarios && (
    <ListItemButton component={NavLink} to="/app/reporte-usuarios" sx={{ pl: 6, py: 0.1 }}>
      <ListItemIcon><Assessment fontSize="small" color="primary" /></ListItemIcon>
      <ListItemText primary="Reporte de Usuarios" />
    </ListItemButton>
  )}
  ```

---

## Decisiones de diseño

- **Ubicación en menú**: el ítem va dentro de "Seguridad" (no en "Consultas") porque el permiso requerido (`usuarios.read`) es un permiso de gestión de seguridad, no de consultas MURIC.
- **Icono `Assessment`**: representa reportes/estadísticas, diferenciado del `Summarize` usado para consultas MURIC.
- **`canSeguridad` extendido**: un usuario con solo `usuarios.read` (sin rol ADMIN/SEGURIDAD ni `roles.manage`) ahora verá el grupo "Seguridad" en el menú y solo el ítem "Reporte de Usuarios".

---

## Verificación

```
npx tsc --noEmit → 0 errores, 0 warnings
```
