# Pruebas manuales: plantillas de carga

Fecha: 2026-09-28 · Rama: `rhenao-sprint04` (front) y `rhenao_sprint04` (back)
Plan que cierra: `docs/prompts/plan-plantillas-carga.md` (fases A a F).

## 1. Objetivo

Estas pruebas se hacen en el navegador para dar por terminado el trabajo de plantillas. La lógica del backend ya se probó contra la base local sin interfaz: parsers, validación de plantillas, ingesta 001-999 y atomicidad. Lo que falta es comprobar la **interfaz**: el formulario, *Cargue de archivos* y los permisos.

## 2. Preparación

| # | Paso | Cómo |
|---|---|---|
| 1 | Base local con las migraciones | Ya aplicadas el 2026-09-27 (`QuitarEntidadDePlantillasCarga`, `AddCatalogoAtributosYColumnasDeAtributo`). Para comprobarlo: `dotnet ef migrations list` en MURICSyncBack no debe mostrar ninguna como `(Pending)`. |
| 2 | Backend corriendo | En MURICSyncBack: `dotnet run` (HTTPS :7167). |
| 3 | Front corriendo | En MuricSyncFront: `npm run dev`. |
| 4 | Usuarios de prueba | Ver la tabla siguiente. |
| 5 | Archivos de prueba | Carpeta `docs/prompts/pruebas-plantillas-carga/` (§3). |

**Usuarios y roles.** Los roles ya existen en la base local:

| Usuario | Rol | Permisos relevantes | Para qué |
|---|---|---|---|
| U-ADMIN | `ADMIN` u `OPERADOR` | `cargas.read`, `cargas.write`, `params.read` | Casi todas las pruebas. |
| U-CONSULTA | `CONSULTA` | `cargas.read`, `params.read` | P-G2: ver sin acciones. |
| U-SINPARAMS | `TEST-ROLE` con `cargas.read` y `cargas.write`, **sin** `params.read` | | P-G3: atributos sin permiso de tablas básicas. `TEST-ROLE` hoy no tiene permisos: asígnalos en *Gestión de roles* con un usuario `ADMIN`. |
| U-SEGURIDAD | `SEGURIDAD` | sin `cargas.*` | P-G4: sin acceso a plantillas. |

**Consultar la base.** Abre una consola con:

```bash
docker exec -it dev-postgres psql -U admin -d muricsyncdb
```

En las consultas, reemplaza `:lote` por el número del lote que muestra *Cargue de archivos* ("Lote #N creado").

## 3. Archivos de prueba

Todos están en `docs/prompts/pruebas-plantillas-carga/`, separados por `;`. Se verificaron con los parsers reales.

| Archivo | Insumo | Contenido | Resultado esperado al cargarlo |
|---|---|---|---|
| `creditos_moneda_vacia.csv` | 001-001 | 3 créditos; la columna `Moneda` está vacía en PRB-002 y PRB-003 | Con respaldo `COP`: PRB-001 = USD, PRB-002 = COP, PRB-003 = COP |
| `separado_por_pipe.csv` | 001-001 | Separado por `\|` | El formulario avisa que ese separador no se acepta |
| `atributos_por_columna.csv` | 001-002 | 3 créditos con columnas Sexo, CIIU, Canal originación y Poliza 2; PRB-002 sin CIIU ni póliza; PRB-003 con la póliza ya prefijada | **10** filas de atributos; pólizas `P2_ABC-123` y `P2_XYZ-9` (sin doble prefijo) |
| `atributos_eav.csv` | 001-002 | Formato SFC (`clave_atributo`/`valor_atributo`) | **3** filas, sin plantilla |
| `todos_combinado.csv` | 001-999 | 2 créditos con campos de crédito, movimiento, Sexo y CIIU; PRB-102 sin CIIU | Créditos **2**, atributos **3**, movimientos **2** |
| `todos_sin_saldo.csv` | 001-999 | Igual, pero la columna se llama `saldo_capital_x` | Error `001-003: saldo_capital`; ningún slot cambia |

## 4. Casos de prueba

Marca cada caso en el registro de §5. Salvo que se indique otro usuario, todos se hacen con **U-ADMIN**.

### A. Lista y edición

**P-A1 · Editar una plantilla existente**
1. Menú *Cargue de archivos → Plantillas de carga*.
2. En `creditos-01`, **Editar**.

Esperado:
- El formulario muestra su mapeo completo, sin pantalla en blanco.
- Guardar sin cambios cierra el diálogo, muestra "Plantilla actualizada." y la lista se recarga.
- La columna "Campos mapeados" muestra el número real (no 0).

**P-A2 · Filtros de la lista**
1. Recorre los chips "Todas", "001-001 Créditos", "001-002 Atributos", "001-003 Movimientos" y "001-999 Todos".

Esperado:
- Cada chip filtra por su insumo, y "Todas" muestra todo.

**P-A3 · Plantillas globales**
1. En *Cargue de archivos* crea un lote para una universalidad cualquiera.
2. Abre el selector "Plantilla (opcional)" de 001-001.
3. Anula el lote, crea otro con **otra** universalidad y repite.

Esperado:
- En los dos lotes aparecen las mismas plantillas activas de 001-001, con su número de campos.

### B. Formulario (ajustes de la Fase C)

**P-B1 · Separador `|` no soportado**
1. **Nueva plantilla**, insumo 001-001, **Importar columnas desde archivo** con `separado_por_pipe.csv`.

Esperado:
- Aviso: *"El archivo parece estar separado por "\|"…"*. No se crean filas.

**P-B2 · Límite de 200 caracteres**
1. En una fila, pega en "Columna en el archivo" un texto de más de 200 caracteres.

Esperado:
- El campo no acepta más de 200.

**P-B3 · Columna que alimenta dos campos**
1. En dos filas distintas escribe la misma columna (p. ej. `NRO`) con campos destino distintos.

Esperado:
- Aviso informativo *"Estas columnas del archivo alimentan más de un campo: NRO"*. Se puede guardar.

**P-B4 · Nombre del archivo descargado**
1. Ponle a la plantilla el nombre `Prueba/Q3: v1?`, con al menos una columna mapeada.
2. **Descargar plantilla vacía**.

Esperado:
- Se descarga un `.xlsx` cuyo nombre no tiene `/`, `:` ni `?`.
- Cancela la plantilla sin guardar.

### C. Valor por defecto como respaldo (D2)

**P-C1 · Crear la plantilla**
1. **Nueva plantilla**, nombre `PRUEBA moneda respaldo`, insumo 001-001.
2. **Importar columnas** con `creditos_moneda_vacia.csv`.
3. En la fila `Moneda` escribe `COP` como valor por defecto.
4. Guarda.

Esperado:
- Las 11 columnas quedan mapeadas como "Sugerida" y no sale la alerta de obligatorios.
- El valor por defecto tiene el texto *"Opcional: si la celda viene vacía"*.

**P-C2 · Cargar**
1. En un lote nuevo, fila 001-001: plantilla `PRUEBA moneda respaldo`, archivo `creditos_moneda_vacia.csv`, **Subir**.

Esperado:
- "Archivo subido y parseado exitosamente."; los conteos quedan en 3 / 0 / 0.
- En la base:

  ```sql
  SELECT "IdentificacionCreditoEntidad", "Moneda" FROM public."LotesCargaCredito" WHERE "LoteId" = :lote ORDER BY 1;
  ```

  devuelve PRB-001 = USD, PRB-002 = COP y PRB-003 = COP.

### D. Catálogo de atributos y atributos por columna

**P-D1 · Catálogo**
1. Menú de tablas básicas → **Catálogo de Atributos**.

Esperado:
- 40 filas con código, atributo, naturaleza, catálogo de valores y descripción.

**P-D2 · Plantilla 001-002 por columnas**
1. **Nueva plantilla**, nombre `PRUEBA atributos columnas`, insumo 001-002.
2. **Importar columnas** con `atributos_por_columna.csv`.

Esperado:
- `Identificacion credito`, `tipo_identificacion` y `numero_identificacion` quedan en sus campos.
- `Sexo`, `CIIU` y `Canal originación` quedan como filas de **atributo** sugeridas (5, 10 y 12), con el buscador de atributos en "Campo destino".
- `Poliza 2` queda **sin sugerencia**, porque es ambiguo entre los atributos 29 y 30.

3. Borra la fila `Poliza 2`. Con **Agregar atributo** crea una fila nueva: columna `Poliza 2`, atributo **30 · Número de la póliza**, "Póliza n.º" = `2`.
4. En la fila de Sexo abre "Valor por defecto".

Esperado:
- Al buscar "póliza" aparecen 29 a 32 con la marca *Repetible*. Un tooltip muestra la descripción de la SFC.
- El campo "Póliza n.º" solo aparece en 29 a 32.
- En Sexo, el valor por defecto es una lista con los valores de *Sexo Biológico*, no texto libre.
- Aparece el aviso *"Atributos obligatorios para la SFC sin columna"* con 1, 2, 3, 4, 11 y 35. No impide guardar.
- En las filas normales, "Clave Atributo" y "Valor Atributo" ya no se ofrecen como destino.

5. Guarda.

**P-D3 · Reglas del formulario**

En una plantilla 001-002 nueva, que no se guarda:

| Acción | Esperado |
|---|---|
| Agregar dos veces el atributo 7 (Indicador de víctima), cada uno con columna | Al guardar: *"El atributo 7 (Indicador de victima) no es repetible…"* |
| Agregar dos veces el atributo 30, ambos con póliza n.º 1 | *"…indica un número de póliza distinto en cada columna."* |
| Agregar una fila de atributo sin elegir el atributo | *"Elige el atributo de cada columna de atributo."* |
| Plantilla nueva que mapea "Clave Atributo" en una fila normal | **Agregar atributo** queda deshabilitado, con un tooltip que explica el formato EAV |

**P-D4 · Cargar atributos por columna**
1. En el lote de P-C2 (o uno nuevo), fila 001-002: plantilla `PRUEBA atributos columnas`, archivo `atributos_por_columna.csv`, **Subir**.

Esperado:
- El conteo de atributos queda en **10**.
- En la base:

  ```sql
  SELECT "IdentificacionCreditoEntidad", "ClaveAtributo", "ValorAtributo"
  FROM public."LotesCargaAtributo" WHERE "LoteId" = :lote ORDER BY 1, 2;
  ```

  PRB-002 no tiene filas de CIIU (10) ni de póliza (30). Las pólizas son `P2_ABC-123` y `P2_XYZ-9`.

**P-D5 · El formato EAV sigue funcionando**
1. Fila 001-002 sin plantilla, archivo `atributos_eav.csv`, **Subir**.

Esperado:
- El conteo de atributos queda en **3**; reemplaza lo de P-D4.

### E. Insumo 001-999 Todos

**P-E1 · Plantilla 001-999**
1. **Nueva plantilla**, nombre `PRUEBA todos`, insumo **001-999 — Todos**.
2. **Importar columnas** con `todos_combinado.csv`.

Esperado:
- Todas las columnas quedan mapeadas; `Sexo` y `CIIU` como atributos 5 y 10.
- En "Campo destino", cada campo muestra el chip de su insumo (001-001 o 001-003).
- Aviso *"Un archivo con esta plantilla llenará: 001-001 Créditos, 001-002 Atributos, 001-003 Movimientos"*.

3. Borra temporalmente las dos filas de atributo.

Esperado:
- El aviso ya no incluye 001-002.

4. Deshaz el cambio: cierra sin guardar y repite los pasos 1 y 2. Guarda.

**P-E2 · Plantilla 001-999 solo con identificadores**
1. Nueva plantilla 001-999 que mapea solo los tres identificadores.

Esperado:
- Aviso de advertencia. Al guardar: *"La plantilla 001-999 debe mapear al menos un campo propio de algún insumo…"*.

**P-E3 · Cargar el archivo combinado en un lote vacío**
1. Crea un **lote nuevo**.
2. En la fila **"001-999 · Todos (un solo archivo)"**, sin elegir plantilla, selecciona `todos_combinado.csv`.

Esperado:
- **Subir** está deshabilitado. El selector dice "Plantilla (obligatoria)" y solo lista plantillas 001-999.

3. Elige `PRUEBA todos` y **Subir**.

Esperado:
- Sin diálogo de confirmación, porque el lote estaba vacío.
- Mensaje *"Archivo 001-999 cargado. Llenó: 001-001, 001-002, 001-003."*.
- Conteos 2 / 3 / 2.
- El historial muestra 3 filas "Exitoso", una por insumo, con el mismo archivo.

**P-E4 · Reemplazo con confirmación (N2)**
1. En el mismo lote, vuelve a subir `todos_combinado.csv` con `PRUEBA todos`.

Esperado:
- Diálogo *"Reemplazar archivos cargados"* que lista 001-001, 001-002 y 001-003.
- **Cancelar** no sube nada: el historial no cambia.
- **Reemplazar** sube el archivo y los conteos siguen en 2 / 3 / 2.

**P-E5 · Error atómico**
1. En el mismo lote, sube `todos_sin_saldo.csv` con `PRUEBA todos` y confirma el reemplazo.

Esperado:
- Error que incluye *"001-003: saldo_capital"*.
- Los conteos **no cambian** (2 / 3 / 2).
- El historial agrega una sola fila `001-999`, "Fallido".

**P-E6 · Las filas por insumo siguen igual**
1. En ese lote, sube `creditos_moneda_vacia.csv` en la fila 001-001 con `PRUEBA moneda respaldo`.

Esperado:
- Solo cambia el slot 001-001 (3 / 3 / 2).

### F. Borrar y desactivar

**P-F1 · Borrar una plantilla usada**
1. En *Plantillas de carga*, **Eliminar** `PRUEBA todos`.

Esperado:
- El diálogo muestra el mensaje del backend (*"…está referenciada por uno o más lotes… Desactívela en su lugar."*) y ofrece **Desactivar**.
- Al desactivarla, la plantilla queda inactiva y deja de aparecer en el selector 001-999 de *Cargue de archivos* (recarga la página).

**P-F2 · Borrar una plantilla no usada**
1. Crea una plantilla 001-003 cualquiera y elimínala.

Esperado:
- Se borra sin error.

### G. Permisos

**P-G1 · Menú y ruta con U-ADMIN**

Esperado:
- *Plantillas de carga* y *Catálogo de Atributos* aparecen en el menú.

**P-G2 · Solo lectura (U-CONSULTA)**
1. Entra a *Plantillas de carga*.

Esperado:
- Ve la lista, sin botones de crear, editar, eliminar ni cambiar estado.
- La sesión **no** se cierra.

**P-G3 · Sin `params.read` (U-SINPARAMS)**
1. **Nueva plantilla**, insumo 001-002.

Esperado:
- **Agregar atributo** está deshabilitado, con el tooltip *"Requiere permiso de consulta de tablas básicas (params.read)."*.
- La sesión **no** se cierra.

2. Edita `PRUEBA atributos columnas`.

Esperado:
- Las filas de atributo muestran "5 · Atributo 5", "10 · Atributo 10", etc.
- La sesión **no** se cierra.

**P-G4 · Sin `cargas.read` (U-SEGURIDAD)**

Esperado:
- *Plantillas de carga* no aparece en el menú.
- Si se escribe la URL `/app/plantillas-carga`, redirige a la página **"Acceso denegado"** (`/app/forbidden`), sin cerrar la sesión.

## 5. Registro de resultados

| Caso | Resultado (OK / Falla) | Observaciones |
|---|---|---|
| P-A1 | OK | 2026-09-29 |
| P-A2 | OK | 2026-09-29 |
| P-A3 | OK | 2026-09-29 |
| P-B1 | OK | 2026-09-29 |
| P-B2 | OK | 2026-09-29 |
| P-B3 | OK | 2026-09-29 |
| P-B4 | OK | 2026-09-29 |
| P-C1 | OK | 2026-09-29 |
| P-C2 | OK | 2026-09-29 |
| P-D1 | OK | 2026-09-29 |
| P-D2 | OK | 2026-09-29 |
| P-D3 | OK | 2026-09-29 |
| P-D4 | OK | 2026-09-29 |
| P-D5 | OK | 2026-09-29 |
| P-E1 | OK | 2026-09-29 |
| P-E2 | OK | 2026-09-29 |
| P-E3 | OK | Verificado tras 66cc5b5 (ícono de "Exitoso" en el historial). |
| P-E4 | OK | 2026-09-29 |
| P-E5 | OK | Falló al inicio: el historial no mostraba la fila `001-999` "Fallido". Corregido en 66cc5b5. |
| P-E6 | OK | 2026-09-29 |
| P-F1 | OK | 2026-09-29 |
| P-F2 | OK | 2026-09-29 |
| P-G1 | OK | 2026-09-29 |
| P-G2 | OK | 2026-09-29 |
| P-G3 | OK | 2026-09-29 |
| P-G4 | OK | 2026-09-29 |

Para cada falla, anota el paso, lo que se vio, el mensaje exacto y, si hay, el error de la consola del navegador (F12).

## 6. Limpieza

Cuando termines:

1. **Anula** en *Cargue de archivos* los lotes de prueba que no estén promovidos.
2. En *Plantillas de carga*, **desactiva** las plantillas `PRUEBA …` que quedaron usadas y **elimina** las que no.
3. Si le quitaste permisos a `TEST-ROLE` o a otro rol, restáuralos.

## 7. Criterio de salida

El trabajo de plantillas queda listo cuando todos los casos están en OK. Luego:

- Marca los criterios pendientes de §5 en `plan-plantillas-carga.md`.
- Envíame las fallas que haya, con el caso y la observación, para corregirlas en un commit por caso.
