# Resultado — Plan 2, Tarea 2: Servicio UserReportService

**Fecha:** 2026-06-08  
**Estado:** Completada

---

## Archivo creado

### `src/features/security/services/UserReportService.ts`

Objeto con dos funciones async:

| Función | Endpoint | Descripción |
|---|---|---|
| `getReport(filter)` | GET `/api/users/report` | Retorna `UserReportResponseDto` con paginación |
| `exportCsv(filter)` | GET `/api/users/report/export` | Descarga CSV directo en el browser |

**`cleanFilter`** — función auxiliar que elimina las entradas con valor `undefined`, `null`
o cadena vacía del objeto de filtros antes de pasarlas como `params` a Axios. Esto evita
que Axios envíe `?isActive=&role=` en la URL cuando el usuario no ha seleccionado esos filtros.

**`exportCsv`** — usa `responseType: 'blob'` para recibir el binario del CSV.
El nombre del archivo descargado sigue el patrón `reporte-usuarios-YYYYMMDD.csv`.
Crea un `<a>` temporal en el DOM, hace click programático y lo limpia inmediatamente.
`URL.revokeObjectURL` libera la memoria del blob después de la descarga.

---

## Decisiones de diseño

- **`cleanFilter` genérico**: recibe `Record<string, unknown>` para ser reutilizable.
  El cast `filter as Record<string, unknown>` es seguro porque los valores de
  `UserReportFilterDto` son todos tipos primitivos o `undefined`.

- **Sin try/catch**: los errores se propagan al componente consumidor, consistente
  con los demás servicios del proyecto (`PermissionService`, `RoleService`).

---

## Verificación

```
npx tsc --noEmit → 0 errores, 0 warnings
```
