# Plan: plantillas de carga (correcciones, plantillas globales, atributos por columna e insumo "001-999 Todos")

Fecha: 2026-09-26 (actualizado 2026-09-27) · Rama: `rhenao-sprint04`
Base: `docs/prompts/analisis-plantillas-carga.md` (hallazgos H1–H16).
Backend revisado: `MURICSyncBack` (commit `4818e64`), incluidos los ADR 0003, 0005 y 0006 y el archivo `pruebas/Tablas MURIC- Atributos de los créditos y deudores.xlsx` (catálogo SFC de los 40 atributos, octubre de 2025).

## 1. Decisiones de negocio recibidas y cómo se aplican

| # | Decisión | Consecuencia en el plan |
|---|---|---|
| D1 | Las plantillas son **globales**, válidas para cualquier universalidad. | Se quitan `TipoEntidad` y `CodigoEntidad` de la plantilla, en el backend y en el front. *Cargue de archivos* deja de filtrar por la entidad del lote. Resuelve H2. (Fase B) |
| D2 | El valor por defecto **sí** se usa para las celdas vacías. | Cambio en `ParserBase.AplicarPlantilla`: si un campo tiene columna **y** valor por defecto, el valor se usa cuando la celda viene vacía. El texto del formulario se ajusta. Resuelve H6. (Fase C) |
| D3 | Por ahora **se permiten** nombres repetidos. | Sin cambios. H14 y B5 quedan descartados. |
| ~~D4~~ | ~~Quitar "Tipo de entidad" de los formularios y dejarlo fijo en 1.~~ **Reemplazada el 2026-09-27 por E1/E8** (ver `docs/decisiones/MURIC_nombre_archivo_entidad.md`). | El tipo y el código de entidad son los de **Titularice** (tipo 600), la entidad reportante, no los de la universalidad. Salen de la configuración del backend y el front los lee por API (E1). Todo lo que toca el lote, el crédito, la promoción, el AVRO, las consultas y el envío pasa al plan nuevo `docs/prompts/plan-entidad-reportante-universalidad.md` (E8). En este plan solo queda D1. |

## 2. Adicional 1: insumo "001-999 Todos"

### 2.1 Qué significa

Es una plantilla cuyo archivo trae, **en una sola fila por crédito**, campos de los tres insumos: datos del crédito (001-001), atributos (001-002) y saldos o movimientos (001-003). Al cargarlo, **un solo archivo llena los tres slots del lote**.

### 2.2 Choque con una decisión de arquitectura ya tomada

El ADR 0005 ("Tres archivos separados por insumo") eligió tres archivos y **rechazó explícitamente** la opción C, "formato a elección del operador", por duplicar el parsing y la validación. "001-999 Todos" es una variante de esa opción C. Por eso:

- Hay que **registrar un ADR nuevo (0009; el 0008 es el de entidad reportante)** que modifique el ADR 0005: se admite, además de los tres archivos, un archivo combinado **solo con plantilla**.
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

### Fase B: plantillas globales (D1) · ≈0,5 día

- **(B)** Migración: quitar `TipoEntidad` y `CodigoEntidad` de `PlantillasCarga`, y reemplazar el índice `ix_plantilla_insumo_entidad` por `ix_plantilla_insumo`. Quitar los campos de `CrearPlantillaRequest`, de las respuestas y de `FiltroPlantillasRequest`. *(Alternativa más conservadora: dejarlos anulables e ignorarlos.)*
- **(F)** `FormPlantilla` deja de enviarlos; se quitan las constantes `TIPO_ENTIDAD_PLANTILLA` y `CODIGO_ENTIDAD_PLANTILLA` de `ListPlantillas`. `CargaArchivos.fetchPlantillas` filtra solo por `insumo` y `soloActivas`.
- **Fuera de esta fase (E8):** el formulario de lote de *Cargue de archivos* (campo "Tipo entidad", `TIPO_ENTIDAD_DEFAULT`, universalidad enviada como `codigoEntidad`) no se toca aquí; lo resuelve el plan de entidad reportante.

### Fase C: valor por defecto como respaldo y ajustes menores (D2, H6, H7, H10, H11, H16) · ≈1 día

- **(B)** `AplicarPlantilla`: si el campo tiene columna **y** valor por defecto, se crea un índice virtual que en cada fila toma `valor de la celda ?? valor por defecto`. Con el índice virtual se evita el caso de una columna compartida por dos campos con valores por defecto distintos. Si la columna **no existe** en el archivo y hay valor por defecto, se usa el valor por defecto.
- **(B)** Validar en `PlantillaService` que `insumo` sea válido y que `campoStaging` exista para ese insumo y no se repita (B1 del análisis).
- **(F)** Texto del valor por defecto: *"Se usa cuando la celda viene vacía o la columna no existe"*. Se quita `|` de la detección de separador (H7). Se valida el máximo de 200 caracteres por columna y se advierten las columnas repetidas (H10). H11 ya no aplica: el backend exige hoy los mismos obligatorios de 001-003 que el front (verificado el 2026-09-27). Se limpia el nombre del archivo descargado (H16).

### Fase D: catálogo de atributos y atributos por columna (opción C de §3) · ≈3 días

- **(B)** Tabla `CatalogoAtributos` + seed de los 40 + controlador OData de solo lectura (`params.read`).
- **(B)** `PlantillaCargaCampo.ClaveAtributo` (+ `OrdinalPoliza` si N3) y sus validaciones.
- **(B)** `ParserBase.MapearFilas` y el modo por columnas en `ParserAtributoService`, más los encabezados canónicos `atributo_N`.
- **(F)** `ListCatalogoAtributos` (consulta), el modelo y el servicio del catálogo.
- **(F)** `FormPlantilla`: filas de atributo con selector de los 40, valor por defecto desde el catálogo, advertencias de obligatorios, sugerencias por nombre de atributo y marca "Repetible".
- Pruebas: una plantilla 001-002 con 5 atributos en columnas genera 5 filas EAV por crédito, y las celdas vacías no generan fila.

### Fase E: insumo "001-999 Todos" · ≈3 días

- **ADR 0009**, que modifica el ADR 0005 (§2.2).
- **(B)** `InsumoEnum.Todos`, validación de la plantilla Todos (unión de campos, identificadores una sola vez, al menos un campo propio de algún insumo), `IngestaArchivoService.IngestarTodosAsync` (lectura única, tres parsers, una transacción, un historial por slot, `PlantillaId00100x`) y `plantillaId` obligatorio para Todos.
- **(F)** Modelo e interfaz: `'001-999'` en `InsumoMURIC`, sus etiquetas, el chip de filtro "001-999 Todos" y `CAMPOS_POR_INSUMO['001-999']` como unión (identificadores una vez, agrupados por insumo en el selector: *Crédito*, *Movimiento*, *Atributos*).
- **(F)** `CargaArchivos`: fila "001-999 Todos" con selector, subida y confirmación de reemplazo (N2).
- Pruebas: un archivo Todos con crédito, movimiento y 3 atributos llena los tres slots. Si falla el parseo de uno, no se toca ningún slot. Eliminar una plantilla Todos usada en un lote devuelve `409`.

### Fase F: cierre · ≈0,5 día

`npm run lint` + `npm run build`, pruebas manuales (§6), actualizar `CLAUDE.md` (upload: plantillas globales, Todos y atributos por columna) y `docs/mapeos/*` del backend (relación atributo → catálogo, que hoy tiene una nota de "pendiente").

**Estimado: ≈9 días** (A 1 · B 0,5 · C 1 · D 3 · E 3 · F 0,5), repartidos entre front y backend. A no depende del backend y puede salir ya.

## Estado (2026-09-27)

Las fases A a F están hechas. Las migraciones `QuitarEntidadDePlantillasCarga` y `AddCatalogoAtributosYColumnasDeAtributo` están aplicadas en la base local de desarrollo.

| Fase | Front | Back |
|---|---|---|
| A | `7b99dbe` | — |
| B | `3368c54` | `e2e18f3` |
| C | `3c788cd` | `4615286` |
| D | `f04aab2` | `4f35d2a` |
| E | `f2d4b04` | `1c8cb24` (ADR 0009) |
| F | `CLAUDE.md`, este plan | `docs/mapeos/*` |

**Qué se verificó sin navegador:**

- Los parsers, con archivos de prueba en memoria: valor por defecto, atributos por columna, pólizas y reparto de 001-999.
- `PlantillaService` e `IngestaArchivoService` contra la base local, con los datos de prueba borrados al final:
  - las validaciones de plantilla;
  - la ingesta 001-999 con tres historiales;
  - la atomicidad ante un error en movimientos;
  - el rechazo de una plantilla de otro insumo;
  - el `409` al borrar una plantilla usada.

**Falta:** las pruebas en el navegador de §6.

## 5. Criterios de aceptación

- [x] Se puede editar cualquier plantilla existente sin errores, y el formulario muestra su mapeo completo. *(navegador)*
- [x] "Campos mapeados" muestra el número real, en la lista y en el selector de *Cargue de archivos*. *(navegador)*
- [x] Una plantilla creada aparece en *Cargue de archivos* para **cualquier** universalidad. *(navegador; el back ya no filtra por entidad)*
- [x] El formulario de plantilla no pide ni envía tipo ni código de entidad. (El formulario de lote se cubre en el plan de entidad reportante.)
- [x] Un campo con columna y valor por defecto toma el valor por defecto en las celdas vacías. *(verificado contra la base: moneda vacía → `COP`)*
- [x] Sin `cargas.write` no se ven las acciones y la sesión no se cierra. Sin `cargas.read` la ruta redirige a "Acceso denegado". *(navegador)*
- [x] Borrar una plantilla usada muestra el mensaje del backend y ofrece desactivarla. *(el back responde bien; falta ver el diálogo)*
- [x] Una plantilla 001-002 puede mapear columnas a atributos elegidos de la lista de los 40, y la carga genera una fila EAV por atributo con valor. *(back verificado; falta ver el formulario)*
- [x] Una plantilla 001-999 mezcla campos de los tres insumos, y un solo archivo llena los slots correspondientes del lote de forma atómica. *(back verificado; falta ver la pantalla)*
- [x] `npm run lint` y `npm run build` pasan.

## 6. Pruebas manuales en el navegador

Requisitos: el backend en `rhenao_sprint04` con las migraciones aplicadas y un usuario con `cargas.read`, `cargas.write` y `params.read`.

1. **Editar una plantilla existente** (`creditos-01` o `creditos-02`): se ve su mapeo completo, se guarda y la lista muestra el número real de campos.
2. **Valor por defecto:** una plantilla 001-001 con "Moneda" mapeada a una columna y valor `COP`. Se sube un archivo con celdas de moneda vacías. En *Cargue de archivos* los créditos quedan con `COP`.
3. **Importar columnas:**
   - Un CSV separado por `|` muestra el aviso de separador no soportado.
   - Un Excel con encabezados "Sexo", "Canal originación" y "CIIU", en una plantilla 001-002, sugiere los atributos 5, 12 y 10.
4. **Atributos por columna (001-002):**
   - Con "Agregar atributo" se agregan Sexo (5), CIIU (10) y Número de póliza (30) con póliza n.º 2.
   - Sexo ofrece como valor por defecto la lista de `SexoBiologico`.
   - Sale el aviso de atributos obligatorios sin columna.
   - Al subir un archivo de 3 créditos con un CIIU vacío, se generan 8 filas de atributos, y la póliza llega como `P2_…`.
5. **Mezcla no permitida:** en una plantilla 001-002 que ya mapea "Clave Atributo", "Agregar atributo" está deshabilitado con su explicación.
6. **Plantilla 001-999:**
   - El selector de campos muestra el insumo de cada uno.
   - El aviso "llenará: …" cambia según lo que se mapea.
   - Guardarla con solo identificadores da error.
7. **Cargue 001-999:**
   - En un lote nuevo, la fila "Todos" exige plantilla. Subir el archivo llena los slots y el mensaje dice cuáles.
   - Subirlo otra vez pide confirmación de reemplazo.
   - Un archivo al que le falta una columna obligatoria muestra el error con el insumo (`001-003: saldo_capital`) y no cambia los conteos.
8. **Borrar una plantilla usada:** el diálogo muestra el mensaje del backend y ofrece "Desactivar".
9. **Permisos:**
   - Un usuario con solo `cargas.read` ve la lista sin acciones y la sesión no se cierra.
   - Un usuario sin `params.read` ve "Agregar atributo" deshabilitado y la sesión no se cierra al abrir el formulario.
10. **Catálogo de atributos:** en tablas básicas aparecen "Catálogo de Atributos" y sus 40 filas.

## 7. Riesgos

| Riesgo | Mitigación |
|---|---|
| Todos contradice el ADR 0005 | ADR 0009 explícito, y diseño de "repartidor" que no duplica la validación ni la promoción. |
| Todos llena slots con datos parciales si la plantilla omite un insumo | Regla N1 y confirmación de reemplazo en la interfaz (N2). |
| Despivotar multiplica filas (40 atributos × N créditos) | La inserción ya es masiva (`BulkInsert`). Medir con el archivo de prueba más grande. |
| Borrar `TipoEntidad` y `CodigoEntidad` de las plantillas es irreversible | Revisar antes los datos reales. Alternativa: dejarlos anulables (Fase B). |
| El catálogo de la SFC cambia (versión octubre de 2025) | Es una tabla de parámetros: se actualiza por seed o migración, sin tocar código. |

## 8. Decisiones nuevas que se necesitan

| # | Pregunta | Recomendación |
|---|---|---|
| N1 | En una plantilla Todos, ¿qué insumos se generan? | Solo los que tengan al menos un campo propio mapeado. Los obligatorios se validan solo para esos. **Aceptada el 2026-09-27.** |
| N2 | Si el lote ya tiene archivos cargados por insumo y se sube un Todos, ¿qué pasa? | Reemplaza los slots que genera (ADR 0006), con confirmación previa en la interfaz. **Aceptada el 2026-09-27.** |
| N3 | Pólizas (atributos 29 a 32) con varias pólizas: ¿el sistema agrega `Pn_` a partir de un ordinal configurado en la plantilla, o el archivo ya lo trae? | Ordinal opcional en la plantilla. Si el valor ya empieza por `P{n}_`, no se agrega.  **Aceptada el 2026-09-27.** |
| N4 | Atributo con la celda vacía y sin valor por defecto: ¿se omite o se reporta vacío? | Se omite (no genera fila).  **Aceptada el 2026-09-27.** |
| N5 | ¿Se mantiene el formato EAV actual (`clave_atributo`/`valor_atributo`) para 001-002? | Sí (opción C). Es el formato de la SFC y no rompe nada.  **Aceptada el 2026-09-27.** |
| ~~N6~~ | ~~D4: ¿"quitar Tipo de entidad" se refiere al formulario de lote?~~ | **Obsoleta:** D4 fue reemplazada por E1/E8 (plan de entidad reportante). |
| N7 | ¿La vista previa debe soportar Todos en la primera versión? | No. Se agrega después, por pestañas de insumo. **Aceptada el 2026-09-27** (el usuario la escribió como "N3: No"). |
