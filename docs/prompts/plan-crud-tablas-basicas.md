# Plan: Crear, Editar y Borrar en las tablas básicas (`ListGeneral`)

Fecha: 2026-09-25 · Rama: `rhenao-sprint04`
Versión 2: validada contra el backend `MuricSyncBack` (commit `4818e64`).

## 1. Objetivo

Hoy `src/features/param/shared/ListGeneral.tsx` solo lista registros. El botón "Editar" existe, pero solo lanza un `alert()`. Este plan agrega a `ListGeneral` las acciones **Crear**, **Editar** y **Borrar**, de forma genérica, para que las 31 tablas básicas de `src/features/param/components/` las tengan sin escribir un formulario por tabla.

## 2. Estado actual del frontend

| Elemento | Situación |
|---|---|
| `ListGeneral.tsx` | Recibe `endpoint`, `title`, `columns`. Pinta `MaterialReactTable`. Columna "Acciones" con `alert()` si `SHOW_EDIT_BUTTON && isAdmin`. |
| `SHOW_EDIT_BUTTON` | En el working tree está en `true` (cambio sin commit), pero `CLAUDE.md` dice `false`. |
| `useEntidades` | Solo hace GET. No expone una función para recargar. |
| `ColumnConfig` | `accessorKey`, `header`, `size`, `nullFallback`. No tiene metadatos de formulario. |
| `getRowId` | **Bug.** Lee `row["codigo"]`, pero el API devuelve `Codigo` (PascalCase). Todas las filas quedan con id `""`. |
| Permisos | La tabla mira el rol `ADMIN`. Ya existen `useAuth().hasPermission(code)` y `usePermission()`. |
| Patrón de diálogos | `src/features/security/components/DialogRole.tsx` (MUI `Dialog`, `Alert` de errores, `extractBackendErrors`). |
| Validación | `yup` ya es dependencia. |

## 3. Validación contra el backend

### 3.1 Contrato de los endpoints (confirmado en el código)

Los 31 controladores de `Controllers/Param/` siguen el mismo patrón OData, con prefijo `odata/v1`. Todos exponen POST, PUT y DELETE. **Ninguno expone PATCH**, excepto `CondicionBien` (ver 3.3).

| Acción | Petición | Permiso | Respuesta OK | Errores controlados |
|---|---|---|---|---|
| Listar | `GET /{Entidad}` | `params.read` | `200` `{ value: [...] }` | — |
| Crear | `POST /{Entidad}` con la entidad completa | `params.write` | `201` con la entidad | `400` con texto `"Llave primaria duplicada (X)"` |
| Editar | `PUT /{Entidad}({clave})` con la entidad **completa** | `params.write` | `204` sin cuerpo | `400` `"El ID de la fila no coincide..."` / `"Error actualizando, Fila no existe."` |
| Borrar | `DELETE /{Entidad}({clave})` | `params.write` | `200` | `400` `"Error eliminando, Fila no existe."` |

Otros datos confirmados:

- **Clave:** todas usan `Codigo`, con `ValueGeneratedNever()`. **El código siempre lo digita el usuario**: se edita al crear y queda de solo lectura al editar.
- **Formato de la clave en la URL:** numérica, `/TipoCredito(3)`. Texto, `/EstadoRegistro('ACT')`, escapando `'` → `''` y con `encodeURIComponent`.
- **Nombres de propiedades:** PascalCase en la respuesta y en el payload (no hay `EnableLowerCamelCase`). Se envían las mismas claves que se reciben.
- **Permiso:** `params.write` ya existe en `Program.cs` y en `Data/PermissionSeed.cs` ("Gestionar parámetros"). **No hay que crear permisos nuevos.**
- **Auditoría:** `AuditSaveChangesInterceptor` registra el usuario real a partir del claim `NameIdentifier`. La columna sombra `Usuario` de cada tabla, en cambio, queda con el valor fijo `"usuario"` (ver 3.3).
- **Errores no controlados:** `GlobalExceptionHandler` responde `500` con `{ success: false, message, traceId, detail }`.

### 3.2 Configuración por tabla (fuente: `Models/Param/*.cs`)

"En uso" indica que la tabla es referenciada por `Credito` o `MovimientoCartera` con `DeleteBehavior.Restrict`. Borrar un registro usado **falla en la base de datos**.
"SaveChanges" indica cómo reacciona el servicio a un error de base de datos (ver 3.3).

| Tabla (endpoint) | Clave | Campos editables (máx.) | En uso | SaveChanges |
|---|---|---|---|---|
| AntiguedadEmpresa | int | Descripcion (100), DescripcionDetallada (opcional, sin límite) | — | oculta el error |
| CalidadDeudor | int | Descripcion (100) | Sí | lanza el error |
| CalificacionCredito | **string (1)** | Descripcion (100) | Sí | lanza el error |
| CanalDesembolso | int | Descripcion (100) | — | oculta el error |
| CanalOriginacion | int | Descripcion (100) | — | oculta el error |
| ClaseDeDeudor | int | Descripcion (100), DescripcionDetallada (opcional) | — | oculta el error |
| CondicionBien | int | Descripcion (100) | — | lanza el error |
| DestinoCredito | int | Descripcion (100) | — | lanza el error |
| EstadoCredito | int | Descripcion (100), DescripcionDetallada (**requerida**, 400) | Sí | lanza el error |
| EstadoRegistro | **string (8)** | Descripcion (100) | Sí | lanza el error |
| FranquisiaCredito | int | Descripcion (100) | — | lanza el error |
| GrupoEtnico | int | Descripcion (100), DescripcionDetallada (opcional) | — | oculta el error |
| IndicadorVictima | int | Descripcion (100) | — | lanza el error |
| Modalidad | int | Descripcion (100) | Sí | lanza el error |
| ModeloProvisiones | int | Descripcion (100) | Sí | lanza el error |
| Periodicidad | int | Descripcion (100) | Sí | **oculta el error** |
| PeriodoGracia | int | Descripcion (100) | Sí | lanza el error |
| PlazoCredito | int | Tipo (200), Descripcion (100) | — | oculta el error |
| ProductoCredito | int | Tipo (100), Descripcion (100), DescripcionDetallada (opcional) | Sí | **oculta el error** |
| RangoPorMontos | int | Tipo (200), Descripcion (100) | — | oculta el error |
| SexoBiologico | int | Descripcion (100) | — | oculta el error |
| TamanoEmpresa | int | Descripcion (100) | — | lanza el error |
| TipoConsolidacion | int | Descripcion (100) | — | lanza el error |
| TipoContratacion | int | Descripcion (100) | — | lanza el error |
| TipoCredito | int | Descripcion (100), DescripcionDetallada (opcional) | — | oculta el error |
| TipoEmpleado (pantalla "Condición laboral") | int | Descripcion (100) | — | lanza el error |
| TipoGarantia | int | Descripcion (**150**) | Sí | lanza el error |
| TipoPoliza | int | Descripcion (**150**) | — | oculta el error |
| TipoRecuperacion | int | Descripcion (100) | — | lanza el error |
| TipoTasa | **string (10)** | Descripcion (**150**) | Sí | **oculta el error** |
| Universalidades | int | Descripcion (100), **Estado** (1: "A"/"I") | — | lanza el error |

### 3.3 Problemas encontrados

**En el backend (hay que corregirlos antes de habilitar las acciones o a la vez):**

| # | Severidad | Problema | Impacto | Corrección propuesta |
|---|---|---|---|---|
| B1 | **Alta** | En 14 servicios `SaveChanges()` atrapa la excepción y devuelve `0`, y los controladores no revisan ese valor. | Un POST, PUT o DELETE que falla en la base de datos responde **201/204/200 como si hubiera funcionado**. El caso más grave es borrar un registro en uso de `Periodicidad`, `ProductoCredito` o `TipoTasa`: el usuario ve "eliminado" y el registro sigue ahí. | Dejar que `SaveChanges` propague la excepción. En el controlador, capturar `DbUpdateException`: violación de FK (Postgres `23503`) → `409` "Registro en uso"; clave duplicada (`23505`) → `409`. |
| B2 | **Alta** | En `CondicionBienController`, `GetById`, `Patch` y `Delete` no tienen `[RequirePermission]`. Solo exigen `[Authorize]`. | Cualquier usuario autenticado, aunque no tenga `params.write`, puede modificar o borrar registros de Condición del bien. | Agregar `[RequirePermission("params.write")]` a Patch/Delete y `params.read` a GetById. |
| B3 | Media | `CondicionBienController` usa `[ApiController]` + `[Route("odata/[controller]")]`, es decir `/odata/CondicionBien`, fuera del prefijo `/odata/v1` que usa el front. Además, su PUT no recibe la clave en la URL. | Es probable que las peticiones del front a `/odata/v1/CondicionBien` no lleguen a esa acción. Hay que confirmarlo con una petición real. | Alinearlo con los otros 30 controladores: rutas por convención OData y `Put([FromODataUri] int key, ...)`. |
| B4 | Media | En los servicios que "lanzan el error", un fallo de base de datos (por ejemplo un registro en uso) termina en `500` con un mensaje genérico. | El usuario no sabe por qué no pudo borrar. | Se resuelve con la misma corrección de B1 (`409` con mensaje claro). |
| B5 | Media | Los controladores no tienen `[ApiController]` ni revisan `ModelState`. Si el cuerpo no se puede deserializar, `row` llega en `null` y el servidor falla con `500`. Tampoco se validan `MaxLength` antes de guardar. | Un texto demasiado largo llega a Postgres y falla allí, lo que dispara B1 o B4. | Revisar `if (!ModelState.IsValid \|\| row == null) return BadRequest(ModelState);`. En el front se valida igual. |
| B6 | Baja | Los 31 servicios guardan `Usuario = "usuario"` fijo (hay un TODO comentado con `ApplicationUserTokenHelper`). | La columna `Usuario` de las tablas no sirve para trazabilidad. El audit log sí registra el usuario real. | Tomar el usuario de los claims. |
| B7 | Baja | POST por duplicado hace `StatusCode = 406` y luego `return BadRequest(...)`. El código final que llega al cliente es `400`. | Solo es confusión en el código. | Devolver `Conflict(...)` (`409`). |

**En el frontend (se corrigen dentro de este desarrollo):**

| # | Problema | Corrección |
|---|---|---|
| F1 | `getRowId` usa `codigo` en minúscula. | Usar `keyField` (por defecto `Codigo`). |
| F2 | `ListUniversalidades` usa la columna `Activo`, pero el backend devuelve `Estado`. La columna sale vacía. | Cambiarla a `Estado`, y en el formulario usar un select A = Activo / I = Inactivo. |
| F3 | `ListEstadoCredito` usa `descripcionDetallada` en minúscula. La columna sale vacía. | Cambiarla a `DescripcionDetallada`. |
| F4 | Los modelos TypeScript (`models/*.model.ts`) están en camelCase y algunos no coinciden con el backend (`Universalidades.activo`, las longitudes de `TipoGarantia`/`TipoPoliza`/`TipoTasa`). | No se usan en `ListGeneral`. La fuente de verdad para el formulario será la tabla 3.2. Opcional: alinearlos. |

## 4. Diseño propuesto

### 4.1 Extender `ColumnConfig` (compatible con las 31 tablas)

```ts
export type FieldType = "text" | "multiline" | "number" | "select";

export interface ColumnConfig {
  accessorKey: string;
  header: string;
  size: number;
  nullFallback?: string;

  // --- Metadatos de formulario (opcionales) ---
  fieldType?: FieldType;             // por defecto "text"
  required?: boolean;                // por defecto true, salvo si hay nullFallback
  maxLength?: number;
  options?: { value: string | number; label: string }[]; // para "select"
  hideInForm?: boolean;
}
```

### 4.2 Nuevas props de `ListGeneral`

```ts
interface ListGeneralProps {
  endpoint: string;
  title: string;
  columns: ColumnConfig[];
  keyField?: string;             // por defecto "Codigo"
  keyType?: "number" | "string"; // por defecto "number"
  keyMaxLength?: number;         // solo para claves de texto (1, 8, 10)
  allowCreate?: boolean;         // por defecto true
  allowEdit?: boolean;           // por defecto true
  allowDelete?: boolean;         // por defecto true
}
```

La clave (`Codigo`) se incluye siempre en el formulario: editable al crear, deshabilitada al editar. Para claves numéricas se envía como `number`, no como texto, porque OData rechaza `"3"` en un campo `Edm.Int32`.

### 4.3 Archivos

| Archivo | Acción | Responsabilidad |
|---|---|---|
| `src/hooks/useEntidades.ts` | Modificar | Exponer `recargar()` sin romper la firma actual. |
| `src/features/param/services/paramService.ts` | Nuevo | `create(endpoint, row)` → POST. `update(endpoint, key, keyType, row)` → **PUT con la entidad completa**. `remove(endpoint, key, keyType)` → DELETE. `buildKeySegment(key, keyType)`. |
| `src/utils/extractBackendErrors.ts` | Nuevo | Reunir en un solo lugar la lectura de errores: cuerpo texto (`"Llave primaria duplicada (X)"`), `{ success, message, traceId }`, `{ errors: [] }`, OData `{ error: { message, details } }` y `ModelState`. Reutilizarlo en los diálogos de seguridad. |
| `src/features/param/shared/buildParamSchema.ts` | Nuevo | Esquema `yup` a partir de las columnas y de la clave (requerido, `maxLength`, entero ≥ 0 en claves numéricas). |
| `src/features/param/shared/DialogParamForm.tsx` | Nuevo | Diálogo de Crear/Editar con el estilo de `DialogRole`. |
| `src/features/param/shared/DialogConfirmDelete.tsx` | Nuevo | Confirmación con el código y la descripción del registro. |
| `src/features/param/shared/ListGeneral.tsx` | Modificar | Botón "Nuevo", `enableRowActions` + `renderRowActions` (Editar/Borrar), `Snackbar`, recarga tras guardar, corrección de F1 y eliminación de `SHOW_EDIT_BUTTON`. |
| `src/features/param/components/List*.tsx` | Modificar | Metadatos según la tabla 3.2, más las correcciones F2 y F3. |
| `CLAUDE.md` | Modificar | Documentar el patrón de CRUD. |

### 4.4 Flujo

```
[Nuevo]  ──► DialogParamForm (crear: campos vacíos, Codigo editable) ──► POST
[✎ fila] ──► DialogParamForm (editar: valores de la fila, Codigo bloqueado) ──► PUT /X(clave)
[🗑 fila] ──► DialogConfirmDelete ──► DELETE /X(clave)
                         │
                         ▼ éxito
      cerrar diálogo → recargar() → Snackbar "Registro creado/actualizado/eliminado"
```

**Verificación defensiva mientras B1 no esté corregido:** después de un DELETE exitoso, si al recargar la fila sigue existiendo, mostrar "No se pudo eliminar el registro; es posible que esté en uso". Así se evita dar una confirmación falsa.

### 4.5 Control de acceso

- `canWrite = hasPermission("params.write")` controla el botón "Nuevo" y los iconos de Editar/Borrar. Se elimina la revisión de `isAdmin`.
- Cada acción se muestra solo si `allowX && canWrite`.
- El backend ya exige `params.write` en todos los POST/PUT/DELETE, salvo en `CondicionBien` (B2).

### 4.6 Manejo de errores

| Respuesta | Mensaje |
|---|---|
| `400` con texto "Llave primaria duplicada" | "Ya existe un registro con el código X" |
| `400` "Fila no existe" | "El registro ya no existe", y se recarga la lista |
| `409` (una vez corregido B1) | "No se puede eliminar: el registro está siendo usado por la cartera" |
| `500` `{ message, traceId }` | El mensaje recibido más el `traceId`, para soporte |
| Red | "Error de conexión. Verifique su conexión a internet." |
| `401`/`403` | Ya lo manejan los interceptores |

## 5. Fases

### Fase A: Correcciones del backend (≈1,5 días, equipo backend)
1. B1 + B4 + B7: propagar las excepciones de `SaveChanges` y traducir `DbUpdateException` a `409`.
2. B2 + B3: permisos y rutas de `CondicionBienController`.
3. B5: validar `ModelState` y el cuerpo nulo.
4. B6 (opcional): usuario real en la columna `Usuario`.

La Fase A puede ir en paralelo con las fases B a D. **La Fase E (borrar) no debe salir a QA sin B1.**

### Fase B: Infraestructura del front (≈1 día)
1. Corregir F1, F2 y F3.
2. `useEntidades.recargar()`, `paramService.ts`, `extractBackendErrors.ts` y `buildParamSchema.ts`.

### Fase C: Editar (≈1 día)
`DialogParamForm` en modo edición e integración con `renderRowActions`. Probar con `TipoCredito` (campo opcional), `Universalidades` (Estado A/I), `EstadoRegistro` (clave de texto) y `EstadoCredito` (detallada requerida).

### Fase D: Crear (≈0,5 día)
Modo creación y botón "Nuevo". Validar el mensaje de duplicado.

### Fase E: Borrar (≈0,5 día)
`DialogConfirmDelete` y la verificación defensiva de 4.4. Probar con un registro en uso de `Periodicidad` (oculta el error) y de `Modalidad` (lanza el error).

### Fase F: Configuración por tabla y cierre (≈1 día)
- Aplicar la tabla 3.2 a los 31 componentes: `keyType="string"` + `keyMaxLength` en CalificacionCredito (1), EstadoRegistro (8) y TipoTasa (10); `maxLength` de 150 en TipoGarantia, TipoPoliza y TipoTasa; `Tipo` con 200 o 100 según la tabla; `fieldType: "multiline"` en las descripciones detalladas; `required: true` + `maxLength: 400` en `EstadoCredito.DescripcionDetallada`.
- Cambiar `isAdmin` por `params.write`, actualizar `CLAUDE.md` y pasar `npm run lint` + `npm run build`.

**Estimado: ≈4 días de front + ≈1,5 días de backend.**

## 6. Criterios de aceptación

- [ ] Un usuario con `params.write` ve "Nuevo", Editar y Borrar en las 31 tablas. Un usuario con solo `params.read` no los ve.
- [ ] Crear, editar y borrar funcionan en tablas con clave numérica y con clave de texto.
- [ ] El código no se puede modificar al editar.
- [ ] Las longitudes máximas y los campos requeridos coinciden con la tabla 3.2 y se validan antes de enviar.
- [ ] Borrar un registro en uso **nunca** muestra un mensaje de éxito.
- [ ] Las columnas `Estado` (Universalidades) y `DescripcionDetallada` (EstadoCredito) muestran datos.
- [ ] Tras cada operación la lista se recarga y aparece una notificación.
- [ ] `npm run lint` y `npm run build` pasan.

## 7. Pruebas manuales

1. Crear un registro válido en `TipoCredito` (numérica) y en `EstadoRegistro` (texto).
2. Crear un registro con código duplicado → mensaje de duplicado.
3. Descripción de 101 caracteres en una tabla con límite 100 → bloqueado en el cliente. En `TipoGarantia` se permiten 150.
4. Editar la descripción → se refleja, y el código no se puede editar.
5. Borrar un registro sin uso → desaparece.
6. Borrar un registro en uso de `Periodicidad`, `ProductoCredito` o `TipoTasa` → mensaje de "en uso", nunca de éxito.
7. Usuario sin `params.write` → no ve las acciones. Forzar un DELETE desde DevTools → `403`. Repetir contra `/odata/CondicionBien(1)` para verificar B2.
8. Revisar que cada operación quede en el audit log con el usuario real.

## 8. Riesgos

| Riesgo | Mitigación |
|---|---|
| Se sale a QA antes de corregir B1 | Verificación defensiva de 4.4, más un criterio de aceptación explícito. |
| `CondicionBien` no responde en `/odata/v1` (B3) | Probarlo en la Fase B. Si falla, usar `allowCreate/Edit/Delete={false}` en esa tabla hasta que se corrija el backend. |
| Se borran datos regulatorios usados por la cartera | Las FK `Restrict` lo impiden en la base de datos. El front siempre pide confirmación. |
| Permisos solo en el front | El backend ya los exige, salvo en B2. |

## 9. Decisiones de negocio pendientes

1. ¿Alguno de los 31 catálogos debe quedar solo de lectura (por ejemplo, los que fija la SFC)? Si es así, marcarlo con `allow*={false}`.
2. ¿Se permite borrar físicamente, o se prefiere desactivar? Hoy solo `Universalidades` tiene un campo `Estado`.
3. ¿Qué roles deben tener `params.write`? Se asigna desde la pantalla de Roles, sin cambios de código.
