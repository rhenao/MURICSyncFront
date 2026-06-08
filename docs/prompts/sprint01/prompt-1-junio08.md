# Prompt 1 junio 8 de 2026 - Armar plan general de trabajo

## Contexto

Ayer hicimos (tu y yo) los cambios relacionados a tres temas en el Backend:

    - RBAC con Permisos Granulares: El objetivo es evolucionar el sistema de autorización de RBAC puro (roles predefinidos) a un modelo de **roles + permisos granulares**.
    - Reporte de Usuarios: Se requiere un endpoint de reporte de usuarios que exponga: **Estado (activo/inactivo), last login, rol(es), nombre y apellido**, con soporte para filtrado, paginación y exportación a CSV.
    - Políticas y Parámetros de Seguridad configurables: Mover los parámetros de seguridad (contraseña, bloqueo, etc.) de código duro en `Program.cs` a una tabla en PostgreSQL, accesible y modificable vía API REST, con efecto inmediato sin reiniciar la aplicación.

Para que obtengas información mas detallada de cada tema, te doy la ruta y nombre de cada uno de los documentos que creamos para cada plan:
    - `"E:\NewProjects\Titularice\MURIC\MURICSyncBack\docs\prompts\sprint01\plan-1-sprint01.md"`
    - `"E:\NewProjects\Titularice\MURIC\MURICSyncBack\docs\prompts\sprint01\plan-2-sprint01.md"`
    - `"E:\NewProjects\Titularice\MURIC\MURICSyncBack\docs\prompts\sprint01\plan-3-sprint01.md"`

Tengo los resumenes que entregaste después de la ejecución de cada tarea de cada plan:
    - `"E:\NewProjects\Titularice\MURIC\MURICSyncBack\docs\prompts\sprint01\plan-1-sprint01-final.md"`
    - `"E:\NewProjects\Titularice\MURIC\MURICSyncBack\docs\prompts\sprint01\plan-2-sprint01-final.md"`
    - `"E:\NewProjects\Titularice\MURIC\MURICSyncBack\docs\prompts\sprint01\plan-3-sprint01-final.md"`

## Tareas

### Tarea 1

Quiero implementar en el Frontend, los tres cambios que ya implementamos en el backend, o sea:

    - RBAC con Permisos Granulares: El objetivo es evolucionar el sistema de autorización de RBAC puro (roles predefinidos) a un modelo de **roles + permisos granulares**.
    - Reporte de Usuarios: Se requiere un endpoint de reporte de usuarios que exponga: **Estado (activo/inactivo), last login, rol(es), nombre y apellido**, con soporte para filtrado, paginación y exportación a CSV.
    - Políticas y Parámetros de Seguridad configurables: Mover los parámetros de seguridad (contraseña, bloqueo, etc.) de código duro en `Program.cs` a una tabla en PostgreSQL, accesible y modificable vía API REST, con efecto inmediato sin reiniciar la aplicación.

Quiero que los hagamos de la siguiente manera:
    - Crea un plan para cada uno de los tres temas, en el que relaciones las tareas que debemos llevar a cabo. Crea el archivo en esta ruta:`E:\newprojects\titularice\muric\muricsyncfront\docs\prompts\sprint01\` y que el nombre tenga el siguiente patrón: `plan-1-sprint01.md`
    - En cada tarea del plan, adiciona el texto del prompt que debo pasarte para que realices la tarea. Agrega en el prompt como "formato de entrega": "Crear un archivo .md, cn los resultados de la tarea"
    - Por cada plan crea también el plan de pruebas correspondiente. Crea el archivo en esta ruta:`E:\newprojects\titularice\muric\muricsyncfront\docs\prompts\sprint01\` y que el nombre tenga el siguiente patrón: `pruebas-1-sprint01.md`
