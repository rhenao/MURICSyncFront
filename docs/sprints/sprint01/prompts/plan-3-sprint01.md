# Plan Sprint 01 — Políticas y Parámetros de Seguridad (Frontend)

**Proyecto:** MURICSyncFront  
**Fecha:** 2026-06-08  
**Rama:** `rhenao-sprint04`

---

## Resumen Ejecutivo

El backend implementó una tabla `security_settings` en PostgreSQL con los parámetros de seguridad (contraseña, bloqueo, sign-in) que antes estaban hardcodeados en `Program.cs`. Ahora son configurables en caliente vía API REST, con efecto inmediato y sin reiniciar la aplicación.

El frontend debe presentar un formulario de configuración que permita a un administrador consultar y modificar estos parámetros, protegido con el permiso `seguridad.manage`.

### Endpoints del backend

| Método | Ruta | Permiso | Descripción |
|---|---|---|---|
| GET | `/api/security-settings` | `seguridad.manage` | Lee la configuración actual |
| PUT | `/api/security-settings` | `seguridad.manage` | Actualiza (parcial) la configuración |

### Estructura de la configuración

```json
{
  "success": true,
  "data": {
    "passwordRequireDigit": true,
    "passwordRequireLowercase": true,
    "passwordRequireUppercase": true,
    "passwordRequireNonAlphanumeric": false,
    "passwordRequiredLength": 6,
    "passwordRequiredUniqueChars": 1,
    "lockoutMaxFailedAttempts": 5,
    "lockoutDurationMinutes": 60,
    "lockoutAllowedForNewUsers": true,
    "signInRequireConfirmedEmail": false,
    "signInRequireConfirmedPhone": false,
    "updatedAt": "2026-06-07T21:57:58Z",
    "updatedBy": "admin@muric.co"
  }
}
```

### Restricciones de validación del backend

| Campo | Restricción |
|---|---|
| `passwordRequiredLength` | 4–128 |
| `passwordRequiredUniqueChars` | 0–10 |
| `lockoutMaxFailedAttempts` | 1–20 |
| `lockoutDurationMinutes` | 1–1440 |

---

## Tareas del Plan

### Tarea 1 — Modelos de configuración de seguridad

**Archivos a crear:**
- `src/features/security/models/SecuritySettings.model.ts`

---

**Prompt de ejecución:**

```
Estás trabajando en MURICSyncFront (React 19 + TypeScript + Vite).
El proyecto está en E:\newprojects\titularice\muric\muricsyncfront.

Lee estos archivos antes de empezar:
- src/features/security/models/UserInfoDto.ts  (para ver el estilo de los modelos)

## Tarea

Crea `src/features/security/models/SecuritySettings.model.ts` con las siguientes interfaces:

### `SecuritySettingsDto`

Respuesta completa del backend (incluye auditoría):

```typescript
export interface SecuritySettingsDto {
  // Contraseña
  passwordRequireDigit: boolean;
  passwordRequireLowercase: boolean;
  passwordRequireUppercase: boolean;
  passwordRequireNonAlphanumeric: boolean;
  passwordRequiredLength: number;
  passwordRequiredUniqueChars: number;

  // Bloqueo
  lockoutMaxFailedAttempts: number;
  lockoutDurationMinutes: number;
  lockoutAllowedForNewUsers: boolean;

  // Inicio de sesión
  signInRequireConfirmedEmail: boolean;
  signInRequireConfirmedPhone: boolean;

  // Auditoría
  updatedAt: string;    // ISO 8601 UTC
  updatedBy?: string;
}
```

### `UpdateSecuritySettingsDto`

Payload para la actualización (todos los campos son opcionales — patch parcial):

```typescript
export interface UpdateSecuritySettingsDto {
  passwordRequireDigit?: boolean;
  passwordRequireLowercase?: boolean;
  passwordRequireUppercase?: boolean;
  passwordRequireNonAlphanumeric?: boolean;
  passwordRequiredLength?: number;    // 4–128
  passwordRequiredUniqueChars?: number; // 0–10
  lockoutMaxFailedAttempts?: number;  // 1–20
  lockoutDurationMinutes?: number;    // 1–1440
  lockoutAllowedForNewUsers?: boolean;
  signInRequireConfirmedEmail?: boolean;
  signInRequireConfirmedPhone?: boolean;
}
```

## Formato de entrega

Crea el archivo `E:\newprojects\titularice\muric\muricsyncfront\docs\prompts\sprint01\result-plan3-tarea1.md`
con un resumen de los cambios realizados.
```

---

### Tarea 2 — Servicio de configuración de seguridad

**Archivos a crear:**
- `src/features/security/services/SecuritySettingsService.ts`

---

**Prompt de ejecución:**

```
Estás trabajando en MURICSyncFront (React 19 + TypeScript + Vite).
El proyecto está en E:\newprojects\titularice\muric\muricsyncfront.

Lee estos archivos antes de empezar:
- src/api/axiosSecurityAPIClient.ts
- src/features/security/models/SecuritySettings.model.ts
- src/features/security/services/AuthService.ts  (para ver el estilo)

## Contexto de los endpoints

BASE: VITE_API_URL_SECURITY (axiosSecurityAPIClient)

GET /api/security-settings         — retorna { success: true, data: SecuritySettingsDto }
PUT /api/security-settings         — body: UpdateSecuritySettingsDto, retorna { success: true, data: SecuritySettingsDto }

## Tarea

Crea `src/features/security/services/SecuritySettingsService.ts` como un objeto con dos funciones:

### `getSettings(): Promise<SecuritySettingsDto>`

Llama `GET /api/security-settings`.
Extrae y retorna `response.data.data`.

### `updateSettings(dto: UpdateSecuritySettingsDto): Promise<SecuritySettingsDto>`

Llama `PUT /api/security-settings` con `dto` como body.
Extrae y retorna `response.data.data`.

Maneja errores re-throwing el error original para que el componente lo capture.

## Formato de entrega

Crea el archivo `E:\newprojects\titularice\muric\muricsyncfront\docs\prompts\sprint01\result-plan3-tarea2.md`
con un resumen de los cambios realizados.
```

---

### Tarea 3 — Componente FormConfigSeguridad

**Archivos a crear:**
- `src/features/security/components/FormConfigSeguridad.tsx`

---

**Prompt de ejecución:**

```
Estás trabajando en MURICSyncFront (React 19 + TypeScript + Vite, MUI v6).
El proyecto está en E:\newprojects\titularice\muric\muricsyncfront.

Lee estos archivos antes de empezar:
- src/features/security/components/ListUsers.tsx           (para ver el estilo MUI)
- src/features/security/services/SecuritySettingsService.ts
- src/features/security/models/SecuritySettings.model.ts
- src/features/auth/hooks/usePermission.ts
- src/features/auth/hooks/useAuth.ts

## Tarea

Crea `src/features/security/components/FormConfigSeguridad.tsx`.

### Estructura visual

La pantalla tiene un título ("Parámetros de Seguridad") y tres secciones
organizadas como MUI `Paper` o `Card` con un `Typography` de subtítulo cada una:

---

**Sección 1: Políticas de Contraseña**

| Control | Campo | Descripción |
|---|---|---|
| Switch | Requiere dígito | `passwordRequireDigit` |
| Switch | Requiere minúscula | `passwordRequireLowercase` |
| Switch | Requiere mayúscula | `passwordRequireUppercase` |
| Switch | Requiere carácter especial | `passwordRequireNonAlphanumeric` |
| TextField (number) | Longitud mínima | `passwordRequiredLength`, rango 4–128 |
| TextField (number) | Caracteres únicos mínimos | `passwordRequiredUniqueChars`, rango 0–10 |

---

**Sección 2: Bloqueo de Cuenta**

| Control | Campo | Descripción |
|---|---|---|
| TextField (number) | Intentos fallidos máximos | `lockoutMaxFailedAttempts`, rango 1–20 |
| TextField (number) | Duración del bloqueo (minutos) | `lockoutDurationMinutes`, rango 1–1440 |
| Switch | Aplicar bloqueo a nuevos usuarios | `lockoutAllowedForNewUsers` |

---

**Sección 3: Inicio de Sesión**

| Control | Campo | Descripción |
|---|---|---|
| Switch | Requiere email confirmado | `signInRequireConfirmedEmail` |
| Switch | Requiere teléfono confirmado | `signInRequireConfirmedPhone` |

---

**Pie del formulario**

- Texto de auditoría: "Última modificación: {updatedAt formateado} por {updatedBy}"
  (si `updatedBy` es null, omitir "por ...")
- Botón **Guardar cambios** (alineado a la derecha)
- Indicador de carga mientras guarda (`saving` state)

### Comportamiento

Al montar el componente:
1. Llama `SecuritySettingsService.getSettings()` para cargar los valores actuales.
2. Muestra un skeleton/spinner mientras carga (`loading` state).
3. Inicializa el estado del formulario con los valores cargados.

Al hacer click en **Guardar cambios**:
1. Construye un `UpdateSecuritySettingsDto` solo con los campos que cambiaron
   respecto al estado inicial (no enviar campos que no se modificaron).
2. Llama `SecuritySettingsService.updateSettings(dto)`.
3. Al éxito: muestra un `Snackbar` verde "Configuración guardada correctamente".
4. Al error: muestra un `Snackbar` rojo con el mensaje del error.
5. Actualiza `updatedAt` y `updatedBy` con la respuesta del backend.

### Control de acceso

Solo usuarios con permiso `seguridad.manage` pueden ver esta pantalla.
Si el usuario no tiene el permiso, redirige a `/app` (usa `usePermission`).

## Formato de entrega

Crea el archivo `E:\newprojects\titularice\muric\muricsyncfront\docs\prompts\sprint01\result-plan3-tarea3.md`
con un resumen de los cambios realizados.
```

---

### Tarea 4 — Registrar ruta y actualizar Menu.tsx

**Archivos a modificar:**
- `src/AppRoutes.tsx`
- `src/components/Menu.tsx`

---

**Prompt de ejecución:**

```
Estás trabajando en MURICSyncFront (React 19 + TypeScript + Vite).
El proyecto está en E:\newprojects\titularice\muric\muricsyncfront.

Lee estos archivos antes de empezar:
- src/AppRoutes.tsx
- src/components/Menu.tsx

## Tarea

### 1. Modificar `src/AppRoutes.tsx`

Agrega la nueva ruta protegida dentro del bloque `/app/*`:

```tsx
<Route path="config-seguridad" element={<FormConfigSeguridad />} />
```

Importa el componente desde `src/features/security/components/FormConfigSeguridad`.

### 2. Modificar `src/components/Menu.tsx`

Agrega el ítem **Parámetros de Seguridad** → `/app/config-seguridad` en la sección
de administración/seguridad del menú.

Visibilidad: solo usuarios con permiso `seguridad.manage`.
Sigue el mismo patrón de visibilidad condicional que ya usa `Menu.tsx`.
Ícono sugerido: `SecurityOutlined` o `TuneOutlined` de MUI icons.

## Formato de entrega

Crea el archivo `E:\newprojects\titularice\muric\muricsyncfront\docs\prompts\sprint01\result-plan3-tarea4.md`
con un resumen de los cambios realizados.
```

---

## Orden de Ejecución

```
Tarea 1 (Modelos) → Tarea 2 (Servicio) → Tarea 3 (Componente) → Tarea 4 (Ruta + Menú)
```

---

## Checklist de Verificación Final

- [ ] `npm run build` sin errores de TypeScript
- [ ] Modelos `SecuritySettingsDto` y `UpdateSecuritySettingsDto` creados
- [ ] `SecuritySettingsService.getSettings()` retorna los valores actuales del backend
- [ ] `SecuritySettingsService.updateSettings()` envía solo los campos modificados
- [ ] Pantalla `/app/config-seguridad` carga el formulario con los valores reales
- [ ] Todos los switches y campos numéricos reflejan el estado actual de la DB
- [ ] Cambiar `passwordRequiredLength` y guardar se refleja en el backend
- [ ] El snackbar de éxito aparece tras guardar
- [ ] El snackbar de error aparece si el backend rechaza los datos
- [ ] El texto de auditoría (`updatedAt`, `updatedBy`) se actualiza tras guardar
- [ ] La pantalla solo es accesible para usuarios con permiso `seguridad.manage`
- [ ] El ítem de menú "Parámetros de Seguridad" aparece solo con el permiso correcto
- [ ] Un usuario sin el permiso es redirigido a `/app` al intentar acceder
