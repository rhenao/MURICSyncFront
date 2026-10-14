// Equivalencias de carga (/api/equivalencias): valor del archivo del cliente → código SFC de un catálogo.
// Plan: docs/prompts/plan-equivalencias-carga.md. Globales; se comprueban al validar y se traducen al promover.

export interface Equivalencia {
  id: number;
  catalogo: string;          // entity set OData: "TipoIdentificacion"
  catalogoNombre: string;    // "Tipo de identificación"
  valorOriginal: string;
  valorNormalizado: string;  // mayúsculas, sin tildes ni espacios sobrantes; es lo que se compara al cargar
  codigo: string;
  codigoDescripcion: string | null; // null si el código ya no existe en el catálogo
  observaciones: string | null;
  usuario: string | null;
  fechaActualizacion: string | null;
}

export interface EquivalenciaRequest {
  catalogo: string;
  valorOriginal: string;
  codigo: string;
  observaciones?: string | null;
}

export interface ValorCatalogo {
  codigo: string;
  descripcion: string;
}

/** Catálogo que acepta equivalencias, con sus códigos (GET /equivalencias/catalogos). */
export interface CatalogoEquivalencia {
  catalogo: string;
  nombre: string;
  campos: string[]; // campos de staging que lo usan; los atributos van como "atributo_N"
  valores: ValorCatalogo[];
}

/**
 * Valor de un lote que no es código de su catálogo (GET /cargas/{id}/codigos-invalidos), agrupado por
 * catálogo y valor normalizado: una equivalencia lo resuelve en todas sus filas.
 */
export interface CodigoInvalido {
  catalogo: string;
  catalogoNombre: string;
  valor: string;
  valorNormalizado: string;
  campos: string[]; // "001-001 tipo_identificacion", "001-002 atributo_5"…
  filas: number;
}

/** Valores precargados al crear una equivalencia desde un lote (fase EQ-D). */
export interface EquivalenciaInicial {
  catalogo: string;
  valorOriginal: string;
}

/**
 * La misma normalización del backend (CatalogosCarga.Normalizar): sin espacios a los lados, espacios
 * internos colapsados, sin tildes y en mayúsculas. Se usa para sugerir el código cuya descripción coincide.
 */
export function normalizarValor(valor: string): string {
  return valor
    .trim()
    .replace(/\s+/g, ' ')
    .normalize('NFD')
    .replace(/\p{Mn}/gu, '')
    .normalize('NFC')
    .toUpperCase();
}
