# Plan: plantillas de carga (correcciones, plantillas globales, atributos por columna e insumo "001-999 Todos")

Fecha: 2026-09-26 · Rama: `rhenao-sprint04`
Base: `docs/prompts/analisis-plantillas-carga.md` (hallazgos H1–H16).
Backend revisado: `MURICSyncBack` (commit `4818e64`), incluidos los ADR 0003, 0005 y 0006 y el archivo `pruebas/Tablas MURIC- Atributos de los créditos y deudores.xlsx` (catálogo SFC de los 40 atributos, octubre de 2025).

## 1. Decisiones de negocio recibidas y cómo se aplican

| # | Decisión | Consecuencia en el plan |
|---|---|---|
| D1 | Las plantillas son **globales**, válidas para cualquier universalidad. | Se quitan `TipoEntidad` y `CodigoEntidad` de la plantilla, en el backend y en el front. *Cargue de archivos* deja de filtrar por la entidad del lote. Resuelve H2. (Fase B) |
| D2 | El valor por defecto **sí** se usa para las celdas vacías. | Cambio en `ParserBase.AplicarPlantilla`: si un campo tiene columna **y** valor por defecto, el valor se usa cuando la celda viene vacía. El texto del formulario se ajusta. Resuelve H6. (Fase C) |
| D3 | Por ahora **se permiten** nombres repetidos. | Sin cambios. H14 y B5 quedan descartados. |
| D4 | Quitar "Tipo de entidad" de los formularios y dejarlo **fijo en 1**. | Se quita el campo "Tipo entidad" del formulario de creación de lote en *Cargue de archivos*: el front envía siempre `1`. En plantillas desaparece junto con D1. **(Interpretación: confirmar N6, §8.)** (Fase B) |

## 2. Adicional 1: insumo "001-999 Todos"

### 2.1 Qué significa

Es una plantilla cuyo archivo trae, **en una sola fila por crédito**, campos de los tres insumos: datos del crédito (001-001), atributos (001-002) y saldos o movimientos (001-003). Al cargarlo, **un solo archivo llena los tres slots del lote**.

### 2.2 Choque con una decisión de arquitectura ya tomada

El ADR 0005 ("Tres archivos separados por insumo") eligió tres archivos y **rechazó explícitamente** la opción C, "formato a elección del operador", por duplicar el parsing y la validación. "001-999 Todos" es una variante de esa opción C. Por eso:

- Hay que **registrar un ADR nuevo (0008)** que modifique el ADR 0005: se admite, además de los tres archivos, un archivo combinado **solo con plantilla**.
- El diseño debe evitar el costo que motivó el rechazo. El archivo combinado se trata como un **"repartidor"** que está antes de los tres slots. Se lee una vez, produce las filas de staging de los tres insumos con **los mismos parsers** y las guarda en los tres slots. La validación, la promoción y la transmisión no cambian, porque siguen viendo tres slots normales.

### 2.3 Diseño propuesto

| Tema | Propuesta |
|---|---|
| Código | `001-999`. Cabe en `Insumo` (`MaxLength(10)`). En el backend, `InsumoEnum.Todos` y `ToCodigo()`/`FromCodigo()`. |
| Campos disponibles | La **unión** de los campos de los tres insumos. Los tres identificadores comunes (`identificacion_credito_entidad`, `tipo_identificacion`, `numero_identificacion`) se mapean **una vez** y alimentan los tres insumos. No hay más nombres repetidos entre insumos (se verificó contra los tres parsers). |
| Atributos | Solo en **formato "atributo por columna"** (§3, opción B). Una fila no puede traer pares clave/valor, así que **Todos depende de la Fase D**. |
| Qué insumos genera | Un insumo se genera si la plantilla mapea **al menos un campo propio** de él (sin contar los identificadores). Los obligatorios se validan solo para los insumos generados. **(Confirmar N1.)** |
| Carga | `POST /api/cargas/{id}/archivos` con `insumo=001-999` y `plantillaId` **obligatorio**. `IngestaArchivoService` lee una vez y aplica a cada parser el subconjunto de campos de su insumo. En **una sola transacción** borra y rellena los slots generados (ADR 0006) y limpia sus errores. Si falla cualquier parte, no se toca ningún slot. |
| Trazabilidad | Un `HistorialCargaArchivo` por slot generado, con el mismo archivo y el mismo hash. En el lote, `PlantillaId001001/2/3` quedan con el id de la plantilla Todos, así que la regla "no se puede borrar una plantilla usada" sigue funcionando sin columnas nuevas. |
| *Cargue de archivos* | Una cuarta fila, "001-999 Todos (un solo archivo)", con su selector de plantillas Todos (obligatorio) y botón de subir. Si ya hay archivos cargados en los slots que va a reemplazar, pide confirmación. **(Confirmar N2.)** |
| Vista previa | `PreviewService` hoy trabaja por insumo. Para Todos: mostrar la vista previa por pestaña de insumo, o dejarla fuera de la primera versión. **(Confirmar N7.)** |

## 3. Adicional 2: cómo manejar "001-002 Atributos"

### 3.1 Situación actual

- El insumo 001-002 es **EAV** (ADR 0003): cada fila del archivo es un par `(crédito, clave_atributo, valor_atributo)`. Un crédito con 12 atributos ocupa 12 filas.
- `clave_atributo` es un entero de **1 a 40** (enum `clave_a` del esquema AVRO `muricV2.0.9.json`). La promoción falla si no es entero (`PromocionService.cs:234`).
- **No hay en el sistema un catálogo de los 40 atributos con su nombre.** Solo está el Excel de la SFC en `pruebas/`, y un mapeo parcial en `docs/mapeos/documento-diligenciamiento-a-entidades.md` que tiene una nota de "pendiente".
- La plantilla actual de 001-002 solo puede mapear las 5 columnas del formato EAV. Si el sistema origen entrega **una columna por atributo** (lo usual en un core o un CRM: "Sexo", "CIIU", "Canal"…), hoy el operador tiene que transformar el archivo a mano antes de cargarlo.

### 3.2 Alternativas

| Opción | Cómo funciona | A favor | En contra |
|---|---|---|---|
| **A. EAV + atributo fijo por plantilla** | La plantilla fija `clave_atributo` con un valor por defecto elegido de la lista de atributos, y el archivo trae solo la columna del valor. | Casi sin cambios en el backend. | **Un archivo por atributo** (hasta 40 archivos por mes). No sirve para "Todos". Como cada carga reemplaza el slot completo (ADR 0006), **no se pueden cargar dos archivos de atributos en el mismo lote**. Descartada. |
| **B. Atributo por columna ("despivotar")**, tu idea ampliada | En la plantilla, cada fila de 001-002 puede ser un **atributo**: "columna del archivo → atributo N (elegido de la lista de los 40)". Al leer, cada fila del archivo produce **una fila EAV por cada atributo con valor**. | Es el formato natural de los sistemas origen. Un solo archivo lleva todos los atributos. **Es lo que hace posible "Todos".** La lista de atributos sirve para validar y guiar al usuario. | Cambios en la plantilla (columna nueva), en el parser (una fila produce N filas) y un catálogo nuevo. |
| **C. B + EAV, los dos** | Si la plantilla (o el archivo sin plantilla) trae `clave_atributo`/`valor_atributo`, se lee como hoy (EAV). Si trae columnas de atributo, se despivota. | Compatible con lo que ya funciona y con los archivos en formato SFC. | Dos caminos en el parser, pero cortos y excluyentes. |

**Recomendación: opción C.** Se implementa B y se conserva el formato EAV actual.

### 3.3 Diseño de la opción C

**Catálogo de atributos (nuevo, backend)**

- Tabla de parámetros `CatalogoAtributos`, de solo consulta, como las demás tablas SFC. Se expone por OData en `/CatalogoAtributos`.

| Campo | Tipo | Ejemplo |
|---|---|---|
| `Codigo` | int (1–40) | `5` |
| `Nombre` | string(100) | `Sexo` |
| `Descripcion` | text | Instrucción de diligenciamiento de la SFC |
| `Naturaleza` | string(30) | `Obligatorio` / `Sólo si es aplicable` |
| `Repetible` | bool | `true` en 18, 29, 30, 31, 32 y 36 (la SFC indica que se repiten) |
| `CatalogoValor` | string(50), opcional | Endpoint del catálogo que define los valores válidos, p. ej. `SexoBiologico` |

- Se llena (seed) desde el Excel de la SFC. Relación atributo → catálogo que **ya existe** en el sistema: 5→`SexoBiologico`, 6→`GrupoEtnico`, 7→`IndicadorVictima`, 8→`TamanoEmpresa`, 9→`TipoContratacion`, 12→`CanalOriginacion`, 13→`CondicionBien`, 14→`TipoEmpleado` (condición laboral), 15→`DestinoCredito`, 17→`TipoConsolidacion`, 22→`TipoRecuperacion`, 23→`FranquisiaCredito`, 29→`TipoPoliza`, 35→`CanalDesembolso`.
- **Catálogos que faltan** (fuera de alcance; se anotan): 10 CIIU (DANE), 11 y 33 municipios DIVIPOLA, 25 crédito sostenible.
- En el front: `ListCatalogoAtributos` con `ListaGeneralConsulta`, en el menú de tablas básicas.

**Plantilla**

- `PlantillaCargaCampo` recibe la columna **`ClaveAtributo int?`**. Una fila con `ClaveAtributo` es una "columna de atributo": `NombreColumnaArchivo` es la columna del archivo, `CampoStaging = "valor_atributo"` y `ValorPorDefecto` funciona como en D2.
- Validación en el backend: la clave debe estar entre 1 y 40, y no puede repetirse en la misma plantilla salvo que el atributo sea `Repetible`.
- Una plantilla 001-002 es **EAV** si mapea `clave_atributo` y **por columnas** si tiene filas con `ClaveAtributo`. No puede mezclar las dos formas.

**Parser (`ParserAtributoService` + `ParserBase`)**

- `ParserBase` pasa a permitir **varias filas de staging por cada fila del archivo** (método virtual `MapearFilas` que por defecto envuelve `MapearFila`).
- En modo por columnas, por cada fila del archivo y cada columna de atributo **con valor** (o con valor por defecto), emite `LoteCargaAtributo { identificación…, ClaveAtributo = N, ValorAtributo = valor }`. **Las celdas vacías sin valor por defecto no generan fila.** **(Confirmar N4.)**
- `NumeroFila` sigue siendo la fila del archivo, para que los errores por celda (ADR 0007) apunten a la fila que ve el operador.
- **Sin plantilla**, también se aceptan encabezados canónicos `atributo_1` … `atributo_40`. Así, la "plantilla vacía descargable" de atributos puede venir en formato ancho.
- **Pólizas (29 a 32):** la SFC exige el prefijo `Pn_` para varias pólizas. Se propone un campo opcional **"ordinal de póliza"** en la fila de la plantilla, con el que el parser antepone `P{n}_` al valor. **(Confirmar N3.)** El 36 (`4_CXX` / `4_IXX`) se deja tal cual lo trae el archivo.

**Formulario (`FormPlantilla`)**

- Para 001-002 (y para Todos), un botón **"Agregar atributo"** agrega una fila cuyo destino es un **selector de los 40 atributos**, con buscador (`Autocomplete`), código, nombre y la marca Obligatorio/Si aplica. La descripción de la SFC se muestra en un tooltip.
- Si el atributo tiene `CatalogoValor`, el valor por defecto es un **select con los valores del catálogo** (p. ej. Sexo: 1, 2…) en lugar de texto libre.
- La alerta de "obligatorios sin mapear" incluye los atributos de naturaleza `Obligatorio` (1–4, 10, 11, 12 y 35) **como advertencia, sin bloquear**, porque varios dependen del tipo de persona (1 solo para jurídica, 2 y 3 solo para natural).
- La sugerencia automática de mapeo también compara los encabezados del archivo con los **nombres** de los atributos (p. ej. "Canal originación" → atributo 12).
- La descarga de la plantilla vacía pone el nombre de cada columna de atributo tal como está en la plantilla.

## 3.4 Cómo queda el modelo de datos (resumen)

```
PlantillaCarga          Id, Nombre, Descripcion, Insumo ('001-001'|'001-002'|'001-003'|'001-999'),
                        UsuarioCreador, EsActiva, FechaCreacion
                        (se eliminan TipoEntidad y CodigoEntidad — D1)
PlantillaCargaCampo     Id, PlantillaId, NombreColumnaArchivo?, CampoStaging, ValorPorDefecto?, OrdenColumna,
                        ClaveAtributo? (nuevo), OrdinalPoliza? (nuevo, si N3 = sí)
CatalogoAtributos       Codigo, Nombre, Descripcion, Naturaleza, Repetible, CatalogoValor?   (nuevo, param SFC)
```

## 4. Fases

El orden prioriza lo que hoy está roto y hace que cada fase se pueda desplegar sola. Las fases B a E necesitan backend; "(F)" marca el trabajo de front y "(B)" el de backend.

### Fase A: corregir lo roto (solo front) · ≈1 día

| Hallazgo | Cambio |
|---|---|
| H1, H3, H9, H12 | Separar los modelos: `PlantillaResumen` (con `numeroCampos`), `PlantillaDetalle` (con `campos`), `CrearPlantillaRequest` y `ActualizarPlantillaRequest`. Editar pide `GET /plantillas/{id}` antes de abrir el formulario. Después de guardar, cambiar el estado o eliminar, **se recarga** la lista. "Campos mapeados" usa `numeroCampos`. `FormPlantilla` se defiende si no llegan `campos`. |
| H15 | `features/upload/services/PlantillaService.ts`, usado por `usePlantillas` y por `CargaArchivos` (el selector muestra `numeroCampos`). |
| H4 | `hasPermission("cargas.write")` para las acciones, `RequirePermission(["cargas.read"])` en la ruta y el menú con `cargas.read`. |
| H5 | Mensajes con `extractBackendErrors`. En un `409` al eliminar, el diálogo muestra el mensaje del backend y ofrece **"Desactivar"**. |
| H8, H13 | Estado de guardado en el formulario (botones deshabilitados, sin cierre mientras guarda) y botón "Reintentar". |

### Fase B: plantillas globales y tipo de entidad fijo (D1, D4) · ≈1 día

- **(B)** Migración: quitar `TipoEntidad` y `CodigoEntidad` de `PlantillasCarga`, y reemplazar el índice `ix_plantilla_insumo_entidad` por `ix_plantilla_insumo`. Quitar los campos de `CrearPlantillaRequest`, de las respuestas y de `FiltroPlantillasRequest`. *(Alternativa más conservadora: dejarlos anulables e ignorarlos.)*
- **(F)** `FormPlantilla` deja de enviarlos. `CargaArchivos.fetchPlantillas` filtra solo por `insumo` y `soloActivas`.
- **(F)** `CargaArchivos`: se quita el campo "Tipo entidad" del formulario de lote y se envía siempre `tipoEntidad: 1` (constante `TIPO_ENTIDAD_DEFAULT` que ya existe).

### Fase C: valor por defecto como respaldo y ajustes menores (D2, H6, H7, H10, H11, H16) · ≈1 día

- **(B)** `AplicarPlantilla`: si el campo tiene columna **y** valor por defecto, se crea un índice virtual que en cada fila toma `valor de la celda ?? valor por defecto`. Con el índice virtual se evita el caso de una columna compartida por dos campos con valores por defecto distintos. Si la columna **no existe** en el archivo y hay valor por defecto, se usa el valor por defecto.
- **(B)** Validar en `PlantillaService` que `insumo` sea válido y que `campoStaging` exista para ese insumo y no se repita (B1 del análisis).
- **(F)** Texto del valor por defecto: *"Se usa cuando la celda viene vacía o la columna no existe"*. Se quita `|` de la detección de separador (H7). Se valida el máximo de 200 caracteres por columna y se advierten las columnas repetidas (H10). Se alinean los obligatorios de 001-003 con el backend (H11). Se limpia el nombre del archivo descargado (H16).

### Fase D: catálogo de atributos y atributos por columna (opción C de §3) · ≈3 días

- **(B)** Tabla `CatalogoAtributos` + seed de los 40 + controlador OData de solo lectura (`params.read`).
- **(B)** `PlantillaCargaCampo.ClaveAtributo` (+ `OrdinalPoliza` si N3) y sus validaciones.
- **(B)** `ParserBase.MapearFilas` y el modo por columnas en `ParserAtributoService`, más los encabezados canónicos `atributo_N`.
- **(F)** `ListCatalogoAtributos` (consulta), el modelo y el servicio del catálogo.
- **(F)** `FormPlantilla`: filas de atributo con selector de los 40, valor por defecto desde el catálogo, advertencias de obligatorios, sugerencias por nombre de atributo y marca "Repetible".
- Pruebas: una plantilla 001-002 con 5 atributos en columnas genera 5 filas EAV por crédito, y las celdas vacías no generan fila.

### Fase E: insumo "001-999 Todos" · ≈3 días

- **ADR 0008**, que modifica el ADR 0005 (§2.2).
- **(B)** `InsumoEnum.Todos`, validación de la plantilla Todos (unión de campos, identificadores una sola vez, al menos un campo propio de algún insumo), `IngestaArchivoService.IngestarTodosAsync` (lectura única, tres parsers, una transacción, un historial por slot, `PlantillaId00100x`) y `plantillaId` obligatorio para Todos.
- **(F)** Modelo e interfaz: `'001-999'` en `InsumoMURIC`, sus etiquetas, el chip de filtro "001-999 Todos" y `CAMPOS_POR_INSUMO['001-999']` como unión (identificadores una vez, agrupados por insumo en el selector: *Crédito*, *Movimiento*, *Atributos*).
- **(F)** `CargaArchivos`: fila "001-999 Todos" con selector, subida y confirmación de reemplazo (N2).
- Pruebas: un archivo Todos con crédito, movimiento y 3 atributos llena los tres slots. Si falla el parseo de uno, no se toca ningún slot. Eliminar una plantilla Todos usada en un lote devuelve `409`.

### Fase F: cierre · ≈0,5 día

`npm run lint` + `npm run build`, pruebas manuales (§6), actualizar `CLAUDE.md` (upload: plantillas globales, Todos y atributos por columna) y `docs/mapeos/*` del backend (relación atributo → catálogo, que hoy tiene una nota de "pendiente").

**Estimado: ≈9,5 días** (A 1 · B 1 · C 1 · D 3 · E 3 · F 0,5), repartidos entre front y backend. A no depende del backend y puede salir ya.

## 5. Criterios de aceptación

- [ ] Se puede editar cualquier plantilla existente sin errores, y el formulario muestra su mapeo completo.
- [ ] "Campos mapeados" muestra el número real, en la lista y en el selector de *Cargue de archivos*.
- [ ] Una plantilla creada aparece en *Cargue de archivos* para **cualquier** universalidad.
- [ ] Ni el formulario de plantilla ni el de lote piden "Tipo de entidad"; los lotes se crean con tipo 1.
- [ ] Un campo con columna y valor por defecto toma el valor por defecto en las celdas vacías.
- [ ] Sin `cargas.write` no se ven las acciones y la sesión no se cierra. Sin `cargas.read` la ruta muestra "Sin acceso".
- [ ] Borrar una plantilla usada muestra el mensaje del backend y ofrece desactivarla.
- [ ] Una plantilla 001-002 puede mapear columnas a atributos elegidos de la lista de los 40, y la carga genera una fila EAV por atributo con valor.
- [ ] Una plantilla 001-999 mezcla campos de los tres insumos, y un solo archivo llena los slots correspondientes del lote de forma atómica.
- [ ] `npm run lint` y `npm run build` pasan.

## 6. Pruebas manuales (resumen)

1. Editar una plantilla creada antes de los cambios → se ve su mapeo y se guarda.
2. Crear un lote de una universalidad distinta de 1 → sus plantillas aparecen.
3. Plantilla con "Moneda" mapeada a una columna y valor por defecto `COP`; archivo con celdas de moneda vacías → staging con `COP`.
4. Plantilla 001-002 con Sexo (5), CIIU (10) y Canal de originación (12) en columnas; archivo de 3 créditos con un CIIU vacío → 8 filas de atributos.
5. Plantilla Todos; subir un archivo → los tres slots quedan "Parseado" con el mismo archivo en el historial. Subir un archivo Todos con un error de formato en un campo de movimiento → ningún slot cambia.
6. Usuario `CONSULTA` (solo `cargas.read`) → ve la lista, sin acciones.

## 7. Riesgos

| Riesgo | Mitigación |
|---|---|
| Todos contradice el ADR 0005 | ADR 0008 explícito, y diseño de "repartidor" que no duplica la validación ni la promoción. |
| Todos llena slots con datos parciales si la plantilla omite un insumo | Regla N1 y confirmación de reemplazo en la interfaz (N2). |
| Despivotar multiplica filas (40 atributos × N créditos) | La inserción ya es masiva (`BulkInsert`). Medir con el archivo de prueba más grande. |
| Borrar `TipoEntidad` y `CodigoEntidad` de las plantillas es irreversible | Revisar antes los datos reales. Alternativa: dejarlos anulables (Fase B). |
| El catálogo de la SFC cambia (versión octubre de 2025) | Es una tabla de parámetros: se actualiza por seed o migración, sin tocar código. |

## 8. Decisiones nuevas que se necesitan

| # | Pregunta | Recomendación |
|---|---|---|
| N1 | En una plantilla Todos, ¿qué insumos se generan? | Solo los que tengan al menos un campo propio mapeado. Los obligatorios se validan solo para esos. |
| N2 | Si el lote ya tiene archivos cargados por insumo y se sube un Todos, ¿qué pasa? | Reemplaza los slots que genera (ADR 0006), con confirmación previa en la interfaz. |
| N3 | Pólizas (atributos 29 a 32) con varias pólizas: ¿el sistema agrega `Pn_` a partir de un ordinal configurado en la plantilla, o el archivo ya lo trae? | Ordinal opcional en la plantilla. Si el valor ya empieza por `P{n}_`, no se agrega. |
| N4 | Atributo con la celda vacía y sin valor por defecto: ¿se omite o se reporta vacío? | Se omite (no genera fila). |
| N5 | ¿Se mantiene el formato EAV actual (`clave_atributo`/`valor_atributo`) para 001-002? | Sí (opción C). Es el formato de la SFC y no rompe nada. |
| N6 | D4: ¿"quitar Tipo de entidad de los formularios" se refiere al formulario de **lote** en *Cargue de archivos* (el único que hoy lo muestra)? | Sí. Se quita de ahí y se envía `1` fijo. |
| N7 | ¿La vista previa debe soportar Todos en la primera versión? | No. Se agrega después, por pestañas de insumo. |
