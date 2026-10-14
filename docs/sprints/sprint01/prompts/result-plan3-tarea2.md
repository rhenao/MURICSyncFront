# Resultado — Plan 3, Tarea 2: Servicio SecuritySettingsService

**Fecha:** 2026-06-08  
**Estado:** Completada

---

## Archivo creado

### `src/features/security/services/SecuritySettingsService.ts`

Objeto con dos funciones async:

| Función | Método | Endpoint | Descripción |
|---|---|---|---|
| `getSettings()` | GET | `/api/security-settings` | Retorna `SecuritySettingsDto` actual |
| `updateSettings(dto)` | PUT | `/api/security-settings` | Envía `UpdateSecuritySettingsDto`, retorna `SecuritySettingsDto` actualizado |

Ambas funciones extraen `response.data.data` (envelope `{ success, data }` estándar del backend).

**Sin try/catch**: los errores se propagan al componente consumidor, consistente con
`PermissionService`, `RoleService` y `UserReportService`.

---

## Decisiones de diseño

- **Objeto literal** (no clase): mismo patrón que `UserReportService`, `PermissionService` y `RoleService`.
- **Tipado genérico del response**: `axiosSecurityAPIClient.get<{ data: SecuritySettingsDto }>` para que TypeScript infiera correctamente el tipo del retorno sin casteos.
- **PUT en lugar de PATCH**: el endpoint del backend usa PUT con payload parcial (`UpdateSecuritySettingsDto` con todos los campos opcionales); el frontend envía solo lo que el usuario modificó.

---

## Verificación

```
npx tsc --noEmit → 0 errores, 0 warnings
```
