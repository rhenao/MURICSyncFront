# Plan de Pruebas Sprint 01 — Políticas y Parámetros de Seguridad (Frontend)

**Proyecto:** MURICSyncFront  
**Fecha:** 2026-06-08  
**Rama:** `rhenao-sprint04`  
**Sprint:** 01  
**Módulo:** Parámetros de Seguridad  
**Tester:** Rolando Henao  

---

## Tabla de Contenido

- [Plan de Pruebas Sprint 01 — Políticas y Parámetros de Seguridad (Frontend)](#plan-de-pruebas-sprint-01--políticas-y-parámetros-de-seguridad-frontend)
  - [Tabla de Contenido](#tabla-de-contenido)
  - [Alcance](#alcance)
  - [Precondiciones](#precondiciones)
  - [Casos de Prueba](#casos-de-prueba)
    - [CP-SEG-01 — Acceso con permiso correcto](#cp-seg-01--acceso-con-permiso-correcto)
      - [Pasos CP01](#pasos-cp01)
      - [Resultado esperado CP01](#resultado-esperado-cp01)
      - [Evidencias CP01](#evidencias-cp01)
      - [Estado CP01](#estado-cp01)
    - [CP-SEG-02 — Acceso sin permiso redirige](#cp-seg-02--acceso-sin-permiso-redirige)
      - [Pasos CP02](#pasos-cp02)
      - [Resultado esperado CP02](#resultado-esperado-cp02)
      - [Evidencias CP02](#evidencias-cp02)
      - [Estado CP02](#estado-cp02)
    - [CP-SEG-03 — Valores cargados coinciden con la base de datos](#cp-seg-03--valores-cargados-coinciden-con-la-base-de-datos)
      - [Pasos CP03](#pasos-cp03)
      - [Resultado esperado CP03](#resultado-esperado-cp03)
      - [Evidencias CP03](#evidencias-cp03)
      - [Estado CP03](#estado-cp03)
    - [CP-SEG-04 — Indicador de carga durante la carga inicial](#cp-seg-04--indicador-de-carga-durante-la-carga-inicial)
      - [Pasos CP04](#pasos-cp04)
      - [Resultado esperado CP04](#resultado-esperado-cp04)
      - [Evidencias CP04](#evidencias-cp04)
      - [Estado CP04](#estado-cp04)
    - [CP-SEG-05 — Guardar cambio en longitud mínima de contraseña](#cp-seg-05--guardar-cambio-en-longitud-mínima-de-contraseña)
      - [Pasos CP05](#pasos-cp05)
      - [Resultado esperado CP05](#resultado-esperado-cp05)
      - [Verificación CP05](#verificación-cp05)
      - [Limpieza CP05](#limpieza-cp05)
      - [Evidencias CP05](#evidencias-cp05)
      - [Estado CP05](#estado-cp05)
    - [CP-SEG-06 — El cambio tiene efecto inmediato (sin reiniciar backend)](#cp-seg-06--el-cambio-tiene-efecto-inmediato-sin-reiniciar-backend)
      - [Pasos CP06](#pasos-cp06)
      - [Resultado esperado CP06](#resultado-esperado-cp06)
      - [Limpieza CP06](#limpieza-cp06)
      - [Evidencias CP06](#evidencias-cp06)
      - [Estado CP06](#estado-cp06)
    - [CP-SEG-07 — Guardar cambio en un switch (boolean)](#cp-seg-07--guardar-cambio-en-un-switch-boolean)
      - [Pasos CP07](#pasos-cp07)
      - [Resultado esperado CP07](#resultado-esperado-cp07)
      - [Verificación CP07](#verificación-cp07)
      - [Limpieza CP07](#limpieza-cp07)
      - [Evidencias CP07](#evidencias-cp07)
      - [Estado CP07](#estado-cp07)
    - [CP-SEG-08 — Cambio de duración del bloqueo](#cp-seg-08--cambio-de-duración-del-bloqueo)
      - [Pasos CP08](#pasos-cp08)
      - [Resultado esperado CP08](#resultado-esperado-cp08)
      - [Limpieza CP08](#limpieza-cp08)
      - [Evidencias CP08](#evidencias-cp08)
      - [Estado CP08](#estado-cp08)
    - [CP-SEG-09 — Validación en el frontend para valores fuera de rango](#cp-seg-09--validación-en-el-frontend-para-valores-fuera-de-rango)
      - [Pasos CP09](#pasos-cp09)
      - [Resultado esperado CP09](#resultado-esperado-cp09)
      - [Evidencias CP09](#evidencias-cp09)
      - [Estado CP09](#estado-cp09)
    - [CP-SEG-10 — Validación en el backend (seguridad adicional)](#cp-seg-10--validación-en-el-backend-seguridad-adicional)
      - [Pasos CP10](#pasos-cp10)
      - [Resultado esperado CP10](#resultado-esperado-cp10)
      - [Evidencias CP10](#evidencias-cp10)
      - [Estado CP10](#estado-cp10)
    - [CP-SEG-11 — Solo se envían los campos modificados](#cp-seg-11--solo-se-envían-los-campos-modificados)
      - [Pasos CP11](#pasos-cp11)
      - [Resultado esperado CP11](#resultado-esperado-cp11)
      - [Limpieza CP11](#limpieza-cp11)
      - [Evidencias CP11](#evidencias-cp11)
      - [Estado CP11](#estado-cp11)
    - [CP-SEG-12 — El texto de auditoría se actualiza tras guardar](#cp-seg-12--el-texto-de-auditoría-se-actualiza-tras-guardar)
      - [Pasos CP12](#pasos-cp12)
      - [Resultado esperado CP12](#resultado-esperado-cp12)
      - [Evidencias CP12](#evidencias-cp12)
      - [Estado CP12](#estado-cp12)
    - [CP-SEG-13 — Manejo de error de red](#cp-seg-13--manejo-de-error-de-red)
      - [Pasos CP13](#pasos-cp13)
      - [Resultado esperado CP13](#resultado-esperado-cp13)
      - [Evidencias CP13](#evidencias-cp13)
      - [Estado CP13](#estado-cp13)
    - [CP-SEG-14 — Pantalla es accesible desde el menú](#cp-seg-14--pantalla-es-accesible-desde-el-menú)
      - [Pasos CP14](#pasos-cp14)
      - [Resultado esperado CP14](#resultado-esperado-cp14)
      - [Evidencias CP14](#evidencias-cp14)
      - [Estado CP14](#estado-cp14)
- [Pruebas de Regresión](#pruebas-de-regresión)
  - [CR-SEG-01 — Login sigue funcionando tras cambio de políticas](#cr-seg-01--login-sigue-funcionando-tras-cambio-de-políticas)
    - [Pasos](#pasos)
    - [Resultado esperado](#resultado-esperado)
  - [CR-SEG-02 — Cambio de contraseña respeta la nueva política](#cr-seg-02--cambio-de-contraseña-respeta-la-nueva-política)
    - [Pasos](#pasos-1)
    - [Resultado esperado](#resultado-esperado-1)

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

---

### CP-SEG-01 — Acceso con permiso correcto

**Objetivo:**  
Verificar que el usuario con `seguridad.manage` puede acceder.

#### Pasos CP01

1. Inicia sesión con `admin@test.com`.  
2. Navega a `/app/config-seguridad` (o usa el menú "Parámetros de Seguridad").  

#### Resultado esperado CP01

- La pantalla carga sin errores.  
- Se muestran las tres secciones: "Políticas de Contraseña", "Bloqueo de Cuenta", "Inicio de Sesión".  
- Los valores de los controles reflejan la configuración actual de la base de datos.  

#### Evidencias CP01

1. Evidencia SEG01
![CP-SEG-01](imagenes/pruebas-3-sprint01-caso01-evidencia01.png "CP-SEG-01")

#### Estado CP01

⬜ Pendiente

---

### CP-SEG-02 — Acceso sin permiso redirige

**Objetivo:**  
Verificar el control de acceso.

#### Pasos CP02

1. Inicia sesión con `operador@test.com`.  
2. Navega directamente a `/app/config-seguridad`.  

#### Resultado esperado CP02

- El navegador redirige a `/app`.  
- El ítem "Parámetros de Seguridad" no aparece en el menú.  

#### Evidencias CP02

1. Evidencia SEG02
![CP-SEG-02](imagenes/pruebas-3-sprint01-caso02-evidencia01.png "CP-SEG-02")

#### Estado CP02

⬜ Pendiente

---

### CP-SEG-03 — Valores cargados coinciden con la base de datos

**Objetivo:**  
Verificar que el formulario carga los valores reales.

#### Pasos CP03

1. Navega a `/app/config-seguridad`.  
2. Observa los valores mostrados.  

#### Resultado esperado CP03

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

#### Evidencias CP03

1. Evidencia SEG03
![CP-SEG-03](imagenes/pruebas-3-sprint01-caso03-evidencia01.png "CP-SEG-03")

#### Estado CP03

⬜ Pendiente

---

### CP-SEG-04 — Indicador de carga durante la carga inicial

**Objetivo:**  
Verificar el feedback visual.

#### Pasos CP04

1. Con DevTools → Network → Slow 3G activado, navega a `/app/config-seguridad`.  

#### Resultado esperado CP04

- Mientras carga, se muestra un skeleton o spinner.  
- Los controles no aparecen hasta que llegan los datos.  
- Al completar la carga, el formulario aparece con los valores.  

#### Evidencias CP04

1. Evidencia SEG04
![CP-SEG-04](imagenes/pruebas-3-sprint01-caso04-evidencia01.png "CP-SEG-04")

#### Estado CP04

⬜ Pendiente

---

### CP-SEG-05 — Guardar cambio en longitud mínima de contraseña

**Objetivo:**  
Verificar que se puede cambiar un parámetro numérico.

#### Pasos CP05

1. En "Longitud mínima", cambia el valor de 6 a 8.  
2. Haz click en "Guardar cambios".  

#### Resultado esperado CP05

- Aparece un Snackbar verde "Configuración guardada correctamente" (o similar).  
- El campo "Última modificación" se actualiza con la hora actual y el email del admin.  
- El valor del campo sigue mostrando 8 (no se resetea).  

#### Verificación CP05

- Ejecuta `GET /api/security-settings` con Postman/Swagger.  
- Confirma que `passwordRequiredLength` es ahora 8.  

#### Limpieza CP05

- Cambia el valor de vuelta a 6 y guarda.  

#### Evidencias CP05

1. Evidencia SEG05
![CP-SEG-05](imagenes/pruebas-3-sprint01-caso05-evidencia01.png "CP-SEG-05")

#### Estado CP05

⬜ Pendiente

---

### CP-SEG-06 — El cambio tiene efecto inmediato (sin reiniciar backend)

**Objetivo:**  
Verificar el efecto en caliente del cambio.

**Precondición:** Completar CP-SEG-05 con longitud = 8.

#### Pasos CP06

1. Intenta crear un usuario nuevo con contraseña `Test1!` (6 caracteres).  
   - Navega a la pantalla de gestión de usuarios y haz click en "Nuevo usuario".  
   - Usa la contraseña `Test1!` (6 chars, tiene mayúscula, minúscula y dígito).  
2. Haz click en "Guardar".  

#### Resultado esperado CP06

- El backend rechaza la contraseña con un error indicando que es demasiado corta.  
- No se necesitó reiniciar la aplicación backend.  

#### Limpieza CP06

- Vuelve a "Parámetros de Seguridad" y restaura la longitud mínima a 6.  
- Verifica que ahora la contraseña `Test1!` sí es válida.  

#### Evidencias CP06

1. Evidencia SEG06
![CP-SEG-06](imagenes/pruebas-3-sprint01-caso06-evidencia01.png "CP-SEG-06")

#### Estado CP06

⬜ Pendiente

---

### CP-SEG-07 — Guardar cambio en un switch (boolean)

**Objetivo:**  
Verificar que los switches se guardan correctamente.

#### Pasos CP07

1. Cambia "Requiere carácter especial" a encendido.  
2. Haz click en "Guardar cambios".  

#### Resultado esperado CP07

- Snackbar de éxito.  
- El switch permanece encendido.  

#### Verificación CP07

- Recarga la página (`F5`).  
- El switch "Requiere carácter especial" sigue encendido (el valor se persiste).  

#### Limpieza CP07

- Apaga el switch y guarda.  

#### Evidencias CP07

1. Evidencia SEG07
![CP-SEG-07](imagenes/pruebas-3-sprint01-caso07-evidencia01.png "CP-SEG-07")

#### Estado CP07

⬜ Pendiente

---

### CP-SEG-08 — Cambio de duración del bloqueo

**Objetivo:**  
Verificar el parámetro de bloqueo.

#### Pasos CP08

1. Cambia "Duración del bloqueo" de 60 a 30.  
2. Guarda.  

#### Resultado esperado CP08

- Guardado exitoso.  
- Al recargar la página, el valor muestra 30.  

#### Limpieza CP08

- Restaura a 60 y guarda.  

#### Evidencias CP08

1. Evidencia SEG08
![CP-SEG-08](imagenes/pruebas-3-sprint01-caso08-evidencia01.png "CP-SEG-08")

#### Estado CP08

⬜ Pendiente

---

### CP-SEG-09 — Validación en el frontend para valores fuera de rango

**Objetivo:**  
Verificar que el frontend valida antes de enviar.

#### Pasos CP09

1. En "Longitud mínima", intenta ingresar el valor 3 (mínimo permitido es 4).  
2. Haz click en "Guardar cambios".  
3. Intenta ingresar 129 (máximo es 128).  
4. Haz click en "Guardar cambios".  

#### Resultado esperado CP09

- El formulario muestra un mensaje de error de validación en el campo ("El valor debe ser entre 4 y 128" o similar).  
- No se realiza ninguna petición al backend.  
- Al ingresar 129, también aparece mensaje de error de validación.  

#### Evidencias CP09

1. Evidencia SEG09
![CP-SEG-09](imagenes/pruebas-3-sprint01-caso09-evidencia01.png "CP-SEG-09")

#### Estado CP09

⬜ Pendiente

---

### CP-SEG-10 — Validación en el backend (seguridad adicional)

**Objetivo:**  
Verificar que el backend también valida.

#### Pasos CP10

1. Usando Postman o DevTools (edita el request antes de enviarlo), envía `passwordRequiredLength: 0`.  
2. Observa la respuesta del backend.  

#### Resultado esperado CP10

- El backend retorna 400 Bad Request con mensaje de validación.  
- En el frontend, si esto se presenta, aparece un Snackbar rojo con el mensaje del error.  

#### Evidencias CP10

1. Evidencia SEG10
![CP-SEG-10](imagenes/pruebas-3-sprint01-caso10-evidencia01.png "CP-SEG-10")

#### Estado CP10

⬜ Pendiente

---

### CP-SEG-11 — Solo se envían los campos modificados

**Objetivo:**  
Verificar que la actualización es parcial (patch).

#### Pasos CP11

1. Con DevTools → Network abierto, cambia únicamente el valor de "Intentos fallidos máximos" de 5 a 3.  
2. Haz click en "Guardar cambios".  
3. Inspecciona el body del request PUT en la pestaña Network.  

#### Resultado esperado CP11

- El body del request solo contiene `{ "lockoutMaxFailedAttempts": 3 }`.  
- NO incluye los demás campos (que no se modificaron).  

#### Limpieza CP11

- Restaura "Intentos fallidos máximos" a 5 y guarda.  

#### Evidencias CP11

1. Evidencia SEG11
![CP-SEG-11](imagenes/pruebas-3-sprint01-caso11-evidencia01.png "CP-SEG-11")

#### Estado CP11

⬜ Pendiente

---

### CP-SEG-12 — El texto de auditoría se actualiza tras guardar

**Objetivo:**  
Verificar la información de auditoría.

#### Pasos CP12

1. Anota la hora y el `updatedBy` que muestra la pantalla.  
2. Modifica cualquier campo y guarda.  

#### Resultado esperado CP12

- El texto "Última modificación" muestra la nueva hora (más reciente que la anotada).  
- El campo "por ..." muestra el email del admin que realizó el cambio (`admin@test.com`).  

#### Evidencias CP12

1. Evidencia SEG12
![CP-SEG-12](imagenes/pruebas-3-sprint01-caso12-evidencia01.png "CP-SEG-12")

#### Estado CP12

⬜ Pendiente

---

### CP-SEG-13 — Manejo de error de red

**Objetivo:**  
Verificar el comportamiento si el backend no responde.

#### Pasos CP13

1. Detén el backend (o usa DevTools para bloquear las peticiones al endpoint).  
2. Intenta guardar un cambio.  

#### Resultado esperado CP13

- Aparece un Snackbar rojo con un mensaje de error (ej. "Error al guardar la configuración").  
- El formulario no se vacía ni se corrompe.  
- Al restablecer la conexión, el formulario puede intentar guardar nuevamente.  

#### Evidencias CP13

1. Evidencia SEG13
![CP-SEG-13](imagenes/pruebas-3-sprint01-caso13-evidencia01.png "CP-SEG-13")

#### Estado CP13

⬜ Pendiente

---

### CP-SEG-14 — Pantalla es accesible desde el menú

**Objetivo:**  
Verificar la navegación desde el menú.

#### Pasos CP14

1. Inicia sesión con `admin@test.com`.  
2. En el menú lateral, busca "Parámetros de Seguridad".  
3. Haz click en el ítem.  

#### Resultado esperado CP14

- Navega a `/app/config-seguridad`.  
- La pantalla carga correctamente.  

#### Evidencias CP14

1. Evidencia SEG14
![CP-SEG-14](imagenes/pruebas-3-sprint01-caso14-evidencia01.png "CP-SEG-14")

#### Estado CP14

⬜ Pendiente

---

# Pruebas de Regresión

---

## CR-SEG-01 — Login sigue funcionando tras cambio de políticas

**Objetivo:**  
Verificar que el cambio de políticas de contraseña no afecta el login.

### Pasos

1. Asegúrate de que los parámetros están en sus valores originales (longitud = 6, etc.).  
2. Haz logout.  
3. Inicia sesión con `admin@test.com`.  

### Resultado esperado

- El login funciona correctamente con las credenciales existentes.  
- No hay errores de "contraseña no cumple políticas" al autenticar.  

---

## CR-SEG-02 — Cambio de contraseña respeta la nueva política

**Objetivo:**  
Verificar que el cambio de política afecta la pantalla de cambio de contraseña.

**Precondición:** Cambiar `passwordRequiredLength` a 10.

### Pasos

1. Navega a `/app/cambiar-contrasena`.  
2. Intenta cambiar la contraseña a una de 8 caracteres.  

### Resultado esperado

- El backend rechaza la contraseña (muy corta para la política actual de 10).  
- El frontend muestra el error del backend.  

**Limpieza:**  
Restaura `passwordRequiredLength` a 6 en la pantalla de parámetros.  

---
