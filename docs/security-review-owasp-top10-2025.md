# Revisión de seguridad — OWASP Top 10:2025

**Alcance:** solo el código fuente de este repositorio (SPA React/Vite, `muricsyncfront`). No se tuvo acceso al backend (API OData / Security API), a la configuración del servidor/CDN que sirve el build, ni al pipeline de CI/CD, por lo que varios controles (autorización real, rate limiting, cabeceras HTTP del servidor, TLS) **no son verificables desde este repositorio** y se marcan explícitamente como tal.

**Metodología:** lectura de código fuente (`src/`), `package.json` / `package-lock.json`, `npm audit`, `index.html`, `vite.config.ts`, `.env*` y rutas (`AppRoutes.tsx`). No se ejecutó pentesting dinámico ni se probó la aplicación corriendo.

**Fecha de revisión:** 2026-08-26 · **Rama:** `rhenao-sprint04`

**Referencia de categorías:** OWASP Top 10:2025 (A01–A10, según la reorganización que renombra/fusiona categorías respecto a 2021: incorpora "Software Supply Chain Failures", "Authentication Failures", "Logging & Alerting Failures" y "Mismatched Trust Boundaries").

---

## Resumen ejecutivo

| # | Categoría | ¿Aplica? | Riesgo |
|---|---|---|---|
| A01 | Broken Access Control | Sí | **Alto** |
| A02 | Security Misconfiguration | Sí | Medio |
| A03 | Software Supply Chain Failures | Sí | **Alto** |
| A04 | Cryptographic Failures | Parcial | Medio-Alto |
| A05 | Injection | No hay evidencia suficiente | Bajo |
| A06 | Insecure Design | Sí | Medio |
| A07 | Authentication Failures | Sí | Medio-Alto |
| A08 | Software or Data Integrity Failures | No hay evidencia suficiente | N/A |
| A09 | Logging & Alerting Failures | Sí | Medio-Alto |
| A10 | Mismatched Trust Boundaries (SSRF) | No aplica | N/A |

---

## A01:2025 – Broken Access Control

**¿Aplica?** Sí.

**Evidencia:**
- En `src/AppRoutes.tsx:61-182`, todas las rutas protegidas —incluidas las sensibles: `/app/lista-usuarios`, `/app/lista-roles`, `/app/lista-permisos`, `/app/reporte-usuarios`, `/app/config-seguridad`, `/app/audit-logs`— están envueltas únicamente en `<RequireAuth>` (exige solo estar autenticado, sin importar el rol). El componente `RequireRole` (`src/features/auth/components/RequireRole.tsx`) existe pero **no se usa a nivel de ruta para ninguna de ellas**; solo se aplica dentro de `AuditLogPage.tsx:46`.
- Como control alternativo, algunos componentes hacen su propio chequeo interno de permisos: `ListRoles.tsx:68`, `ListPermissions.tsx:76`, `ReporteUsuarios.tsx:88`, `FormConfigSeguridad.tsx:108` (`if (!hasPermission(...)) return <Forbidden/>`). Este patrón está duplicado y es inconsistente.
- `src/features/security/components/ListUsers.tsx` (ruta `/app/lista-usuarios`) **no tiene ningún chequeo de rol/permiso** dentro del componente. Su única protección es que el ítem de menú está oculto (`Menu.tsx:70,452-461`) — ocultar en el menú no es control de acceso: cualquier usuario autenticado que conozca o adivine la URL puede renderizar la página.
- Los datos de autorización usados en el cliente (`user.roles`, usados en `Menu.tsx:63-79` y `ListGeneral.tsx:28`) provienen de un objeto `user` guardado como JSON plano en `localStorage` (`AuthService.ts:44-45`), sin firma ni verificación. Un usuario puede editar `localStorage.user` desde las DevTools del navegador y auto-asignarse `roles: ["ADMIN"]` para desbloquear la interfaz (menús, botón "Editar" de `ListGeneral.tsx:39-62`, etc.). El impacto real depende de que el backend valide independientemente cada request — **eso no es verificable desde este repositorio**, pero la ausencia de un guard de ruta consistente es, en sí misma, un hallazgo de diseño.

**Nivel de riesgo:** **Alto.** Aunque la autorización final debería vivir en el backend, la falta de un guard uniforme en el frontend permite que usuarios autenticados con roles bajos (p. ej. "CONSULTA") accedan a pantallas de administración de usuarios/roles/permisos simplemente navegando a la URL, y la UI confía en datos que el propio cliente puede alterar.

**Mitigación:**
1. Envolver **todas** las rutas sensibles en `AppRoutes.tsx` con `RequireRole`/`RequireAuth` + verificación de permisos, de forma consistente (no depender de que cada componente lo reimplemente).
2. Agregar el chequeo faltante en `ListUsers.tsx`.
3. No derivar decisiones de UI de un blob de `localStorage` editable por el usuario; si se necesita esa información en cliente, derivarla de claims dentro del propio JWT (que al menos requiere una firma válida para ser aceptado por el backend), no de un objeto JSON aparte.
4. Confirmar (fuera de este repo) que cada endpoint del backend re-valida rol/permiso independientemente de lo que envíe el cliente.

---

## A02:2025 – Security Misconfiguration

**¿Aplica?** Sí.

**Evidencia:**
- `index.html:1-13` no define ninguna cabecera/meta `Content-Security-Policy`, `X-Content-Type-Options` u otra política de seguridad.
- `.env` y `.env.production` están *trackeados* en git (confirmado con `git ls-files`). Actualmente solo contienen URLs base (`VITE_API_URL`, `VITE_API_URL_SECURITY`, `VITE_APP_VERSION`) y ninguna clave/secreto, pero la práctica de versionar archivos `.env` es riesgosa si en el futuro alguien añade una credencial sin notar que el archivo se sube al repo.
- `vite.config.ts:1-8` es la configuración por defecto, sin ninguna instrucción para eliminar `console.*`/`debugger` en el build de producción (ver también A09) ni configuración de cabeceras.
- Cabeceras de seguridad del servidor/CDN que sirve el build (HSTS, `X-Frame-Options`, CSP real, etc.) **no son verificables desde este repositorio** — dependen de la infraestructura de despliegue.

**Nivel de riesgo:** Medio.

**Mitigación:**
1. Agregar una política CSP (meta tag como mínimo, cabecera HTTP idealmente) en `index.html` o en el servidor que sirve el build.
2. Migrar `.env`/`.env.production` fuera del control de versiones (usar `.env.example` + inyección de valores reales vía variables de entorno de CI/CD), o al menos auditar su contenido antes de cada commit.
3. Confirmar en el servidor/CDN de despliegue las cabeceras estándar de seguridad (fuera del alcance de este repo).
4. Configurar `esbuild.drop` en `vite.config.ts` para eliminar `console`/`debugger` en builds de producción.

---

## A03:2025 – Software Supply Chain Failures

**¿Aplica?** Sí.

**Evidencia:**
- `npm audit` (ejecutado sobre este repo) reporta **2 vulnerabilidades HIGH** en `xlsx@0.18.5` (`package.json:23`):
  - Prototype Pollution — [GHSA-4r6h-8v6p-xvw6](https://github.com/advisories/GHSA-4r6h-8v6p-xvw6), CVSS 7.8.
  - ReDoS — [GHSA-5pgg-2g8v-p4x9](https://github.com/advisories/GHSA-5pgg-2g8v-p4x9), CVSS 7.5.
  - `fixAvailable: false` en el registro npm — la versión publicada en npm no se actualiza más allá de 0.18.5; el mantenedor (SheetJS) recomienda usar su propio CDN para versiones parcheadas.
  - Esta librería procesa directamente archivos `.xlsx/.xls` **cargados por el usuario** en `src/features/upload/components/CargaArchivos.tsx:586` (`accept=".csv,.txt,.xlsx,.xls"`), por lo que la superficie de ataque es alcanzable con un archivo malicioso.
- Casi todas las dependencias de `package.json:13-24` están fijadas literalmente como `"latest"` (`react`, `react-dom`, `react-router-dom`, `axios`, `@mui/*`, `material-react-table`, `yup`, `@emotion/*`). Esto significa que una futura instalación sin `npm ci` (p. ej. `npm install` o `npm update`) puede traer silenciosamente versiones nuevas no revisadas, sin build reproducible.
- `package-lock.json` sí está versionado (mitigante parcial si el pipeline usa `npm ci`), pero actualmente aparece modificado en el working tree (`git status`).

**Nivel de riesgo:** **Alto** (vulnerabilidad HIGH con ruta de explotación alcanzable vía carga de archivos, más una práctica de versionado que facilita introducir dependencias no auditadas).

**Mitigación:**
1. Reemplazar `xlsx` por la build oficial parcheada de SheetJS (vía su CDN, según su propio aviso) o por una alternativa mantenida (p. ej. `exceljs`).
2. Fijar versiones exactas (o rangos acotados tipo `^x.y.z` reales) en `package.json` en lugar de `"latest"`.
3. Usar `npm ci` en build/CI para respetar el lockfile, y agregar `npm audit` (o Dependabot/Snyk) al pipeline.

---

## A04:2025 – Cryptographic Failures

**¿Aplica?** Parcialmente.

**Evidencia:**
- El JWT y el objeto `user` completo se guardan en `localStorage` en texto plano (`AuthService.ts:44-46`), no en una cookie `httpOnly`. Es un trade-off común en SPAs con Bearer tokens, pero implica que cualquier XSS futuro comprometería la sesión completa.
- Se registran **contraseñas en texto plano** en la consola del navegador:
  - `src/features/security/components/PasswordChange.tsx:108` (`console.log("Contraseña actual:", formData.currentPassword)`) y `:109` (`console.log("Nueva contraseña:", formData.newPassword)`).
  - `src/features/security/components/DialogResetPassword.tsx:103` (`console.log("Nueva contraseña:", formData.newPassword)`).
- El token completo emitido por el backend se imprime en consola tras un login exitoso: `src/features/security/services/AuthService.ts:38` (`console.log("📥 Respuesta exitosa del servidor:", response.data)`), sin ningún guard de entorno (`import.meta.env.DEV`), por lo que también ocurre en producción.
- Los `.env` no contienen secretos actualmente (solo URLs), y las URLs de producción son rutas relativas (`.env.production`), delegando TLS al reverse proxy — **no verificable desde este repo**.

**Nivel de riesgo:** Medio-Alto (por el logging de contraseñas y tokens en texto plano; no por el manejo de `localStorage`, que es una decisión de diseño aceptable si se documenta y se mitiga con controles de XSS).

**Mitigación:**
1. Eliminar de inmediato todos los `console.log`/`console.error` que impriman contraseñas, tokens o el payload completo de login.
2. Envolver cualquier logging de depuración restante en `if (import.meta.env.DEV)`.
3. Si el backend puede emitir cookies `httpOnly` + `SameSite`, evaluar migrar la sesión fuera de `localStorage`.

---

## A05:2025 – Injection

**¿Aplica?** No se encontró evidencia suficiente de inyección explotable desde el frontend.

**Evidencia:**
- Búsqueda de `dangerouslySetInnerHTML`, `innerHTML`, `eval(`, `new Function(`, `document.write` en todo `src/`: **sin resultados**. No hay sinks de XSS basado en DOM identificados.
- `src/hooks/useEntidades.ts:19` pasa el `endpoint` directamente a `axios.get()`, pero los endpoints son literales fijos por componente (p. ej. `/Foo` en cada `ListXxx.tsx`), no se construyen a partir de entrada de usuario en los archivos revisados.
- No se encontró construcción de queries OData (`$filter`, etc.) por concatenación de strings con entrada de usuario en el código revisado.
- El manejo de inyección en el backend (SQL/OData) **no es verificable desde este repositorio**.

**Nivel de riesgo:** Bajo (para la superficie visible en el frontend).

**Mitigación:** Mantener la ausencia de `dangerouslySetInnerHTML`/`innerHTML`; si en el futuro se construyen filtros OData a partir de entrada de usuario, usar siempre parametrización/escaping, nunca interpolación de strings.

---

## A06:2025 – Insecure Design

**¿Aplica?** Sí.

**Evidencia:**
- Política de contraseñas débil: longitud mínima de solo 6 caracteres, sin requisito de complejidad — `src/features/security/components/DialogRegisterUser.tsx:81-82` (`formData.password.length < 6`).
- El control de acceso está diseñado de forma no centralizada: en vez de un único guard reutilizado (`RequireRole` a nivel de ruta), cada componente sensible reimplementa su propio `if (!hasPermission(...))` (`ListRoles.tsx:68`, `ListPermissions.tsx:76`, `ReporteUsuarios.tsx:88`, `FormConfigSeguridad.tsx:108`). Este diseño repetido es precisamente lo que permitió que `ListUsers.tsx` quedara sin ningún chequeo (ver A01).
- La expiración de sesión se calcula enteramente en el cliente comparando `new Date()` con un `tokenExpiry` guardado en `localStorage` en texto plano (`AuthService.ts:80-87`, replicado en `axiosOdataAPIClient.ts:23-26` y `axiosSecurityAPIClient.ts:19-28`) — un valor que el usuario puede editar libremente desde DevTools.

**Nivel de riesgo:** Medio.

**Mitigación:**
1. Definir y aplicar una política de contraseñas real (longitud ≥ 10-12 + complejidad), idealmente validada también en backend.
2. Centralizar la lógica de autorización en un único guard reutilizado a nivel de ruta, eliminando la duplicación por componente.
3. Tratar la expiración calculada en cliente como una conveniencia de UX, nunca como el límite real de sesión (que debe imponer el backend al validar el JWT en cada request).

---

## A07:2025 – Authentication Failures

**¿Aplica?** Sí.

**Evidencia:**
- Misma política de contraseña débil citada en A06 (`DialogRegisterUser.tsx:81-82`).
- No se observan controles de fuerza bruta en el frontend (contador de intentos, CAPTCHA, backoff) en `Login.tsx`. El rate limiting real es responsabilidad del backend y **no es verificable desde este repositorio**.
- La respuesta completa del login, incluido el JWT emitido, se imprime en consola sin guard de entorno: `AuthService.ts:38`.
- La opción `rememberMe` se envía al backend (`AuthService.ts:9,34`) pero no se observó ninguna diferencia en el manejo del token resultante en el frontend — no se puede evaluar completamente sin el comportamiento del backend.

**Nivel de riesgo:** Medio-Alto.

**Mitigación:**
1. Endurecer la política de contraseñas (ver A06).
2. Eliminar el logging de la respuesta de login/token (`AuthService.ts:38`).
3. Confirmar en el backend (fuera de este repo) la existencia de rate limiting/lockout sobre `/auth/login`.

---

## A08:2025 – Software or Data Integrity Failures

**¿Aplica?** No se encontró evidencia suficiente para evaluarlo.

**Evidencia:**
- No hay archivos de pipeline CI/CD (p. ej. `.github/workflows`) en este repositorio para revisar integridad de artefactos, firmas o despliegues.
- El build es el estándar de Vite: `tsc -b && vite build` (`package.json:8`), sin mecanismos de carga dinámica de código remoto ni auto-actualización detectados en `src/`.

**Nivel de riesgo:** No aplicable / sin evidencia suficiente — el proceso de build/despliegue real vive fuera de este repositorio.

**Mitigación:** N/A por ahora. Si se agrega un pipeline CI/CD, verificar integridad del lockfile, considerar `npm ci` con verificación de hashes, y firmar/verificar artefactos de despliegue.

---

## A09:2025 – Logging & Alerting Failures

**¿Aplica?** Sí (en cuanto a exposición de datos vía logs de cliente).

**Evidencia:**
- Se detectaron 43 llamadas `console.*` en 13 archivos, concentradas en `src/features/security/*` y `src/api/*` (conteo por `grep`), sin ningún guard de entorno (`import.meta.env.DEV`), por lo que se ejecutan también en producción:
  - Contraseñas en texto plano: `PasswordChange.tsx:108-109`, `DialogResetPassword.tsx:102-103`.
  - Token y respuesta completa de login: `AuthService.ts:38`.
  - IDs de usuario y permisos: `Menu.tsx:74`, `PasswordChange.tsx:107`, `DialogResetPassword.tsx:102`.
- No existe telemetría de seguridad del lado del cliente (p. ej. reportar intentos fallidos o accesos denegados a un backend de monitoreo); el frontend solo redirige o muestra `Forbidden`. Esto es razonable para una SPA — el logging/alerting de seguridad real debería vivir en el backend, lo cual **no es verificable desde este repositorio**.

**Nivel de riesgo:** Medio-Alto, específicamente por la exposición de datos sensibles en logs de consola.

**Mitigación:**
1. Eliminar o envolver en `if (import.meta.env.DEV)` todos los `console.*` que impriman datos sensibles.
2. Aplicar un plugin de build que elimine `console`/`debugger` en producción (`esbuild.drop` en `vite.config.ts`).
3. Si se desea telemetría de seguridad desde el cliente (p. ej. 403 repetidos), enviarla al backend en vez de dejarla solo en la consola del navegador.

---

## A10:2025 – Mismatched Trust Boundaries (incl. SSRF)

**¿Aplica?** No aplica / sin evidencia.

**Evidencia:**
- Ambos clientes Axios (`axiosOdataAPIClient.ts`, `axiosSecurityAPIClient.ts`) usan una `baseURL` fija definida en tiempo de build (`import.meta.env.VITE_API_URL*`). No se encontró ningún punto donde un valor suministrado por el usuario se convierta en el host/URL destino de una petición (se revisaron `EnviaMURIC.tsx`, `ConsultasMURIC.tsx` y el flujo de carga de archivos).
- Al ser una SPA pura, este código no actúa como proxy de peticiones hacia URLs arbitrarias controladas por el atacante — ese vector, de existir, estaría en el backend, fuera del alcance de este repositorio.

**Nivel de riesgo:** No aplicable — sin evidencia.

**Mitigación:** N/A para este repositorio. Si el backend acepta URLs o callbacks provistos por el frontend (p. ej. webhooks), esa lógica debe revisarse en el repositorio del backend.

---

## Hallazgos priorizados (para remediar primero)

1. **[Alto]** Rutas administrativas sin `RequireRole` en `AppRoutes.tsx` + `ListUsers.tsx` sin chequeo de permisos (A01).
2. **[Alto]** `xlsx@0.18.5` con 2 CVEs HIGH alcanzables vía carga de archivos (A03).
3. **[Medio-Alto]** Contraseñas y tokens impresos en consola en `AuthService.ts`, `PasswordChange.tsx`, `DialogResetPassword.tsx` (A04/A07/A09).
4. **[Medio]** Política de contraseñas de solo 6 caracteres sin complejidad (A06/A07).
5. **[Medio]** Dependencias fijadas como `"latest"` en `package.json` (A03).
6. **[Medio]** Ausencia de CSP y `.env*` versionados en git (A02).
