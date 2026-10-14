# Estado del proyecto MuricSync Frontend

## Lo que ya está completo y funcional

### Autenticación y Seguridad

- Login con JWT, guard RequireAuth, expiración de token
- Gestión de usuarios: listar, registrar, editar, reset de contraseña, cambio de contraseña
- Control de acceso por roles: ADMIN, OPERADOR, SEGURIDAD, CONSULTA
- Menú lateral con items visibles según rol

### Parámetros / Tablas de referencia (30 tablas)

- Todas funcionando: listan datos vía OData, con edición para ADMIN
- Completamente integradas al backend

### Proceso de cargue de archivos (/app/carga-archivos) — completamente integrado

- Crear lote (fecha corte, universalidad, tipo entidad)
- Subir 3 insumos: créditos (001-001), atributos (001-002), movimientos (001-003)
- Selección de plantilla de mapeo por insumo
- Validar lote → Promover → Anular
- Descargar AVRO (.avro.p7z) y transmitir a SFC
- Historial de archivos y historial de transmisiones con consulta de estado

### Plantillas de carga (/app/plantillas-carga) — completamente integrado

- CRUD completo de plantillas de mapeo de columnas
- Importar columnas desde archivo (CSV/Excel)
- Sugerencia automática de mapeo por nombre de columna
- Descarga de plantilla vacía

## Lo que está PENDIENTE (stubs/simulaciones)

1. Envío a MURIC (/app/envio-muric) — EnviaMURIC.tsx
   - La UI está lista (formulario con fecha corte, universalidad, tipo de información)
   - HandleEnviar hace un setTimeout(1500) simulado — no llama ningún endpoint real
   - Comentado: // TODO: Llamar API de envío a MURIC

2. Consultas MURIC (/app/consultas-muric) — ConsultasMURIC.tsx

   - La UI está lista (filtros por periodo, universalidad, tipo de informe; tabs de resultados)
   - handleObtener usa buildMockResultados() con datos aleatorios — no llama ningún endpoint real
   - Los tipos de informe disponibles: "Totales de Créditos enviados" y "Totales de Movimiento de cartera"

## Qué necesito del backend para completarlo

1. Para EnviaMURIC: Necesito el contrato del endpoint:
    - URL, método HTTP (POST?)
    - Payload esperado: ¿fechaCorte, codigoUniversalidad, tipoInformacion? ¿Hay más campos?
    - Respuesta: ¿qué devuelve? (filas enviadas, ID de proceso, estado?)
    - ¿Usa axiosSecurityAPIClient o axiosOdataAPIClient?

2. Para ConsultasMURIC: Necesito el contrato del endpoint:
   - URL y método
   - Parámetros de query: ¿periodoInicial, periodoFinal, codigoUniversalidad, tipoInforme?
   - Estructura de la respuesta: las columnas reales que devuelve (ahora solo muestro ID, universalidad, periodo, total valor — ¿hay
  más?)

## Cómo darme contexto del backend

La forma más directa es cualquiera de estas:

1. Pegar el contrato Swagger/OpenAPI del backend (JSON o YAML) o la URL del Swagger si está levantado
2. Mostrarme los controllers C# de los endpoints pendientes (los métodos de acción con sus DTOs)
3. Describirme los endpoints en texto: URL, método, qué recibe y qué devuelve
4. Pegar ejemplos de request/response de Postman o similar
