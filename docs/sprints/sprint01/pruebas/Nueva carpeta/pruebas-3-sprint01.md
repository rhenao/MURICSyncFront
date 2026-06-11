# Plan de Pruebas Sprint 01 — Políticas y Parámetros de Seguridad (Frontend)

**Proyecto:** MURICSyncFront  
**Fecha:** 2026-06-08  
**Rama:** `rhenao-sprint04`

---

## Alcance

Verificar que la pantalla de configuración de seguridad carga correctamente los parámetros actuales, permite modificarlos, y que los cambios tienen efecto inmediato en el comportamiento del sistema (sin reinicio).

---

## Precondiciones

- El backend (MURICSyncBack) debe estar corriendo con la migración `AddSecuritySettings` aplicada.
- La tabla `security_settings` tiene exactamente 1 fila con los valores iniciales.
- `admin@test.com` tiene el rol `ADMIN` (y por tanto el permiso `seguridad.manage`).
- `operador@test.com` NO tiene el permiso `seguridad.manage`.
- Tener a mano los valores originales de la configuración (longitud mínima 6, intentos max 5, bloqueo 60 min) para poder restaurarlos al final.

---

## Casos de Prueba

### CP-SEG-01 — Acceso con permiso correcto

**Objetivo:** Verificar que el usuario con `seguridad.manage` puede acceder.

**Pasos:**
1. Inicia sesión con `admin@test.com`.
2. Navega a `/app/config-seguridad` (o usa el menú "Parámetros de Seguridad").

**Resultado esperado:**
- La pantalla carga sin errores.
- Se muestran las tres secciones: "Políticas de Contraseña", "Bloqueo de Cuenta", "Inicio de Sesión".
- Los valores de los controles reflejan la configuración actual de la base de datos.

---

### CP-SEG-02 — Acceso sin permiso redirige

**Objetivo:** Verificar el control de acceso.

**Pasos:**
1. Inicia sesión con `operador@test.com`.
2. Navega directamente a `/app/config-seguridad`.

**Resultado esperado:**
- El navegador redirige a `/app`.
- El ítem "Parámetros de Seguridad" no aparece en el menú.

---

### CP-SEG-03 — Valores cargados coinciden con la base de datos

**Objetivo:** Verificar que el formulario carga los valores reales.

**Pasos:**
1. Navega a `/app/config-seguridad`.
2. Observa los valores mostrados.

**Resultado esperado:**
- "Requiere dígito" → encendido (true).
- "Requiere minúscula" → encendido (true).
- "Requiere mayúscula" → encendido (true).
- "Requiere carácter especial" → apagado (false).
- "Longitud mínima" → 6.
- "Caracteres únicos mínimos" → 1.
- "Intentos fallidos máximos" → 5.
- "Duración del bloqueo (min)" → 60.
- "Bloqueo para nuevos usuarios" → encendido (true).
- "Requiere email confirmado" → apagado (false).
- "Requiere teléfono confirmado" → apagado (false).

---

### CP-SEG-04 — Indicador de carga durante la carga inicial

**Objetivo:** Verificar el feedback visual.

**Pasos:**
1. Con DevTools → Network → Slow 3G activado, navega a `/app/config-seguridad`.

**Resultado esperado:**
- Mientras carga, se muestra un skeleton o spinner.
- Los controles no aparecen hasta que llegan los datos.
- Al completar la carga, el formulario aparece con los valores.

---

### CP-SEG-05 — Guardar cambio en longitud mínima de contraseña

**Objetivo:** Verificar que se puede cambiar un parámetro numérico.

**Pasos:**
1. En "Longitud mínima", cambia el valor de 6 a 8.
2. Haz click en "Guardar cambios".

**Resultado esperado:**
- Aparece un Snackbar verde "Configuración guardada correctamente" (o similar).
- El campo "Última modificación" se actualiza con la hora actual y el email del admin.
- El valor del campo sigue mostrando 8 (no se resetea).

**Verificación en el backend:**
- Ejecuta `GET /api/security-settings` con Postman/Swagger.
- Confirma que `passwordRequiredLength` es ahora 8.

**Limpieza:**
- Cambia el valor de vuelta a 6 y guarda.

---

### CP-SEG-06 — El cambio tiene efecto inmediato (sin reiniciar backend)

**Objetivo:** Verificar el efecto en caliente del cambio.

**Precondición:** Completar CP-SEG-05 con longitud = 8.

**Pasos:**
1. Intenta crear un usuario nuevo con contraseña `Test1!` (6 caracteres).
   - Navega a la pantalla de gestión de usuarios y haz click en "Nuevo usuario".
   - Usa la contraseña `Test1!` (6 chars, tiene mayúscula, minúscula y dígito).
2. Haz click en "Guardar".

**Resultado esperado:**
- El backend rechaza la contraseña con un error indicando que es demasiado corta.
- No se necesitó reiniciar la aplicación backend.

**Limpieza:**
- Vuelve a "Parámetros de Seguridad" y restaura la longitud mínima a 6.
- Verifica que ahora la contraseña `Test1!` sí es válida.

---

### CP-SEG-07 — Guardar cambio en un switch (boolean)

**Objetivo:** Verificar que los switches se guardan correctamente.

**Pasos:**
1. Cambia "Requiere carácter especial" a encendido.
2. Haz click en "Guardar cambios".

**Resultado esperado:**
- Snackbar de éxito.
- El switch permanece encendido.

**Verificación:**
- Recarga la página (`F5`).
- El switch "Requiere carácter especial" sigue encendido (el valor se persiste).

**Limpieza:**
- Apaga el switch y guarda.

---

### CP-SEG-08 — Cambio de duración del bloqueo

**Objetivo:** Verificar el parámetro de bloqueo.

**Pasos:**
1. Cambia "Duración del bloqueo" de 60 a 30.
2. Guarda.

**Resultado esperado:**
- Guardado exitoso.
- Al recargar la página, el valor muestra 30.

**Limpieza:**
- Restaura a 60 y guarda.

---

### CP-SEG-09 — Validación en el frontend para valores fuera de rango

**Objetivo:** Verificar que el frontend valida antes de enviar.

**Pasos:**
1. En "Longitud mínima", intenta ingresar el valor 3 (mínimo permitido es 4).
2. Haz click en "Guardar cambios".

**Resultado esperado:**
- El formulario muestra un mensaje de error de validación en el campo
  ("El valor debe ser entre 4 y 128" o similar).
- No se realiza ninguna petición al backend.

**Pasos adicionales:**
3. Intenta ingresar 129 (máximo es 128).

**Resultado esperado:**
- Mensaje de error de validación.

---

### CP-SEG-10 — Validación en el backend (seguridad adicional)

**Objetivo:** Verificar que el backend también valida.

**Pasos:**
1. Usando Postman o DevTools (edita el request antes de enviarlo), envía `passwordRequiredLength: 0`.
2. Observa la respuesta del backend.

**Resultado esperado:**
- El backend retorna 400 Bad Request con mensaje de validación.
- En el frontend, si esto se presenta, aparece un Snackbar rojo con el mensaje del error.

---

### CP-SEG-11 — Solo se envían los campos modificados

**Objetivo:** Verificar que la actualización es parcial (patch).

**Pasos:**
1. Con DevTools → Network abierto, cambia únicamente el valor de "Intentos fallidos máximos" de 5 a 3.
2. Haz click en "Guardar cambios".
3. Inspecciona el body del request PUT en la pestaña Network.

**Resultado esperado:**
- El body del request solo contiene `{ "lockoutMaxFailedAttempts": 3 }`.
- NO incluye los demás campos (que no se modificaron).

**Limpieza:**
- Restaura "Intentos fallidos máximos" a 5 y guarda.

---

### CP-SEG-12 — El texto de auditoría se actualiza tras guardar

**Objetivo:** Verificar la información de auditoría.

**Pasos:**
1. Anota la hora y el `updatedBy` que muestra la pantalla.
2. Modifica cualquier campo y guarda.

**Resultado esperado:**
- El texto "Última modificación" muestra la nueva hora (más reciente que la anotada).
- El campo "por ..." muestra el email del admin que realizó el cambio (`admin@test.com`).

---

### CP-SEG-13 — Manejo de error de red

**Objetivo:** Verificar el comportamiento si el backend no responde.

**Pasos:**
1. Detén el backend (o usa DevTools para bloquear las peticiones al endpoint).
2. Intenta guardar un cambio.

**Resultado esperado:**
- Aparece un Snackbar rojo con un mensaje de error (ej. "Error al guardar la configuración").
- El formulario no se vacía ni se corrompe.
- Al restablecer la conexión, el formulario puede intentar guardar nuevamente.

---

### CP-SEG-14 — Pantalla es accesible desde el menú

**Objetivo:** Verificar la navegación desde el menú.

**Pasos:**
1. Inicia sesión con `admin@test.com`.
2. En el menú lateral, busca "Parámetros de Seguridad".
3. Haz click en el ítem.

**Resultado esperado:**
- Navega a `/app/config-seguridad`.
- La pantalla carga correctamente.

---

## Pruebas de Regresión

### CR-SEG-01 — Login sigue funcionando tras cambio de políticas

**Objetivo:** Verificar que el cambio de políticas de contraseña no afecta el login.

**Pasos:**
1. Asegúrate de que los parámetros están en sus valores originales (longitud = 6, etc.).
2. Haz logout.
3. Inicia sesión con `admin@test.com`.

**Resultado esperado:**
- El login funciona correctamente con las credenciales existentes.
- No hay errores de "contraseña no cumple políticas" al autenticar.

### CR-SEG-02 — Cambio de contraseña respeta la nueva política

**Objetivo:** Verificar que el cambio de política afecta la pantalla de cambio de contraseña.

**Precondición:** Cambiar `passwordRequiredLength` a 10.

**Pasos:**
1. Navega a `/app/cambiar-contrasena`.
2. Intenta cambiar la contraseña a una de 8 caracteres.

**Resultado esperado:**
- El backend rechaza la contraseña (muy corta para la política actual de 10).
- El frontend muestra el error del backend.

**Limpieza:**
- Restaura `passwordRequiredLength` a 6 en la pantalla de parámetros.
