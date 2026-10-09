# Plan: Cargue de archivos, lista de lotes y ajustes

Fecha: 2026-09-28 · Rama: `rhenao-sprint04` (front) y `rhenao_sprint04` (back)
Backend revisado: `MURICSyncBack` (commit `b70315b`).
Relacionado: `plan-entidad-reportante-universalidad.md` (fases A a E, sin empezar) y `plan-plantillas-carga.md` (terminado).

**Estado (2026-09-28):** fases 0 a L5 hechas. Back: `2a30fb7` (B1), `417596a` (L1). Front: `677894f` (B1), `46a8250` (L2), `e456845` y `673ba4e` (L3), `7d3e852` (L4) y el commit de L5. Faltan las pruebas en el navegador: `pruebas-manuales-cargue-archivos.md`.

## 1. Qué se pidió y respuesta corta

| Pedido | Respuesta corta |
|---|---|
| Quitar el tipo de entidad del cargue | Ya está en el plan de entidad reportante (Fase B). El tipo y el código son los de Titularice, vienen de la configuración del backend y **el usuario no los elige**. Propongo partir esa Fase B para sacar primero lo del lote (§3.1). |
| Ver la lista de lotes y su estado | El backend ya tiene `GET /api/cargas` con filtros, pero no hay pantalla para abrir un lote existente. Propongo una pantalla **Lotes de carga** y que *Cargue de archivos* abra un lote por URL (§3.2). |

En la revisión salieron otros ajustes. Van en §2.3 y §3.3, ordenados por prioridad.

## 2. Diagnóstico

### 2.1 Tipo de entidad

| Dónde | Hoy |
|---|---|
| `CargaArchivos` (formulario) | Campo editable "Tipo entidad" (por defecto `1`, `TIPO_ENTIDAD_DEFAULT`). "Universalidad" se envía como `codigoEntidad`. |
| `CargaArchivos` (resumen) | Muestra "Tipo entidad" y "Código entidad" (este último es la universalidad). |
| `CrearLoteRequest` | `TipoEntidad` y `CodigoEntidad` obligatorios, `>= 1`. |
| `LoteCarga`, `FiltroLotesRequest`, `LoteResponse` | `TipoEntidad` y `CodigoEntidad`; índice `ix_lote_corte_entidad`. |
| `PromocionService` (l. 156, 181, 219) | Marca el crédito con el tipo y el código del lote y busca créditos existentes por esos dos valores. |

El diagnóstico completo y el diseño están en `plan-entidad-reportante-universalidad.md` §1 y §3. No se repiten aquí.

### 2.2 Lista de lotes

**Backend.** `GET /api/cargas` (`cargas.read`) filtra por `estado`, `fechaCorte`, `tipoEntidad` y `codigoEntidad`, ordena por fecha de creación descendente y responde `LoteResponse` **sin conteos ni errores**. No tiene paginación.

**Front.**

- `CargaArchivos` guarda el lote activo **solo en memoria**. Al recargar la página, al usar "Reiniciar" o al salir de la pantalla, el lote se pierde y **no hay forma de volver a abrirlo**. Para seguir con un lote a medio cargar, hoy hay que anularlo y crear otro.
- `ConsultasMURIC` (menú *Consultas*) **ya lista lotes**, pero:
  - El filtro de estado ofrece `Creado`, que no existe, y omite `Iniciado`, `Parseado` y `Fallido`.
  - Para mostrar los conteos hace un `GET /cargas/{id}` **por cada lote** (N+1).
  - No permite abrir el lote.
  - Muestra la universalidad como "Entidad" y solo con el código.
- `EnviaMURIC` lista los lotes `Promovido` para transmitir. Esa pantalla cambia en la Fase C del plan de entidad reportante (transmisión por fecha de corte).

### 2.3 Otros hallazgos

| # | Hallazgo | Impacto |
|---|---|---|
| H1 | **Promover** y **Anular** se ejecutan sin confirmación. Las dos acciones son irreversibles. | Alto: un clic equivocado promueve a MURIC o anula el lote. |
| H2 | Las rutas `/app/carga-archivos`, `/app/envio-muric` y `/app/consultas-muric` no tienen guard; el menú filtra por **rol**, no por permiso. Un usuario con `cargas.read` pero sin `cargas.write` ve los botones de acción, y el `403` del cliente Security **cierra la sesión**. | Alto (cuando exista la lista y usuarios de consulta abran lotes). |
| H3 | `CargaArchivos` y `ConsultasMURIC` consultan `/Universalidades` por OData **sin exigir `params.read`**. Un `403` del cliente OData cierra la sesión. Es el mismo caso que se resolvió en plantillas con `useEntidades(endpoint, { enabled })`. | Medio: depende de cómo se configuren los roles. |
| H4 | Se pueden crear **varios lotes activos** para la misma fecha de corte y universalidad. | Medio: con la transmisión por corte (plan de entidad, E10), todos deben estar `Promovido` o `Anulado`, y los duplicados confunden. |
| H5 | El backend acepta archivos en `Validado` (vuelve a `Parseado`), pero el front solo permite subir en `Iniciado` y `Parseado`. | Bajo: para corregir un archivo después de validar hay que anular el lote. |
| H6 | El lote tiene `Observaciones`, pero el front no las captura ni las muestra. | Bajo. |
| H7 | Los endpoints `GET /cargas/{id}/errores` y `/errores/exportar` no tienen pantalla. `POST /validar` todavía es un stub (TODO "Bloque 4"): limpia errores y pasa a `Validado`. | Hoy nulo: no se generan errores. Hace falta cuando exista el motor de validación. |
| H8 | El estado de lote `Fallido` existe en la máquina de estados, pero **ningún código lo asigna**. | Bajo: estado muerto; conviene documentarlo o quitarlo. |
| H9 | El paso 4 de `CargaArchivos` (AVRO y transmisión **por lote**) duplica `EnviaMURIC` y queda obsoleto con la transmisión por fecha de corte. | Se resuelve en la Fase C del plan de entidad reportante. |
| H10 | La acción rápida "Consultas" de `LandingPage` apunta a `/app/archivos-cargados`, que **no tiene ruta**. | Bajo: enlace roto. |
| H11 | `Menu.tsx` hace `console.log` de los permisos del usuario. | Bajo: ruido en la consola. |
| H12 | `ConfigMapeoCarga` (prototipo anterior de plantillas, 696 líneas) sigue con ruta activa, sin guard y oculto en el menú. Ya se había señalado en `analisis-plantillas-carga.md`. | Bajo. |
| H13 | Las subidas y la descarga del AVRO usan `fetch` nativo: un `401` por token vencido sale como error genérico, sin redirigir a `/login`. | Bajo. |
| H14 | `CargaArchivos.tsx` tiene unas 950 líneas con cuatro pasos, dos tablas y un diálogo. | Mantenibilidad: conviene partirlo al tocarlo (§3.2). |

## 3. Propuesta

### 3.1 Quitar el tipo de entidad: partir la Fase B del plan de entidad reportante

La Fase B completa también cambia la clave del crédito y agrega el prefijo por universalidad (**E9**, opción c, decidida el 2026-09-28). Para sacar primero lo del cargue, se parte en dos:

- **B1 · Lote por universalidad** (no depende de E9):
  - **(B)** `LoteCarga.UniversalidadCodigo` con FK a `Universalidades` (`Restrict`) y traslado `UniversalidadCodigo ← CodigoEntidad`. Se quitan `TipoEntidad` y `CodigoEntidad` del lote. Índice `ix_lote_corte_universalidad`.
  - **(B)** `CrearLoteRequest { fechaCorte, universalidadCodigo, observaciones }`: valida que la universalidad exista y esté activa. `FiltroLotesRequest` y `LoteResponse` usan `universalidadCodigo`, y la respuesta agrega `universalidadDescripcion`.
  - **(B)** `PromocionService` sigue marcando el crédito con `TipoEntidad = 1` y `CodigoEntidad = lote.UniversalidadCodigo`, igual que hoy. Es **temporal**: los créditos existentes no cambian de clave hasta B2.
  - **(F)** `CargaArchivos`: se quitan el campo "Tipo entidad" y `TIPO_ENTIDAD_DEFAULT`. El resumen muestra "Universalidad: código — descripción". `ConsultasMURIC` y `EnviaMURIC` filtran por `universalidadCodigo`.
- **B2 · Crédito por universalidad** (E9 c): lo que queda de la Fase B original (clave del crédito, detección de colisiones, migración de créditos).

La **Fase A** (configuración `EntidadReportante` y el dato informativo "Entidad reportante: T600 · C…") puede ir antes o después de B1; son independientes.

### 3.2 Lista de lotes

**Backend**

- `GET /api/cargas` responde un `LoteResumenResponse` = `LoteResponse` + `conteos` (001 / 002 / 003) + `errores` / `advertencias`. Los conteos salen de **cuatro consultas agrupadas** por `LoteId` sobre los lotes filtrados, no de una consulta por lote.
- Filtros: `estado` (acepta varios, `estado=Iniciado&estado=Parseado`), `fechaCorte`, `fechaCorteDesde` y `fechaCorteHasta`, y `universalidadCodigo` (después de B1).
- Sin paginación por ahora: el volumen es del orden de universalidades × 12 por año. Si crece, se agrega `pagina` y `tamanoPagina` (ver L3).

**Front: pantalla nueva `ListLotes`** (`src/features/upload/components/ListLotes.tsx`)

- Ruta `/app/lotes-carga` con `RequirePermission(["cargas.read"])`. En el menú, *Proceso de cargue de archivos → Lotes de carga*, antes de *Cargue de archivos*.
- `MaterialReactTable`, con `tableStyles` y `ListaHeader` de `param/shared` (igual que `ListPlantillas`).
- Filtros: chips de estado ("Activos" = `Iniciado` + `Parseado` + `Validado`, "Promovidos", "Anulados", "Todos"; por defecto, "Activos"), fecha de corte y universalidad.
- Columnas:

  | Lote | Corte | Universalidad | Estado | 001 / 002 / 003 | Errores | Creado (fecha, usuario) | Promovido (fecha, usuario) |
  |---|---|---|---|---|---|---|---|

  Estado con los colores de `ESTADO_COLOR` (se mueve a un archivo compartido para no repetirlo en tres pantallas).
- Acción por fila **Abrir**, o clic en la fila: navega a `/app/carga-archivos/:id`.
- Botón **Nuevo lote**, solo con `cargas.write`: navega a `/app/carga-archivos`.

**Front: `CargaArchivos` abre un lote por URL**

- Rutas `/app/carga-archivos` (nuevo) y `/app/carga-archivos/:id` (existente). Con `:id`, al montar se llama a `refrescarLote(id)`; si el lote no existe (`404`), se muestra un aviso con enlace a la lista.
- Al crear el lote, navega a `/app/carga-archivos/:id`. Así una recarga de la página no lo pierde.
- "Reiniciar" pasa a **"Volver a la lista"**. Crear otro lote se hace desde la lista.
- **Solo lectura** sin `cargas.write`: se ocultan subir, validar, promover y anular (H2).
- Se parte en subcomponentes (H14): `FormNuevoLote`, `ResumenLote`, `PanelArchivos` (incluye el diálogo 001-999), `PanelAcciones` e `HistorialArchivos`. `CargaArchivos` queda como orquestador del estado.

**`ConsultasMURIC`**: con la lista nueva, esta pantalla sobra (ver L2).

### 3.3 Otros ajustes

| # | Ajuste | Resuelve |
|---|---|---|
| A1 | Diálogo de confirmación en **Promover** ("Los créditos pasan a MURIC; no se puede deshacer") y en **Anular**. | H1 |
| A2 | Guards de ruta por permiso: `/app/carga-archivos` → `cargas.read` (acciones con `cargas.write`); `/app/envio-muric` → `cargas.write`. En el menú, `canCargue` pasa a permisos. | H2 |
| A3 | Universalidades: después de B1, la descripción llega con el lote y la lista no necesita OData. Para el selector de "Nuevo lote", `useEntidades('/Universalidades', { enabled: hasPermission('params.read') })`. Si no hay permiso, un aviso en lugar del `403` que cierra la sesión. | H3 |
| A4 | **Un lote activo por corte y universalidad**: crear un lote cuando ya hay uno en `Iniciado`, `Parseado` o `Validado` responde `409` con *"Ya existe el lote #N (Parseado) para esta universalidad y corte. Ábralo o anúlelo."*. El front muestra un enlace **Abrir lote #N**. | H4 |
| A5 | Permitir subir archivos en `Validado`, con un aviso de que el lote vuelve a `Parseado` y hay que validarlo de nuevo. | H5 |
| A6 | Campo **Observaciones** (opcional, máx. 500) en "Nuevo lote"; se muestra en el resumen y como tooltip en la lista. | H6 |
| A7 | Limpieza: enlace de `LandingPage` a `/app/lotes-carga`, quitar el `console.log` de `Menu.tsx`, y retirar `ConfigMapeoCarga` y su ruta (ver L6). | H10, H11, H12 |
| A8 | Un helper `fetchConToken` (autorización + `401`/`403` → mismo manejo que los clientes Axios) para las subidas y la descarga. | H13 |

**Quedan fuera de este plan:**

- El panel de errores de validación (H7): se hace con el motor de validación (Bloque 4). Sin reglas no hay errores que mostrar.
- El paso 4 de transmisión (H9): lo reemplaza la Fase C del plan de entidad reportante.

## 4. Fases

"(B)" = backend, "(F)" = front. Una fase por turno, con `lint` + `build` (front) o `dotnet build` (back) y un commit por fase.

| Fase | Contenido | Estimado |
|---|---|---|
| **0** | Plan de entidad reportante **B1** (§3.1). La Fase A es opcional aquí. | ≈1 día |
| **L1** (B) | `GET /api/cargas` con conteos y errores agrupados, filtros de §3.2 y **A4** (un lote activo por corte y universalidad). | ≈0,5 día |
| **L2** (F) | `ListLotes`, ruta y menú; `ESTADO_COLOR` compartido. | ≈1 día |
| **L3** (F) | `CargaArchivos` con `:id`, navegación, modo solo lectura, subcomponentes, **A1**, **A5**, **A6** y el enlace del `409` de A4. | ≈1 día |
| **L4** (F) | **A2**, **A3**, **A7** y **A8**; `ConsultasMURIC` según L2. | ≈0,5 día |
| **L5** | Cierre: `CLAUDE.md` del front (lista de lotes, rutas, un lote activo por corte), pruebas manuales (§5). | ≈0,5 día |

**Estimado: ≈4,5 días.** L1 y L2 pueden ir antes de la Fase 0 si L1 es urgente, pero entonces los DTOs y el filtro de universalidad se tocan dos veces (ver L1 en §6).

## 5. Pruebas manuales (resumen)

1. Crear un lote: el formulario ya no pide tipo de entidad; el resumen muestra la universalidad con su descripción.
2. Recargar la página con un lote abierto: el lote sigue abierto (`/app/carga-archivos/:id`).
3. *Lotes de carga*: los chips filtran por estado; los conteos coinciden con los del lote abierto; **Abrir** lleva al lote.
4. Crear un segundo lote del mismo corte y universalidad con uno activo: `409` con el enlace al lote existente. Con el primero anulado, sí se crea.
5. Promover y anular piden confirmación; **Cancelar** no hace nada.
6. Subir un archivo en `Validado`: aviso, el lote vuelve a `Parseado`.
7. Con U-CONSULTA: ve la lista y abre un lote sin botones de acción; la sesión no se cierra.
8. Con un usuario sin `params.read`: *Lotes de carga* muestra la universalidad; "Nuevo lote" avisa que falta el permiso, sin cerrar la sesión.

## 6. Decisiones (recibidas el 2026-09-28)

Se aceptaron todas las recomendaciones.

| # | Decisión | Consecuencia |
|---|---|---|
| L1 | B1 del plan de entidad reportante va **antes** que la lista. | La Fase 0 es la primera. `plan-entidad-reportante-universalidad.md` parte su Fase B en B1 y B2. |
| L2 | Se **retira** *Consultas MURIC*; la entrada *Consultas* del menú abre *Lotes de carga*. | En L4 se borran `ConsultasMURIC` y su ruta (`/app/consultas-muric` redirige a `/app/lotes-carga`). Una consulta de créditos MURIC sería otro plan. |
| L3 | Sin paginación por ahora. | Filtro por defecto "Activos" y rango de fechas de corte. Revisar con más de ~500 lotes. |
| L4 | **Un lote activo** por corte y universalidad. Si ya hay uno `Promovido`, se **permite** con advertencia. | L1 (B): `409` con un lote activo; con uno promovido, la respuesta de creación trae `advertencia` y el front la muestra. |
| L5 | Se quita el estado de lote `Fallido`. | L1 (B): sale de la máquina de estados, **después de comprobar que ningún lote de la base lo tiene**. L3/L4 (F): sale de `ESTADO_COLOR` y de `canAnular`. El resultado `Fallido` del **historial de archivos** se queda. |
| L6 | Se elimina `ConfigMapeoCarga`. | L4: se borran el componente, su modelo y la ruta `/config-mapeo-carga`. |
| L7 | *Lotes de carga* lo ve todo usuario con `cargas.read`; las acciones requieren `cargas.write`. | Menú y guard por permiso, no por rol. |
