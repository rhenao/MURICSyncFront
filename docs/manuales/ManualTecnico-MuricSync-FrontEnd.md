# Manual técnico — MuricSync FrontEnd

**Proyecto:** MuricSync FrontEnd (Vite + React + TypeScript)  
**Fecha:** 2026-03-16  
**Versión de la app:** `VITE_APP_VERSION` (por defecto `1.0.0`)  

---

## 1) Propósito y alcance

Este documento describe la arquitectura técnica, configuración, estructura del código, y flujos principales del frontend **MuricSync FrontEnd**.

Incluye:

- Cómo instalar, ejecutar y construir el proyecto.
- Variables de entorno requeridas.
- Ruteo, layout y tema (MUI).
- Autenticación (token + expiración) y control de acceso.
- Consumo de APIs (OData y Seguridad) y hooks de datos.
- Descripción de módulos funcionales (Parametrización, Seguridad, Upload).

No incluye guía funcional de usuario final; se centra en el mantenimiento y evolución del código.

---

## 2) Stack tecnológico

- **Runtime:** Node.js (recomendado LTS)
- **Bundler:** Vite
- **Framework UI:** React
- **Lenguaje:** TypeScript (modo `strict`)
- **UI kit:** MUI (Material UI) + Emotion
- **Navegación:** `react-router-dom`
- **HTTP:** Axios
- **Tablas:** `material-react-table` + `@mui/x-data-grid` (instalado)
- **Archivos:** `xlsx` (lectura de Excel)
- **Validación:** `yup` (dependencia instalada; uso actual depende de cada feature)
- **Calidad:** ESLint

Scripts principales (ver `package.json`):
- `npm run dev` (desarrollo)
- `npm run build` (TypeScript build + Vite build)
- `npm run preview` (servidor local del build)
- `npm run lint` (lint)

---

## 3) Instalación y ejecución

### 3.1 Instalación

1. Instalar dependencias:
   - `npm install`

### 3.2 Desarrollo (local)

1. Ejecutar servidor de desarrollo:
   - `npm run dev`

2. Abrir la URL que indica Vite (por defecto suele ser `http://localhost:5173`).

**Nota importante (sobre Python):** este proyecto es 100% **frontend en React**. No requiere Python para ejecutarse, construir o desplegarse. El archivo Word (`.docx`) se generó una vez como artefacto de documentación; si no necesitas regenerarlo, puedes ignorar cualquier script/herramienta externa usada para convertir Markdown → Word.

### 3.3 Build

1. Generar build de producción:
   - `npm run build`

2. Artefacto de salida:
   - Carpeta `dist/`

### 3.4 Previsualización del build

- `npm run preview`

---

## 4) Configuración y variables de entorno

El proyecto usa variables `VITE_*` (requeridas por Vite). Se definen en:
- `.env` (local)
- `.env.production` (producción)

Variables identificadas en el código:

- `VITE_API_URL`
  - Base URL para consumo de **OData**.
  - Usada por: `src/api/axiosOdataAPIClient.ts`.
  - Valor por defecto (repo): `https://localhost:7167/odata/v1`

- `VITE_API_URL_SECURITY`
  - Base URL para consumo de **API de seguridad** (login, usuarios, etc.).
  - Usada por: `src/api/axiosSecurityAPIClient.ts` y `AuthService`.
  - Valor por defecto (repo): `https://localhost:7167/api`

- `VITE_APP_VERSION`
  - Versión mostrada en el menú lateral.
  - Usada por: `src/components/Menu.tsx`.
  - Valor por defecto (repo): `1.0.0`

Notas:
- No se observan otras variables `VITE_*` referenciadas.
- Mantener URLs coherentes con el backend esperado (OData vs Seguridad).

---

## 5) Estructura del proyecto

Estructura principal:

- `src/main.tsx`
  - Punto de entrada React. Monta `App`.

- `src/App.tsx`
  - Proveedores globales: `ThemeProvider` (MUI), `CssBaseline`, `AuthProvider` y `BrowserRouter`.

- `src/AppRoutes.tsx`
  - Definición de rutas.

- `src/theme.ts`
  - Tema global MUI (paleta, tipografía, overrides).

- `src/components/`
  - Layout (TopBar + Drawer + Outlet), menú lateral, avatar/usuario.

- `src/api/`
  - Clientes Axios preconfigurados (OData y Seguridad) con interceptores.

- `src/hooks/`
  - Hooks genéricos: `useEntidades` (OData), definiciones de respuestas.

- `src/features/`
  - Organización por dominios:
    - `auth/` (contexto de sesión, guard de rutas)
    - `home/` (landing interna)
    - `param/` (tablas paramétricas vía OData)
    - `security/` (login y administración de usuarios)
    - `upload/` (carga/validación/procesamiento de archivos; en parte simulada)
    - `muric001/`, `muric002/`, `muric003/` (carpetas presentes; componentes no implementados actualmente)

---

## 6) Enrutamiento

El ruteo está centralizado en `src/AppRoutes.tsx` con `react-router-dom`.

### 6.1 Rutas públicas

- `/` → redirige a `/login`
- `/login` → pantalla de acceso

### 6.2 Rutas protegidas

Se agrupan bajo un `Route` que envuelve:
- `RequireAuth` (control de sesión)
- `Layout` (TopBar + Drawer + `Outlet`)

Ejemplos:
- `/app` → `LandingPage`
- `/app/lista-*` → pantallas de parametrización
- `/app/lista-usuarios` → administración de usuarios
- `/app/cambiar-contrasena` → cambio de contraseña
- `/app/carga-archivos` → carga de archivos
- `/config-mapeo-carga` → configuración de mapeo (protegida y dentro del layout)

### 6.3 Rutas enlazadas en el menú pero no definidas en AppRoutes

Actualmente el menú incluye enlaces a rutas que **no aparecen definidas** en `AppRoutes.tsx`:
- `/app/muric001`, `/app/muric002`, `/app/muric003`
- `/app/archivos-cargados`, `/app/archivos-enviados`

Si se navega a esas rutas, el `catch-all` `*` redirige a `/login`. Para habilitarlas se debe:
- Crear componentes/páginas correspondientes.
- Agregar sus `<Route ... />` en `AppRoutes.tsx`.

---

## 7) Layout y tema

### 7.1 Tema MUI

Definido en `src/theme.ts`:
- Modo `light`.
- Paleta primaria corporativa (azules) y fondos claros.
- Tipografía base con `fontSize: 11`.
- Overrides para `MuiButton`, `MuiPaper`, `MuiOutlinedInput`, etc.

### 7.2 Layout

`src/components/Layout.tsx`:
- `TopBar` fijo.
- `Drawer` lateral:
  - Temporal en móvil.
  - Permanente en escritorio.
- El contenido de cada ruta protegida se renderiza vía `<Outlet />`.

---

## 8) Autenticación y autorización

### 8.1 Contexto y guard de rutas

- `src/features/auth/components/AuthProvider.tsx`
  - Mantiene estado de sesión:
    - `isAuthenticated`
    - `user`
    - `initializing` (carga inicial desde `localStorage`)
    - `authLoading` (estado durante login)
  - Expone `login()` y `logout()`.

- `src/features/auth/components/RequireAuth.tsx`
  - Mientras `initializing` muestra `CircularProgress`.
  - Si no está autenticado redirige a `/login`.

### 8.2 Persistencia de sesión

La sesión se basa en `localStorage`:
- `token` (JWT o token bearer)
- `tokenExpiry` (fecha/hora parseable por `Date`)
- `user` (JSON)

`AuthService.isAuthenticated()` valida que exista `token` y `tokenExpiry` y que `new Date() < new Date(expiry)`.

### 8.3 Login

`src/features/security/services/AuthService.ts`:
- `POST /auth/login` contra `VITE_API_URL_SECURITY`.
- Mapea credenciales:
  - `username` (UI) → `email` (payload)
  - `password` → `password`
  - `rememberMe` → `rememberMe`
- Si `response.success` y `response.token`, guarda datos en `localStorage`.

### 8.4 Interceptores Axios

- `src/api/axiosOdataAPIClient.ts`:
  - Agrega `Authorization: Bearer <token>` si existe y no expiró.
  - Si expiró: limpia `localStorage` y redirige a `/login`.
  - En respuestas 401/403: limpia y redirige.

- `src/api/axiosSecurityAPIClient.ts`:
  - NO agrega token para `'/auth/login'`.
  - Para otras rutas: agrega bearer token si no expiró.
  - En error 401/403: limpia y redirige (excepto login).

Consideraciones:
- La redirección se hace por `window.location.href = '/login'` en los interceptores.
- En el UI, `logout()` además navega a `/login` con React Router.

---

## 9) Acceso a datos y hooks

### 9.1 OData — `useEntidades`

`src/hooks/useEntidades.ts`:
- Firma: `useEntidades<T>(endpoint: string)`
- Realiza `GET` usando `axiosOdataAPIClient`.
- Soporta dos formatos de respuesta:
  - OData: `{ value: T[] }`
  - Array directo: `T[]`
- Devuelve `{ entidades, cargando, error }`.

Ejemplo de uso (Parametrización):
- Endpoint: `"/AntiguedadEmpresa"`
- Request efectivo: `${VITE_API_URL}/AntiguedadEmpresa`

### 9.2 Seguridad — `useGetUsers`

`src/features/security/hooks/useGetUsers.tsx`:
- Similar a `useEntidades`, pero usa `axiosSecurityAPIClient`.
- Actualmente asume que la respuesta es `T[]`.

---

## 10) Módulo: Parametrización (`features/param`)

Patrón típico:
- Un modelo TypeScript (por ejemplo `AntiguedadEmpresa.model.ts`) define el shape de datos.
- Un componente `List*.tsx`:
  - Llama `useEntidades<Model>("/<Entidad>")`.
  - Renderiza una tabla con `MaterialReactTable`.

Ejemplo: `ListAntiguedadEmpresa.tsx`
- Tabla sin paginación (renderiza todos los registros recibidos).
- Columnas con `accessorKey` en formato esperado por la API (por ejemplo `Codigo`, `Descripcion`).

Para agregar una nueva tabla paramétrica:
1. Crear/actualizar el modelo en `src/features/param/models/`.
2. Crear el componente listado en `src/features/param/components/` usando `useEntidades`.
3. Registrar ruta en `src/AppRoutes.tsx`.
4. Agregar enlace en `src/components/Menu.tsx`.

---

## 11) Módulo: Seguridad (`features/security`)

Componentes principales:
- `Login.tsx`
  - Llama `login()` del `AuthProvider`.
  - Si `success`: navega a `/app`.
  - Si falla: muestra `Alert` con `errors`.

- `ListUsers.tsx`
  - Obtiene usuarios via `useGetUsers("/auth/users")`.
  - Tabla `MaterialReactTable` con acciones (editar / asignar contraseña).
  - Persistencia (create/update/reset) está marcada como `TODO`.

---

## 12) Módulo: Upload / Carga de archivos (`features/upload`)

Componente principal:
- `CargaArchivos.tsx`

Capacidades actuales:
- Selección de archivos: `.csv`, `.txt`, `.xlsx`, `.xls`.
- Validaciones locales:
  - Extensión permitida.
  - Tamaño máximo 10MB.
- Lectura y preview:
  - Excel: usa `xlsx` para leer primera hoja.
  - CSV/TXT: split por líneas y coma (parser simple).
- Construcción de modelos en memoria:
  - `ArchivosCarga`, `ArchivosCargaDetalle`, `RegistroAuditoria`, `VersionArchivo`.
  - Se generan IDs con `crypto.randomUUID()`.
- Flujo UI por estados: `Sin archivo` → `Cargado` → `Validado` → `Procesado` → `Reversado` (y `Error`).

Puntos pendientes:
- Envío real a backend (`TODO` en el componente).
- Usuario real para auditoría (actualmente usa `usuario@ejemplo.com`).
- Empresas/"universalidades" actualmente están hardcodeadas como `empresasPrueba`.

---

## 13) Convenciones de código y calidad

- TypeScript `strict: true` (ver `tsconfig.app.json`).
- ESLint configurado con `@eslint/js`, `typescript-eslint`, `eslint-plugin-react-hooks` y `react-refresh`.

Recomendación de flujo:
- Antes de PR/build, ejecutar:
  - `npm run lint`
  - `npm run build`

---

## 14) Troubleshooting (técnico)

- **Redirecciones inesperadas a `/login`**
  - Revisar `tokenExpiry` en `localStorage`.
  - Confirmar que backend retorna `expiresAt` parseable por `Date`.
  - Confirmar que no hay 401/403 desde APIs (interceptores limpian sesión).

- **CORS / errores de red**
  - Verificar `.env` (URLs correctas).
  - Confirmar que el backend habilita CORS para el origen del frontend.

- **Rutas que “mandan al login”**
  - Revisar que la ruta exista en `AppRoutes.tsx`.
  - Actualmente hay links en el menú sin ruta definida (ver sección 6.3).

- **Tablas paramétricas vacías**
  - Verificar que el endpoint OData exista (ej. `/AntiguedadEmpresa`).
  - Revisar formato de respuesta: `{ value: [...] }` o array.

---

## 15) Anexo — endpoints observados

Seguridad (base `VITE_API_URL_SECURITY`):
- `POST /auth/login`
- `GET /auth/users`

OData (base `VITE_API_URL`):
- `GET /AntiguedadEmpresa`
- (y otros `List*` similares en `features/param/components/`)
