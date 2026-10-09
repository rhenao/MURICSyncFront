# Plan: tablas básicas de solo consulta y CRUD para Universalidades

Fecha: 2026-09-26 · Rama: `rhenao-sprint04`
Backend revisado: `MURICSyncBack` (commit `4818e64`).
Versión 2: incorpora las decisiones de negocio R1–R5 (ver §8).

Este plan **reemplaza el alcance** de `plan-crud-tablas-basicas.md`. Ese plan daba Crear/Editar/Borrar a las 31 tablas. Ahora se decidió que las tablas de la Superintendencia Financiera (SFC) sean **solo de consulta**. Solo `Universalidades`, que es del dominio de la empresa, tendrá Crear, Editar y Borrar. Del plan anterior se reutilizan el análisis del contrato OData y el diseño de diálogos y errores.

## 1. Objetivo

| # | Cambio |
|---|---|
| 1 | Renombrar `src/features/param/shared/ListGeneral.tsx` a `ListaGeneralConsulta.tsx`. |
| 2 | Quitar de `ListaGeneralConsulta.tsx` el botón "Editar" y todo lo que lo soporta. |
| 3 | Crear `src/features/param/shared/ListaGeneralCrud.tsx`, basado en el patrón de `ListGeneral`, con las acciones Crear, Editar y Borrar para una entidad. |
| 4 | Hacer que `ListUniversalidades.tsx` use `ListaGeneralCrud`, con Crear y Editar. **Borrar queda deshabilitado** (`allowDelete={false}`): la baja es lógica, con `Estado = "I"` (decisión R1). |

## 2. Estado actual

### 2.1 Frontend

| Elemento | Situación |
|---|---|
| `ListGeneral.tsx` | Recibe `endpoint`, `title` y `columns`. Pinta un `MaterialReactTable`. Muestra la columna "Acciones" con un `alert()` si `SHOW_EDIT_BUTTON && isAdmin`. |
| Cambios sin commit | `ListGeneral.tsx` tiene `SHOW_EDIT_BUTTON = true`, y `CLAUDE.md` dice que es `false`. Los dos quedan resueltos con este plan, porque la constante desaparece. |
| Usos de `ListGeneral` | Los 31 componentes de `src/features/param/components/` y `CLAUDE.md`. |
| `getRowId` | **Bug.** Lee `row["codigo"]`, pero el API devuelve `Codigo` en PascalCase. Todas las filas quedan con id `""`. |
| `ListUniversalidades.tsx` | **Bug.** Muestra la columna `Activo`, pero el backend devuelve `Estado`. La columna sale vacía. |
| `models/Universalidades.model.ts` | Está en camelCase y usa `activo`. No coincide con el API (`Codigo`, `Descripcion`, `Estado`). |
| `useEntidades` | Solo hace GET. No expone una función para recargar. |
| Permisos | `useAuth().hasPermission(code)` y `usePermission()` ya existen. |
| Patrón de diálogo | `src/features/security/components/DialogRole.tsx`: MUI `Dialog`, `Alert` de errores y una función local `extractBackendErrors`, que está duplicada en `DialogPermission.tsx`. |
| Validación | `yup` ya es dependencia. |
| Ruta | `/app/lista-universalidades` en `AppRoutes.tsx`, sin guard de permiso. Solo tiene `RequireAuth`. |

### 2.2 Backend: `UniversalidadesController` + `UniversalidadesService`

Es un `ODataController` con prefijo `odata/v1` y `[Authorize]` a nivel de clase.

| Acción | Petición | Permiso | Respuesta OK | Errores controlados |
|---|---|---|---|---|
| Listar | `GET /Universalidades` | `params.read` | `200` `{ value: [...] }` | — |
| Consultar uno | `GET /Universalidades({codigo})` | `params.read` | `200` entidad | `404` |
| Crear | `POST /Universalidades` con la entidad completa | `params.write` | `201` con la entidad | `400`, texto `"Llave primaria duplicada (X)"` |
| Editar | `PUT /Universalidades({codigo})` con la entidad **completa** | `params.write` | `204` sin cuerpo | `400` `"El ID de la fila no coincide con el ID proporcionado en la URL."` / `400` `"Error actualizando, Fila no existe."` |
| Borrar | `DELETE /Universalidades({codigo})` | `params.write` | `200` sin cuerpo | `400` `"Error eliminando, Fila no existe."` |

No hay `PATCH`. El servicio tiene `Update(key, Delta<>)`, pero el controlador no lo expone.

Modelo (`Models/Param/Universalidades.cs`):

| Propiedad | Tipo | Reglas |
|---|---|---|
| `Codigo` | `int` | Clave, `ValueGeneratedNever()`. **La digita el usuario.** Editable al crear y de solo lectura al editar. En el JSON va como número, no como texto: OData rechaza `"3"` en un campo `Edm.Int32`. |
| `Descripcion` | `string` | Requerida, `MaxLength(100)`. |
| `Estado` | `string` | Requerida, `MaxLength(1)`: `"A"` (Activo) o `"I"` (Inactivo). |
| `FechaActualizacion`, `Usuario` | shadow | No viajan en el JSON. Las llena el servicio. |

Otros datos confirmados:

- Las propiedades viajan en **PascalCase**, tanto en la respuesta como en el payload.
- `params.read` y `params.write` ya existen en `Data/PermissionSeed.cs`. **No hay que crear permisos.**
- `SaveChanges()` **propaga** las excepciones. Un error de base de datos termina en `500` con `{ success: false, message, traceId, detail }`, a través de `GlobalExceptionHandler`. No se oculta el error.
- **No existe FK hacia `Universalidades`.** `Credito` y `LoteCargaCredito` solo guardan `IdentificacionNegocioVehiculoUniversalidad` como texto libre, y ni la carga ni la transmisión validan ese texto contra la tabla. Borrar nunca falla por integridad, pero puede dejar créditos apuntando a una universalidad que ya no existe (ver §8).

### 2.3 Observaciones del backend (no bloquean el desarrollo)

| # | Severidad | Observación | Recomendación |
|---|---|---|---|
| B1 | Media | No hay `[ApiController]` ni revisión de `ModelState`. Si el cuerpo no se deserializa, `row` llega `null` y el servidor responde `500`. Tampoco se valida `MaxLength` antes de guardar; Postgres rechaza el dato y el servidor responde `500`. | Agregar `if (row == null \|\| !ModelState.IsValid) return BadRequest(ModelState);`. En el front se valida igual (§4.4). |
| B2 | Baja | Por un duplicado, POST fija `StatusCode = 406` y luego hace `return BadRequest(...)`. El cliente recibe `400`. | Devolver `Conflict(...)` (`409`). El front debe aceptar los dos códigos. |
| B3 | Baja | `Usuario` se guarda con el valor fijo `"usuario"`. | Tomarlo de los claims. El audit log ya registra el usuario real. |
| B4 | Baja | El servicio no valida que `Estado` ∈ {`A`, `I`}. | Validarlo en el backend. El front lo limita con un select. |
| B5 | Media | Por la decisión R1 el front no ofrece borrar, pero `DELETE /Universalidades(codigo)` sigue disponible para quien tenga `params.write`. Un borrado forzado desde DevTools o Postman deja créditos huérfanos. | Quitar la acción `Delete` del controlador, o hacer que responda `405`/`409` con "Use la baja lógica (Estado = I)". Ocultar el botón no es un control de seguridad. |

## 3. Parte 1: tablas básicas de solo consulta

### 3.1 Renombrar `ListGeneral.tsx` → `ListaGeneralConsulta.tsx`

1. `git mv src/features/param/shared/ListGeneral.tsx src/features/param/shared/ListaGeneralConsulta.tsx`, para conservar el historial.
2. Renombrar el componente a `ListaGeneralConsulta` y la interfaz de props a `ListaGeneralConsultaProps`.
3. Actualizar el import en los 30 componentes de solo consulta:
   ```tsx
   import ListaGeneralConsulta, { type ColumnConfig } from "../shared/ListaGeneralConsulta";
   ...
   return <ListaGeneralConsulta endpoint="/Foo" title="Foo" columns={columns} />;
   ```
   Es un reemplazo mecánico. `ListUniversalidades.tsx` se trata aparte en la Parte 2.

### 3.2 Quitar el botón "Editar"

En `ListaGeneralConsulta.tsx`:

- Eliminar la constante `SHOW_EDIT_BUTTON`, la columna "Acciones", el cálculo de `isAdmin` y el import de `useAuth`.
- Quitar `Button` del import de `@mui/material`.
- Corregir `getRowId`: usar `row["Codigo"]`, con respaldo en `row["codigo"]`.

### 3.3 Extraer lo compartido

Para no duplicar entre los dos componentes, `ColumnConfig`, el estilo de la tabla y el encabezado se sacan a archivos propios:

| Archivo nuevo | Contenido |
|---|---|
| `src/features/param/shared/columnConfig.ts` | `ColumnConfig` (y `FieldType`, ver §4.2), más `toMrtColumns(columns)`, que convierte a `MRT_ColumnDef` con `nullFallback`. |
| `src/features/param/shared/tableStyles.ts` | Las props de estilo de `MaterialReactTable` que hoy están en línea: `muiTableProps`, `muiTableBodyRowProps`, `muiTableContainerProps`, `muiTablePaperProps`, `muiTableHeadCellProps`, `muiTableBodyCellProps` y el `sx` del `Card`. |
| `src/features/param/shared/ListaHeader.tsx` | El título y el `Chip` "N registros". Recibe un `slot` opcional para el botón "Nuevo". |

`ListaGeneralConsulta.tsx` re-exporta `type ColumnConfig`, así que los imports de los 30 componentes no cambian de forma.

### 3.4 Documentación

En `CLAUDE.md`, sección *Param feature pattern*:

- Cambiar `ListGeneral` por `ListaGeneralConsulta` en el texto y en el ejemplo.
- Quitar el párrafo de `SHOW_EDIT_BUTTON` y la columna "Editar".
- Agregar un párrafo sobre `ListaGeneralCrud`: cuándo usarlo (solo en tablas del dominio de la empresa), sus props y el permiso `params.write`.
- En *Auth flow*, punto 4, cambiar "the edit column in `ListGeneral`" por "the CRUD actions in `ListaGeneralCrud`".

## 4. Parte 2: `ListaGeneralCrud.tsx` para Universalidades

### 4.1 Archivos

| Archivo | Acción | Responsabilidad |
|---|---|---|
| `src/hooks/useEntidades.ts` | Modificar | Exponer `recargar()` sin romper la firma actual: `{ entidades, cargando, error, recargar }`. Se implementa moviendo `fetchEntidades` a un `useCallback`. |
| `src/features/param/services/ParamCrudService.ts` | Nuevo | `crear(endpoint, row)` → `POST`. `actualizar(endpoint, key, keyType, row)` → `PUT {endpoint}({key})` con la entidad completa. `eliminar(endpoint, key, keyType)` → `DELETE`. `buildKeySegment(key, keyType)`: numérica `(3)`, texto `('ABC')` con `'` → `''` y `encodeURIComponent`. Usa `axiosOdataAPIClient`. |
| `src/utils/extractBackendErrors.ts` | Nuevo | Una sola función para leer los errores: cuerpo de texto plano (`"Llave primaria duplicada (X)"`), `{ success, message, traceId }`, OData `{ error: { message, details } }`, `ModelState` `{ errors: { campo: [..] } }` y errores de red. Reemplaza las copias locales de `DialogRole.tsx` y `DialogPermission.tsx` (opcional en este sprint). |
| `src/features/param/shared/buildParamSchema.ts` | Nuevo | Arma un esquema `yup` a partir de `ColumnConfig[]` y de la clave: campos requeridos, `maxLength`, `oneOf` para los select y entero ≥ 1 para las claves numéricas. |
| `src/features/param/shared/DialogParamForm.tsx` | Nuevo | Diálogo de Crear/Editar con el estilo de `DialogRole`. Genera los campos desde `columns`: `TextField` para text/number/multiline y `TextField select` para select. Pinta los errores por campo y un `Alert` con los errores del backend. |
| `src/features/param/shared/DialogConfirmDelete.tsx` | Nuevo | Confirmación: "¿Eliminar el registro {Codigo} – {Descripcion}? Esta acción no se puede deshacer." |
| `src/features/param/shared/ListaGeneralCrud.tsx` | Nuevo | Tabla, botón "Nuevo", acciones por fila, diálogos, `Snackbar` y recarga. |
| `src/features/param/components/ListUniversalidades.tsx` | Modificar | Usar `ListaGeneralCrud`, cambiar la columna `Activo` → `Estado` y agregar los metadatos del formulario. |
| `src/features/param/models/Universalidades.model.ts` | Modificar | Alinear con el API: `Codigo: number; Descripcion: string; Estado: "A" \| "I";`. |

### 4.2 `ColumnConfig` extendido (compatible con los 30 componentes de consulta)

```ts
export type FieldType = "text" | "multiline" | "number" | "select";

export interface ColumnConfig {
  accessorKey: string;
  header: string;
  size: number;
  nullFallback?: string;

  // --- Solo los usa ListaGeneralCrud ---
  fieldType?: FieldType;                                  // por defecto "text"
  required?: boolean;                                     // por defecto true
  maxLength?: number;
  options?: { value: string | number; label: string }[];  // para "select"; la tabla muestra el label
  hideInForm?: boolean;
}
```

Si una columna tiene `options`, la tabla muestra el `label` en lugar del valor crudo, por ejemplo "Activo" en vez de "A".

### 4.3 Props de `ListaGeneralCrud`

```ts
interface ListaGeneralCrudProps {
  endpoint: string;
  title: string;
  columns: ColumnConfig[];
  keyField?: string;              // por defecto "Codigo"
  keyType?: "number" | "string";  // por defecto "number"
  keyMaxLength?: number;          // solo para claves de texto
  allowCreate?: boolean;          // por defecto true
  allowEdit?: boolean;            // por defecto true
  allowDelete?: boolean;          // por defecto true
  writePermission?: string;       // por defecto "params.write"
}
```

La clave (`keyField`) siempre está en el formulario: editable al crear y deshabilitada al editar. Si `columns` no la incluye, el diálogo la agrega igual.

### 4.4 Configuración de `ListUniversalidades.tsx`

```tsx
import ListaGeneralCrud from "../shared/ListaGeneralCrud";
import type { ColumnConfig } from "../shared/columnConfig";

const ESTADOS = [
  { value: "A", label: "Activo" },
  { value: "I", label: "Inactivo" },
];

const columns: ColumnConfig[] = [
  { accessorKey: "Codigo", header: "Código", size: 120, fieldType: "number" },
  { accessorKey: "Descripcion", header: "Descripción", size: 320, maxLength: 100 },
  { accessorKey: "Estado", header: "Estado", size: 120, fieldType: "select", options: ESTADOS },
];

export default function ListUniversalidades() {
  return (
    <ListaGeneralCrud
      endpoint="/Universalidades"
      title="Universalidades"
      columns={columns}
      allowDelete={false} // R1: baja lógica con Estado = "I"
    />
  );
}
```

Al crear, `Estado` arranca en `"A"`.

**Baja lógica (R1):** para dar de baja una universalidad se edita y se pone `Estado = "I"`. Para que se note en la lista:

- La columna Estado se pinta como `Chip`: verde "Activo" o gris "Inactivo". Se implementa en `toMrtColumns`: cada opción de `options` puede llevar `color`, y entonces se pinta como `Chip`.
- Las filas inactivas se muestran atenuadas (prop `filaInactiva` de `ListaGeneralCrud`; `opacity: 0.55` en todas las celdas menos Acciones).
- No se filtran: la tabla sigue mostrando activas e inactivas, porque la baja es reversible (se puede reactivar con `Estado = "A"`).

### 4.5 Flujo

```
[Nuevo]    ──► DialogParamForm (crear: vacío, Estado="A", Codigo editable) ──► POST /Universalidades
[✎ fila]   ──► DialogParamForm (editar: valores de la fila, Codigo bloqueado) ──► PUT /Universalidades(codigo)
[🗑 fila]  ──► DialogConfirmDelete ──► DELETE {endpoint}(clave)   (no se muestra en Universalidades: allowDelete=false)
                          │
                          ▼ éxito
       cerrar diálogo → recargar() → Snackbar "Registro creado / actualizado / eliminado"
```

- Las acciones por fila usan `enableRowActions` + `renderRowActions` de MRT, con `IconButton` + `Tooltip` (Editar/Eliminar) y `positionActionsColumn="last"`.
- El botón "Nuevo" se pone en `renderTopToolbarCustomActions`, a través del `slot` de `ListaHeader`.
- El payload del PUT se arma desde el estado del formulario: `{ Codigo, Descripcion, Estado }`. No se reenvían campos desconocidos de la fila, como `@odata.etag`.
- Se hace `trim()` a los textos antes de validar y enviar.
- Mientras la petición está en curso, los botones del diálogo quedan deshabilitados para evitar doble envío.

### 4.6 Control de acceso

- `canWrite = hasPermission(writePermission)`. Cada acción se muestra solo si `allowX && canWrite`. Se deja de usar el rol `ADMIN`.
- **Importante:** el interceptor de `axiosOdataAPIClient` **cierra la sesión** ante un `403`. Si un usuario sin `params.write` llegara a ver un botón y lo usara, perdería la sesión. Por eso las acciones deben quedar ocultas, no solo deshabilitadas, cuando falta el permiso.
- La ruta `/app/lista-universalidades` sigue abierta a quien tenga sesión (lectura). No hace falta un `RequirePermission` nuevo.
- Recordatorio (ver `CLAUDE.md`): la revisión en el front es solo de UX. La autorización real es el `[RequirePermission("params.write")]` del backend, que ya existe.

### 4.7 Manejo de errores

| Respuesta | Mensaje en el diálogo |
|---|---|
| `400`/`409` con texto "Llave primaria duplicada" | "Ya existe una universalidad con el código X." |
| `400` "Fila no existe" (editar o borrar) | "El registro ya no existe." Se cierra el diálogo y se recarga la lista. |
| `400` "El ID de la fila no coincide…" | Error interno: mostrar el texto recibido. No debería pasar, porque el código va bloqueado. |
| `500` `{ message, traceId }` | "No se pudo guardar el registro." + `message` + "Código de soporte: {traceId}". |
| Sin respuesta (red) | "Error de conexión. Verifique su conexión a internet." |
| `401`/`403` | Ya lo manejan los interceptores. |

## 5. Fases

| Fase | Contenido | Estimado |
|---|---|---|
| **A. Consulta** | §3 completo: renombrar, quitar el botón, extraer lo compartido, actualizar los 30 imports y `CLAUDE.md`. Corregir `getRowId`. Absorbe los cambios sin commit de `ListGeneral.tsx` y `CLAUDE.md` (R5). Verificar con `npm run lint` + `npm run build`. **Commit aparte** (R4). | 0,5 día |
| **B. Infraestructura CRUD** | `useEntidades.recargar()`, `ParamCrudService.ts` (+ `interpretarErrorParam`), `extractBackendErrors.ts`, `buildParamSchema.ts`, extensión de `ColumnConfig`. | 0,5 día |
| **C. Editar** | `DialogParamForm` (modo edición), `ListaGeneralCrud` con `renderRowActions`, `ListUniversalidades` migrado (columna `Estado`), modelo alineado. | 0,5 día |
| **D. Crear** | Modo creación, botón "Nuevo", mensaje de duplicado. | 0,5 día |
| **E. Borrar (genérico) y baja lógica** | `DialogConfirmDelete` dentro de `ListaGeneralCrud`, controlado por `allowDelete`, para que el componente siga siendo reutilizable. En Universalidades queda apagado (R1). Chip de Estado y filas inactivas atenuadas. | 0,25 día |
| **F. Cierre** | Pruebas manuales (§7), lint y build, commit. | 0,25 día |

**Total estimado: ≈2,5 días de front.** Las observaciones del backend B1–B4 son opcionales y pueden ir en paralelo.

Se sugiere un commit por fase: A queda separado de B–F, para que el renombrado no se mezcle con la funcionalidad nueva.

## 6. Criterios de aceptación

- [x] No existe `ListGeneral.tsx` ni ninguna referencia a `ListGeneral` en `src/` ni en `CLAUDE.md`.
- [x] Las 30 tablas SFC usan `ListaGeneralConsulta` y no muestran ningún botón de acción, aunque el usuario sea `ADMIN`.
- [x] Universalidades usa `ListaGeneralCrud` y la columna Estado muestra "Activo" o "Inactivo".
- [x] Un usuario con `params.write` ve "Nuevo" y Editar. Un usuario con solo `params.read` ve la lista sin acciones (ni ocultas por CSS ni deshabilitadas: no se renderizan).
- [x] Universalidades **no** muestra la acción Eliminar (R1).
- [x] Poner `Estado = "I"` desde Editar da de baja la universalidad: la fila sigue en la lista, con el chip "Inactivo" y atenuada. Se puede reactivar con `Estado = "A"`.
- [x] Crear y editar funcionan, y cada operación recarga la lista y muestra una notificación.
- [x] `ListaGeneralCrud` con `allowDelete` en `true` (valor por defecto) sigue ofreciendo Eliminar, para uso futuro en otras tablas.
- [x] Al editar, el código no se puede modificar.
- [x] Descripción vacía o de más de 100 caracteres, código vacío, no numérico o ≤ 0 → se bloquea en el cliente con un mensaje por campo.
- [x] Un código duplicado muestra un mensaje claro, no un error genérico.
- [x] `npm run lint` y `npm run build` pasan.

## 7. Pruebas manuales

1. Abrir 3–4 tablas SFC (por ejemplo TipoCredito, EstadoRegistro y TipoTasa) con un usuario `ADMIN` → sin columna de acciones; los datos cargan igual que antes.
2. Universalidades, usuario con `params.write`: crear el código 999, "Prueba", Activo → aparece en la lista.
3. Crear otra vez el código 999 → mensaje de duplicado.
4. Descripción de 101 caracteres → bloqueada en el cliente.
5. Editar el 999: cambiar la descripción y pasar a Inactivo → se refleja. El campo código está bloqueado.
6. Verificar que la fila del 999 no tiene botón Eliminar. Darla de baja (Inactivo) → chip gris y fila atenuada. Reactivarla (Activo) → vuelve a la normalidad.
7. Abrir la edición del 999, borrar ese registro directamente en la base de datos y luego guardar el diálogo → "El registro ya no existe" y se recarga la lista.
8. Usuario con solo `params.read` → ve la lista sin botones. Un `DELETE` forzado desde DevTools responde `403` (y el interceptor cierra la sesión; es el comportamiento esperado).
9. Revisar el audit log: cada operación queda con el usuario real.

## 8. Decisiones tomadas (2026-09-26)

| # | Tema | Decisión | Dónde se aplica |
|---|---|---|---|
| R1 | Borrado físico sin integridad referencial | **No se permite borrar.** Universalidades usa `allowDelete={false}` y la baja es lógica con `Estado = "I"`. | §1, §4.4, Fase E, §6, §7. Recomendado en backend: B5. |
| R2 | Relación entre `IdentificacionNegocioVehiculoUniversalidad` (texto) y `Universalidades.Codigo` (int) | **Pendiente:** confirmar con negocio si la carga debe validar contra esta tabla (y si debe rechazar universalidades inactivas). | Fuera del alcance (§9). |
| R3 | Un `403` cierra la sesión | Las acciones sin `params.write` **no se renderizan**. | §4.6, §6. |
| R4 | Renombrado masivo (31 archivos) | Fase A en un **commit aparte**, verificado con `npm run build`. | §5. |
| R5 | Cambios sin commit en `ListGeneral.tsx` y `CLAUDE.md` | Se **absorben en la Fase A**: la constante `SHOW_EDIT_BUTTON` desaparece y el párrafo de `CLAUDE.md` se reescribe. | §3.2, §3.4, §5. |

## 9. Fuera de alcance

- Crear, editar o borrar en las 30 tablas SFC.
- Las correcciones del backend listadas en `plan-crud-tablas-basicas.md` §3.3 para otras tablas (CondicionBien, SaveChanges que ocultan errores, etc.). Siguen vigentes, pero ya no bloquean nada, porque esas tablas quedan de solo consulta.
- Validar en la carga de créditos que la universalidad exista y esté activa (R2, pendiente de negocio).
- Cambios en el backend (B1–B5). Son recomendaciones; B5 es la más importante para que la decisión R1 no dependa solo del front.
- Paginación del lado del servidor u OData `$filter`/`$orderby`. Universalidades es una tabla pequeña.
