# Plan: Equivalencias de carga

Fecha: 2026-10-14 · Rama: `rhenao-sprint04` (front) y `rhenao_sprint04` (back)
Backend revisado: `MURICSyncBack` `8125b82` (igual en código a `e94252c`, la versión de QA).
Origen: pruebas de cargue con datos reales del cliente.
Relacionado: `plan-plantillas-carga.md` (plantillas, columnas de atributo) y `plan-cargue-archivos.md` (lotes, validación).
**Decisiones EQ1–EQ9 respondidas el 2026-10-14** (§6). Cambios frente a la primera versión: un valor sin equivalencia no es un error por sí mismo (EQ7), no hay importación masiva (EQ8) y la guía de pruebas queda para cuando haya ejemplos reales (EQ9).

## 1. Problema

Algunos campos del archivo del cliente no traen el código SFC, sino un texto propio. Por ejemplo, la columna "Tipo Documento", mapeada a `tipo_identificacion`, trae "CEDULA DE CIUDADANIA", cuando a la SFC se debe enviar `1` (fila `Codigo = 1`, "Cédula de ciudadanía" de `TiposIdentificacion`).

Hoy esas filas no se pueden cargar:

| Dónde | Qué pasa hoy con "CEDULA DE CIUDADANIA" |
|---|---|
| Staging | `LotesCarga*.TipoIdentificacion` es `varchar(20)` y el texto tiene exactamente 20 caracteres: cabe por casualidad. "CEDULA DE EXTRANJERIA" (21) haría fallar la carga del archivo **completo** con un error de base de datos. `CalificacionCredito` es `varchar(5)`, así que "CATEGORIA A" tampoco cabe. |
| Validación (`Validar lote`) | No revisa catálogos: hoy su única regla es la del identificador de universalidad. |
| Promoción | `PromocionService` revisa los catálogos de crédito y de movimiento, pero se detiene en el **primer** error ("Fila 1: TipoIdentificacion 'CEDULA DE CIUDADANIA' no es un entero válido."). En un archivo real eso significa corregir un valor, volver a promover, ver el siguiente error, y así sucesivamente. |
| Atributos (001-002) | Los valores de los atributos con catálogo (sexo, grupo étnico, canal…) no se revisan en ninguna parte y llegan tal cual a la capa final y al AVRO. |

## 2. Respuestas a las tareas

### 2.1 Nombre y estructura de la tabla

**Nombre: `EquivalenciasCarga`**, entidad `EquivalenciaCarga`. Sigue la convención de `PlantillasCarga` y `LotesCarga`. Se descarta `MapeosCargues` porque "mapeo" ya se usa para columna → campo (plantillas). "Equivalencia" dice exactamente lo que es: valor del cliente → código SFC.

Tomo tu propuesta (catálogo + valor original + equivalencia) con estos ajustes:

| Columna | Tipo | Notas |
|---|---|---|
| `Id` | `bigint` identity | |
| `Catalogo` | `varchar(50)` | Nombre del catálogo, igual al entity set OData (`TipoIdentificacion`, `EstadoCredito`…), como ya hace `CatalogoAtributos.CatalogoValor`. Es tu `NombreTabla`. Solo acepta los catálogos de la lista del §3.2. |
| `ValorOriginal` | `varchar(200)` | Tal como lo escribe el usuario: "CEDULA DE CIUDADANIA". |
| `ValorNormalizado` | `varchar(200)` | Lo calcula el backend: sin espacios a los lados, espacios internos colapsados, mayúsculas y sin tildes ("Cédula  de ciudadanía" → "CEDULA DE CIUDADANIA"). Es la columna que se compara al cargar. |
| `Codigo` | `varchar(20)` | Tu `Equivalencia`: el código SFC destino, como texto porque `TipoTasa` y `CalificacionCredito` usan códigos de texto. Al guardar, el backend comprueba que exista en el catálogo. |
| `Observaciones` | `varchar(500)`, nula | Opcional, para anotar de dónde sale la equivalencia. |
| `FechaActualizacion`, `Usuario` | sombra | Como en las demás tablas. |

- **Índice único** `(Catalogo, ValorNormalizado)`: un valor del cliente tiene una sola traducción por catálogo. Varios valores sí pueden llevar al mismo código ("CC", "CEDULA" y "CÉDULA DE CIUDADANÍA" → 1).
- **Por catálogo, no por campo** (como propusiste): `TipoIdentificacion` aparece en los tres insumos y `Periodicidad` en dos campos de crédito. Una sola fila sirve para todos. El backend sabe qué campo usa qué catálogo (§3.2).
- **Global** (EQ1): no depende de la universalidad ni de la plantilla, igual que las plantillas (D1).

### 2.2 ¿Dónde se aplican: en el cargue o en el envío?

**En el cargue, no en el envío.** El envío genera el AVRO desde la capa final, y la capa final guarda los códigos como enteros con FK a los catálogos (`Creditos.ModalidadCodigo`, `Deudores.TipoIdentificacion`…). "CEDULA DE CIUDADANIA" ni siquiera puede llegar ahí. Traducir en el envío obligaría a quitar esas FK y haría que lo promovido no fuera lo que se transmite (ADR 0001).

Dentro del cargue hay tres momentos posibles. Recomiendo el **(c)** (EQ2):

| Opción | Cómo funciona | Contra |
|---|---|---|
| (a) Al subir el archivo | El parser traduce antes de grabar en staging. | Si falta una equivalencia, hay que crearla y **volver a subir** el archivo. El staging pierde el valor original. |
| (b) Al validar, reescribiendo staging | `Validar` traduce las filas de staging en la base. | Se pierde el valor original, y traducir dos veces puede encadenar equivalencias ("1"→"2" y después "2"→"3"). |
| **(c) Se comprueba al validar y se traduce al promover** (decidido, EQ2) | Staging guarda el valor **tal como viene en el archivo**. `Validar` calcula la traducción; si no hay equivalencia, toma el valor tal cual (EQ7) y reporta, celda por celda, los que no son un código válido del catálogo. `Promover` aplica la misma traducción al pasar a la capa final. | Hay que ampliar algunas columnas de staging (§3.1). Es una migración barata: en Postgres, ampliar un `varchar` no reescribe la tabla. |

Por qué recomiendo (c):
- **Flujo sin volver a subir el archivo:** subir → validar → ver los "valores sin equivalencia" → crearlos desde el mismo panel → validar otra vez → promover.
- El staging queda fiel al archivo, y el panel de errores y el CSV muestran el valor que de verdad vino.
- Una sola función de traducción (`TraductorCatalogos`), usada por la regla de validación y por la promoción. No puede pasar que la validación apruebe algo que la promoción rechaza.
- Si una equivalencia cambia entre validar y promover, la promoción usa la vigente y vuelve a comprobar los catálogos.

## 3. Diseño

### 3.1 Backend: modelo y migración (Fase EQ-A)

- `Models/Carga/EquivalenciaCarga.cs` con el mapping del §2.1, `DbSet<EquivalenciaCarga> EquivalenciasCarga`.
- Migración `AddEquivalenciasCarga`:
  - Crea la tabla y el índice único.
  - **Amplía a `varchar(200)`** las columnas de staging con catálogo: `TipoIdentificacion` (las 3 tablas), `Modalidad`, `CodigoProducto`, `CalidadDeudor`, `FrecuenciaPago*`, `TipoTasa`, `TipoGarantia`, `CalificacionCredito`, `Estado`, `PeriodoGracia`, `ModeloProvisiones`. `ValorAtributo` ya es de 500.
  - Sin datos que migrar: las columnas solo crecen.

### 3.2 Backend: qué campo usa qué catálogo

Clase estática `Services/Carga/CatalogosCarga.cs`, junto a `CamposStaging`:

| Campo de staging | Catálogo | Validado hoy en la promoción |
|---|---|---|
| `tipo_identificacion` (3 insumos) | `TipoIdentificacion` | Solo que sea entero |
| `modalidad` | `Modalidad` | Sí |
| `codigo_producto` | `ProductoCredito` | Sí |
| `calidad_deudor` | `CalidadDeudor` | Sí |
| `frecuencia_pago_capital`, `frecuencia_pago_intereses` | `Periodicidad` | Sí |
| `tipo_tasa` | `TipoTasa` (código de texto) | Sí |
| `tipo_garantia` | `TipoGarantia` | Sí |
| `calificacion_credito` | `CalificacionCredito` (código de texto) | No |
| `estado` | `EstadoCredito` | Sí |
| `periodo_gracia` | `PeriodoGracia` | Sí |
| `modelo_provisiones` | `ModeloProvisiones` | Sí |
| `valor_atributo` de un atributo con `CatalogoAtributos.CatalogoValor` (sexo, grupo étnico, víctima, tamaño de empresa, tipo de contratación, canal de originación, condición del bien, condición laboral, destino, consolidación, recuperación, franquicia, tipo de póliza, canal de desembolso) | El de `CatalogoValor` | No (EQ5) |

`moneda` y `marco_legal` no tienen tabla de catálogo en el sistema y quedan fuera.

**`TraductorCatalogos`** (servicio *scoped*):
- Carga una vez por operación los códigos de los catálogos usados y las equivalencias.
- Expone `Traducir(catalogo, valor) → (valor, origen, valido)`, donde `origen` es `Equivalencia` o `Archivo` y `valido` dice si el valor resultante existe en el catálogo.
- **Precedencia (EQ3):**
  1. Si hay una equivalencia para el valor normalizado, se usa, aunque el valor ya sea un código válido. Así se cubre un cliente que numera con sus propios códigos ("1" del cliente → "3" SFC).
  2. Si no hay equivalencia, se toma **el valor del archivo tal cual** (EQ7). No es un error por sí mismo: solo lo es si ese valor no es un código del catálogo, y eso lo reporta la validación (§3.4).
- No compara automáticamente contra la descripción del catálogo (EQ4). La descripción solo se usa para sugerir un código en el diálogo (§3.6).

### 3.3 Backend: API de equivalencias (Fase EQ-A)

`Controllers/Carga/EquivalenciasController.cs`, en `/api/equivalencias`. Es REST como `/api/plantillas`, no OData, porque normaliza y valida al guardar.

| Método | Ruta | Permiso (EQ6) | Notas |
|---|---|---|---|
| GET | `/equivalencias?catalogo=` | `cargas.read` | Lista completa (son pocas filas), filtrable por catálogo. |
| GET | `/equivalencias/catalogos` | `cargas.read` | Catálogos que aceptan equivalencias: `{ catalogo, nombre, campos[], valores[{codigo, descripcion}] }`. El front arma los desplegables con esto **sin** consultar OData, así no depende de `params.read` (un 403 del cliente OData cierra la sesión). |
| POST | `/equivalencias` | `cargas.write` | `{ catalogo, valorOriginal, codigo, observaciones }`. 400 si el catálogo no está en la lista o el código no existe en él; 409 si el valor normalizado ya existe en ese catálogo. |
| PUT | `/equivalencias/{id}` | `cargas.write` | Mismas validaciones. |
| DELETE | `/equivalencias/{id}` | `cargas.write` | Borrado físico: nada la referencia, porque la capa final guarda el código, no la equivalencia. |

Sin importación masiva por ahora (EQ8).

Las escrituras quedan en la auditoría por `AuditMiddleware`, como las demás escrituras.

### 3.4 Backend: validación (Fase EQ-B)

- Regla nueva `ReglaCodigosCatalogo : IReglaValidacion`, código `CATALOGO-CODIGO-INVALIDO`, severidad **`Error`** (bloquea la promoción).
- Recorre el staging de los tres insumos (y los atributos con `CatalogoValor`) y pasa cada valor por el traductor (EQ7):
  - Un valor sin equivalencia **no** genera error si ya es un código válido del catálogo.
  - Genera **un error por celda** cuando el valor resultante, traducido o tomado tal cual, no existe en el catálogo. Por ejemplo, en `insumo 001-001`, `fila 7`, `campo tipo_identificacion` y valor `CEDULA DE EXTRANJERIA`: *"'CEDULA DE EXTRANJERIA' no es un código de TipoIdentificacion. Corríjalo en el archivo o cree una equivalencia en Equivalencias de carga."*
  - Si el valor vino de una equivalencia cuyo código ya no existe en el catálogo, el mensaje lo dice.
- Los campos obligatorios vacíos no se reportan aquí: los cubre la validación de encabezados, y la regla de obligatorios por celda es otro tema.
- **Volumen:** un archivo real puede repetir el mismo valor en miles de filas. La regla corre en memoria con los catálogos precargados, y `ErroresValidacion` ya está indexada por lote, insumo y fila.
- Endpoint nuevo `GET /api/cargas/{id}/codigos-invalidos` (`cargas.read`): agrupa esos errores en `{ catalogo, campo, valorObservado, filas }`. Con él, el panel muestra "CEDULA DE EXTRANJERIA (1.240 filas)" en vez de 1.240 renglones.

### 3.5 Backend: promoción (Fase EQ-B)

- `PromocionService` traduce cada campo con catálogo usando `TraductorCatalogos` antes de convertirlo a entero o texto. Esto reemplaza `ValidarCodigoInt` y los `int.Parse` sueltos de esos campos.
- `TipoIdentificacion` del deudor también pasa por el traductor. Hoy solo se comprueba que sea entero, sin mirar el catálogo.
- Los valores de atributo con `CatalogoValor` se graban ya traducidos (EQ5).
- Si a pesar de la validación queda algún código inválido, porque se borró o cambió una equivalencia después de validar, la promoción falla con el mensaje de siempre. Como la validación ya dejó la lista completa, ese caso es raro.
- El AVRO no cambia: se genera desde la capa final, que ya trae los códigos.

### 3.6 Front: pantalla de equivalencias (Fase EQ-C)

- `src/features/upload/`:
  - `models/Equivalencia.model.ts`.
  - `services/EquivalenciaService.ts`, que usa el cliente de seguridad y llama a `/equivalencias`.
  - `components/ListEquivalencias.tsx`.
- Ruta `/app/equivalencias-carga` con `RequirePermission("cargas.read")`. En el menú *Cargue*, la opción **"Equivalencias de carga"** va entre *Plantillas de carga* y *Lotes de carga*.
- Lista `MaterialReactTable`:
  - Columnas: catálogo (nombre legible), valor original, código y descripción SFC, observaciones y última modificación (usuario y fecha).
  - Filtro por catálogo con un selector arriba de la tabla. Exportar a CSV.
- Con `cargas.write` se puede crear, editar y borrar (este último con confirmación). Sin ese permiso las acciones **no se muestran**.
- Diálogo con estos campos: catálogo (select, de `/equivalencias/catalogos`), valor original (texto) y código SFC (autocomplete con "código – descripción" del catálogo elegido), más observaciones. Los errores 400 y 409 del backend se muestran en el diálogo.
- **Sugerencia (EQ4):** si el valor original normalizado coincide con la descripción normalizada de un código del catálogo, el diálogo lo preselecciona y lo indica ("Sugerido por la descripción"). El usuario lo tiene que confirmar al guardar.
- Reutiliza `tableStyles` y `ListaHeader` de `param/shared`. No usa `ListaGeneralCrud`, porque aquel trabaja contra OData y esta API es REST.

### 3.7 Front: desde el lote (Fase EQ-D)

- En `CargaArchivos`, `PanelErrores` agrega una sección **"Códigos no válidos"** cuando el lote tiene errores de esa regla, alimentada por `/codigos-invalidos`.
- Muestra una tabla con catálogo, campo, valor y número de filas, y un botón **"Crear equivalencia"** por renglón. El botón abre el mismo diálogo de EQ-C con el catálogo y el valor ya puestos; el usuario solo elige el código.
- Después de crear las equivalencias, aparece el aviso *"Valide el lote de nuevo para aplicar las equivalencias"*, junto al botón *Validar* que ya existe. No hace falta volver a subir el archivo.
- Sin `cargas.write` la sección se ve, pero sin botones.

### 3.8 Documentación (Fase EQ-E)

- **ADR 0010** del backend, `0010-equivalencias-de-carga.md`: el staging guarda el valor del archivo, la validación comprueba y la promoción traduce. Incluye por qué no se traduce en el envío.
- `CLAUDE.md` de los dos repos y `docs/mapeos/excel-a-staging.md` del backend (campo → catálogo).
- La guía de pruebas manuales **queda aplazada** hasta que haya ejemplos reales del cliente (EQ9). Cada fase de backend sí se prueba contra la API en :7299 con datos armados para la fase. Esos datos incluyen "CEDULA DE CIUDADANIA", "CEDULA DE EXTRANJERIA" (21 caracteres), un valor con tildes y espacios dobles, y un código propio del cliente que choca con uno SFC.
- Registrar en `MURICSyncBack/docs/despliegue/pendientes-qa.md` los cambios de front y backend y la migración: hay que sacar un respaldo de la base antes de desplegar.

## 4. Fases

"(B)" = backend, "(F)" = front. Una fase por turno, con `dotnet build` o `lint` + `build`, y un commit por fase y por repo.

| Fase | Contenido | Estimado |
|---|---|---|
| **EQ-A** (B) | Modelo, migración (tabla + ampliar staging), `CatalogosCarga`, `TraductorCatalogos` y `EquivalenciasController` (CRUD + `/catalogos`). Probado contra la API en :7299. | ≈1 día |
| **EQ-B** (B) | `ReglaCodigosCatalogo`, `/codigos-invalidos` y traducción en `PromocionService`. Probado con un archivo que traiga textos. | ≈1 día |
| **EQ-C** (F) | Pantalla *Equivalencias de carga*, servicio, modelo, ruta y menú. | ≈1 día |
| **EQ-D** (F) | Sección "Códigos no válidos" en `PanelErrores` con creación rápida. | ≈0,5 día |
| **EQ-E** | ADR 0010, `CLAUDE.md` de los dos repos, mapeos y `pendientes-qa.md`. Sin guía de pruebas (EQ9). | ≈0,5 día |

**Estimado: ≈4 días.**

## 5. Riesgos

| Riesgo | Mitigación |
|---|---|
| Una equivalencia mal creada manda a la SFC un código equivocado sin que nadie lo note | Solo la crea quien tiene `cargas.write`, queda auditada y la lista muestra quién la creó y cuándo. |
| Un código propio del cliente que coincide con un código SFC (EQ3) | La equivalencia gana. Se documenta en la pantalla con un texto de ayuda. |
| Archivos grandes con muchos errores de catálogo | Un error por celda, pero el panel los agrupa por valor. Se reutiliza la exportación CSV que ya existe. |
| Cambio de una equivalencia después de promover | No afecta lo promovido, que guarda el código. Para corregir hay que volver a cargar el corte, como con cualquier otro dato. |
| Ampliar columnas de staging | Migración solo de `ALTER COLUMN TYPE varchar(200)`, sin pérdida de datos. Se prueba en `BEGIN/ROLLBACK` antes de aplicarla. |

## 6. Decisiones (respondidas el 2026-10-14)

| # | Pregunta | Decisión |
|---|---|---|
| EQ1 | ¿Equivalencias globales, o por universalidad o plantilla? | **Globales.** |
| EQ2 | ¿En qué momento se aplican? | **Se comprueban al validar y se traducen al promover** (opción c del §2.2). |
| EQ3 | Si el valor ya es un código válido y además tiene equivalencia, ¿cuál gana? | **La equivalencia** (cubre clientes con códigos propios). |
| EQ4 | ¿Traducir automáticamente cuando el texto coincide con la descripción del catálogo? | **No.** El diálogo solo lo sugiere (§3.6). |
| EQ5 | ¿Incluir los atributos 001-002 con catálogo? | **Sí.** |
| EQ6 | ¿Quién las administra? | Ver: `cargas.read`. Crear, editar y borrar: `cargas.write`. |
| EQ7 | ¿Un valor sin equivalencia es error o advertencia? | **Ninguno de los dos:** se toma el valor tal cual y se valida contra el catálogo. Es error solo si ese valor no es un código válido (regla `CATALOGO-CODIGO-INVALIDO`, §3.4). |
| EQ8 | ¿Importación masiva? | **Por ahora no.** |
| EQ9 | Ejemplos reales | Aún no hay. **La guía de pruebas manuales queda aplazada**; cada fase se prueba contra la API con datos armados para la fase. |
