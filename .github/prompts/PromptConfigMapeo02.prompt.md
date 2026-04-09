---
mode: agent
---

vamos a agregar en el menú una nueva opción llamada "Configurar Mapeo de Carga" que redirija al componente "ConfigMapeoCarga" que se encuentra en: src\features\upload\components\ConfigMapeoCarga.tsx.
Esta opción debe estar visible solo para usuarios autenticados.
El menú se encuentra en: src\app\components\Menu.tsx
Además, debemos asegurarnos de que la ruta para este componente esté protegida y solo accesible para usuarios autenticados. La ruta debe ser "/config-mapeo-carga".
La configuración de rutas se encuentra en: src\app\App.tsx
Finalmente, debemos asegurarnos de que el sistema de autenticación esté funcionando correctamente para proteger esta nueva ruta y opción de menú. El sistema de autenticación se encuentra en: src\features\auth
\components\AuthProvider.tsx y src\features\auth\hooks\useAuth.ts
