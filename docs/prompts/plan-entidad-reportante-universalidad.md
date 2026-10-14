# Plan: entidad reportante (Titularice) y universalidad en lote y crédito

Fecha: 2026-09-27 · Rama: `rhenao-sprint04`
Base: `docs/decisiones/MURIC_nombre_archivo_entidad.md` (tipo y código de entidad = Titularice, tipo 600).
Backend revisado: `MURICSyncBack` (commit `4818e64`), ADR 0002 (snapshot mensual), 0005 y 0006.
Relacionado: `docs/prompts/plan-plantillas-carga.md` (D4 queda reemplazada por este plan).

**Estado (2026-09-29):** B1 hecha (back `2a30fb7`, front `677894f`), Fase A hecha (back `7640410`, front `44edc7a`) B2 hecha (back `6e107bc`, front `3a7e45d`) C hecha (back `df8ceb3` con ADR 0008, front `eb7950a`) y D hecha (back `b9daf64`, front `eca8453`; decisiones 2026-09-29: severidad Error, regla en "Validar lote", con panel de errores) y E hecha (CLAUDE.md del back `e94252c`; guía `pruebas-manuales-entidad-reportante.md` con archivos en `pruebas-entidad-reportante/`). Faltan las pruebas en el navegador.

## 1. Diagnóstico: hoy la universalidad ocupa el lugar de la entidad

| Dónde | Qué hace hoy | Qué debe hacer |
|---|---|---|
| `CargaArchivos` (formulario de lote) | Envía `tipoEntidad = 1` (`TIPO_ENTIDAD_DEFAULT`) y `codigoEntidad` = **código de la universalidad** elegida. | Envía solo la **universalidad**. Tipo y código no los decide el usuario. |
| `CrearLoteRequest` / `LoteCarga` | `TipoEntidad`, `CodigoEntidad` (= universalidad). Índice `ix_lote_corte_entidad`. | `UniversalidadCodigo`. Sin tipo ni código. |
| `Credito` | Clave única `ux_credito_identificacion` = (tipo, código = universalidad, id del crédito). | Un solo reportante: la clave es el id del crédito (ver E9). La universalidad es un atributo del crédito. |
| `PromocionService` (l. 156, 181, 219) | Sella el crédito con el tipo y código del lote y busca existentes por esa terna. | Sella `UniversalidadCodigo` y busca por id del crédito. |
| `GeneradorAvroService` (l. 98, 126, 160) | `GenerarAsync(loteId)`: **un archivo por lote** → uno por universalidad, `T1_C<univ>_muric_…`, cabecera con esos valores. | **Un archivo por fecha de corte** con todas las universalidades, `T600_C<Titularice>_…`, cabecera desde configuración. |
| `TransmisionSfc` | `LoteId` obligatorio: la transmisión cuelga de un lote. | La transmisión cuelga de la **fecha de corte**. |
| `ConsultasMURIC` / `EnviaMURIC` | Filtran por `codigoEntidad` como si fuera la universalidad; `EnviaMURIC` transmite por lote. | Filtran por `universalidadCodigo`; el envío es por fecha de corte. |

Consecuencia: con los datos actuales, cada universalidad se transmitiría como si fuera una entidad vigilada distinta, con tipo 1 (bancos). **La SFC rechazaría el archivo o lo atribuiría a otra entidad.**

## 2. Decisiones recibidas (2026-09-27 a 2026-09-29)

| # | Decisión | Consecuencia |
|---|---|---|
| E1 | Tipo y código de la entidad reportante viven en la **configuración del backend**, con override por variable de entorno, **validados al arrancar**. El front los **lee por API**. | Sección `EntidadReportante` en `appsettings` + `EntidadReportanteOptions` con `ValidateOnStart`. Endpoint de solo lectura. El front no tiene variable `VITE_` para esto y **nunca envía** tipo ni código. (Fase A) |
| E8 | La Fase B de plantillas queda solo con D1. Lo demás va en este plan. | `plan-plantillas-carga.md` actualizado: D4 y N6 obsoletas. |
| E9 | (2026-09-28) Prefijo **opcional por universalidad** (opción c). | Columna `PrefijoCredito` (opcional) en `Universalidades`, editable en su CRUD. La ingesta lo antepone a `identificacion_credito_entidad` para que staging y errores muestren el id final. La promoción **siempre** detecta colisiones con otra universalidad (§3.2). Va en B2. |
| E2 | (2026-09-29) D4 original se anula. | El front no envía tipo ni código (hecho en B1). |
| E3 | (2026-09-29) La universalidad es columna propia del lote. | `UniversalidadCodigo` con FK (hecho en B1). Se sigue cargando por universalidad porque cada originador entrega sus archivos. |
| E4 | (2026-09-29) Tipo y código **no** se guardan en `LoteCarga` ni en `Credito`. | Se leen de la configuración al generar (Fase A). Mientras el código no esté confirmado, guardarlo en filas obligaría a migrar datos después. |
| E5 | (2026-09-29) Clave única del crédito = id con prefijo (E9). | `UniversalidadCodigo` es atributo del crédito, no parte de la clave (B2). |
| E6 | (2026-09-29) Generación y transmisión por fecha de corte. | Un archivo por corte con todas las universalidades (Fase C). |
| E7 | (2026-09-29) Se valida el prefijo `TTTCCC` de `identificacion_negocio_vehiculo_universalidad`. | Fase D. La validación contra la universalidad del lote espera a que el CRUD de Universalidades tenga tipo de vehículo, ANN y originador. |
| E10 | (2026-09-29) No se transmite un corte con lotes sin promover. | `409` con la lista de lotes pendientes; para excluir una universalidad del corte, se anula su lote (Fase C). |
| E12 | (2026-09-27) Los cambios de MURICSyncBack los hace Claude. | Commit aparte en la rama `rhenao_sprint04` del backend. |
| — | (2026-09-29) El `PrefijoCredito` de una universalidad no se puede cambiar después de su primera transmisión. | El CRUD de Universalidades lo bloquea si la universalidad ya tiene créditos transmitidos (B2). |
| E11 | (2026-09-29) No hay datos reales: todo lo que existe en los ambientes es de prueba. | B2 no necesita migrar créditos: los datos de prueba se pueden limpiar o dejar con la clave nueva (B1 ya migró los lotes). |
| — | (2026-09-28) La Fase B se parte en **B1** (lote) y **B2** (crédito). B1 va primero (decisión L1 de `plan-cargue-archivos.md`). | Ver §4. |

## 3. Diseño

### 3.1 Configuración (E1)

```json
"EntidadReportante": {
  "TipoEntidad": 600,
  "CodigoEntidad": 0,
  "DigitosCodigoEnNombre": 0
}
```

- `CodigoEntidad = 0` en `appsettings.json` → **la API no arranca** hasta que cada ambiente lo configure (`EntidadReportante__CodigoEntidad=3`). Cumple el "no hardcodear" del documento de decisión mientras el código de Titularice sigue sin confirmar.
- `DigitosCodigoEnNombre`: `0` = sin ceros a la izquierda (`C3`, como los ejemplos oficiales `T1_C57`); `3` = `C003`. Resuelve el pendiente de formato sin tocar código.
- El prefijo `TTTCCC` de `identificacion_negocio_vehiculo_universalidad` **siempre** usa 3 dígitos (`600003`), independiente del nombre de archivo.
- `GET /api/configuracion/entidad-reportante` → `{ tipoEntidad, codigoEntidad, nombreArchivoEjemplo }`. Requiere usuario autenticado, sin permiso especial (no es un dato sensible).
- Un solo helper `NombreArchivoMuric.Construir(opciones, fechaCorte)` para que nombre y cabecera salgan de la misma fuente.

### 3.2 Universalidad en lote y crédito (E3, E4, E5)

- `LoteCarga`: se agrega `UniversalidadCodigo int` con FK a `Universalidades.Codigo` (`Restrict`; las universalidades se retiran con `Estado = "I"`, no se borran). Se quitan `TipoEntidad` y `CodigoEntidad`. Índice `ix_lote_corte_universalidad (FechaCorte, UniversalidadCodigo)`.
- Crear lote valida que la universalidad exista y esté activa.
- `Credito`: se agrega `UniversalidadCodigo`; se quitan `TipoEntidad` y `CodigoEntidad`. Clave única según E9.
- **Detección de colisiones en la promoción** (se haga o no el prefijo): si un id de crédito ya existe con **otra** universalidad, la promoción falla con un error por fila que nombra las dos universalidades. Nunca se sobreescribe en silencio un crédito de otra universalidad.
- Migración de datos (E11): `UniversalidadCodigo ← CodigoEntidad` en lotes y créditos antes de borrar las columnas.

### 3.3 Generación y transmisión por fecha de corte (E6, E10)

- `IGeneradorAvroService.GenerarAsync(DateOnly fechaCorte)`: toma los créditos con movimiento en el corte, de **todas** las universalidades. (El filtro actual por tipo/código desaparece.)
- Precondición: todos los lotes **no anulados** de esa fecha de corte deben estar `Promovido`. Si no, `409` con la lista de lotes pendientes (E10).
- `TransmisionSfc`: se agrega `FechaCorte`; `LoteId` pasa a anulable (conserva el historial existente) y deja de usarse en transmisiones nuevas.
- Endpoints nuevos: `GET /api/transmisiones?fechaCorte=`, `GET /api/transmisiones/avro?fechaCorte=`, `POST /api/transmisiones { fechaCorte }`, `POST /api/transmisiones/{txId}/consultar`. Los de `/api/cargas/{id}/avro|transmitir|transmisiones` se retiran (o responden `410`) al terminar la fase.
- Antes de firmar: assert de coherencia nombre ↔ cabecera (`tipo_entidad`, `codigo_entidad`, fecha).

### 3.4 Validación del identificador de universalidad (E7)

- En la validación (ADR 0007, error por celda): `identificacion_negocio_vehiculo_universalidad` de 21 caracteres y con los 6 primeros = `TTTCCC` de la configuración.
- Validar además que corresponda a la universalidad del lote (tipo de vehículo + ANN) **depende** de que `Universalidades` tenga esos campos y el originador. Eso es una extensión del CRUD de Universalidades (fuera de este plan; ver `plan-crud-universalidades.md`, R2).

### 3.5 Front

- `EntidadReportanteService` + hook `useEntidadReportante` (una llamada, cacheada). Se muestra "Entidad reportante: T600 · C3" como dato informativo en *Cargue de archivos* y *Envío MURIC*.
- `CargaArchivos`: se quita el campo "Tipo entidad" y `TIPO_ENTIDAD_DEFAULT`; el lote se crea con `{ fechaCorte, universalidadCodigo, observaciones }`. El modelo `Lote` cambia `tipoEntidad/codigoEntidad` por `universalidadCodigo`.
- `ConsultasMURIC`: el filtro "Universalidad" envía `universalidadCodigo`; la columna muestra la descripción de la universalidad.
- `EnviaMURIC`: pasa a trabajar **por fecha de corte**: estado de los lotes del corte por universalidad (listos / pendientes), descarga del AVRO, transmitir y consultar estado. El filtro por universalidad se quita de la transmisión (el archivo es uno solo).

## 4. Fases

"(B)" = backend, "(F)" = front. Cada fase se despliega sola; cada una deja el sistema consistente.

### Fase A: configuración de la entidad reportante (E1) · ≈0,5 día

- **(B)** `EntidadReportanteOptions` + `ValidateOnStart`, sección en `appsettings*.json`, helper de nombre de archivo, endpoint `GET /api/configuracion/entidad-reportante`.
- **(B)** `GeneradorAvroService` toma tipo/código/nombre de la configuración (todavía por lote).
- **(F)** Servicio + hook y el dato informativo en *Cargue de archivos* y *Envío MURIC*.

### Fase B1: lote por universalidad (E3) · ≈1 día

Va primero (decisión L1 de `plan-cargue-archivos.md`). No depende de E9.

- **(B)** Migración: `LoteCarga.UniversalidadCodigo` (FK a `Universalidades.Codigo`, `Restrict`) con traslado `UniversalidadCodigo ← CodigoEntidad`; se quitan `TipoEntidad` y `CodigoEntidad` del lote; índice `ix_lote_corte_universalidad`.
- **(B)** `CrearLoteRequest { fechaCorte, universalidadCodigo, observaciones }` (universalidad existente y activa), `FiltroLotesRequest` y `LoteResponse` con `universalidadCodigo` y `universalidadDescripcion`.
- **(B)** `PromocionService` **temporal**: sigue marcando el crédito con `TipoEntidad = 1` y `CodigoEntidad = lote.UniversalidadCodigo`, como hoy, para que la clave de los créditos existentes no cambie hasta B2.
- **(F)** `CargaArchivos`, `ConsultasMURIC` y `EnviaMURIC` con `universalidadCodigo`; se quitan "Tipo entidad" y `TIPO_ENTIDAD_DEFAULT`.

### Fase B2: crédito por universalidad (E4, E5, E9, E11) · ≈1 día

- **(B)** `Credito.UniversalidadCodigo`, fuera `TipoEntidad` y `CodigoEntidad`, nueva clave única (§3.2) y migración de créditos (E11).
- **(B)** `Universalidades.PrefijoCredito` (E9 c), aplicado en la ingesta; detección de colisiones en la promoción.
- **(F)** Campo "Prefijo de crédito" en el CRUD de Universalidades.

### Fase C: generación y transmisión por fecha de corte (E6, E10) · ≈2 días

- **(B)** `GenerarAsync(fechaCorte)`, precondición de lotes promovidos, `TransmisionSfc.FechaCorte`, endpoints de `/api/transmisiones`, assert nombre ↔ cabecera.
- **(F)** `EnviaMURIC` por fecha de corte.
- **ADR nuevo** "Entidad reportante única y transmisión por fecha de corte", a partir de `MURIC_nombre_archivo_entidad.md`. Toma el número 0008; el ADR del insumo "Todos" de `plan-plantillas-carga.md` pasa al 0009.

### Fase D: validación del identificador de universalidad (E7) · ≈0,5 día

- **(B)** Regla de 21 caracteres + prefijo `TTTCCC` en la validación.
- **(F)** Sin cambios (los errores por celda ya se muestran).

### Fase E: cierre · ≈0,5 día

`npm run lint` + `npm run build`, pruebas manuales (§5), `CLAUDE.md` del front (entidad reportante por API, lote por universalidad, envío por corte) y del backend (sección `EntidadReportante`).

**Estimado: ≈5,5 días** (A 0,5 · B1 1 · B2 1 · C 2 · D 0,5 · E 0,5).

**Orden sugerido con el plan de plantillas:** plantillas Fase B (D1) es independiente y puede ir antes. Este plan debe estar completo **antes de la primera transmisión real**.

## 5. Pruebas manuales (resumen)

1. Arrancar la API sin `EntidadReportante__CodigoEntidad` → no arranca, con un mensaje claro.
2. `GET /api/configuracion/entidad-reportante` → `600 / <código>`; el front lo muestra.
3. Crear lotes del mismo corte para dos universalidades, promover ambos → créditos con su `UniversalidadCodigo`.
4. Promover un lote con un id de crédito que ya existe en otra universalidad → la promoción falla y nombra ambas.
5. Generar el AVRO del corte → un solo archivo `T600_C<código>_muric_<DDMMAAAA>.avro.p7z` con los créditos de las dos universalidades y cabecera coherente.
6. Intentar transmitir un corte con un lote en `Validado` → `409` con la lista de pendientes.
7. Crédito con `identificacion_negocio_vehiculo_universalidad` de 20 caracteres o con otro prefijo → error de celda en la validación.

## 6. Riesgos

| Riesgo | Mitigación |
|---|---|
| El código de Titularice ante la SFC sigue sin confirmar | `ValidateOnStart` impide operar con un valor por defecto; se configura por ambiente. |
| El id de un crédito cambia entre meses (p. ej. si se agrega un prefijo después de haber transmitido) | La SFC sigue el crédito por su id mes a mes (ADR 0002). Con E9 (c), el `PrefijoCredito` de una universalidad **no se puede cambiar** después de su primera transmisión: el CRUD lo bloquea si la universalidad ya tiene créditos transmitidos. |
| Borrar `TipoEntidad`/`CodigoEntidad` de lote y crédito | Migración con traslado a `UniversalidadCodigo`; revisar los datos reales antes (E11). |
| Transmisiones históricas colgadas de `LoteId` | `LoteId` queda anulable; no se borra historial. |
| Un corte con una universalidad atrasada bloquea el envío de todas | Es el comportamiento correcto (un archivo por corte). La pantalla muestra qué lote falta; se puede anular un lote si no aplica. |

## 7. Decisiones pendientes

Ninguna.
