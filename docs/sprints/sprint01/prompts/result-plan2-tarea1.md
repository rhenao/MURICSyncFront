# Resultado — Plan 2, Tarea 1: Modelos del reporte de usuarios

**Fecha:** 2026-06-08  
**Estado:** Completada

---

## Archivo creado

### `src/features/security/models/UserReport.model.ts`

Tres interfaces en un solo archivo, siguiendo el estilo de `User.model.ts` (fechas como `string` ISO 8601):

| Interface | Uso |
|---|---|
| `UserReportItemDto` | Una fila del reporte (id, email, nombre, apellido, fullName, isActive, lastLoginAt?, createdAt, roles) |
| `UserReportFilterDto` | Parámetros de filtrado y paginación enviados como query string |
| `UserReportResponseDto` | Envelope paginado de respuesta (items, totalCount, page, pageSize, totalPages) |

**Notas de tipos:**
- `lastLoginAt` es `string?` (opcional) porque usuarios que nunca hicieron login tendrán `null` desde el backend.
- `sortBy` usa union type literal para restringir los valores válidos que acepta el backend.
- Fechas como `string` (no `Date`) consistente con el resto del proyecto.

---

## Verificación

```
npx tsc --noEmit → 0 errores, 0 warnings
```
