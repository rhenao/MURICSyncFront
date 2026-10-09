# Plan: Consultas

Fecha: 2026-09-29 · Rama: `rhenao-sprint04` (front) y `rhenao_sprint04` (back)
Backend revisado: `MURICSyncBack` (commit `e94252c`).
Relacionado: `plan-cargue-archivos.md` (Lotes de carga, decisión L2) y `plan-entidad-reportante-universalidad.md` (envío por corte, ADR 0008).

## 1. Objetivo

El menú *Consultas* hoy solo tiene *Lotes de carga*. Este plan agrega las cinco consultas que más necesitan los usuarios, en este orden:

| # | Consulta | Pregunta que responde | Usuarios |
|---|---|---|---|
| 1 | **Historial de transmisiones** | ¿Qué se envió a la SFC, cuándo y qué respondió? | Cumplimiento, auditoría |
| 2 | **Resumen de cartera por corte** | ¿Cuánta cartera se reporta y cómo se reparte (universalidad, mora, calificación)? | Operadores (cuadre antes de transmitir), gerencia |
| 3 | **Estado de cumplimiento por corte** | ¿Qué falta para cerrar cada mes? | Coordinación de la operación |
| 4 | **Ficha de crédito** | ¿Qué sabemos de este crédito o deudor, mes a mes? | Soporte, cumplimiento |
| 5 | **Comparación entre cortes** | ¿Qué créditos aparecen, desaparecen o cambian raro entre dos meses? | Control de calidad antes de transmitir |

## 2. Estado actual

| Tema | Hoy |
|---|---|
| Menú *Consultas* | Una opción, *Lotes de carga* (`cargas.read`). *Consultas MURIC* se retiró (L2). La carpeta `src/features/queries/` quedó vacía; `muric001/002/003` también están vacías. |
| Datos | Capa final: `Creditos` (con `UniversalidadCodigo`), `Deudores` (tipo y número de identificación, nombre), `AtributosCredito` (EAV versionado por corte), `MovimientosCartera` (snapshot por crédito y corte: estado, calificación, días de mora, saldos, provisiones, garantía). Además `LotesCarga`, `TransmisionesSfc`, `ErroresValidacion`. |
| Índices | `MovimientosCartera`: único `(CreditoId, FechaCorte)`, `FechaCorte`, `(FechaCorte, EstadoCodigo)`, `(FechaCorte, CalificacionCreditoCodigo)`. `Deudores`: `(TipoIdentificacion, NumeroIdentificacion)`. `Creditos`: único `IdentificacionCreditoEntidad`. Alcanzan para estas consultas. |
| API | `GET /api/transmisiones` ya lista **todas** las transmisiones si no se le pasa `fechaCorte`. `GET /api/cargas` lista lotes con filtros. No hay endpoints sobre la capa final. |
| Catálogos útiles | Estados de crédito 1–10 (Normal … Pagado 8, Castigado 6, Vendida/cedida 5, Consolidado 9, Cancelada por reexpedición 10). Calificaciones A–E. |
| Permisos | `params.*`, `cargas.read/write`, `usuarios.*`, `roles.manage`, `seguridad.manage` (`PermissionSeed`). CONSULTA tiene `params.read` y `cargas.read`. |
| Auditoría | `AuditMiddleware` registra escrituras y, de los GET, solo los de una lista blanca (`SelectAllowed`: usuarios, roles, auditoría…). |
| Front | Sin librería de gráficos. `xlsx` (SheetJS) ya está instalado (plantillas). Listas con `MaterialReactTable` y los estilos de `param/shared`. |

## 3. Diseño

Transversal:

- **Backend:** un `ConsultasController` (`/api/consultas`, `[Authorize]`, `ApiExceptionFilter`) y un `ConsultasService` de solo lectura (`AsNoTracking`), con las agregaciones hechas en la base (`GroupBy`), no en memoria. Permiso `cargas.read`, salvo la ficha de crédito (K2).
- **Front:** feature `src/features/queries/` (`components`, `services`, `models`). Rutas `/app/consultas/<consulta>` con `RequirePermission`. En el menú *Consultas*, una entrada por consulta, además de *Lotes de carga*.
- **Datos:** las consultas 2, 4 y 5 leen la **capa final** (lo promovido, que es lo que se transmite; K11).
- **Exportación:** a Excel en el cliente con `xlsx`, de lo que muestra la pantalla (K5).
- **Montos:** formato `es-CO`, sin decimales en saldos y con dos en tasas.

### 3.1 Historial de transmisiones

- **Backend:** `GET /api/transmisiones` gana filtros `estado` (repetible), `corteDesde`, `corteHasta`. Sin paginación (se envía una por mes).
- **Front** `/app/consultas/transmisiones` (`cargas.read`):
  - Columnas: corte, archivo, ID SFC, estado (chip), código y mensaje SFC, créditos / demográficos / movimientos, fecha, usuario, última consulta.
  - Filtros: chips de estado (Todas, Enviado, Aprobado, Rechazado, Error) y rango de cortes.
  - **Consultar estado** solo con `cargas.write`. El corte enlaza a *Envío a MURIC* (con `cargas.write`).
  - Las transmisiones por lote anteriores a la Fase C se marcan como tales.
  - Exportar a Excel.

### 3.2 Resumen de cartera por corte

- **Backend** `GET /api/consultas/cartera?fechaCorte=`:

  ```
  { fechaCorte,
    totales: { creditos, saldoCapital, saldoIntereses, saldoOtros, provisiones, valorGarantia },
    porUniversalidad: [ { codigo, descripcion, creditos, saldoCapital, …, provisiones } ],
    porCalificacion:  [ { codigo, creditos, saldoCapital } ],
    porRangoMora:     [ { rango, creditos, saldoCapital } ],   // rangos de K6
    porEstado:        [ { codigo, descripcion, creditos, saldoCapital } ] }
  ```

  `provisiones` = procíclica + contracíclica + adicional + otros. Sin movimientos en el corte: `404`.
- **Front** `/app/consultas/cartera`:
  - Selector de corte, que ofrece los cortes con datos (`GET /api/consultas/cortes`).
  - Tarjetas de totales y cuatro tablas: por universalidad, calificación, mora y estado, cada una con su porcentaje del saldo.
  - Sin gráficos en la primera versión (K10). Exportar a Excel, una hoja por tabla.

### 3.3 Estado de cumplimiento por corte

- **Backend** `GET /api/consultas/cumplimiento?desde=&hasta=` (por defecto, los últimos 12 cortes con lotes). Responde, por cada corte:
  - Una celda por universalidad `{ loteId, estado }` con el lote más relevante (activo, si no promovido, si no anulado), o `null`.
  - La última transmisión `{ estado, fecha }`.
  - Una marca **faltante** para las universalidades activas sin lote no anulado (regla de K9).
- **Front** `/app/consultas/cumplimiento`:
  - Matriz de cortes (filas) por universalidades (columnas), con chips de estado del lote y, a la derecha, el estado de la transmisión.
  - Las celdas faltantes van resaltadas. Cada celda abre el lote, y cada corte abre *Envío a MURIC* (con `cargas.write`).

### 3.4 Ficha de crédito

- **Backend:**
  - `GET /api/consultas/creditos?texto=`: busca por id del crédito (exacto o por inicio) o por número de identificación del deudor (exacto). Devuelve hasta 50 resultados con id, universalidad, deudor, último corte y último saldo.
  - `GET /api/consultas/creditos/{id}`: devuelve el crédito, el deudor, la universalidad, los **atributos vigentes** (último valor por clave, con el nombre de `CatalogoAtributos`) y los **movimientos de todos los cortes**, el más reciente primero.
  - Permiso propio (K2). Las dos rutas se **auditan** (se agregan a `SelectAllowed`; K3).
- **Front** `/app/consultas/credito`:
  - Buscador y lista de resultados.
  - Ficha con tres bloques: datos del crédito y del deudor, atributos, e historia por corte (estado, calificación, días de mora, saldos, provisiones), con un indicador de si el crédito salió en la transmisión de cada corte.
  - Sin exportación (K5).

### 3.5 Comparación entre cortes

- **Backend** `GET /api/consultas/comparacion?corte=&anterior=` (`anterior` por defecto = corte con datos inmediatamente anterior). Resumen con conteos y lista paginada por categoría (`&categoria=&pagina=`):

  | Categoría | Regla |
  |---|---|
  | Nuevos | En `corte`, no en `anterior`. |
  | **Desaparecidos** | En `anterior` con estado **no terminal**, no en `corte`. Probable error de carga. |
  | Terminados | En `anterior` con estado terminal (K7), no en `corte`. Esperado. |
  | Variación de saldo | En ambos; saldo de capital cambia más que el umbral (K8). |
  | Salto de mora | En ambos; los días de mora suben más que los días entre los dos cortes (imposible si el crédito no se pagó). |

- **Front** `/app/consultas/comparacion`:
  - Dos selectores de corte y tarjetas con los conteos por categoría. Al elegir una tarjeta se ve la tabla de esa categoría (crédito, universalidad, valores en cada corte y diferencia), y cada crédito abre su ficha (si hay permiso).
  - Exportar a Excel la categoría elegida.

## 4. Fases

"(B)" = backend, "(F)" = front. Una fase por turno, con `dotnet build` / `lint` + `build` y un commit por fase y por repo.

| Fase | Contenido | Estimado |
|---|---|---|
| **K0** (F) | Base: feature `queries`, servicio `ConsultasService` del front, sección *Consultas* del menú y rutas; helper de exportación a Excel. | ≈0,5 día |
| **K1** | Historial de transmisiones: filtros en `GET /api/transmisiones` (B) y pantalla (F). | ≈0,5 día |
| **K2** | Resumen de cartera: `ConsultasController` + `/cortes` + `/cartera` (B) y pantalla (F). | ≈1 día |
| **K3** | Cumplimiento por corte: `/cumplimiento` (B) y matriz (F). | ≈1 día |
| **K4** | Ficha de crédito: permiso nuevo y su seed, búsqueda y detalle, auditoría (B), buscador y ficha (F). | ≈1,5 días |
| **K5** | Comparación entre cortes: `/comparacion` (B) y pantalla (F). | ≈1,5 días |
| **K6** | Cierre: `CLAUDE.md` de los dos repos, guía de pruebas manuales con datos verificados. | ≈0,5 día |

**Estimado: ≈6,5 días.** Cada fase de consulta se prueba contra la API con los cortes de prueba existentes (2026-11-30, 2027-02-28 y el 2027-01-31 de la guía de entidad reportante).

## 5. Pruebas manuales (resumen)

1. Transmisiones: aparecen las de todos los cortes; los filtros funcionan; U-CONSULTA no ve *Consultar estado*.
2. Cartera: los totales del corte 2027-02-28 coinciden con la suma de sus dos universalidades y con el AVRO transmitido (4 créditos).
3. Cumplimiento: la 113 aparece faltante o anulada en 2027-02-28; los cortes con transmisión muestran su estado.
4. Ficha: buscar `PRB-301` da dos créditos (111 y `U112-PRB-301` de la 112); la ficha muestra su historia por corte; la consulta queda en la auditoría; sin el permiso, la opción no aparece.
5. Comparación: entre 2027-01-31 y 2027-02-28 no hay desaparecidos; un crédito quitado del archivo de un corte aparece como desaparecido.

## 6. Riesgos

| Riesgo | Mitigación |
|---|---|
| La ficha expone datos personales del deudor | Permiso propio, sin exportación y con auditoría de cada consulta (K2–K5). |
| Volumen: millones de movimientos por corte en producción | Agregación en SQL con los índices por `FechaCorte`; listas de la comparación paginadas; búsqueda de créditos limitada a 50 y sin `LIKE '%x%'`. |
| "Faltante" mal calculado para universalidades nuevas o retiradas | Regla de K9; las inactivas no cuentan. |
| Umbrales de la comparación que generen ruido | Configurables en `appsettings` (sección `Consultas`), con los valores de K8 por defecto. |
| Los datos de prueba actuales son pocos | Cada fase deja verificada su consulta contra la API con los cortes existentes; la guía de K6 incluye los casos. |

## 7. Decisiones pendientes

| # | Pregunta | Recomendación |
|---|---|---|
| K1 | ¿Orden de las fases? | El de §4: transmisiones (casi sin backend), cartera, cumplimiento, ficha y comparación. |
| K2 | ¿Quién ve la ficha de crédito? | Permiso nuevo **`consultas.creditos`** ("Consultar créditos y deudores"), asignado a ADMIN y OPERADOR. CONSULTA solo si se le asigna en *Gestión de roles*. |
| K3 | ¿Se auditan las consultas de la ficha? | **Sí**, búsqueda y detalle, con el texto buscado y el crédito consultado. |
| K4 | ¿Se enmascara el número de identificación del deudor? | No: quien tiene el permiso lo necesita completo para atender solicitudes. La protección es el permiso más la auditoría. |
| K5 | ¿Qué se exporta a Excel? | Transmisiones, cartera, cumplimiento y comparación. La ficha de crédito **no**. |
| K6 | Rangos de mora del resumen | 0, 1–30, 31–60, 61–90, 91–180, 181–360 y más de 360 días. |
| K7 | ¿Qué estados son "terminales" (su desaparición es esperada)? | 5 Vendida/cedida, 6 Castigado, 8 Pagado, 9 Consolidado y 10 Cancelada por reexpedición. ¿Incluir 4 Titularizada? Recomiendo **no** (sigue siendo cartera de la universalidad). |
| K8 | Umbral de variación de saldo | Aumento de más del 20 % o baja de más del 50 % del saldo de capital entre cortes. Configurable. |
| K9 | ¿Desde cuándo una universalidad "falta" en un corte? | Desde su **primer lote** no anulado, y solo mientras esté activa. |
| K10 | ¿Gráficos? | No en la primera versión: tablas con porcentajes. Si se quieren, `@mui/x-charts` en una fase aparte. |
| K11 | ¿El resumen de cartera usa solo lo promovido? | **Sí**: es lo que se transmite. Lo que está en staging se ve en cada lote. |
