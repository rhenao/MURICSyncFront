# Plan de remediación — OWASP Top 10:2025 (MuricSyncFront)

Basado en `docs/security-review-owasp-top10-2025.md` (revisión del 2026-08-26, rama `rhenao-sprint04`). Verificado contra el código actual el 2026-09-02: todos los hallazgos siguen presentes.

Organizado en fases por riesgo/esfuerzo. Cada fase es un PR independiente para facilitar revisión.

---

## Fase 1 — Quick wins de bajo riesgo (1 PR, ~1-2h)

Cambios mecánicos, sin impacto funcional, alto valor inmediato.

1. **Eliminar logging de credenciales/tokens en consola** (A04/A07/A09)
   - `src/features/security/services/AuthService.ts:25-66` — quitar o envolver en `if (import.meta.env.DEV)` todos los `console.log`/`console.error`, en particular la línea 38 (`response.data` completo, incluye el JWT).
   - `src/features/security/components/PasswordChange.tsx:107-109` — eliminar los `console.log` de `currentPassword`/`newPassword`.
   - `src/features/security/components/DialogResetPassword.tsx:102-103` — eliminar el `console.log` de `newPassword`.
   - Criterio de aceptación: `grep -rn "console\." src/features/security` no debe mostrar contraseñas ni tokens en texto plano; cualquier log de depuración restante queda bajo `import.meta.env.DEV`.

2. **Eliminar `console`/`debugger` del build de producción** (A02/A09)
   - `vite.config.ts` — agregar `esbuild: { drop: mode === 'production' ? ['console', 'debugger'] : [] }` (requiere cambiar `defineConfig` a la forma con `({ mode }) => ...`).
   - Actúa como red de seguridad adicional sobre el punto 1 para cualquier `console.*` que se escape en el futuro.

3. **Fijar versiones exactas de dependencias** (A03)
   - `package.json:13-24` — reemplazar todos los `"latest"` por la versión exacta actualmente instalada (leer de `package-lock.json` o `npm ls --depth=0`).
   - Ejecutar `npm install` después y confirmar que `package-lock.json` no cambia de forma inesperada.

**Verificación de fase:** `npm run build` sin errores; revisión manual de que no aparecen contraseñas/tokens en la consola del navegador al hacer login/cambio de contraseña (probar en `npm run dev`).

---

## Fase 2 — Vulnerabilidad de dependencia (1 PR, ~2-4h, requiere prueba funcional)

4. **Reemplazar `xlsx@0.18.5`** (A03 — Alto)
   - Dos CVEs HIGH (Prototype Pollution, ReDoS) sin fix disponible en npm; alcanzable vía carga de archivo en `src/features/upload/components/CargaArchivos.tsx:586`.
   - Opción recomendada: migrar a la build oficial parcheada de SheetJS distribuida por su propio CDN (`https://cdn.sheetjs.com/...`), siguiendo el aviso del mantenedor, en vez de `npm install xlsx`.
   - Alternativa si no se quiere depender de un CDN externo: migrar a `exceljs` (mantenido activamente), revisando la API usada en `CargaArchivos.tsx` (lectura de `.xlsx`/`.xls`) ya que difiere de la de `xlsx`.
   - Después del cambio, correr `npm audit` y confirmar que las 2 vulnerabilidades HIGH desaparecen.
   - **Prueba manual obligatoria:** cargar un archivo `.xlsx` real de ejemplo por la UI de `CargaArchivos` y confirmar que el parseo sigue funcionando igual (columnas, tipos de dato, filas).

---

## Fase 3 — Control de acceso centralizado (1 PR, ~4-6h, cambio estructural)

5. **Centralizar autorización con `RequireRole` a nivel de ruta** (A01 — Alto, A06)
   - En `src/AppRoutes.tsx`, envolver cada ruta administrativa/sensible con `RequireRole` (además de `RequireAuth`), en vez de dejar que cada componente reimplemente su propio `if (!hasPermission(...))`:
     - `/app/lista-usuarios` (`ListUsers`) — actualmente **sin ningún chequeo**, es la prioridad más alta.
     - `/app/lista-roles`, `/app/lista-permisos`, `/app/reporte-usuarios`, `/app/config-seguridad` — mover el chequeo que hoy vive dentro de `ListRoles.tsx:68`, `ListPermissions.tsx:76`, `ReporteUsuarios.tsx:88`, `FormConfigSeguridad.tsx:108` hacia el nivel de ruta.
     - `/app/audit-logs` ya usa `RequireRole` dentro de `AuditLogPage.tsx:46` — usar ese patrón como referencia y replicarlo consistentemente vía el guard de ruta en vez de dentro del componente.
   - Una vez migrado el chequeo a la ruta, eliminar el `if (!hasPermission(...)) return <Forbidden/>` duplicado dentro de cada componente (ya no hace falta si la ruta ya lo garantiza), dejando un único punto de verdad.
   - **Nota de alcance:** esto reduce el riesgo de que una pantalla quede *sin* protección por descuido (como pasó con `ListUsers.tsx`), pero la autorización real debe seguir validándose en el backend — este cambio es defensa en frontend, no el control final.

**Verificación de fase:** probar manualmente con un usuario de rol bajo (p. ej. "CONSULTA") que navegar directamente a cada URL administrativa redirige/muestra `Forbidden`, y que un usuario con el rol correcto sigue accediendo sin problema.

---

## Fase 4 — Endurecimiento de diseño (1 PR, ~2-3h)

6. **Política de contraseñas** (A06/A07)
   - `src/features/security/components/DialogRegisterUser.tsx:81-82` — subir el mínimo de 6 a al menos 10-12 caracteres y agregar requisito de complejidad (mayúscula, minúscula, número, símbolo — usar `yup`, que ya es dependencia del proyecto, para la validación).
   - Documentar que esta validación es solo UX; el backend debe aplicar la misma política independientemente.

7. **Documentar el trade-off de `localStorage`/expiración en cliente** (A04/A06)
   - No requiere cambio de código inmediato (migrar a cookies `httpOnly` depende de que el backend lo soporte, fuera de alcance de este repo), pero sí dejar constancia en `CLAUDE.md` o en un ADR de que:
     - La expiración de sesión calculada en `AuthService.ts:80-87` / `axiosOdataAPIClient.ts:23-26` / `axiosSecurityAPIClient.ts:19-28` es solo UX, no el límite real (lo impone el backend al validar el JWT).
     - Si en el futuro el backend expone cookies `httpOnly` + `SameSite`, reevaluar sacar la sesión de `localStorage`.

---

## Fase 5 — Configuración e higiene de repo (1 PR, ~1h)

8. **CSP básica** (A02)
   - Agregar meta tag `Content-Security-Policy` en `index.html` como mínimo (idealmente reforzada luego vía cabecera HTTP en el servidor/CDN que sirve el build, fuera de este repo).

9. **`.env` / `.env.production` versionados** (A02)
   - Confirmar que no contienen secretos (ya verificado: solo URLs).
   - Opción A (mínima): dejarlos como están pero agregar una nota en `CLAUDE.md` de que nunca deben llevar credenciales/secretos.
   - Opción B (más robusta): sacarlos del control de versiones, commitear un `.env.example` con los nombres de variable sin valores reales, e inyectar los valores reales vía variables de entorno del pipeline de CI/CD.
   - Requiere alinear con el proceso de deploy existente (ver notas en Obsidian sobre despliegue a QA) antes de elegir opción B.

---

## Fuera de alcance de este repositorio (requiere coordinación con backend/infra)

- Confirmar que cada endpoint del backend revalida rol/permiso independientemente del cliente (A01).
- Rate limiting / lockout sobre `/auth/login` (A07).
- Cabeceras de seguridad del servidor/CDN (HSTS, `X-Frame-Options`, CSP real vía header) (A02).
- Integridad de pipeline CI/CD (A08) — no existe pipeline en este repo actualmente.

---

## Orden sugerido de ejecución

| Fase | Prioridad | Bloqueante para deploy a QA |
|---|---|---|
| 1 (logging) | Inmediata | Sí — expone contraseñas/tokens en producción |
| 2 (xlsx) | Alta | Sí — CVE HIGH alcanzable |
| 3 (RequireRole) | Alta | Recomendado antes de exponer `lista-usuarios` a usuarios no-admin |
| 4 (contraseñas) | Media | No bloqueante, pero fácil de incluir junto a fase 3 |
| 5 (CSP/.env) | Media-baja | No bloqueante para QA, sí para producción |
