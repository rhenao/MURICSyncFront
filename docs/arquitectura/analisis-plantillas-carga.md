# Análisis: Plantillas de archivos de carga

**Fecha:** 2026-05-18  
**Autor:** Análisis generado con Claude Code  
**Módulo afectado:** `features/upload` (frontend) + Bloque 2 – Capa de staging (backend)  
**Estado:** Decisiones de diseño resueltas — listo para implementación

---

## 0. Decisiones de diseño resueltas

| # | Pregunta | Decisión |
| --- | --- | --- |
| D1 | ¿Granularidad de la plantilla? | **Una plantilla por insumo** (001-001, 001-002, o 001-003) |
| D2 | ¿Valor por defecto para campo obligatorio? | **Sí.** Un campo MURIC obligatorio puede cubrirse con un valor por defecto definido en la plantilla |
| D3 | ¿Visibilidad entre usuarios? | **Compartidas.** Todos los usuarios con acceso a carga ven todas las plantillas |
| D4 | ¿Alcance por entidad reportante? | **Por universalidad.** Cada plantilla está asociada a una entidad reportante específica (`TipoEntidad` + `CodigoEntidad`) |
| D5 | ¿Historial de versiones? | **Sin snapshot.** Se guarda solo el `Id` de la plantilla; cambios en la plantilla no se preservan en el historial de lotes |

Estas decisiones impactan directamente el modelo de datos y los controles de integridad — ver secciones 3 y 7.

---

## 1. Contexto y estado actual

### 1.1 Lo que ya existe

El sistema MURICSync tiene implementado un flujo de carga en tres insumos (ADR 0005):

| Insumo | Tabla staging | Encabezados esperados |
| --- | --- | --- |
| MURIC-001-001 | `LoteCargaCredito` | 16 columnas definidas en `excel-a-staging.md` |
| MURIC-001-002 | `LoteCargaAtributo` | 5 columnas |
| MURIC-001-003 | `LoteCargaMovimiento` | 27 columnas |

El parser del backend (ADR 0004) aplica las siguientes reglas de búsqueda de columnas:

- Comparación **case-insensitive**, tolerando espacios extra.
- Columnas no reconocidas → se ignoran silenciosamente.
- Columnas obligatorias ausentes → fallo a nivel de archivo.

En el frontend, `ConfigMapeoCarga.tsx` ya existe como prototipo de mapeo de columnas, pero:

- No está conectado al backend.
- Sus "tablas destino" (`Creditos`, `Pagos`) no coinciden con las entidades reales de staging.
- No tiene noción de insumo MURIC.

### 1.2 El problema a resolver

Los archivos que generan las entidades reportantes provienen de sistemas propietarios con nombres de columnas arbitrarios. El sistema hoy solo acepta archivos que usen exactamente los encabezados canonizados (o variantes por casing/espacios), lo que obliga al operador a reformatear manualmente el archivo antes de cargarlo.

**Objetivo**: permitir que los usuarios guarden **plantillas de mapeo** que traduzcan los nombres de columna de sus archivos a los campos canónicos del staging, sin modificar los archivos fuente.

---

## 2. Análisis del requerimiento

### 2.1 Qué es una "plantilla de carga"

Una plantilla de carga es una configuración persistida que define:

```text
NombreColumnaEnArchivo → CampoCanónicoStaging
```

Ejemplo:

| Columna en el archivo del usuario | Campo staging canónico |
| --- | --- |
| `nro_credito` | `identificacion_credito_entidad` |
| `tipo_doc` | `tipo_identificacion` |
| `nro_doc` | `numero_identificacion` |
| `tasa` (ausente en archivo) | `tipo_tasa` → valor por defecto `"F"` |

### 2.2 Impacto en el flujo actual

El flujo actual (backend, Bloque 2) es:

```text
Archivo → Parser → LoteCargaXxx (staging, varchar, sin validar)
```

Con plantillas, el flujo se convierte en:

```text
Archivo + PlantillaId → Parser → [Capa de mapeo] → LoteCargaXxx (staging, varchar)
```

La capa de mapeo es una transformación de nombres de columna: nada cambia en el staging ni en la validación posterior. El motor de validación (Bloque 4) trabaja sobre el staging y no necesita saber si se usó una plantilla.

### 2.3 Qué cambia y qué no cambia

| Componente | Impacto |
| --- | --- |
| Tablas de staging (`LoteCargaCredito`, etc.) | **Sin cambio.** Las columnas destino son exactamente las actuales. |
| Motor de validación (Bloque 4) | **Sin cambio.** Opera sobre el staging ya mapeado. |
| Tabla `LoteCarga` | **Cambio menor**: agregar columna `PlantillaId` (FK nullable) para trazabilidad. |
| `IParserCreditoService` (y siblings) | **Cambio**: recibir un diccionario de mapeo opcional; si presente, re-nombrar columnas antes de buscarlas. |
| Endpoint `POST /api/cargas/{id}/archivos` | **Cambio**: aceptar `plantillaId` opcional en el body/querystring. |
| Frontend `CargaArchivos.tsx` | **Cambio**: selector de plantilla al subir cada insumo. |
| Frontend `ConfigMapeoCarga.tsx` | **Reescritura**: conectar al backend real con los campos de staging correctos. |

---

## 3. Modelo de datos propuesto (backend)

### 3.1 Entidades nuevas

#### `PlantillaCarga`

| Campo | Tipo | Descripción |
| --- | --- | --- |
| `Id` | `bigint` (identity) | PK |
| `Nombre` | `varchar(200)` | Nombre descriptivo (ej. "Formato Core Bancario v2") |
| `Descripcion` | `text` | Notas del operador sobre cuándo usar esta plantilla |
| `Insumo` | `varchar(20)` | `001-001`, `001-002`, o `001-003` — **una plantilla cubre un solo insumo** (D1) |
| `TipoEntidad` | `integer` | Tipo de la entidad reportante propietaria de esta plantilla (D4) |
| `CodigoEntidad` | `integer` | Código de la entidad reportante propietaria (D4) |
| `UsuarioCreador` | `varchar(255)` | Quién la creó (para auditoría; no restringe visibilidad — D3) |
| `EsActiva` | `boolean` | Permite desactivar sin borrar. **Única forma de "eliminar" si está referenciada** |
| `FechaCreacion` | `timestamp` | Default `now()` |
| `Usuario` + `FechaActualizacion` | shadow | Auditoría estándar |

**Índices:**
- `ix_plantilla_entidad_insumo` sobre `(TipoEntidad, CodigoEntidad, Insumo)`: patrón de consulta principal.
- `ix_plantilla_activa` sobre `(EsActiva)`.

#### `PlantillaCargaCampo`

| Campo | Tipo | Descripción |
| --- | --- | --- |
| `Id` | `bigint` (identity) | PK |
| `PlantillaId` | `bigint` | FK → `PlantillaCarga.Id`, `ON DELETE CASCADE` |
| `NombreColumnaArchivo` | `varchar(200)` | Nombre de la columna tal como aparece en el archivo. `NULL` si la fila es puramente un valor por defecto sin columna origen |
| `CampoStaging` | `varchar(100)` | Campo canónico destino (ej. `identificacion_credito_entidad`) |
| `ValorPorDefecto` | `varchar(500)` | Si el campo no está en el archivo, se inyecta este valor en todas las filas. **Cubre campos obligatorios** (D2) |
| `OrdenColumna` | `integer` | Orden visual en la UI (sin efecto en el parser) |

**Notas de diseño derivadas de D2:**
- No existe campo `EsObligatorioCubrirlo` separado: la obligatoriedad del campo está definida en el contrato del insumo (el documento `excel-a-staging.md`), no en la plantilla. La plantilla es responsable de proveer valor (ya sea mapeando una columna o inyectando un defecto); si no provee valor para un campo obligatorio y tampoco está en el archivo, el error lo levanta el parser como siempre.
- Índice único `ux_plantilla_campo_staging` sobre `(PlantillaId, CampoStaging)`: un campo destino solo puede aparecer una vez por plantilla.

### 3.2 Cambio en `LoteCarga`

Agregar tres columnas FK (nullable), una por insumo — para trazabilidad **sin snapshot** (D5):

| Columna nueva | Tipo | Descripción |
| --- | --- | --- |
| `PlantillaId001001` | `bigint` nullable | FK → `PlantillaCarga.Id`, `ON DELETE SET NULL` |
| `PlantillaId001002` | `bigint` nullable | ídem |
| `PlantillaId001003` | `bigint` nullable | ídem |

`ON DELETE SET NULL` en lugar de `RESTRICT`: dado que no hay snapshot (D5), si la plantilla se elimina físicamente el campo queda en `NULL` y el historial del lote pierde la referencia. La restricción operativa es que **no se permite eliminar físicamente** una plantilla que esté referenciada; solo se puede desactivar (`EsActiva = false`). El endpoint `DELETE /api/plantillas/{id}` debe verificar esta condición antes de proceder.

**Consecuencia de D5 a tener en cuenta:** si una plantilla se edita y un operador consulta el historial de un lote que la usó, verá la versión actual de la plantilla, no la que estaba vigente al momento de la carga. Esto es aceptable dado que el staging ya contiene los datos tal como fueron mapeados; la plantilla en el historial es informativa.

---

## 4. Endpoints REST propuestos (backend)

```text
GET    /api/plantillas                         Lista plantillas (filtros: insumo, activa, tipoEntidad, codigoEntidad)
POST   /api/plantillas                         Crear plantilla con sus campos
GET    /api/plantillas/{id}                    Detalle de plantilla + campos
PUT    /api/plantillas/{id}                    Actualizar (nombre, descripción, campos)
PATCH  /api/plantillas/{id}/desactivar         Desactivar plantilla (EsActiva = false)
DELETE /api/plantillas/{id}                    Eliminar físicamente — solo si no está referenciada en ningún lote
GET    /api/plantillas/{id}/descargar          Descargar Excel vacío con los encabezados de la plantilla
```

**Roles** (consistente con el patrón del sistema — D3):

| Operación | Roles permitidos |
| --- | --- |
| Leer (`GET`) | `ADMIN`, `OPERADOR`, `CONSULTA` |
| Crear / Editar / Desactivar | `ADMIN`, `OPERADOR` |
| Eliminar físicamente | `ADMIN` únicamente |

**Filtro por entidad en `GET /api/plantillas`**: el endpoint filtra por `(TipoEntidad, CodigoEntidad)` para devolver solo las plantillas de la entidad del lote activo. Un usuario `ADMIN` puede consultar sin filtro. Esto garantiza que en la UI de carga el selector solo muestre plantillas de la misma entidad del lote (D4).

El endpoint existente `POST /api/cargas/{id}/archivos` recibe `plantillaId` (opcional) en el body multipart. El backend valida que la plantilla exista, esté activa, y que su `(TipoEntidad, CodigoEntidad)` coincida con el lote.

---

## 5. Lógica de parseo con plantilla

Cuando el endpoint recibe un `plantillaId` válido:

1. Cargar el diccionario de mapeo: `{ NombreColumnaArchivo → CampoStaging, ValorPorDefecto }`.
2. Validar que la plantilla está activa y pertenece a la misma entidad del lote. Si no, rechazar con `400`.
3. Leer la fila de encabezados del archivo.
4. Construir un "encabezado resuelto":
   - Para cada columna del archivo: buscar coincidencia en `NombreColumnaArchivo` (case-insensitive, trim). Si hay match, usar `CampoStaging` como nombre efectivo.
   - Para cada entrada de la plantilla con `NombreColumnaArchivo = NULL` o cuya columna no existe en el archivo: inyectar `ValorPorDefecto` en todas las filas como columna virtual. **Esto cubre campos obligatorios del insumo que la entidad reportante no incluye en su archivo** (D2).
5. Continuar con el parseo normal usando el encabezado resuelto.
6. Registrar `PlantillaId` en la columna correspondiente de `LoteCarga` (D5: referencia simple, sin snapshot).

Sin `plantillaId`, el comportamiento es exactamente el actual (búsqueda case-insensitive directa sobre los encabezados canónicos).

**Invariante:** la capa de mapeo opera antes del staging. Una vez que los datos están en staging, el motor de validación (Bloque 4) no distingue si el valor llegó del archivo o de un `ValorPorDefecto`. Esto es correcto: lo que importa es que el campo tiene un valor que cumple las reglas.

**Caso especial — campo en archivo Y en plantilla con valor por defecto:** si el archivo incluye la columna y la plantilla también define un `ValorPorDefecto` para ese campo, prevalece el valor del archivo (el valor por defecto es solo el fallback cuando la columna está ausente).

---

## 6. Pantallas de frontend

### 6.1 Gestión de plantillas (nueva ruta, ej. `/plantillas`)

**Lista de plantillas:**
- Filtra automáticamente por la entidad reportante activa del usuario (D4).
- Columnas: Nombre, Insumo, Estado (Activa/Inactiva), Creada por, Fecha.
- Acciones por fila: Editar, Descargar plantilla vacía, Desactivar.

**Formulario de creación/edición:**
- Campos de cabecera: Nombre, Descripción, Insumo (selector: 001-001 / 001-002 / 001-003).
- Tabla de mapeo de columnas:
  - `Columna en el archivo` (texto libre; puede dejarse vacío si la fila es solo un valor por defecto).
  - `Campo destino` (selector restringido a los campos canónicos del insumo elegido — con indicador visual de "obligatorio" según `excel-a-staging.md`).
  - `Valor por defecto` (texto, opcional; si se completa, cubre la ausencia de la columna en el archivo — D2).
- Botón "Agregar fila" para sumar más mapeos.
- Botón "Descargar plantilla vacía" (solo disponible al editar una plantilla existente).
- Botón "Guardar" → `POST` o `PUT` al backend.

`ConfigMapeoCarga.tsx` es la base de este formulario; requiere reescritura para:
- Anclar los campos destino a los campos reales de cada insumo (no a `Creditos`/`Pagos`).
- Agregar selector de insumo y pasar `TipoEntidad`/`CodigoEntidad` desde el contexto de auth.
- Eliminar el `payloadPreview` y reemplazarlo por una llamada real al backend.
- Eliminar el campo `esRequerido` del modelo (la obligatoriedad es del insumo, no de la plantilla).

### 6.2 Uso de plantilla en carga (cambio en `CargaArchivos.tsx`)

Al subir cada uno de los tres insumos, agregar un selector "Usar plantilla" que:

- Lista solo las plantillas **activas del insumo correspondiente y de la misma entidad** (D3, D4).
- Si se selecciona una, envía `plantillaId` junto con el archivo en `POST /api/cargas/{id}/archivos`.
- Permite dejar en blanco (carga sin plantilla = comportamiento actual).
- Después de la carga, muestra el nombre de la plantilla usada en el resumen del insumo.

---

## 7. Reglas que se deben respetar ("siempre y cuando se cumplan las reglas")

Las siguientes restricciones aplican **independientemente de si se usa plantilla**:

1. **Campos obligatorios del insumo deben estar cubiertos.** La cobertura puede venir del archivo (columna presente) o de la plantilla (valor por defecto) — D2. Si ninguna de las dos cubre un campo obligatorio, el parse falla igual que hoy.
2. **Una plantilla solo aplica a su propia entidad reportante** (D4). No se puede usar la plantilla de la universalidad A para cargar datos de la universalidad B.
3. **El staging recibe todo como `varchar`.** La plantilla no puede cambiar tipos de datos; la validación de tipos sigue en Bloque 4 sin cambios.
4. **Una plantilla cubre exactamente un insumo** (D1). No existe una plantilla "de lote completo".
5. **Parsing en backend** (ADR 0004 intacto). La plantilla es un parámetro que el backend usa; el frontend no parsea nada.
6. **El hash del archivo original se conserva** antes de aplicar el mapeo. La trazabilidad regulatoria es sobre el archivo crudo, no sobre los datos transformados.
7. **Una plantilla modificada no altera el staging ya generado** (D5). El staging es inmutable una vez parseado; la plantilla solo afecta futuras cargas.

---

## 8. Relación con `ConfigMapeoCarga.tsx` existente

El prototipo actual es reutilizable como base de la UI pero tiene divergencias importantes:

| Aspecto | Prototipo actual | Propuesta |
| --- | --- | --- |
| Tablas destino | `Creditos`, `Pagos` (incorrectas) | Los 3 insumos MURIC con sus campos reales |
| Persistencia | Solo genera JSON en pantalla | POST al backend |
| Relación con insumo | Sin distinción | Cada plantilla es para un insumo específico |
| Descarga de plantilla vacía | No existe | Endpoint dedicado |
| Uso en carga | No existe conexión | Selector en `CargaArchivos.tsx` |

---

## 9. Decisiones resueltas — impacto consolidado en el diseño

Todas las ambigüedades han sido resueltas. Esta sección documenta cómo cada decisión se materializó en cambios concretos al diseño:

| Decisión | Impacto en modelo de datos | Impacto en lógica / UI |
| --- | --- | --- |
| D1 — Una plantilla por insumo | `PlantillaCarga.Insumo` varchar not-null | Selector de plantilla filtra por insumo del slot en `CargaArchivos.tsx` |
| D2 — Valores por defecto cubren campos obligatorios | `NombreColumnaArchivo` puede ser NULL en `PlantillaCargaCampo` | Parser inyecta columnas virtuales antes de buscar campos obligatorios |
| D3 — Plantillas compartidas | Sin campo de restricción por usuario | `GET /api/plantillas` no filtra por usuario creador |
| D4 — Asociadas a entidad reportante | `TipoEntidad` + `CodigoEntidad` not-null en `PlantillaCarga` | Validación cruzada al subir: plantilla y lote deben coincidir en entidad |
| D5 — Sin snapshot | `LoteCarga.PlantillaIdXXX` FK con `ON DELETE SET NULL` | `DELETE` físico solo si sin referencias; de lo contrario solo `PATCH /desactivar` |

---

## 10. Resumen ejecutivo

La funcionalidad de plantillas es **estructuralmente limpia**: actúa como una capa de traducción entre los encabezados del archivo del usuario y los nombres canónicos del staging. No afecta el staging, el motor de validación, ni la promoción a capa final. Los datos en staging son idénticos independientemente de si se usó plantilla o no.

**Los cambios son localizados:**

| Capa | Cambios |
| --- | --- |
| Backend — BD | 2 tablas nuevas (`PlantillaCarga`, `PlantillaCargaCampo`), 3 columnas FK en `LoteCarga` |
| Backend — API | 6 endpoints nuevos (`/api/plantillas`), modificación menor de `POST /api/cargas/{id}/archivos` |
| Backend — Lógica | Los 3 parsers reciben un diccionario de mapeo opcional; se agrega una capa de traducción de encabezados antes del loop de filas |
| Frontend | Reescritura de `ConfigMapeoCarga.tsx` → pantalla de gestión de plantillas; selector de plantilla en `CargaArchivos.tsx` |

**El riesgo es bajo** siempre que la capa de mapeo sea transparente (transform-before-parse) y nunca mezcle transformación con validación. El principio es: la plantilla traduce nombres de columna; las reglas de negocio sobre los valores siguen viviendo en el Bloque 4.
