Tengo todo lo necesario. Aquí el contrato completo basado en el código real del backend:

  ---
  Aclaración de terminología

  Antes de los endpoints, un mapeo de nombres (el frontend usa términos distintos al backend):

  ┌───────────────────────────────┬───────────────┬──────────────────────────────────┐
  │           Frontend            │ Backend (API) │               Tipo               │
  ├───────────────────────────────┼───────────────┼──────────────────────────────────┤
  │ codigoUniversalidad           │ codigoEntidad │ int                              │
  ├───────────────────────────────┼───────────────┼──────────────────────────────────┤
  │ tipoInformacion               │ tipoEntidad   │ int                              │
  ├───────────────────────────────┼───────────────┼──────────────────────────────────┤
  │ periodoInicial / periodoFinal │ fechaCorte    │ DateOnly (YYYY-MM-DD) — ver nota │
  └───────────────────────────────┴───────────────┴──────────────────────────────────┘

  ▎ Nota: El filtro actual tiene una sola fechaCorte, no un rango. Si el frontend necesita periodoInicial/periodoFinal, hay que agregar
  ▎ FechaCorteDesde/FechaCorteHasta al FiltroLotesRequest — es un cambio de 5 líneas.

  Cliente HTTP a usar: axiosSecurityAPIClient (o el cliente con base URL de la API REST + el Bearer token del JWT). No es el cliente OData.

  ---
  1. EnviaMURIC — Flujo completo (multi-paso)

  EnviaMURIC no es un solo endpoint: es una secuencia de 5 llamadas. El frontend debe orquestarlas.

  Paso 1 — Crear el lote

  POST /api/cargas
  Content-Type: application/json
  Authorization: Bearer <token>

  Request body:
  {
    "fechaCorte": "2024-03-31",
    "tipoEntidad": 3,
    "codigoEntidad": 12345,
    "observaciones": "Corte marzo 2024"
  }

  Response 201 Created:
  {
    "id": 42,
    "fechaCorte": "2024-03-31",
    "tipoEntidad": 3,
    "codigoEntidad": 12345,
    "estado": "Creado",
    "fechaCreacion": "2024-05-01T14:00:00Z",
    "usuarioCreador": "operador@entidad.com",
    "fechaPromocion": null,
    "usuarioPromotor": null,
    "observaciones": "Corte marzo 2024"
  }

  id devuelto es el loteId que se usa en todos los pasos siguientes.

  ---
  Paso 2 — Subir los 3 archivos (una llamada por insumo)

  POST /api/cargas/{loteId}/archivos
  Content-Type: multipart/form-data
  Authorization: Bearer <token>

  Form fields:

  ┌─────────────┬────────┬──────────────────────────────────────────┐
  │    Campo    │  Tipo  │             Valores válidos              │
  ├─────────────┼────────┼──────────────────────────────────────────┤
  │ insumo      │ string │ "Credito" · "Atributo" · "Movimiento"    │
  ├─────────────┼────────┼──────────────────────────────────────────┤
  │ archivo     │ File   │ Excel .xlsx o .csv                       │
  ├─────────────┼────────┼──────────────────────────────────────────┤
  │ plantillaId │ long?  │ Opcional — ID de plantilla personalizada │
  └─────────────┴────────┴──────────────────────────────────────────┘

  Se llama 3 veces: una con insumo=Credito, otra con insumo=Atributo, otra con insumo=Movimiento.

  Response 200 OK:
  {
    "id": 7,
    "loteId": 42,
    "insumo": "Credito",
    "nombreArchivo": "creditos_marzo.xlsx",
    "hashArchivo": "a3f1c8...",
    "tamanoBytes": 204800,
    "filasParseadas": 1523,
    "resultado": "Exitoso",
    "mensajeResultado": null,
    "fechaCarga": "2024-05-01T14:05:00Z",
    "usuarioCarga": "operador@entidad.com"
  }

  Errores posibles:
  - 400 — archivo vacío o insumo inválido
  - 404 — lote no encontrado
  - 409 — lote no está en estado Creado (ya tiene ese insumo o fue anulado)
  - 422 — columnas obligatorias faltantes:
  {
    "mensaje": "Faltan columnas requeridas",
    "columnasFaltantes": ["numero_identificacion", "fecha_desembolso"]
  }

  ---
  Paso 3 — Validar

  POST /api/cargas/{loteId}/validar
  Authorization: Bearer <token>

  Sin body.

  Response 200 OK:
  {
    "mensaje": "Validación ejecutada (stub)...",
    "loteId": 42,
    "estado": "Validado"
  }

  ▎ Importante para el frontend: Después de validar, consultar GET /api/cargas/{loteId}/errores para saber si hay errores bloqueantes antes de
  ▎ continuar.

  ---
  Paso 4 — Promover (staging → cartera transaccional)

  POST /api/cargas/{loteId}/promover
  Authorization: Bearer <token>

  Sin body.

  Response 200 OK:
  {
    "loteId": 42,
    "deudoresUpserted": 312,
    "creditosUpserted": 1523,
    "atributosInsertados": 4890,
    "movimientosUpserted": 1523,
    "estado": "Promovido",
    "fechaPromocion": "2024-05-01T14:10:00Z",
    "usuarioPromotor": "operador@entidad.com"
  }

  ---
  Paso 5 — Transmitir a la SFC

  POST /api/cargas/{loteId}/transmitir
  Authorization: Bearer <token>

  Sin body. Internamente genera el AVRO, lo firma y lo envía a la SFC.

  Response 200 OK:
  {
    "transmisionId": 1,
    "idTransmisionSfc": "TX-20240501-0042",
    "estado": "Enviado",
    "nombreArchivo": "T3_C12345_muric_31032024.avro.p7z",
    "hashSha256": "b7e3a1...",
    "totalCreditos": 1523,
    "totalDemograficos": 4890,
    "totalMovimientos": 1523,
    "fechaTransmision": "2024-05-01T14:12:00Z"
  }

  También existe GET /api/cargas/{loteId}/avro si el frontend quiere descargar el archivo AVRO directamente (devuelve application/octet-stream + header
  X-SHA256).

  ---
  2. ConsultasMURIC — Listado de lotes enviados

  Listar lotes (con filtros)

  GET /api/cargas?estado=Promovido&fechaCorte=2024-03-31&tipoEntidad=3&codigoEntidad=12345
  Authorization: Bearer <token>

  Query params (todos opcionales):

  ┌───────────────┬──────────┬─────────────────────────────────────────┐
  │     Param     │   Tipo   │               Descripción               │
  ├───────────────┼──────────┼─────────────────────────────────────────┤
  │ estado        │ string   │ Creado · Validado · Promovido · Anulado │
  ├───────────────┼──────────┼─────────────────────────────────────────┤
  │ fechaCorte    │ DateOnly │ YYYY-MM-DD                              │
  ├───────────────┼──────────┼─────────────────────────────────────────┤
  │ tipoEntidad   │ int      │ Tipo de entidad                         │
  ├───────────────┼──────────┼─────────────────────────────────────────┤
  │ codigoEntidad │ int      │ Código de la universalidad/entidad      │
  └───────────────┴──────────┴─────────────────────────────────────────┘

  ▎ Gap actual: no hay rango de fechas (periodoInicial/periodoFinal). Si el frontend lo necesita, hay que modificar FiltroLotesRequest.

  Response 200 OK — array de lotes:
  [
    {
      "id": 42,
      "fechaCorte": "2024-03-31",
      "tipoEntidad": 3,
      "codigoEntidad": 12345,
      "estado": "Promovido",
      "fechaCreacion": "2024-05-01T14:00:00Z",
      "usuarioCreador": "operador@entidad.com",
      "fechaPromocion": "2024-05-01T14:10:00Z",
      "usuarioPromotor": "operador@entidad.com",
      "observaciones": "Corte marzo 2024"
    }
  ]

  ▎ Gap: no incluye totales monetarios. Si la pantalla necesita "total valor", hay que agregarlo a LoteResponse — actualmente los conteos de registros
  ▎ solo están en LoteDetalleResponse.

  ---
  Detalle de un lote (con conteos)

  GET /api/cargas/{loteId}
  Authorization: Bearer <token>

  Response 200 OK:
  {
    "id": 42,
    "fechaCorte": "2024-03-31",
    "tipoEntidad": 3,
    "codigoEntidad": 12345,
    "estado": "Promovido",
    "fechaCreacion": "2024-05-01T14:00:00Z",
    "usuarioCreador": "operador@entidad.com",
    "fechaPromocion": "2024-05-01T14:10:00Z",
    "usuarioPromotor": "operador@entidad.com",
    "observaciones": "Corte marzo 2024",
    "conteos": {
      "creditos": 1523,
      "atributos": 4890,
      "movimientos": 1523
    },
    "resumenErrores": {
      "total": 2,
      "errores": 1,
      "advertencias": 1,
      "porInsumo": { "Credito": 1, "Movimiento": 1 }
    }
  }

  ---
  Transmisiones de un lote

  GET /api/cargas/{loteId}/transmisiones
  Authorization: Bearer <token>

  Response 200 OK:
  [
    {
      "id": 1,
      "loteId": 42,
      "nombreArchivo": "T3_C12345_muric_31032024.avro.p7z",
      "hashSha256": "b7e3a1...",
      "idTransmisionSfc": "TX-20240501-0042",
      "estado": "Aprobado",
      "codigoEstadoSfc": "99",
      "mensajeEstado": null,
      "fechaTransmision": "2024-05-01T14:12:00Z",
      "usuarioTransmisor": "operador@entidad.com",
      "fechaUltimaConsulta": "2024-05-01T15:00:00Z",
      "totalCreditos": 1523,
      "totalDemograficos": 4890,
      "totalMovimientos": 1523
    }
  ]

  Los estados posibles de una transmisión son: Enviado · Aprobado · Rechazado · Error.

  ---
  Gaps detectados que el frontend debe conocer

  ┌─────┬────────────────────────────────────┬──────────────────────────────────────┬──────────────────────────────────────────────────────────────┐
  │  #  │                Gap                 │               Impacto                │                 Solución backend (sencilla)                  │
  ├─────┼────────────────────────────────────┼──────────────────────────────────────┼──────────────────────────────────────────────────────────────┤
  │ 1   │ Filtro de lotes no tiene rango de  │ ConsultasMURIC no puede filtrar por  │ Agregar FechaCorteDesde/FechaCorteHasta a FiltroLotesRequest │
  │     │ fechas                             │ período                              │                                                              │
  ├─────┼────────────────────────────────────┼──────────────────────────────────────┼──────────────────────────────────────────────────────────────┤
  │ 2   │ "Total valor" no existe en la      │ Columna de la tabla en               │ Definir qué significa: ¿saldo capital total? Requiere query  │
  │     │ respuesta                          │ ConsultasMURIC vacía                 │ adicional                                                    │
  ├─────┼────────────────────────────────────┼──────────────────────────────────────┼──────────────────────────────────────────────────────────────┤
  │ 3   │ Validación es un stub              │ Paso 3 siempre pasa aunque haya      │ Bloque 4 pendiente de implementar                            │
  │     │                                    │ errores                              │                                                              │
  ├─────┼────────────────────────────────────┼──────────────────────────────────────┼──────────────────────────────────────────────────────────────┤
  │ 4   │ Migración de TransmisionSfc        │ Toda la transmisión falla en BD      │ dotnet ef migrations add AddTransmisionSfc                   │
  │     │ faltante                           │                                      │                                                              │
  └─────┴────────────────────────────────────┴──────────────────────────────────────┴──────────────────────────────────────────────────────────────┘
