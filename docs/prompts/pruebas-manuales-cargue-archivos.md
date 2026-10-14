# Pruebas manuales: cargue de archivos y lotes de carga

Fecha: 2026-09-28 · Rama: `rhenao-sprint04` (front) y `rhenao_sprint04` (back)
Plan que cierra: `docs/prompts/plan-cargue-archivos.md` (fases 0 y L1 a L5).

## 1. Objetivo

Estas pruebas se hacen en el navegador para cerrar el plan. El backend de L1 (lista con conteos, un lote activo por corte y universalidad, advertencia con lote promovido) ya se probó contra la API local. Falta comprobar la **interfaz**: la lista de lotes, abrir un lote por URL, las confirmaciones y los permisos.

## 2. Preparación

| # | Paso | Cómo |
|---|---|---|
| 1 | Base local con la migración | `LoteCargaPorUniversalidad` ya está aplicada (2026-09-28). Para comprobarlo: `dotnet ef migrations list` en MURICSyncBack no debe mostrarla como `(Pending)`. |
| 2 | Backend **reiniciado** | En MURICSyncBack: detener el proceso anterior y `dotnet run` (HTTPS :7167). El proceso que venía corriendo tiene el código de antes de B1. |
| 3 | Front corriendo | En MuricSyncFront: `npm run dev`. |
| 4 | Usuarios de prueba | Los mismos de `pruebas-manuales-plantillas-carga.md` §2 (tabla siguiente). |
| 5 | Archivo de prueba | `docs/prompts/pruebas-plantillas-carga/creditos_moneda_vacia.csv`. |

| Usuario | Rol | Permisos relevantes | Para qué |
|---|---|---|---|
| U-ADMIN | `ADMIN` u `OPERADOR` | `cargas.read`, `cargas.write`, `params.read` | Casi todas las pruebas. |
| U-CONSULTA | `CONSULTA` | `cargas.read`, `params.read` | P-F1: lista y lote en solo lectura. |
| U-SINPARAMS | `TEST-ROLE` con `cargas.read` y `cargas.write`, **sin** `params.read` | | P-F2: lote nuevo sin permiso de tablas básicas. |
| U-SEGURIDAD | `SEGURIDAD` | sin `cargas.*` | P-F3: sin acceso a lotes. |

**Datos locales que conviene conocer**

- La universalidad **111** tiene varios lotes `Parseado` del corte **2026-09-30** (#22, #23, #25, #26, #27) y uno `Iniciado` (#24). Son anteriores a la regla de un lote activo.
- La migración creó las universalidades **5** y **100** como **inactivas** ("Universalidad N (creada al migrar lotes)"), porque había lotes con esos códigos. El lote #2 (universalidad 100, corte 2026-04-30) está `Promovido`.
- El lote #28 (universalidad 112) quedó `Anulado` por las pruebas de L1.

**Consultar la base**

```bash
docker exec -it dev-postgres psql -U admin -d muricsyncdb
```

## 3. Casos de prueba

Salvo que se indique otro usuario, todos se hacen con **U-ADMIN**.

### A. Lote por universalidad (Fase 0)

**P-A1 · Formulario sin tipo de entidad**
1. Menú *Proceso de cargue de archivos → Cargue de archivos*.

Esperado:
- El formulario pide fecha de corte, universalidad y observaciones (opcional). **No** pide tipo de entidad.
- El selector de universalidad solo lista las activas (111, 112, 113); no aparecen 5 ni 100.

**P-A2 · Resumen del lote**
1. Abre el lote #22 desde *Lotes de carga*.

Esperado:
- "Información del lote" muestra "Universalidad: 111 — Universalidad de Libranza Titularice Ban100 Private 01". No hay "Tipo entidad" ni "Código entidad".

**P-A3 · Lotes migrados**
1. En *Lotes de carga*, chip **Todos**.

Esperado:
- Los lotes de las universalidades 5 y 100 muestran "Universalidad 100 (creada al migrar lotes)" y "Universalidad 5 (…)".

### B. Lista de lotes (L1, L2)

**P-B1 · Menú y filtro por defecto**
1. Menú *Proceso de cargue de archivos*.

Esperado:
- Aparecen *Plantillas de carga*, *Lotes de carga* y *Cargue de archivos*, en ese orden.
- *Lotes de carga* abre con el chip **Activos**: solo lotes `Iniciado`, `Parseado` o `Validado`, del más reciente al más antiguo.

**P-B2 · Chips y filtros**
1. Recorre los chips **Promovidos**, **Anulados** y **Todos**.
2. En **Todos**, elige la universalidad 111 y luego el corte 2026-09-30.

Esperado:
- Cada chip muestra solo su estado; **Todos** muestra todo.
- Al cambiar de chip, los filtros de universalidad y corte vuelven a "Todas" / "Todos".
- Universalidad y corte ofrecen solo valores de los lotes cargados, y el contador de registros cambia con cada filtro.

**P-B3 · Conteos**
1. Anota las filas 001 / 002 / 003 del lote #25 en la lista.
2. Ábrelo.

Esperado:
- "Filas parseadas (001 / 002 / 003)" del resumen coincide con la lista (3 / 3 / 2).

**P-B4 · Abrir y volver**
1. En la lista, **Abrir** (ícono al final de la fila) en cualquier lote.
2. **Volver a la lista**.

Esperado:
- La URL pasa a `/app/carga-archivos/<id>` y se ve ese lote.
- **Volver a la lista** regresa a *Lotes de carga*.

### C. Lote por URL (L3)

**P-C1 · Crear y recargar**
1. En *Lotes de carga*, **Nuevo lote**: universalidad 113, corte 2026-10-31, observaciones `Prueba L5`. **Crear lote**.
2. Recarga la página (F5).

Esperado:
- Mensaje "Lote #N creado exitosamente." y la URL pasa a `/app/carga-archivos/N`.
- Tras recargar, el lote sigue abierto, con las observaciones en el resumen.
- En la lista, el lote nuevo muestra el ícono de observaciones; el tooltip dice `Prueba L5`.

**P-C2 · Lote inexistente**
1. Escribe la URL `/app/carga-archivos/99999`.
2. Escribe la URL `/app/carga-archivos/abc`.

Esperado:
- En los dos casos: aviso *"El lote #… no existe."*, sin formulario ni error rojo.

**P-C3 · Subir en un lote nuevo**
1. En el lote de P-C1, fila 001-001, sube `creditos_moneda_vacia.csv` sin plantilla.

Esperado:
- "Archivo subido y parseado exitosamente."; el lote pasa a `Parseado`.

### D. Reglas al crear (L1, L3)

**P-D1 · Lote activo duplicado**
1. **Nuevo lote**: universalidad 111, corte 2026-09-30.

Esperado:
- Error *"Ya existe el lote #22 (Parseado) para esta universalidad y fecha de corte. Ábralo o anúlelo antes de crear otro."* con el botón **Abrir lote #22**.
- **Abrir lote #22** abre ese lote.

**P-D2 · Corte con un lote promovido**

Preparación (crea un lote promovido de prueba para la universalidad 113):

```sql
INSERT INTO public."LotesCarga" ("FechaCorte", "UniversalidadCodigo", "Estado", "FechaCreacion", "UsuarioCreador")
VALUES ('2026-08-31', 113, 'Promovido', now(), 'prueba-L5') RETURNING "Id";
```

1. **Nuevo lote**: universalidad 113, corte 2026-08-31.

Esperado:
- El lote se crea y, bajo el resumen, aparece la advertencia *"Ya existe el lote #… promovido para esta universalidad y fecha de corte. Al promover este lote se actualizan en MURIC los créditos que traiga para ese corte."*.
- La advertencia se puede cerrar y no reaparece al abrir otro lote.

Limpieza: anula el lote nuevo y borra el promovido de prueba:

```sql
DELETE FROM public."LotesCarga" WHERE "UsuarioCreador" = 'prueba-L5';
```

### E. Acciones del lote (L3)

**P-E1 · Confirmar promover**
1. Abre un lote `Validado` (o valida el de P-C3).
2. **Promover a MURIC** → **Cancelar**.

Esperado:
- Diálogo *"Promover el lote #N"*. **Cancelar** no cambia nada: el lote sigue `Validado`.
- (No confirmes la promoción salvo que quieras promover el lote de verdad.)

**P-E2 · Confirmar anular**
1. En el lote de P-C1, **Anular lote** → **Cancelar**; luego **Anular lote** → **Anular**.

Esperado:
- **Cancelar** no cambia nada. **Anular** deja el lote `Anulado` y desaparecen las acciones de carga.

**P-E3 · Subir en Validado**
1. En un lote `Validado` de prueba, sube un archivo en cualquier fila.

Esperado:
- Antes de subir, el panel "2. Carga de archivos" muestra el aviso *"El lote ya está validado. Si sube un archivo, vuelve a Parseado…"*.
- Después de subir, el lote queda `Parseado`.

### F. Permisos (L3, L4)

**P-F1 · Solo lectura (U-CONSULTA)**
1. Menú: *Lotes de carga* (en *Proceso de cargue* y en *Consultas*).
2. Abre el lote #22.

Esperado:
- La lista se ve sin **Nuevo lote**.
- El lote muestra resumen e historial, el aviso *"Solo consulta: no tiene permiso para modificar lotes."* y **no** muestra carga de archivos, validar, promover ni anular.
- En un lote `Promovido`, el paso 4 muestra solo el historial de transmisiones, sin botones.
- *Cargue de archivos* y *Envío a MURIC* no aparecen en el menú.
- La sesión **no** se cierra en ningún momento.

**P-F2 · Sin `params.read` (U-SINPARAMS)**
1. *Cargue de archivos* (lote nuevo).
2. *Envío a MURIC*.

Esperado:
- Lote nuevo: aviso *"Para elegir la universalidad se necesita el permiso de consulta de tablas básicas (params.read)."* y el selector deshabilitado.
- Envío MURIC: el filtro de universalidad queda deshabilitado en "Todas".
- La sesión **no** se cierra.

**P-F3 · Sin `cargas.*` (U-SEGURIDAD)**
1. Revisa el menú.
2. Escribe las URL `/app/lotes-carga`, `/app/carga-archivos/22` y `/app/envio-muric`.

Esperado:
- No aparecen *Proceso de cargue de archivos*, *Envío a MURIC* ni *Consultas*.
- Las tres URL llevan a **"Acceso denegado"** (`/app/forbidden`), sin cerrar la sesión.

**P-F4 · Consultas MURIC retirada**
1. Con U-ADMIN, escribe la URL `/app/consultas-muric`.

Esperado:
- Redirige a *Lotes de carga*.

**P-F5 · Página de inicio**
1. Con U-ADMIN y luego con U-CONSULTA, abre la página de inicio.

Esperado:
- U-ADMIN ve los accesos *Cargue de archivos* y *Lotes de carga*; U-CONSULTA solo *Lotes de carga*. Los dos abren su pantalla (antes "Consultas" llevaba a una ruta inexistente).

### G. Sesión en subidas (L4)

**P-G1 · Token vencido al subir**
1. Abre un lote `Iniciado` o `Parseado` y elige un archivo en una fila.
2. En DevTools (F12) → *Application* → *Local Storage*, cambia `tokenExpiry` a una fecha pasada (p. ej. `2020-01-01T00:00:00Z`).
3. **Subir**.

Esperado:
- La sesión se cierra y el navegador va a `/login` (antes salía un error genérico y la sesión seguía).

## 4. Registro de resultados

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
| P-C3 | OK | 2026-09-29 |
| P-D1 | OK | 2026-09-29 |
| P-D2 | OK | 2026-09-29 |
| P-E1 | OK | 2026-09-29 |
| P-E2 | OK | 2026-09-29 |
| P-E3 | OK | 2026-09-29 |
| P-F1 | OK | 2026-09-29 |
| P-F2 | OK | 2026-09-29 |
| P-F3 | OK | 2026-09-29 |
| P-F4 | OK | 2026-09-29 |
| P-F5 | OK | 2026-09-29 |
| P-G1 | OK | 2026-09-29 |

Para cada falla, anota el paso, lo que se vio, el mensaje exacto y, si hay, el error de la consola del navegador (F12).

## 5. Limpieza

1. Anula los lotes de prueba que no estén promovidos (P-C1 ya queda anulado en P-E2).
2. Si hiciste P-D2, confirma que se borró el lote `prueba-L5`.
3. Si le quitaste permisos a `TEST-ROLE` o a otro rol, restáuralos.
4. Opcional: los lotes activos duplicados anteriores a la regla (universalidad 111, corte 2026-09-30; universalidad 100, corte 2026-04-30) se pueden anular desde la lista para dejar uno por corte.
5. Opcional: renombra las universalidades 5 y 100 creadas por la migración, o déjalas inactivas.

## 6. Criterio de salida

El plan de cargue de archivos queda cerrado cuando todos los casos están en OK. Luego:

- Envíame las fallas que haya, con el caso y la observación, para corregirlas en un commit por caso.
- Siguen pendientes en `plan-entidad-reportante-universalidad.md` las fases A (configuración de la entidad reportante), B2 (crédito por universalidad y prefijo), C (AVRO y transmisión por fecha de corte), D y E.
