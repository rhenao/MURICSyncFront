# Diagrama de arquitectura — MuricSync FrontEnd

Este diagrama resume la arquitectura **en ejecución** (runtime) del SPA: ruteo, autenticación, layout, módulos y consumo de APIs.

```mermaid
flowchart LR
  U[Usuario] --> B[Navegador]
  B --> SPA[React SPA (Vite + TypeScript)]

  subgraph SPA[React SPA (Vite + TypeScript)]
    App[App.tsx\nThemeProvider + CssBaseline\nAuthProvider + BrowserRouter] --> Routes[AppRoutes.tsx\nRoutes + Navigate]

    Routes --> Public[Ruta pública\n/login]
    Routes --> Guard[RequireAuth]\n
    Guard --> Layout[Layout.tsx\nTopBar + Drawer + Menu\nOutlet]

    Layout --> Home[home/LandingPage]
    Layout --> Param[param/*\nList*.tsx + Modelos\nMaterialReactTable\nuseEntidades(OData)]
    Layout --> Security[security/*\nLogin\nListUsers + Diálogos\nuseGetUsers(Security)]
    Layout --> Upload[upload/*\nCargaArchivos\nLee CSV/TXT/Excel (xlsx)\nTODO: envío a backend]

    App --> Auth[AuthProvider/AuthContext\nlogin/logout\ninitializing/authLoading]
    Auth <--> LS[(localStorage\n token\n tokenExpiry\n user)]

    Layout --> Menu[Menu.tsx\nEnlaces + VITE_APP_VERSION]
  end

  subgraph API[Acceso a datos (Axios)]
    ODataClient[axiosOdataAPIClient\nbaseURL=VITE_API_URL\nInterceptor: Bearer token\n401/403 => limpiar + /login]
    SecClient[axiosSecurityAPIClient\nbaseURL=VITE_API_URL_SECURITY\nInterceptor: Bearer token\nExcepto /auth/login]\n
    AuthService[AuthService\nPOST /auth/login\nGuarda token + expiración + user]\n
    AuthService --> SecClient
  end

  Param --> ODataClient
  Security --> SecClient
  Auth --> AuthService

  subgraph BE[Backends]
    ODataAPI[API OData\n/odata/v1/*]
    SecAPI[API Seguridad\n/api\n/auth/login\n/auth/users]
  end

  ODataClient --> ODataAPI
  SecClient --> SecAPI

  Env[.env / .env.production\nVITE_API_URL\nVITE_API_URL_SECURITY\nVITE_APP_VERSION]
  Env -.-> ODataClient
  Env -.-> SecClient
  Env -.-> Menu
```

Notas:
- Las rutas `/app/muric001`, `/app/muric002`, `/app/muric003` y las consultas del menú existen como enlaces, pero actualmente no están registradas en `AppRoutes.tsx`.
- Los interceptores de Axios limpian `localStorage` y fuerzan redirección a `/login` ante token expirado o respuestas 401/403.
