# Resultado — Plan 1, Tarea 2: Actualizar AuthService y AuthProvider

**Fecha:** 2026-06-08  
**Estado:** Completada

---

## Archivos analizados y decisiones

### `AuthService.ts` — Sin cambios

El método `login()` guarda `response.data.user` con `JSON.stringify` directamente, sin
transformación ni mapeo manual de campos. El campo `permissions` que ahora incluye el
backend llegará en `response.data.user` y se guardará automáticamente en localStorage.

El método `getUser()` hace `JSON.parse(user) as UserInfoDto`, lo que también incluye
`permissions` automáticamente. **No requirió ningún cambio.**

### `useAuth.ts` — Sin cambios

El hook retorna `context` cuyo tipo se infiere de `AuthContext` (tipo `AuthContextValue`).
Al actualizar `AuthContextValue` en `AuthProvider.tsx`, los nuevos métodos quedan
disponibles con autocompletado sin tocar `useAuth.ts`. **No requirió ningún cambio.**

---

## Archivo modificado

### `src/features/auth/components/AuthProvider.tsx`

**Cambio 1 — Interfaz `AuthContextValue`:**

Agregados dos nuevos campos al contrato del contexto:

```typescript
hasPermission: (code: string) => boolean;
hasAnyPermission: (codes: string[]) => boolean;
```

**Cambio 2 — Implementación con `useCallback`:**

Ambas funciones se declaran con `useCallback` y dependen de `[user]`, de modo que
se memorizan y solo se recalculan cuando el objeto `user` cambia (login/logout):

```typescript
const hasPermission = useCallback(
  (code: string): boolean => user?.permissions?.includes(code) ?? false,
  [user]
);

const hasAnyPermission = useCallback(
  (codes: string[]): boolean =>
    codes.some((code) => user?.permissions?.includes(code) ?? false),
  [user]
);
```

**Cambio 3 — `useMemo` del valor del contexto:**

Agregados `hasPermission` y `hasAnyPermission` al objeto retornado y al array
de dependencias del `useMemo`.

---

## Decisiones de diseño

- **`useCallback` con `[user]`**: las funciones se redefinen cuando cambia `user`
  (al hacer login o logout), garantizando que siempre evalúen los permisos actuales.
  Si se declararan fuera de `useCallback` o sin la dependencia correcta, podrían
  capturar un `user` obsoleto en closures.

- **`?? false` como fallback**: si `user` es `null` (no autenticado) o si por alguna
  razón el campo `permissions` no está en el objeto, la función retorna `false` de
  forma segura en lugar de lanzar un error.

- **`hasAnyPermission` separado de `hasPermission`**: útil para menús o rutas que
  requieren cualquiera de varios permisos (ej. mostrar un ítem si tiene
  `usuarios.read` O `usuarios.write`).

---

## Verificación

```
npx tsc --noEmit → 0 errores, 0 warnings
```
