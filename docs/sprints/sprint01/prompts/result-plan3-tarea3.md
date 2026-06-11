# Resultado — Plan 3, Tarea 3: Componente FormConfigSeguridad

**Fecha:** 2026-06-08  
**Estado:** Completada

---

## Archivo creado

### `src/features/security/components/FormConfigSeguridad.tsx`

Formulario de configuración de políticas de seguridad con 3 secciones MUI `Card`,
pie con auditoría y botón de guardar.

---

## Estructura del componente

### Estado

| Estado | Tipo | Propósito |
|---|---|---|
| `loading` | `boolean` | Spinner inicial mientras carga del backend |
| `saving` | `boolean` | Deshabilita botón y muestra indicador durante guardado |
| `initialForm` | `FormState \| null` | Snapshot de los valores cargados — base para calcular el diff |
| `form` | `FormState \| null` | Estado editable del formulario |
| `audit` | `{ updatedAt, updatedBy? } \| null` | Texto de auditoría del pie |
| `loadError` | `string \| null` | Error de carga inicial (muestra Alert) |
| `snackbar` | `{ open, message, severity }` | Feedback de éxito/error tras guardar |

### Helpers (fuera del componente)

| Función | Propósito |
|---|---|
| `settingsToForm(s)` | Convierte `SecuritySettingsDto` a `FormState` (sin campos de auditoría) |
| `buildDiff(original, current)` | Retorna `UpdateSecuritySettingsDto` solo con los campos que cambiaron |
| `extractErrorMessage(err)` | Extrae mensaje de `AxiosError.response.data.message` o `.errors[]` |

### `buildDiff` — guardado parcial

Itera `Object.keys(original)` comparando cada campo con `current`. Solo incluye en el DTO
los campos que cambiaron. Si no hay diferencias, muestra Snackbar informativo sin llamar al backend.

### Orden de hooks (reglas de React)

Todos los `useState` y `useEffect` se invocan antes del `if (!hasPermission("seguridad.manage"))`.
Los `if (loading)` / `if (loadError)` / `if (!form)` van después del guard de permisos.

### Ciclo de actualización exitosa

Al recibir la respuesta del PUT: `settingsToForm(result)` actualiza tanto `form` como `initialForm`,
de modo que el próximo "Guardar" calculará el diff desde los valores ya persistidos — sin recargar la página.

---

## Secciones del formulario

| Sección | Controles |
|---|---|
| **Políticas de Contraseña** | 4 `Switch` (dígito, minúscula, mayúscula, especial) + 2 `TextField` número (longitud 4–128, únicos 0–10) |
| **Bloqueo de Cuenta** | 2 `TextField` número (intentos 1–20, duración 1–1440) + 1 `Switch` (nuevos usuarios) |
| **Inicio de Sesión** | 2 `Switch` (email confirmado, teléfono confirmado) |
| **Pie** | Texto auditoría `"Última modificación: {fecha} [por {usuario}]"` + botón Guardar |

---

## Verificación

```
npx tsc --noEmit → 0 errores, 0 warnings
```
