# MURIC – Identificación de la entidad en el nombre del archivo AVRO

## Decisión

En el nombre del archivo que se transmite a la SFC:

```text
T<tipoentidad>_C<codigoentidad>_muric_<PeriodoATransmitir>.avro.p7z
```

`<tipoentidad>` y `<codigoentidad>` corresponden a **Titularice**, la sociedad titularizadora y entidad vigilada que reporta. **No** corresponden a la universalidad ni al originador (cliente de Titularice).

- `tipoentidad` = **600** (Sociedades titularizadoras por cuenta de las universalidades conformadas por cartera de crédito).
- `codigoentidad` = código asignado por la SFC a Titularice. **Pendiente de confirmar** (ver abajo).

## Fundamento

1. **Las universalidades no tienen tipo/código de entidad propio en la SFC; la titularizadora sí.** En el registro SIMEV de la SFC, el tipo 600 aparece asociado a sociedades titularizadoras (p. ej. Titularizadora Colombiana: tipo 600, código 001). Las Reglas de diligenciamiento listan el tipo 600 como «Sociedades titularizadoras por cuenta de las universalidades».
2. **La universalidad se identifica dentro del archivo, por crédito.** El insumo MURIC-001-001 tiene el campo `identificacion_negocio_vehiculo_universalidad` con la estructura `TTTCCCTTTNNNNNNNNNNNN`:
   - `TTT` = tipo de entidad (Titularice, 600)
   - `CCC` = código de entidad (Titularice)
   - `TTT` = tipo de vehículo
   - `NNNNNNNNNNNN` = código ANN (12 caracteres) del título inscrito

   El campo es obligatorio para titularizadoras (numeral 18 de las Reglas generales).
3. **Normativa.** Las Circulares Externas 016 de 2025 y 002 de 2026 definen como sujeto obligado a la titularizadora, que reporta «por cuenta de» las universalidades.
4. **Consistencia técnica.**
   - El esquema AVRO (`muricV2_0_8.json`) define `tipo_entidad` y `codigo_entidad` como `int` en la raíz del registro, uno por archivo.
   - Las credenciales del API se obtienen por autogestión de usuarios **de cada entidad**.
   - La respuesta de transmisión devuelve `tipo_entidad` y `codigo_entidad`.

   Nombre de archivo, cabecera AVRO y usuario del API deben coincidir con la misma entidad: Titularice.

## Implicaciones para MuricSync

### Backend (.NET)

- Se genera **un único archivo por fecha de corte para Titularice**, con la cartera de **todas** sus universalidades. No se genera un archivo por universalidad.
- `tipo_entidad` y `codigo_entidad` de la cabecera AVRO y del nombre de archivo salen de la **configuración de la entidad reportante** (Titularice), no de los datos de cada universalidad.
- Cada registro de `creditos` debe llevar `identificacion_negocio_vehiculo_universalidad` con el formato `TTTCCCTTTNNNNNNNNNNNN`. Validar:
  - longitud de 21 caracteres;
  - que los primeros 6 caracteres coincidan con el tipo/código de Titularice.
- El modelo de datos debe tener la universalidad como entidad propia, con:
  - tipo de vehículo;
  - código ANN (12 caracteres);
  - relación con el originador.

  Los créditos se asocian a una universalidad.
- Un solo juego de credenciales del API: el de Titularice.
- Validar la coherencia entre el nombre del archivo y la cabecera AVRO antes de firmar y transmitir.

### Frontend (React)

- El tipo/código de entidad se muestra como dato de configuración global de la entidad reportante, no como selección por universalidad.
- La generación y la transmisión se lanzan **por fecha de corte**. Las pantallas de detalle, validación y errores pueden filtrar o agrupar por universalidad.
- Mantenimiento (CRUD) de universalidades: tipo de vehículo, código ANN y originador, con vista previa del identificador compuesto `TTTCCCTTTNNNNNNNNNNNN`.

## Pendientes por confirmar

- [ ] **Código de entidad de Titularice ante la SFC.** En SIMEV aparece una titularizadora tipo 600, código 003 (NIT 901598194), pero no está confirmado que sea Titularice. Verificar en SIMEV o con el área de cumplimiento. **No hardcodear.** Dejarlo en configuración.
- [ ] **Formato del código en el nombre** (`C3` vs `C003`). Los ejemplos oficiales no usan ceros a la izquierda (`T1_C57`, `T22_C1`) y en el AVRO el campo es `int`. Es una inferencia; confirmar con la SFC. Implementar el formateo de forma configurable.
- [ ] **Fecha en el nombre.** Uno de los ejemplos oficiales (`T22_C1_muric_01052025`) usa el día 01, lo que no cuadra con que el corte sea el último día del mes. Asumir por ahora `DDMMAAAA` = fecha de corte (último día del mes) y confirmarlo con la SFC.

## Ejemplos oficiales disponibles

No se encontró ningún ejemplo publicado de nombre de archivo de una titularizadora (tipo 600). Los únicos ejemplos del Documento Técnico V1.1 son genéricos:

- `T1_C57_muric_30042025.avro.p7z` (tipo 1, banco)
- `T22_C1_muric_01052025.avro.p7z` (tipo 22, IOE)
- Multipart: `T1_C57_muric_30042025.avro.p7z.part1`, `.part2`, …, `.partN`
