# Plan de Pruebas Sprint 01 — Reporte de Usuarios (Frontend)

**Proyecto:** MURICSyncFront  
**Fecha:** 2026-06-08  
**Rama:** `rhenao-sprint04`  
**Sprint:** 01  
**Módulo:** Reporte de Usuarios  
**Tester:** Rolando Henao  

---

## Tabla de Contenido

- [Plan de Pruebas Sprint 01 — Reporte de Usuarios (Frontend)](#plan-de-pruebas-sprint-01--reporte-de-usuarios-frontend)
  - [Tabla de Contenido](#tabla-de-contenido)
  - [Alcance](#alcance)
  - [Precondiciones](#precondiciones)
  - [Casos de Prueba](#casos-de-prueba)
    - [CP-REP-01 — Acceso a la pantalla con permiso correcto](#cp-rep-01--acceso-a-la-pantalla-con-permiso-correcto)
      - [Pasos CP01](#pasos-cp01)
      - [Resultado esperado CP01](#resultado-esperado-cp01)
      - [Evidencias CP01](#evidencias-cp01)
      - [Estado CP01](#estado-cp01)
    - [CP-REP-02 — Acceso sin permiso redirige](#cp-rep-02--acceso-sin-permiso-redirige)
      - [Pasos CP02](#pasos-cp02)
      - [Resultado esperado CP02](#resultado-esperado-cp02)
      - [Evidencias CP02](#evidencias-cp02)
      - [Estado CP02](#estado-cp02)
    - [CP-REP-03 — Tabla muestra las columnas correctas](#cp-rep-03--tabla-muestra-las-columnas-correctas)
      - [Pasos CP03](#pasos-cp03)
      - [Resultado esperado CP03](#resultado-esperado-cp03)
      - [Evidencias CP03](#evidencias-cp03)
      - [Estado CP03](#estado-cp03)
    - [CP-REP-04 — Filtro por estado Activo](#cp-rep-04--filtro-por-estado-activo)
      - [Pasos CP04](#pasos-cp04)
      - [Resultado esperado CP04](#resultado-esperado-cp04)
      - [Evidencias CP04](#evidencias-cp04)
      - [Estado CP04](#estado-cp04)
    - [CP-REP-05 — Filtro por estado Inactivo](#cp-rep-05--filtro-por-estado-inactivo)
      - [Pasos CP05](#pasos-cp05)
      - [Resultado esperado CP05](#resultado-esperado-cp05)
      - [Evidencias CP05](#evidencias-cp05)
      - [Estado CP05](#estado-cp05)
    - [CP-REP-06 — Filtro Todos (sin filtro de estado)](#cp-rep-06--filtro-todos-sin-filtro-de-estado)
      - [Pasos CP06](#pasos-cp06)
      - [Resultado esperado CP06](#resultado-esperado-cp06)
      - [Evidencias CP06](#evidencias-cp06)
      - [Estado CP06](#estado-cp06)
    - [CP-REP-07 — Filtro por rol](#cp-rep-07--filtro-por-rol)
      - [Pasos CP07](#pasos-cp07)
      - [Resultado esperado CP07](#resultado-esperado-cp07)
      - [Evidencias CP07](#evidencias-cp07)
      - [Estado CP07](#estado-cp07)
    - [CP-REP-08 — Filtro por búsqueda (nombre/apellido/email)](#cp-rep-08--filtro-por-búsqueda-nombreapellidoemail)
      - [Pasos CP08](#pasos-cp08)
      - [Resultado esperado CP08](#resultado-esperado-cp08)
      - [Evidencias CP08](#evidencias-cp08)
      - [Estado CP08](#estado-cp08)
    - [CP-REP-09 — Búsqueda sin resultados](#cp-rep-09--búsqueda-sin-resultados)
      - [Pasos CP09](#pasos-cp09)
      - [Resultado esperado CP09](#resultado-esperado-cp09)
      - [Evidencias CP09](#evidencias-cp09)
      - [Estado CP09](#estado-cp09)
    - [CP-REP-10 — Filtro por rango de último login](#cp-rep-10--filtro-por-rango-de-último-login)
      - [Pasos CP10](#pasos-cp10)
      - [Resultado esperado CP10](#resultado-esperado-cp10)
      - [Evidencias CP10](#evidencias-cp10)
      - [Estado CP10](#estado-cp10)
    - [CP-REP-11 — Limpiar filtros](#cp-rep-11--limpiar-filtros)
      - [Pasos CP11](#pasos-cp11)
      - [Resultado esperado CP11](#resultado-esperado-cp11)
      - [Evidencias CP11](#evidencias-cp11)
      - [Estado CP11](#estado-cp11)
    - [CP-REP-12 — Paginación del lado del servidor](#cp-rep-12--paginación-del-lado-del-servidor)
      - [Pasos CP12](#pasos-cp12)
      - [Resultado esperado CP12](#resultado-esperado-cp12)
      - [Evidencias CP12](#evidencias-cp12)
      - [Estado CP12](#estado-cp12)
    - [CP-REP-13 — Cambio de tamaño de página](#cp-rep-13--cambio-de-tamaño-de-página)
      - [Pasos CP13](#pasos-cp13)
      - [Resultado esperado CP13](#resultado-esperado-cp13)
      - [Evidencias CP13](#evidencias-cp13)
      - [Estado CP13](#estado-cp13)
    - [CP-REP-14 — Combinación de filtros y paginación](#cp-rep-14--combinación-de-filtros-y-paginación)
      - [Pasos CP14](#pasos-cp14)
      - [Resultado esperado CP14](#resultado-esperado-cp14)
      - [Evidencias CP14](#evidencias-cp14)
      - [Estado CP14](#estado-cp14)
    - [CP-REP-15 — Exportar CSV (descarga el archivo)](#cp-rep-15--exportar-csv-descarga-el-archivo)
      - [Pasos CP15](#pasos-cp15)
      - [Resultado esperado CP15](#resultado-esperado-cp15)
      - [Evidencias CP15](#evidencias-cp15)
      - [Estado CP15](#estado-cp15)
    - [CP-REP-16 — El CSV exportado tiene el formato correcto](#cp-rep-16--el-csv-exportado-tiene-el-formato-correcto)
      - [Pasos CP16](#pasos-cp16)
      - [Resultado esperado CP16](#resultado-esperado-cp16)
      - [Evidencias CP16](#evidencias-cp16)
      - [Estado CP16](#estado-cp16)
    - [CP-REP-17 — CSV exportado aplica los filtros activos](#cp-rep-17--csv-exportado-aplica-los-filtros-activos)
      - [Pasos CP17](#pasos-cp17)
      - [Resultado esperado CP17](#resultado-esperado-cp17)
      - [Evidencias CP17](#evidencias-cp17)
      - [Estado CP17](#estado-cp17)
    - [CP-REP-18 — Indicador de carga durante la búsqueda](#cp-rep-18--indicador-de-carga-durante-la-búsqueda)
      - [Pasos CP18](#pasos-cp18)
      - [Resultado esperado CP18](#resultado-esperado-cp18)
      - [Evidencias CP18](#evidencias-cp18)
      - [Estado CP18](#estado-cp18)
- [Pruebas de Regresión](#pruebas-de-regresión)
  - [CR-REP-01 — ListUsers no se ve afectada](#cr-rep-01--listusers-no-se-ve-afectada)
    - [Pasos](#pasos)
    - [Resultado esperado](#resultado-esperado)

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

---

### CP-REP-01 — Acceso a la pantalla con permiso correcto

**Objetivo:**  
Verificar que el usuario con `usuarios.read` puede acceder.

#### Pasos CP01

1. Inicia sesión con `admin@test.com`.  
2. Navega a `/app/reporte-usuarios` (o usa el ítem del menú "Reporte de Usuarios").  

#### Resultado esperado CP01

- La pantalla carga correctamente.  
- Se muestra el panel de filtros y la tabla.  
- La tabla carga y muestra los usuarios de la base de datos.  

#### Evidencias CP01

1. Evidencia REP01
![CP-REP-01](imagenes/pruebas-2-sprint01-caso01-evidencia01.png "CP-REP-01")

#### Estado CP01

⬜ Pendiente

---

### CP-REP-02 — Acceso sin permiso redirige

**Objetivo:**  
Verificar el control de acceso.

#### Pasos CP02

1. Inicia sesión con `operador@test.com`.  
2. Navega directamente a `/app/reporte-usuarios`.  

#### Resultado esperado CP02

- El navegador redirige a `/app`.  
- La pantalla de reporte no se muestra.  
- El ítem "Reporte de Usuarios" no aparece en el menú.  

#### Evidencias CP02

1. Evidencia REP02
![CP-REP-02](imagenes/pruebas-2-sprint01-caso02-evidencia01.png "CP-REP-02")

#### Estado CP02

⬜ Pendiente

---

### CP-REP-03 — Tabla muestra las columnas correctas

**Objetivo:**  
Verificar la estructura de la tabla.

#### Pasos CP03

1. Navega a `/app/reporte-usuarios`.  
2. Observa las columnas de la tabla.  

#### Resultado esperado CP03

- La tabla tiene las columnas: Nombre, Apellido, Email, Estado, Último Login, Creado, Roles.  
- La columna "Estado" muestra un chip de color (verde para Activo, rojo para Inactivo).  
- La columna "Último Login" muestra "Nunca" para usuarios sin login registrado.  
- La columna "Roles" muestra chips por cada rol del usuario.  

#### Evidencias CP03

1. Evidencia REP03
![CP-REP-03](imagenes/pruebas-2-sprint01-caso03-evidencia01.png "CP-REP-03")

#### Estado CP03

⬜ Pendiente

---

### CP-REP-04 — Filtro por estado Activo

**Objetivo:**  
Verificar el filtro de estado.

#### Pasos CP04

1. En el panel de filtros, selecciona "Activo" en el campo Estado.  
2. Haz click en "Buscar".  

#### Resultado esperado CP04

- La tabla solo muestra usuarios con estado Activo.  
- Ninguna fila muestra el chip "Inactivo".  
- El `totalCount` en la paginación refleja solo los usuarios activos.  

#### Evidencias CP04

1. Evidencia REP04
![CP-REP-04](imagenes/pruebas-2-sprint01-caso04-evidencia01.png "CP-REP-04")

#### Estado CP04

⬜ Pendiente

---

### CP-REP-05 — Filtro por estado Inactivo

**Objetivo:**  
Verificar el filtro de estado Inactivo.

#### Pasos CP05

1. Selecciona "Inactivo" en el campo Estado.  
2. Haz click en "Buscar".  

#### Resultado esperado CP05

- La tabla solo muestra usuarios con estado Inactivo.  
- Todos los chips de estado muestran "Inactivo".  

#### Evidencias CP05

1. Evidencia REP05
![CP-REP-05](imagenes/pruebas-2-sprint01-caso05-evidencia01.png "CP-REP-05")

#### Estado CP05

⬜ Pendiente

---

### CP-REP-06 — Filtro Todos (sin filtro de estado)

**Objetivo:**  
Verificar que la opción "Todos" muestra todos los usuarios sin filtro de estado.

#### Pasos CP06

1. Selecciona "Todos" en el campo Estado.  
2. Haz click en "Buscar".  

#### Resultado esperado CP06

- La tabla muestra usuarios activos e inactivos.  
- El total refleja todos los usuarios.  

#### Evidencias CP06

1. Evidencia REP06
![CP-REP-06](imagenes/pruebas-2-sprint01-caso06-evidencia01.png "CP-REP-06")

#### Estado CP06

⬜ Pendiente

---

### CP-REP-07 — Filtro por rol

**Objetivo:**  
Verificar el filtro por nombre de rol.

#### Pasos CP07

1. En el campo "Rol", escribe `ADMIN`.  
2. Haz click en "Buscar".  

#### Resultado esperado CP07

- La tabla solo muestra usuarios que tienen el rol `ADMIN`.  
- La columna "Roles" de cada fila incluye el chip "ADMIN".  

#### Evidencias CP07

1. Evidencia REP07
![CP-REP-07](imagenes/pruebas-2-sprint01-caso07-evidencia01.png "CP-REP-07")

#### Estado CP07

⬜ Pendiente

---

### CP-REP-08 — Filtro por búsqueda (nombre/apellido/email)

**Objetivo:**  
Verificar la búsqueda de texto libre.

#### Pasos CP08

1. En el campo "Búsqueda", escribe parte del nombre de un usuario conocido (ej. primeras 3 letras del apellido).  
2. Haz click en "Buscar".  

#### Resultado esperado CP08

- La tabla muestra solo los usuarios cuyo nombre, apellido o email contengan el texto buscado.  
- Los resultados son insensibles a mayúsculas/minúsculas.  

#### Evidencias CP08

1. Evidencia REP08
![CP-REP-08](imagenes/pruebas-2-sprint01-caso08-evidencia01.png "CP-REP-08")

#### Estado CP08

⬜ Pendiente

---

### CP-REP-09 — Búsqueda sin resultados

**Objetivo:**  
Verificar el comportamiento cuando la búsqueda no retorna resultados.

#### Pasos CP09

1. En el campo "Búsqueda", escribe un texto que no coincide con ningún usuario (ej. `zzzzzzzzz`).  
2. Haz click en "Buscar".  

#### Resultado esperado CP09

- La tabla muestra 0 filas.  
- Aparece un mensaje indicando que no hay resultados (comportamiento de MaterialReactTable).  
- El `totalCount` muestra 0.  

#### Evidencias CP09

1. Evidencia REP09
![CP-REP-09](imagenes/pruebas-2-sprint01-caso09-evidencia01.png "CP-REP-09")

#### Estado CP09

⬜ Pendiente

---

### CP-REP-10 — Filtro por rango de último login

**Objetivo:**  
Verificar los filtros de fecha.

#### Pasos CP10

1. En "Último login desde", selecciona una fecha de hace 7 días.  
2. En "Último login hasta", selecciona la fecha de hoy.  
3. Haz click en "Buscar".  

#### Resultado esperado CP10

- La tabla solo muestra usuarios cuyo `lastLoginAt` cae dentro del rango.  
- Usuarios sin último login ("Nunca") no aparecen en los resultados.  

#### Evidencias CP10

1. Evidencia REP10
![CP-REP-10](imagenes/pruebas-2-sprint01-caso10-evidencia01.png "CP-REP-10")

#### Estado CP10

⬜ Pendiente

---

### CP-REP-11 — Limpiar filtros

**Objetivo:**  
Verificar el botón Limpiar.

#### Pasos CP11

1. Aplica algunos filtros (ej. estado Activo, búsqueda = "test").  
2. Haz click en "Limpiar".  

#### Resultado esperado CP11

- Todos los campos de filtro regresan a su valor por defecto (Estado = Todos, búsqueda vacía, fechas vacías).  
- La tabla recarga con todos los usuarios (sin filtros).  

#### Evidencias CP11

1. Evidencia REP11
![CP-REP-11](imagenes/pruebas-2-sprint01-caso11-evidencia01.png "CP-REP-11")

#### Estado CP11

⬜ Pendiente

---

### CP-REP-12 — Paginación del lado del servidor

**Objetivo:**  
Verificar que la paginación se hace en el servidor.

#### Pasos CP12

1. Asegúrate de que hay más de 50 usuarios en la DB (o cambia el pageSize a 5 para probar).  
2. Navega a la segunda página usando los controles de paginación de MRT.  

#### Resultado esperado CP12

- La tabla muestra usuarios distintos a la primera página.  
- La URL o el estado indica que está en la página 2.  
- Se realiza una nueva llamada al backend (visible en DevTools → Network tab) con `page=2`.  

#### Evidencias CP12

1. Evidencia REP12
![CP-REP-12](imagenes/pruebas-2-sprint01-caso12-evidencia01.png "CP-REP-12")

#### Estado CP12

⬜ Pendiente

---

### CP-REP-13 — Cambio de tamaño de página

**Objetivo:**  
Verificar el cambio de tamaño de página y su efecto en la paginación.

#### Pasos CP13

1. En los controles de paginación, cambia el tamaño de página de 50 a 10.  

#### Resultado esperado CP13

- La tabla muestra máximo 10 filas.  
- Se realiza una nueva llamada al backend con `pageSize=10`.  
- El número total de páginas se recalcula correctamente.  

#### Evidencias CP13

1. Evidencia REP13
![CP-REP-13](imagenes/pruebas-2-sprint01-caso13-evidencia01.png "CP-REP-13")

#### Estado CP13

⬜ Pendiente

---

### CP-REP-14 — Combinación de filtros y paginación

**Objetivo:**  
Verificar que los filtros se mantienen al paginar.

#### Pasos CP14

1. Aplica filtro por estado "Activo" y haz click en "Buscar".  
2. Si hay más de una página de resultados, navega a la página 2.  

#### Resultado esperado CP14

- La segunda página sigue mostrando solo usuarios activos.  
- Los filtros no se resetean al cambiar de página.  

#### Evidencias CP14

1. Evidencia REP14
![CP-REP-14](imagenes/pruebas-2-sprint01-caso14-evidencia01.png "CP-REP-14")

#### Estado CP14

⬜ Pendiente

---

### CP-REP-15 — Exportar CSV (descarga el archivo)

**Objetivo:**  
Verificar la descarga del CSV.

#### Pasos CP15

1. Sin aplicar filtros, haz click en "Exportar CSV".  

#### Resultado esperado CP15

- El navegador descarga un archivo con nombre `reporte-usuarios-YYYYMMDD.csv`.  
- La descarga inicia automáticamente sin necesidad de abrir una nueva pestaña.  
- El botón muestra un indicador de carga (spinner o texto "Exportando...") mientras descarga.  

#### Evidencias CP15

1. Evidencia REP15
![CP-REP-15](imagenes/pruebas-2-sprint01-caso15-evidencia01.png "CP-REP-15")

#### Estado CP15

⬜ Pendiente

---

### CP-REP-16 — El CSV exportado tiene el formato correcto

**Objetivo:**  
Verificar el contenido del CSV.

#### Pasos CP16

1. Descarga el CSV.  
2. Abre el archivo en Excel o un editor de texto.  

#### Resultado esperado CP16

- La primera fila es el encabezado: `Id,Email,Nombre,Apellido,NombreCompleto,Estado,UltimoLogin,FechaCreacion,Roles`  
- Las filas de datos tienen valores en las columnas correspondientes.  
- La columna "Estado" tiene "Activo" o "Inactivo" (no `true`/`false`).  
- La columna "Roles" tiene los roles separados por `|` (ej. `ADMIN|OPERADOR`).  
- Los acentos/tildes se muestran correctamente en Excel (indica BOM UTF-8 correcto).  

#### Evidencias CP16

1. Evidencia REP16
![CP-REP-16](imagenes/pruebas-2-sprint01-caso16-evidencia01.png "CP-REP-16")

#### Estado CP16

⬜ Pendiente

---

### CP-REP-17 — CSV exportado aplica los filtros activos

**Objetivo:**  
Verificar que el export respeta los filtros.

#### Pasos CP17

1. Aplica el filtro estado = "Activo".  
2. Haz click en "Buscar".  
3. Haz click en "Exportar CSV".  
4. Abre el archivo descargado.  

#### Resultado esperado CP17

- El CSV solo contiene usuarios con estado "Activo".  
- La columna "Estado" tiene solo "Activo" en todas las filas.  

#### Evidencias CP17

1. Evidencia REP17
![CP-REP-17](imagenes/pruebas-2-sprint01-caso17-evidencia01.png "CP-REP-17")

#### Estado CP17

⬜ Pendiente

---

### CP-REP-18 — Indicador de carga durante la búsqueda

**Objetivo:**  
Verificar el feedback visual durante las operaciones.

#### Pasos CP18

1. Aplica un filtro y haz click en "Buscar" con la red simulada lenta (DevTools → Network → Slow 3G).  

#### Resultado esperado CP18

- La tabla muestra un indicador de carga (skeleton, spinner o `progressBar` de MRT) mientras espera la respuesta.  
- Los controles de filtro están deshabilitados o el botón "Buscar" muestra un spinner.  
- Al completar la carga, se muestran los resultados.  

#### Evidencias CP18

1. Evidencia REP18
![CP-REP-18](imagenes/pruebas-2-sprint01-caso18-evidencia01.png "CP-REP-18")

#### Estado CP18

⬜ Pendiente

---

# Pruebas de Regresión

---

## CR-REP-01 — ListUsers no se ve afectada

**Objetivo:**  
Verificar que la pantalla original de usuarios no se rompe.

### Pasos

1. Navega a `/app/lista-usuarios`.  
2. Verifica que carga correctamente y muestra los usuarios.  
3. Intenta editar un usuario.  

### Resultado esperado

- La pantalla `ListUsers` funciona exactamente igual que antes del sprint.  

---
