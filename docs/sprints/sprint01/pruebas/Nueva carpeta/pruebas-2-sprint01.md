# Plan de Pruebas Sprint 01 — Reporte de Usuarios (Frontend)

**Proyecto:** MURICSyncFront  
**Fecha:** 2026-06-08  
**Rama:** `rhenao-sprint04`

---

## Alcance

Verificar que la pantalla de Reporte de Usuarios consume correctamente los endpoints del backend, aplica los filtros, pagina los resultados del lado del servidor, y descarga el CSV correctamente.

---

## Precondiciones

- El backend (MURICSyncBack) debe estar corriendo con la migración `AddUserLastLoginAt` aplicada.
- En la base de datos existen al menos 10 usuarios de prueba con variedad de:
  - Roles (ADMIN, OPERADOR, CONSULTA, SEGURIDAD)
  - Estado activo/inactivo (al menos 2 inactivos)
  - Fecha de último login variada (algunos sin login registrado)
- Usuario `admin@test.com` con permiso `usuarios.read` (rol ADMIN).
- Usuario `operador@test.com` sin permiso `usuarios.read`.

---

## Casos de Prueba

### CP-REP-01 — Acceso a la pantalla con permiso correcto

**Objetivo:** Verificar que el usuario con `usuarios.read` puede acceder.

**Pasos:**
1. Inicia sesión con `admin@test.com`.
2. Navega a `/app/reporte-usuarios` (o usa el ítem del menú "Reporte de Usuarios").

**Resultado esperado:**
- La pantalla carga correctamente.
- Se muestra el panel de filtros y la tabla.
- La tabla carga y muestra los usuarios de la base de datos.

---

### CP-REP-02 — Acceso sin permiso redirige

**Objetivo:** Verificar el control de acceso.

**Pasos:**
1. Inicia sesión con `operador@test.com`.
2. Navega directamente a `/app/reporte-usuarios`.

**Resultado esperado:**
- El navegador redirige a `/app`.
- La pantalla de reporte no se muestra.
- El ítem "Reporte de Usuarios" no aparece en el menú.

---

### CP-REP-03 — Tabla muestra las columnas correctas

**Objetivo:** Verificar la estructura de la tabla.

**Pasos:**
1. Navega a `/app/reporte-usuarios`.
2. Observa las columnas de la tabla.

**Resultado esperado:**
- La tabla tiene las columnas: Nombre, Apellido, Email, Estado, Último Login, Creado, Roles.
- La columna "Estado" muestra un chip de color (verde para Activo, rojo para Inactivo).
- La columna "Último Login" muestra "Nunca" para usuarios sin login registrado.
- La columna "Roles" muestra chips por cada rol del usuario.

---

### CP-REP-04 — Filtro por estado Activo

**Objetivo:** Verificar el filtro de estado.

**Pasos:**
1. En el panel de filtros, selecciona "Activo" en el campo Estado.
2. Haz click en "Buscar".

**Resultado esperado:**
- La tabla solo muestra usuarios con estado Activo.
- Ninguna fila muestra el chip "Inactivo".
- El `totalCount` en la paginación refleja solo los usuarios activos.

---

### CP-REP-05 — Filtro por estado Inactivo

**Pasos:**
1. Selecciona "Inactivo" en el campo Estado.
2. Haz click en "Buscar".

**Resultado esperado:**
- La tabla solo muestra usuarios con estado Inactivo.
- Todos los chips de estado muestran "Inactivo".

---

### CP-REP-06 — Filtro Todos (sin filtro de estado)

**Pasos:**
1. Selecciona "Todos" en el campo Estado.
2. Haz click en "Buscar".

**Resultado esperado:**
- La tabla muestra usuarios activos e inactivos.
- El total refleja todos los usuarios.

---

### CP-REP-07 — Filtro por rol

**Objetivo:** Verificar el filtro por nombre de rol.

**Pasos:**
1. En el campo "Rol", escribe `ADMIN`.
2. Haz click en "Buscar".

**Resultado esperado:**
- La tabla solo muestra usuarios que tienen el rol `ADMIN`.
- La columna "Roles" de cada fila incluye el chip "ADMIN".

---

### CP-REP-08 — Filtro por búsqueda (nombre/apellido/email)

**Objetivo:** Verificar la búsqueda de texto libre.

**Pasos:**
1. En el campo "Búsqueda", escribe parte del nombre de un usuario conocido (ej. primeras 3 letras del apellido).
2. Haz click en "Buscar".

**Resultado esperado:**
- La tabla muestra solo los usuarios cuyo nombre, apellido o email contengan el texto buscado.
- Los resultados son insensibles a mayúsculas/minúsculas.

---

### CP-REP-09 — Búsqueda sin resultados

**Pasos:**
1. En el campo "Búsqueda", escribe un texto que no coincide con ningún usuario (ej. `zzzzzzzzz`).
2. Haz click en "Buscar".

**Resultado esperado:**
- La tabla muestra 0 filas.
- Aparece un mensaje indicando que no hay resultados (comportamiento de MaterialReactTable).
- El `totalCount` muestra 0.

---

### CP-REP-10 — Filtro por rango de último login

**Objetivo:** Verificar los filtros de fecha.

**Pasos:**
1. En "Último login desde", selecciona una fecha de hace 7 días.
2. En "Último login hasta", selecciona la fecha de hoy.
3. Haz click en "Buscar".

**Resultado esperado:**
- La tabla solo muestra usuarios cuyo `lastLoginAt` cae dentro del rango.
- Usuarios sin último login ("Nunca") no aparecen en los resultados.

---

### CP-REP-11 — Limpiar filtros

**Objetivo:** Verificar el botón Limpiar.

**Pasos:**
1. Aplica algunos filtros (ej. estado Activo, búsqueda = "test").
2. Haz click en "Limpiar".

**Resultado esperado:**
- Todos los campos de filtro regresan a su valor por defecto (Estado = Todos, búsqueda vacía, fechas vacías).
- La tabla recarga con todos los usuarios (sin filtros).

---

### CP-REP-12 — Paginación del lado del servidor

**Objetivo:** Verificar que la paginación se hace en el servidor.

**Pasos:**
1. Asegúrate de que hay más de 50 usuarios en la DB (o cambia el pageSize a 5 para probar).
2. Navega a la segunda página usando los controles de paginación de MRT.

**Resultado esperado:**
- La tabla muestra usuarios distintos a la primera página.
- La URL o el estado indica que está en la página 2.
- Se realiza una nueva llamada al backend (visible en DevTools → Network tab) con `page=2`.

---

### CP-REP-13 — Cambio de tamaño de página

**Pasos:**
1. En los controles de paginación, cambia el tamaño de página de 50 a 10.

**Resultado esperado:**
- La tabla muestra máximo 10 filas.
- Se realiza una nueva llamada al backend con `pageSize=10`.
- El número total de páginas se recalcula correctamente.

---

### CP-REP-14 — Combinación de filtros y paginación

**Objetivo:** Verificar que los filtros se mantienen al paginar.

**Pasos:**
1. Aplica filtro por estado "Activo" y haz click en "Buscar".
2. Si hay más de una página de resultados, navega a la página 2.

**Resultado esperado:**
- La segunda página sigue mostrando solo usuarios activos.
- Los filtros no se resetean al cambiar de página.

---

### CP-REP-15 — Exportar CSV (descarga el archivo)

**Objetivo:** Verificar la descarga del CSV.

**Pasos:**
1. Sin aplicar filtros, haz click en "Exportar CSV".

**Resultado esperado:**
- El navegador descarga un archivo con nombre `reporte-usuarios-YYYYMMDD.csv`.
- La descarga inicia automáticamente sin necesidad de abrir una nueva pestaña.
- El botón muestra un indicador de carga (spinner o texto "Exportando...") mientras descarga.

---

### CP-REP-16 — El CSV exportado tiene el formato correcto

**Objetivo:** Verificar el contenido del CSV.

**Pasos:**
1. Descarga el CSV.
2. Abre el archivo en Excel o un editor de texto.

**Resultado esperado:**
- La primera fila es el encabezado: `Id,Email,Nombre,Apellido,NombreCompleto,Estado,UltimoLogin,FechaCreacion,Roles`
- Las filas de datos tienen valores en las columnas correspondientes.
- La columna "Estado" tiene "Activo" o "Inactivo" (no `true`/`false`).
- La columna "Roles" tiene los roles separados por `|` (ej. `ADMIN|OPERADOR`).
- Los acentos/tildes se muestran correctamente en Excel (indica BOM UTF-8 correcto).

---

### CP-REP-17 — CSV exportado aplica los filtros activos

**Objetivo:** Verificar que el export respeta los filtros.

**Pasos:**
1. Aplica el filtro estado = "Activo".
2. Haz click en "Buscar".
3. Haz click en "Exportar CSV".
4. Abre el archivo descargado.

**Resultado esperado:**
- El CSV solo contiene usuarios con estado "Activo".
- La columna "Estado" tiene solo "Activo" en todas las filas.

---

### CP-REP-18 — Indicador de carga durante la búsqueda

**Objetivo:** Verificar el feedback visual durante las operaciones.

**Pasos:**
1. Aplica un filtro y haz click en "Buscar" con la red simulada lenta (DevTools → Network → Slow 3G).

**Resultado esperado:**
- La tabla muestra un indicador de carga (skeleton, spinner o `progressBar` de MRT) mientras espera la respuesta.
- Los controles de filtro están deshabilitados o el botón "Buscar" muestra un spinner.
- Al completar la carga, se muestran los resultados.

---

## Pruebas de Regresión

### CR-REP-01 — ListUsers no se ve afectada

**Objetivo:** Verificar que la pantalla original de usuarios no se rompe.

**Pasos:**
1. Navega a `/app/lista-usuarios`.
2. Verifica que carga correctamente y muestra los usuarios.
3. Intenta editar un usuario.

**Resultado esperado:**
- La pantalla `ListUsers` funciona exactamente igual que antes del sprint.
