# Prompt para Claude Code — Plan de cambios: Auditoría de aplicación (Frontend)

## Contexto del proyecto

Estoy desarrollando **MuricSync**, un sistema de gestión integral del ciclo
de reporte regulatorio MURIC para la Superintendencia Financiera de Colombia
(SFC). El sistema gestiona la captura, validación, construcción y transmisión
de los insumos MURIC-001-001, MURIC-001-002 y MURIC-001-003.

**Stack técnico del frontend:**

- React 19 con TypeScript
- Vite como bundler
- CSS 4 para estilos
- Autenticación: JWT con refresh tokens (gestionado desde el frontend)

---

## Requerimiento a implementar

Implementar los cambios necesarios en el frontend de MuricSync para:

1. **Contribuir datos de contexto** al registro de auditoría del backend
   en cada request HTTP
2. **Exponer una pantalla de consulta** de logs de auditoría para usuarios
   con rol autorizado

---

## Lo que necesito

Genera el **plan de cambios detallado** para implementar la participación
del frontend en la auditoría de aplicación. El plan debe incluir:

1. Todos los archivos nuevos a crear, con su ruta relativa dentro del proyecto
2. Todos los archivos existentes que deben modificarse y qué cambios
   específicos requieren
3. El orden de implementación recomendado
4. Las interfaces TypeScript necesarias para tipar correctamente
   la comunicación con el backend

---

## Diseño de referencia aprobado

### Parte 1 — Enriquecimiento de requests HTTP

Todo request que salga del frontend hacia la API debe incluir
automáticamente los siguientes headers adicionales al JWT:

```text
X-Timezone:    Intl.DateTimeFormat().resolvedOptions().timeZone
X-Screen-Size: {window.screen.width}x{window.screen.height}
```

Este comportamiento debe implementarse **una sola vez** en el cliente HTTP
central (Axios o fetch wrapper), no en cada llamada individual.

**Restricciones:**

- El frontend **nunca** debe enviar su propio timestamp como fuente de
  verdad para la auditoría. El timestamp oficial siempre lo genera
  el backend.
- El frontend **nunca** debe llamar directamente a un endpoint de escritura
  de logs. La auditoría es responsabilidad exclusiva del backend.

---

### Parte 2 — Módulo de consulta de auditoría

#### Contrato con el backend

El frontend consume el endpoint `GET /api/audit-logs` con los siguientes
filtros opcionales como query params:

```typescript
interface AuditLogFilter {
  userId?:    string;
  action?:    AuditAction;
  module?:    AuditModule;
  dateFrom?:  string;          // formato ISO 8601
  dateTo?:    string;          // formato ISO 8601
  ipAddress?: string;
  page?:      number;          // paginación base 1
  pageSize?:  number;          // máximo 100
}

type AuditAction =
  | 'LOGIN'
  | 'LOGIN_FAILED'
  | 'INSERT'
  | 'UPDATE'
  | 'DELETE';

type AuditModule =
  | 'MURIC_001_001'
  | 'MURIC_001_002'
  | 'MURIC_001_003'
  | 'TRANSMISION'
  | 'AUTH';

interface AuditLogEntry {
  id:            number;
  timestamp:     string;
  userId:        string | null;
  userName:      string | null;
  ipAddress:     string | null;
  action:        AuditAction;
  module:        AuditModule | null;
  entityType:    string | null;
  entityId:      string | null;
  httpMethod:    string | null;
  endpoint:      string | null;
  statusCode:    number | null;
  durationMs:    number | null;
  oldValues:     Record<string, unknown> | null;
  newValues:     Record<string, unknown> | null;
  correlationId: string | null;
  periodoCorte:  string | null;
}

interface AuditLogPage {
  items:      AuditLogEntry[];
  totalCount: number;
  page:       number;
  pageSize:   number;
}
```

#### Componentes a construir

**`AuditLogPage`** — página principal del módulo, protegida por rol
`AuditViewer` o `Admin`. Orquesta filtros, tabla y detalle.

**`AuditLogFilters`** — panel de filtros con los siguientes controles:

- Selector de rango de fechas (`dateFrom` / `dateTo`)
- Selector de acción (`AuditAction`)
- Selector de módulo (`AuditModule`)
- Campo de texto libre para `userId` o `userName`
- Campo de texto libre para `ipAddress`
- Botón aplicar y botón limpiar filtros

**`AuditLogTable`** — tabla paginada con las siguientes columnas visibles
por defecto:

| Columna | Campo fuente | Formato |
| --- | --- | --- |
| Fecha y hora | `timestamp` | `dd/MM/yyyy HH:mm:ss` en zona local |
| Usuario | `userName` o `userId` | texto plano |
| Acción | `action` | badge con color por tipo |
| Módulo | `module` | texto plano |
| Entidad | `entityType` + `entityId` | `Tipo #ID` |
| IP | `ipAddress` | texto plano |
| Estado HTTP | `statusCode` | badge verde/rojo |
| Duración | `durationMs` | `{n} ms` |
| Detalle | — | botón expandir fila |

La tabla debe soportar paginación server-side. No se requiere ordenamiento
por columna en esta versión.

**`AuditLogDetail`** — panel o fila expandida que muestra, para el registro
seleccionado:

- Todos los campos de `AuditLogEntry`
- `oldValues` y `newValues` renderizados como **diff visual**: campos
  eliminados en rojo, campos agregados en verde, campos modificados
  mostrando valor anterior y valor nuevo lado a lado
- `correlationId` copiable al portapapeles

#### Colores de badges por acción

| Acción | Color sugerido |
| --- | --- |
| `LOGIN` | verde |
| `LOGIN_FAILED` | rojo |
| `INSERT` | azul |
| `UPDATE` | amarillo/ámbar |
| `DELETE` | rojo |

---

## Restricciones de implementación

- La ruta del módulo de auditoría debe ser `/audit-logs` dentro del
  router de la aplicación.
- La pantalla debe ser accesible **únicamente** para usuarios con rol
  `AuditViewer` o `Admin`. Redirigir a `/forbidden` si el rol no aplica.
- El módulo es de **solo lectura**: ningún componente debe exponer
  acciones de escritura, edición o eliminación sobre los logs.
- Los campos `oldValues` y `newValues` llegan como objetos JSON desde
  el backend. El frontend los parsea y renderiza, pero **nunca los
  modifica**.
- Manejar explícitamente los estados de carga, error y lista vacía en
  la tabla.
- El panel de filtros debe reflejar su estado en los query params de la
  URL, de forma que el resultado sea compartible por enlace.

---

## Entregables esperados del plan

Para cada archivo, indica:

1. **Ruta completa** relativa a la raíz del proyecto
2. **Tipo de cambio**: Nuevo / Modificar
3. **Responsabilidad** del archivo en una línea
4. **Dependencias**: qué otros archivos debe tener listos antes

Finaliza el plan con el **orden de implementación paso a paso**.
