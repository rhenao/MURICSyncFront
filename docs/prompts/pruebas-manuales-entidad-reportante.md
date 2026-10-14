# Pruebas manuales: entidad reportante, universalidad y envío por fecha de corte

Fecha: 2026-09-29 · Rama: `rhenao-sprint04` (front) y `rhenao_sprint04` (back)
Plan que cierra: `docs/prompts/plan-entidad-reportante-universalidad.md` (fases B1, A, B2, C, D y E). ADR 0008 del backend.

## 1. Objetivo

Estas pruebas se hacen en el navegador para cerrar el plan. El backend ya se probó contra la API local y el mock de la SFC: configuración de la entidad, prefijo y colisiones, validación, AVRO y transmisión por corte. Falta comprobar la **interfaz** de punta a punta.

## 2. Preparación

| # | Paso | Cómo |
|---|---|---|
| 1 | Migraciones | Ya aplicadas en local: `CreditoPorUniversalidadYPrefijo` y `TransmisionPorFechaCorte`. Para comprobarlo: `dotnet ef migrations list` en MURICSyncBack no debe mostrar ninguna `(Pending)`. |
| 2 | Código de la entidad | Ya está en tus user-secrets: `EntidadReportante:CodigoEntidad = 3` (valor tentativo de SIMEV). Para verlo: `dotnet user-secrets list` en MURICSyncBack. |
| 3 | Backend **reiniciado** | En MURICSyncBack: detener el proceso anterior y `dotnet run`. |
| 4 | Mock de la SFC | En `MURIC/mock-sfc-api`: `npm start` (puerto 3001). Sin él, *Transmitir* falla. |
| 5 | Front | En MuricSyncFront: `npm run dev`. |
| 6 | Archivos | `docs/prompts/pruebas-entidad-reportante/`: `creditos_corte.csv` (001-001, créditos PRB-301 y PRB-302 con `identificacion_negocio_vehiculo_universalidad` válido) y `movimientos_corte.csv` (001-003). Se cargan **sin plantilla**. |

Usuarios: los mismos de `pruebas-manuales-cargue-archivos.md` §2 (U-ADMIN, U-CONSULTA).

**Datos locales que conviene conocer**

- La universalidad **112** tiene el prefijo `U112-` y ya tiene transmisiones de prueba (#2 del corte 2026-11-30 y #3 del corte 2027-02-28), así que su prefijo está bloqueado.
- La **111** y la **113** no tienen prefijo.
- El lote **#34** (113, corte 2026-12-31) está `Validado` con 3 errores de validación.
- El corte **2027-02-28** ya lo usé para verificar el flujo (lotes #35 y #36 promovidos, #37 anulado). **Estas pruebas usan el corte 2027-01-31.**
- Los archivos de prueba anteriores (`todos_combinado.csv`, `creditos_moneda_vacia.csv`…) no traen `identificacion_negocio_vehiculo_universalidad`: un lote cargado con ellos ya no se puede promover.

**Consultar la base**

```bash
docker exec -it dev-postgres psql -U admin -d muricsyncdb
```

## 3. Casos de prueba

Salvo que se indique otro usuario, todos se hacen con **U-ADMIN**.

### A. Entidad reportante (Fase A)

**P-A1 · La API no arranca sin el código**
1. En MURICSyncBack: `dotnet user-secrets remove "EntidadReportante:CodigoEntidad"` y `dotnet run`.
2. Restaura: `dotnet user-secrets set "EntidadReportante:CodigoEntidad" "3"` y `dotnet run`.

Esperado:
- Paso 1: la API se detiene con *"EntidadReportante:CodigoEntidad debe estar entre 1 y 999. Configure el código de Titularice…"*.
- Paso 2: arranca normalmente.

**P-A2 · Chip de la entidad reportante**
1. Abre *Cargue de archivos* y *Envío a MURIC*.

Esperado:
- Las dos muestran el chip **"Entidad reportante: T600 · C3"**; el tooltip trae un nombre de archivo de ejemplo `T600_C3_muric_<DDMMAAAA>.avro.p7z`.

### B. Prefijo de crédito (Fase B2)

**P-B1 · Formato del prefijo**
1. *Tablas básicas → Universalidades*: la tabla muestra la columna **Prefijo de crédito** (`U112-` en la 112, "—" en las demás).
2. Edita la 111 con el prefijo `U 111` (con espacio) y guarda.
3. Cancela sin guardar.

Esperado:
- Paso 2: el formulario muestra *"El prefijo de crédito solo admite letras, números, "-" y "_" (máximo 20 caracteres)."* y no se cierra.

**P-B2 · Prefijo bloqueado tras transmitir**
1. Edita la 112: cambia `U112-` por `X112-` y guarda.

Esperado:
- *"No se puede cambiar el prefijo de crédito de la universalidad 112: ya tiene transmisiones a la SFC…"*. El prefijo sigue en `U112-`.

### C. Validación del identificador de universalidad (Fase D)

**P-C1 · Panel de errores**
1. En *Lotes de carga*, chip **Todos**, abre el lote **#34**.

Esperado:
- Aparece **Errores de validación** con 3 filas (filas 2, 3 y 4 del archivo): valor vacío, 14 caracteres y prefijo `600001`, cada una con su mensaje y la regla `001-001-ID-VEHICULO-UNIV`.
- **Promover a MURIC** está deshabilitado; el tooltip dice *"El lote tiene 3 error(es) de validación."*.
- **Exportar CSV** descarga `errores-lote-34.csv` con las 3 filas.

**P-C2 · Corregir y validar de nuevo**
1. En el lote #34, fila 001-001, sube `creditos_corte.csv` (sin plantilla). El lote vuelve a `Parseado`.
2. **Validar lote**.

Esperado:
- Al subir desaparece el panel de errores (se limpian los del insumo).
- Al validar: mensaje *"Validación sin errores. El lote se puede promover."*. **No lo promuevas** (los créditos PRB-301/302 ya existen en otra universalidad y lo verás en P-D2).
- Después, **anula** el lote #34.

### D. Corte completo y envío por fecha de corte (Fase C)

Corte de todas las pruebas de este bloque: **2027-01-31**.

**P-D1 · Lote de la 111**
1. *Lotes de carga* → **Nuevo lote**: universalidad 111, corte 2027-01-31.
2. Sube `creditos_corte.csv` en 001-001 y `movimientos_corte.csv` en 001-003 (sin plantilla).
3. **Validar lote** → **Promover a MURIC** → **Promover**.

Esperado:
- Validación sin errores; el lote queda `Promovido`.
- Aparece el aviso *"Lote promovido. El AVRO se genera y se transmite por fecha de corte (2027-01-31)…"* con el botón **Ir a Envío a MURIC**.

**P-D2 · Colisión de créditos (113)**
1. **Nuevo lote**: universalidad 113, corte 2027-01-31. Sube los mismos dos archivos, valida y promueve.

Esperado:
- La promoción falla: *"2 crédito(s) del lote ya existen en otra universalidad: fila 1: 'PRB-301' ya está en la universalidad 111; fila 2: 'PRB-302'…. Configure un prefijo de crédito para la universalidad 113…"*. El lote sigue `Validado`.

**P-D3 · Corte con un lote pendiente**
1. En el lote de la 111, **Ir a Envío a MURIC**.

Esperado:
- Se abre *Envío a MURIC* con el corte **2027-01-31** ya consultado (la URL trae `?fechaCorte=2027-01-31`).
- La tabla muestra los dos lotes (111 `Promovido`, 113 `Validado`) y el aviso *"El corte no se puede transmitir: 1 lote(s) sin promover…"*.
- **Descargar AVRO** y **Transmitir a SFC** están deshabilitados.
- El número del lote abre ese lote en *Cargue de archivos*.

**P-D4 · Excluir la 113 anulando su lote**
1. Abre el lote de la 113 y **Anular lote** → **Anular**.
2. Vuelve a *Envío a MURIC* y **Consultar** el corte 2027-01-31.

Esperado:
- El lote de la 113 aparece atenuado como `Anulado`.
- Aviso *"Listo para transmitir: 1 lote(s) promovido(s) de 1 universalidad(es)."*.

**P-D5 · Segunda universalidad con prefijo (112)**
1. **Nuevo lote**: universalidad 112, corte 2027-01-31. Sube los mismos dos archivos, valida y promueve.
2. En la base:

   ```sql
   SELECT "UniversalidadCodigo", "IdentificacionCreditoEntidad"
   FROM public."Creditos" WHERE "IdentificacionCreditoEntidad" LIKE '%PRB-30%' ORDER BY 1, 2;
   ```

Esperado:
- La promoción funciona (no hay colisión: los ids llevan el prefijo).
- La consulta muestra `111 | PRB-301`, `111 | PRB-302`, `112 | U112-PRB-301` y `112 | U112-PRB-302`.

**P-D6 · Descargar y transmitir el corte**
1. *Envío a MURIC*, corte 2027-01-31, **Consultar**.
2. **Descargar AVRO**.
3. **Transmitir a SFC** → **Transmitir**.
4. En la tabla de transmisiones, **Consultar estado** (ícono ↻).

Esperado:
- Paso 1: *"Listo para transmitir: 2 lote(s) promovido(s) de 2 universalidad(es)."*.
- Paso 2: se descarga **`T600_C3_muric_31012027.avro.p7z`** (un solo archivo para las dos universalidades).
- Paso 3: el diálogo dice *"Se envía a la SFC un solo archivo con 2 lote(s) de 2 universalidad(es)."*; luego *"Transmisión exitosa — T600_C3_muric_31012027.avro.p7z — ID SFC: …"* y la transmisión aparece en la tabla con 4 créditos y 4 movimientos.
- Paso 4: el código SFC pasa a `121` (el mock responde "en recepción").

**P-D7 · Retransmitir**
1. **Transmitir a SFC** otra vez.

Esperado:
- El diálogo agrega *"Este corte ya tiene 1 transmisión(es); se enviará de nuevo."*. Cancela.

### E. Permisos

**P-E1 · Solo consulta (U-CONSULTA)**
1. Revisa el menú.
2. Abre el lote de la 111 del corte 2027-01-31.

Esperado:
- *Envío a MURIC* no aparece en el menú (exige `cargas.write`).
- El lote muestra el aviso de lote promovido **sin** el botón *Ir a Envío a MURIC*.
- La sesión no se cierra.

## 4. Registro de resultados

| Caso | Resultado (OK / Falla) | Observaciones |
|---|---|---|
| P-A1 | | |
| P-A2 | | |
| P-B1 | | |
| P-B2 | | |
| P-C1 | | |
| P-C2 | | |
| P-D1 | | |
| P-D2 | | |
| P-D3 | | |
| P-D4 | | |
| P-D5 | | |
| P-D6 | | |
| P-D7 | | |
| P-E1 | | |

Para cada falla, anota el paso, lo que se vio, el mensaje exacto y, si hay, el error de la consola del navegador (F12).

## 5. Limpieza

1. Confirma que `EntidadReportante:CodigoEntidad` quedó en user-secrets (P-A1).
2. Detén el mock de la SFC si no lo vas a usar.
3. Opcional: las transmisiones de prueba bloquean el prefijo de la 112. Si quieres cambiarlo, bórralas antes:

   ```sql
   DELETE FROM public."TransmisionesSfc" WHERE "IdTransmisionSfc" = '50000001';
   ```

## 6. Criterio de salida

El plan de entidad reportante queda cerrado cuando todos los casos están en OK. Luego:

- Envíame las fallas que haya, con el caso y la observación, para corregirlas en un commit por caso.
- Siguen pendientes fuera de este plan:
  - Confirmar con cumplimiento el **código de Titularice ante la SFC** y el formato del nombre (`C3` o `C003`); se ajustan en configuración, sin tocar código.
  - Validar `identificacion_negocio_vehiculo_universalidad` contra la universalidad del lote (tipo de vehículo y ANN), cuando el CRUD de Universalidades tenga esos campos (E7).
  - Las demás reglas regulatorias del motor de validación (Bloque 4).
