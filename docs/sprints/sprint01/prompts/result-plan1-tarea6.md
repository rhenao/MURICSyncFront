# Resultado — Plan 1, Tarea 6: ListPermissions y DialogPermission

**Fecha:** 2026-06-08  
**Estado:** Completada

---

## Archivos creados

### `src/features/security/components/ListPermissions.tsx`

Pantalla de gestión de permisos. Sigue el patrón idéntico a `ListRoles.tsx`.

**Columnas:**
- **Código** — tipografía monospace para distinguirlo visualmente (ej. `params.read`)
- **Nombre** — texto plano
- **Módulo** — chip de color según módulo (ver tabla de colores abajo)
- **Descripción** — texto plano

**Colores de módulo:**

| Módulo | Color MUI |
|---|---|
| params | primary |
| cargas | info |
| usuarios | success |
| roles | warning |
| seguridad | error |
| otros / sin módulo | default |

**Acciones por fila:** Editar y Eliminar (sin botón "Permisos", a diferencia de `ListRoles`).

**Guarda de acceso:** `usePermission` → `<Navigate to="/app" replace />` si no tiene `roles.manage`.

---

### `src/features/security/components/DialogPermission.tsx`

Diálogo para crear o editar un permiso.

**Campos:**

| Campo | Comportamiento |
|---|---|
| Código | Editable en creación; **deshabilitado** en edición + helper text explicativo |
| Nombre | Siempre editable, requerido |
| Módulo | `Autocomplete freeSolo` con 5 sugerencias; acepta texto libre también |
| Descripción | Multiline, opcional |

**Campo Módulo:** usa `MUI Autocomplete` con `freeSolo: true` para ofrecer las sugerencias
`params, cargas, usuarios, roles, seguridad` pero sin obligar a elegir una de ellas.
Se maneja tanto el evento `onChange` (click en sugerencia) como `onInputChange` (texto libre).
Se normaliza a `undefined` cuando el valor es cadena vacía antes de enviar al backend.

---

## Decisiones de diseño

- **Código monospace en la tabla**: hace los códigos de permiso (que siguen el patrón
  `modulo.accion`) más fáciles de leer y distinguir entre sí.

- **`Autocomplete freeSolo` para Módulo**: la lista de módulos puede crecer en el futuro.
  Usando `freeSolo`, el usuario puede ingresar un módulo nuevo sin que el formulario lo
  rechace, mientras las sugerencias facilitan el ingreso de los valores comunes.

- **`module?.trim() || undefined`**: cuando el campo módulo está vacío se envía `undefined`
  (no incluido en el body JSON), consistente con el backend que acepta módulo como opcional.

---

## Verificación

```
npx tsc --noEmit → 0 errores, 0 warnings
```
