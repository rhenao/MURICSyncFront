# Resultado — Plan 2, Tarea 3: Componente ReporteUsuarios

**Fecha:** 2026-06-08  
**Estado:** Completada

---

## Archivo creado

### `src/features/security/components/ReporteUsuarios.tsx`

Pantalla de reporte paginado de usuarios con filtros y exportación CSV.

---

## Estructura del componente

### Estado

| Estado | Tipo | Propósito |
|---|---|---|
| `filterInputs` | `FilterInputs` | Estado del formulario de filtros (no dispara fetch al cambiar) |
| `appliedFilters` | `FilterInputs` | Filtros enviados al backend (se actualiza al hacer "Buscar") |
| `pageIndex` | `number` | Página actual (base 0, MRT) |
| `pageSize` | `number` | Tamaño de página (default 50) |
| `rows` | `UserReportItemDto[]` | Filas de la tabla |
| `totalCount` | `number` | Total de registros para la paginación |
| `loading` | `boolean` | Estado de carga de la tabla |
| `error` | `string \| null` | Mensaje de error mostrado en Alert |
| `exporting` | `boolean` | Estado de carga del botón Exportar CSV |

### Helpers

- **`FilterInputs`** — interfaz local con `isActive: "" | "true" | "false"` para el Select de MUI
- **`EMPTY_FILTERS`** — objeto constante para resetear el formulario
- **`toApiFilter(f)`** — convierte `FilterInputs` a `UserReportFilterDto`:
  - `isActive: ""` → `undefined`, `"true"` → `true`, `"false"` → `false`
  - strings vacíos → `undefined` (no enviados al backend)

### Paginación (servidor)

- MRT usa índice base 0; el backend espera base 1 → se convierte con `page: pageIndex + 1`
- `onPaginationChange` recibe un `updater` (función o valor directo, per MRT v3 API)
- Cuando cambia el `pageSize`, se resetea a la página 0 automáticamente
- "Buscar" y "Limpiar" también resetean `pageIndex` a 0

### Guarda de permisos

Todos los hooks se llaman primero; el `if (!hasPermission("usuarios.read"))` con el `<Navigate>` va después del `useEffect` de fetch — cumple las reglas de hooks de React.

### Columnas MRT

| Columna | Tipo de celda |
|---|---|
| Nombre / Apellido / Email | Texto plano |
| Estado | `<Chip>` verde (Activo) / rojo (Inactivo) |
| Último Login | Fecha formateada con `toLocaleString("es-CO")` o `"Nunca"` en color `text.disabled` |
| Creado | `toLocaleDateString("es-CO")` |
| Roles | Array de `<Chip>` con variante outlined |

### Toolbar superior

`renderTopToolbarCustomActions` muestra el título "Reporte de Usuarios" a la izquierda y el botón "Exportar CSV" a la derecha. El botón muestra un `CircularProgress` de 18 px mientras exporta y queda deshabilitado durante carga o exportación.

---

## Decisiones de diseño

- **Estado de filtros separado** (`filterInputs` vs `appliedFilters`): el usuario puede escribir en los campos sin disparar fetch; solo "Buscar" actualiza `appliedFilters`.
- **`useEffect` único** con deps `[appliedFilters, pageIndex, pageSize, fetchData]`: reagrupa todos los triggers de fetch en un solo efecto, evitando doble fetch.
- **`useCallback` para `fetchData`** con deps vacías `[]`: la función es estable entre renders; el efecto solo se re-ejecuta cuando cambia el estado relevante.
- **`onPaginationChange` robusto**: acepta el updater funcional o un valor directo (contrato MRT v3 para `onPaginationChange`).

---

## Verificación

```
npx tsc --noEmit → 0 errores, 0 warnings
```
