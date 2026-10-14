# Análisis: administración de plantillas de carga

Fecha: 2026-09-26 · Rama: `rhenao-sprint04`
Alcance: `src/features/upload/components/ListPlantillas.tsx` y lo que usa (`FormPlantilla.tsx`, `hooks/usePlantillas.ts`, `models/Plantilla.model.ts`), más el uso de las plantillas en `CargaArchivos.tsx`.
Backend revisado: `MURICSyncBack` (commit `4818e64`): `Controllers/Plantilla/PlantillasController.cs`, `Services/Plantilla/PlantillaService.cs`, `DTOs/Plantilla/*`, `Models/Plantilla/*`, `Services/Carga/ParserBase.cs` y los tres parsers.

Solo se revisó el código; no se ejecutó la aplicación. Los hallazgos marcados **(verificar)** conviene confirmarlos con una petición real.

> **Actualización 2026-09-26:** D1–D4 ya tienen respuesta (plantillas globales; el valor por defecto se usa para las celdas vacías; se permiten nombres repetidos; tipo de entidad fijo en 1). El plan que las aplica, junto con el insumo "001-999 Todos" y los atributos por columna, está en `docs/prompts/plan-plantillas-carga.md`.

## 1. Resumen

Una **plantilla de carga** dice cómo leer el archivo de un cliente: qué columna del archivo corresponde a cada campo de staging de un insumo MURIC (001-001 Créditos, 001-002 Atributos, 001-003 Movimientos), y qué valor fijo usar para los campos que no vienen en el archivo. En *Cargue de archivos* el usuario puede elegir una plantilla por insumo, y el backend la usa para traducir los encabezados del archivo.

La pantalla está bien armada en lo visual (filtro por insumo, importar encabezados desde un archivo, sugerencia automática de mapeo, alerta de obligatorios faltantes, descarga de una plantilla vacía). Pero **no coincide con el contrato del backend en dos puntos que la dejan casi inutilizable**:

1. **Editar una plantilla existente rompe la aplicación** (H1): la lista no trae los campos del mapeo y el formulario asume que sí.
2. **Las plantillas creadas desde la pantalla solo sirven para la universalidad 1** (H2): el tipo y el código de entidad se envían fijos en `1`, y *Cargue de archivos* filtra las plantillas por la universalidad del lote.

## 2. Cómo funciona hoy

### 2.1 Componentes

| Archivo | Responsabilidad |
|---|---|
| `ListPlantillas.tsx` | Tabla (MRT) con nombre y descripción, insumo, campos mapeados, creador, fecha y estado. Filtro por insumo con chips. Acciones: Nueva, Editar, Activar/Desactivar, Eliminar (con confirmación). Snackbar de resultado. |
| `FormPlantilla.tsx` | Diálogo de crear o editar: nombre, insumo (bloqueado al editar), descripción y tabla de mapeo (columna del archivo → campo destino → valor por defecto). Importa encabezados de Excel/CSV/TXT, sugiere el mapeo por similitud de nombres y descarga un Excel vacío con los encabezados. |
| `usePlantillas.ts` | Carga, crea, actualiza, cambia el estado (con actualización optimista) y elimina. Usa `axiosSecurityAPIClient` (base `/api`). |
| `Plantilla.model.ts` | Tipos, etiquetas de insumo y `CAMPOS_POR_INSUMO`: la lista de campos de staging de cada insumo, con su marca de obligatorio. |
| `CargaArchivos.tsx` | Al crear un lote pide las plantillas activas de cada insumo **filtradas por la universalidad y el tipo de entidad del lote**, y envía `plantillaId` al subir cada archivo. |

Ruta `/app/plantillas-carga` (`AppRoutes.tsx:197`), sin guard de permiso. En el menú aparece bajo "Proceso de cargue de archivos", visible para los roles `ADMIN` y `OPERADOR` (`Menu.tsx:67`).

### 2.2 Contrato del backend (`api/plantillas`)

| Acción | Petición | Permiso | Respuesta OK | Errores |
|---|---|---|---|---|
| Listar | `GET /plantillas?insumo=&tipoEntidad=&codigoEntidad=&soloActivas=` | `cargas.read` | `200` lista de **resumen** (`numeroCampos`, **sin `campos`**) ordenada por fecha descendente | — |
| Consultar una | `GET /plantillas/{id}` | `cargas.read` | `200` **detalle** con `campos` ordenados | `404` texto |
| Crear | `POST /plantillas` | `cargas.write` | `201` detalle | `400` validación (`[ApiController]`) |
| Actualizar | `PUT /plantillas/{id}` con `nombre`, `descripcion` y `campos` | `cargas.write` | `200` detalle | `404` texto, `400` validación |
| Activar/Desactivar | `PATCH /plantillas/{id}` con `{ esActiva }` | `cargas.write` | `200` detalle | `404` texto |
| Eliminar | `DELETE /plantillas/{id}` | `cargas.write` | `204` | `404` texto; `409` texto "…está referenciada por uno o más lotes de carga… Desactívela en su lugar." |

Otros datos confirmados:

- **Crear** usa `nombre`, `descripcion`, `insumo`, `tipoEntidad` (≥ 1), `codigoEntidad` (≥ 1) y `campos`. El creador sale del claim de email del token, **no** del cuerpo. `esActiva` siempre arranca en `true`.
- **Actualizar** solo cambia `nombre`, `descripcion` y `campos`. Borra todos los campos y los vuelve a crear. El insumo y la entidad no se pueden cambiar.
- **Límites:** `nombre` 200, `insumo` 10, `nombreColumnaArchivo` 200, `campoStaging` 100. `descripcion` y `valorPorDefecto` no tienen límite.
- **Eliminar** revisa si algún lote usa la plantilla (`PlantillaId001001/2/3`). Además hay FK desde `LotesCarga`.
- **Serialización:** no hay configuración JSON propia en `Program.cs`, así que ASP.NET responde en **camelCase** (`id`, `nombre`, `numeroCampos`…) **(verificar)**.

### 2.3 Cómo aplica el backend la plantilla al leer el archivo (`ParserBase.AplicarPlantilla`)

- Los encabezados del archivo y `nombreColumnaArchivo` se normalizan igual: minúsculas, `trim`, y espacios o `_` seguidos → `_`. La comparación no distingue mayúsculas.
- Si el campo tiene `nombreColumnaArchivo`, esa columna se asigna al campo de staging. **Si la columna no existe en el archivo, se ignora sin avisar**; solo falla después si el campo era obligatorio.
- Si el campo **no** tiene columna y sí tiene `valorPorDefecto`, se crea una columna virtual con ese valor en todas las filas.
- **Si tiene columna y valor por defecto, el valor por defecto se ignora.** No sirve de respaldo para las celdas vacías.
- Los encabezados originales del archivo también siguen disponibles. Una columna que ya se llama como el campo de staging funciona aunque no esté en la plantilla.
- Delimitadores de CSV aceptados: `;`, tabulador y `,`. **No acepta `|`.**
- Nombres de campos: los de `CAMPOS_POR_INSUMO` **coinciden exactamente** con las claves que leen los tres parsers.

## 3. Hallazgos

Severidad: **Alta** = la función no sirve o se pierden datos; **Media** = comportamiento incorrecto o engañoso; **Baja** = calidad o mantenimiento.

### Alta

| # | Hallazgo | Dónde | Efecto |
|---|---|---|---|
| **H1** | La lista viene del `GET /plantillas`, que devuelve el **resumen sin `campos`**. `handleEditar` pasa esa fila al formulario, y el formulario hace `setFilas(plantilla.campos?.map(...))`, es decir `setFilas(undefined)`. En el siguiente render, `filas.map(...)` lanza `TypeError`. | `ListPlantillas.tsx:67-70`, `FormPlantilla.tsx:195`, `FormPlantilla.tsx:208` | **Editar cualquier plantilla ya guardada rompe la pantalla.** No hay `ErrorBoundary`, así que React desmonta la aplicación y queda en blanco. Solo se salvan las plantillas creadas o editadas en la misma sesión, porque esas respuestas sí traen `campos`. |
| **H2** | Al crear se envía `tipoEntidad: 1` y `codigoEntidad: 1` fijos. En *Cargue de archivos*, `codigoEntidad` es **la universalidad elegida** en el lote, y las plantillas se piden filtradas por esa universalidad y ese tipo. | `FormPlantilla.tsx:327-328`, `CargaArchivos.tsx:185-195`, `CargaArchivos.tsx:491-500` | Una plantilla creada desde la pantalla **solo aparece al cargar lotes de la universalidad 1**. Para las demás universalidades el selector sale vacío y no hay forma de corregirlo desde la interfaz. |

### Media

| # | Hallazgo | Dónde | Efecto |
|---|---|---|---|
| **H3** | La columna "Campos mapeados" usa `campos?.length ?? 0`, pero el resumen trae `numeroCampos`. El modelo TS no tiene `numeroCampos`. | `ListPlantillas.tsx:150-152`, `Plantilla.model.ts:85-95` | Todas las plantillas cargadas muestran **0 campos**. En *Cargue de archivos* el selector muestra "( campos)", porque `p.campos?.length` es `undefined` (`CargaArchivos.tsx:619`). |
| **H4** | La pantalla decide los permisos por **rol** (`ADMIN`/`OPERADOR`), y el backend exige los **permisos** `cargas.read` y `cargas.write`. La ruta no tiene guard y el menú también filtra por rol. | `ListPlantillas.tsx:44`, `Menu.tsx:67`, `AppRoutes.tsx:197` | Hoy coincide con la semilla, pero los permisos de un rol se editan desde la pantalla Roles. Si a `OPERADOR` se le quita `cargas.write`, sigue viendo los botones, el backend responde `403` y **el interceptor cierra la sesión** (`axiosSecurityAPIClient`). |
| **H5** | Cualquier error al eliminar muestra "No se puede eliminar: la plantilla está referenciada en un lote.", sea un `409`, un `404`, un `500` o un fallo de red. El mensaje real del backend (que sugiere desactivarla) se pierde. Lo mismo pasa al guardar ("Error al guardar la plantilla."), aunque el backend devuelva errores de validación por campo. | `ListPlantillas.tsx:83-85`, `ListPlantillas.tsx:106-109` | Mensajes engañosos o sin información útil. |
| **H6** | En el formulario, "Valor por defecto" dice *"Opcional"* cuando hay columna. Eso sugiere que sirve de respaldo para las celdas vacías, pero el backend **lo ignora** si hay columna (§2.3). | `FormPlantilla.tsx:569-573` | El usuario cree que configuró un valor de respaldo que nunca se aplica. |
| **H7** | Al importar encabezados, el front detecta también el separador `\|`. El backend solo acepta `;`, tabulador y `,`. | `FormPlantilla.tsx:117-119`, `ParserBase.cs` `DetectarDelimitador` | Se puede armar una plantilla con un archivo separado por `\|` que después **no se puede cargar**: el backend lee toda la fila como una sola columna. |
| **H8** | El formulario no tiene estado de "guardando": el botón no se deshabilita y el diálogo se puede cerrar mientras la petición está en curso. | `FormPlantilla.tsx:298-333`, `ListPlantillas.tsx:72-86` | Un doble clic en "Crear plantilla" crea **dos plantillas iguales**. |
| **H9** | Después de crear, la plantilla se agrega **al final** de la lista, y el backend ordena por fecha descendente. Al actualizar se reemplaza el resumen por el detalle, así que la lista mezcla dos formas de objeto. | `usePlantillas.ts:25-33` | Orden inconsistente hasta recargar, y es el origen de por qué H1 y H3 "a veces funcionan". |
| **H10** | La validación del front no respeta los límites del backend: `nombreColumnaArchivo` ≤ 200 no se valida, y no se revisa que dos campos usen **la misma columna del archivo**. | `FormPlantilla.tsx:298-322` | Un nombre de columna muy largo lleva a un `400` con mensaje genérico (H5). La columna repetida puede ser intencional, pero no se avisa. |

### Baja

| # | Hallazgo | Dónde | Efecto |
|---|---|---|---|
| **H11** | En `CAMPOS_POR_INSUMO` de 001-003 están como obligatorios `modelo_provisiones`, las cuatro provisiones y `valor_garantia`. El backend **no** los exige (`ParserMovimientoService.EncabezadosObligatorios`). 001-001 y 001-002 sí coinciden. | `Plantilla.model.ts:60-69` | Solo produce una alerta de "obligatorios sin mapear" que no corresponde. No bloquea el guardado. |
| **H12** | Se envían `usuarioCreador`, `esActiva` y `campos[].plantillaId`, que el backend ignora. `PlantillaInput` se deriva del modelo de lectura. | `FormPlantilla.tsx:323-332`, `Plantilla.model.ts:98` | Código engañoso: parece que el front decide el creador o el estado inicial. |
| **H13** | Si falla la carga inicial, la pantalla entera se reemplaza por un `Alert` sin botón para reintentar. | `ListPlantillas.tsx:216-222` | Hay que recargar el navegador. |
| **H14** | No hay control de nombres repetidos (ni en el front ni en el backend). | — | Puede haber varias plantillas con el mismo nombre para el mismo insumo y la misma universalidad, y confunden en el selector de *Cargue de archivos*. |
| **H15** | Todo el acceso a la API está dentro del hook, que usa `axiosSecurityAPIClient`. Es correcto porque la base es `/api`, pero el nombre del cliente confunde, y `CargaArchivos` repite la llamada `GET /plantillas` por su cuenta. | `usePlantillas.ts`, `CargaArchivos.tsx:185-205` | Dos lugares que se pueden desalinear (ya pasa con H3). |
| **H16** | El nombre de la plantilla va sin limpiar en el nombre del archivo que se descarga (`plantilla_${insumo}_${nombre}.xlsx`). | `FormPlantilla.tsx:293` | Caracteres como `/`, `:` o `?` dan un nombre de archivo raro o inválido según el navegador. |

## 4. Recomendaciones

### 4.1 Correcciones del front (orden sugerido)

1. **H1: cargar el detalle antes de editar.** En `handleEditar`, pedir `GET /plantillas/{id}` y abrir el formulario con esa respuesta (con un estado "cargando" en el botón). En `FormPlantilla`, usar `setFilas(plantilla.campos?.map(campoToFila) ?? [nuevaFila()])` como defensa.
2. **H3 / H9 / H12: separar los modelos.**
   - `PlantillaResumen`: lo que devuelve el listado, con `numeroCampos`.
   - `PlantillaDetalle`: lo que devuelven `GET/{id}`, `POST`, `PUT` y `PATCH`, con `campos`.
   - `CrearPlantillaRequest` y `ActualizarPlantillaRequest`, igual que los DTOs del backend.
   - Después de crear, actualizar o cambiar el estado, **recargar la lista** (o convertir el detalle a resumen) en vez de mezclar objetos.
3. **H2: elegir la universalidad en el formulario.** Agregar un select "Universalidad" (activas, igual que en *Cargue de archivos*) y otro de "Tipo de entidad" si aplica; mostrar la universalidad como columna y filtro en la lista. Queda bloqueado al editar, porque el backend no permite cambiarlo. Depende de la decisión D1 (§5).
4. **H4: permisos en lugar de roles.** `canEdit = hasPermission("cargas.write")`; ruta con `<RequirePermission requiredPermissions={["cargas.read"]}>`; menú con `hasPermission("cargas.read")`.
5. **H5: mensajes del backend.** Usar `utils/extractBackendErrors` (ya existe) al guardar, cambiar el estado y eliminar. En un `409` al eliminar, mostrar el mensaje del backend y ofrecer "Desactivar" en el mismo diálogo.
6. **H8: estado de guardado.** `saving` en `FormPlantilla`: botones deshabilitados, `CircularProgress` y cierre bloqueado mientras guarda (igual que `DialogParamForm`/`DialogRole`).
7. **H6: aclarar el valor por defecto.** Cambiar el placeholder a "Solo se usa si no hay columna", o deshabilitar el campo cuando hay columna. Otra opción es cambiar el backend para que lo use de respaldo en las celdas vacías (decisión D2).
8. **H7:** quitar `|` de la detección, o avisar "El sistema no acepta archivos separados por |".
9. **H10 / H11 / H16:** validar el máximo de 200 caracteres por columna, advertir las columnas repetidas, alinear los obligatorios de 001-003 con el backend y limpiar el nombre del archivo descargado.
10. **H13:** botón "Reintentar" en el `Alert` de error.
11. **H15 (opcional):** mover las llamadas a un `PlantillaService.ts` en `features/upload/services/` (la carpeta existe y está vacía), y usarlo desde el hook y desde `CargaArchivos`.

### 4.2 Recomendaciones para el backend (opcionales)

| # | Recomendación |
|---|---|
| B1 | Validar que `insumo` sea `001-001`, `001-002` o `001-003`, y que cada `campoStaging` exista para ese insumo y no esté repetido. Hoy se acepta cualquier texto. |
| B2 | Validar que `codigoEntidad` corresponda a una universalidad existente y activa. |
| B3 | Si se decide D2, usar `valorPorDefecto` también cuando la columna existe pero la celda viene vacía. |
| B4 | Informar como advertencia en el resultado de la carga las columnas de la plantilla que no se encontraron en el archivo. Hoy se ignoran sin avisar (§2.3). |
| B5 | Unicidad de `nombre` por insumo y entidad, si negocio lo pide (D3). |

## 5. Decisiones pendientes de negocio

| # | Pregunta | Por qué importa |
|---|---|---|
| D1 | ¿Las plantillas son **por universalidad** (como las filtra hoy *Cargue de archivos*) o **globales**, para cualquier universalidad? | Si son por universalidad, el formulario necesita el selector (H2). Si son globales, hay que cambiar el filtro de `CargaArchivos` y el backend (hoy `codigoEntidad` es obligatorio y ≥ 1). |
| D2 | Cuando un campo tiene columna **y** valor por defecto, ¿el valor por defecto debe usarse para las celdas vacías? | Define si se corrige el texto del front (H6) o el backend (B3). |
| D3 | ¿Se permiten dos plantillas con el mismo nombre para el mismo insumo y la misma universalidad? | H14 / B5. |
| D4 | ¿Qué es `tipoEntidad` y qué valores puede tomar? Hoy es `1` fijo tanto aquí como por defecto en *Cargue de archivos*. | Define si el formulario lo pide o se deja fijo. |

## 6. Otras observaciones (fuera del alcance de plantillas)

- `ConfigMapeoCarga.tsx` + `models/MapeoCarga.model.ts`: es un prototipo anterior del mismo concepto. No hace llamadas al API, está oculto en el menú (`display: "none"`, `Menu.tsx:369`), pero **la ruta `/config-mapeo-carga` sigue activa** (`AppRoutes.tsx:225`). Conviene eliminarlo o protegerlo.
- `Menu.tsx:74` hace `console.log` de los permisos del usuario en cada render.
- `CargaArchivos.tsx:178` ordena las universalidades comparando el código como texto: `"10"` queda antes de `"2"`.

## 7. Siguiente paso sugerido

Con D1 respondida, se puede armar un plan por fases como el de Universalidades:

- **Fase A:** H1 y H3, más la separación de modelos. Es lo que hoy impide usar la pantalla.
- **Fase B:** H2 (universalidad en el formulario) y H4 (permisos).
- **Fase C:** H5, H6, H7 y H8 (mensajes, valor por defecto, separador y doble envío).
- **Fase D:** lo de severidad baja, más el `PlantillaService` compartido.
