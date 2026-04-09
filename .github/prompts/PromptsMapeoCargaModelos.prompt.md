---
mode: agent
---

Vamos a crear los modelos para cada una de las siguientes tablas sql:

Tabla: MapeoCarga
CREATE TABLE MapeoCarga (
IdMapeoCarga INT PRIMARY KEY IDENTITY,
IdUsuario INT NOT NULL,
NombreMapeo NVARCHAR(100),
TablaDestino NVARCHAR(100),
Activo BIT DEFAULT 0,
);

Tabla: MapeoCargaCampos
CREATE TABLE MapeoCargaCampos (
IdMapeoCargaCampo INT PRIMARY KEY IDENTITY,
IdMapeoCarga INT NOT NULL,
CampoOrigen NVARCHAR(100),
CampoDestino NVARCHAR(100),
ValorPorDefecto NVARCHAR(MAX),
EsRequerido BIT DEFAULT 0,
);

Crear por un archivo llamado: src\features\upload\models\MapeoCarga.model.ts
