---
mode: agent
---

Vamos a crear un componente en React para configurar el mapeo de carga de datos. El componente debe permitir al usuario:

- Subir un archivo Excel o CSV.
- Visualizar los campos detectados en el archivo. Deben estar en la primera fila del archivo. Estos serán los campos de origen.
- Seleccionar una tabla destino
- Mapear los campos de origen a los campos de destino
- Establecer valores por defecto y marcar campos como requeridos.

El componente se llamará "ConfigMapeoCarga" y se creará en el archivo: src\features\upload\components\ConfigMapeoCarga.tsx
