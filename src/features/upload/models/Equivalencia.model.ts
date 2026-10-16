// Equivalencias de carga (/api/equivalencias): valor del archivo del cliente → valor que espera la SFC.
// Plan: docs/prompts/plan-equivalencias-carga.md. Globales; se comprueban al validar y se traducen al promover.
// Cada una es por catálogo (código SFC) o, desde CC-C de docs/prompts/plan-consistencia-cargues.md, por campo
// sin catálogo de la lista blanca ("NO APLICA" → 0 en spread_tasa_interes).

/** Lo que tienen en común una equivalencia, un catálogo o campo y un código no válido: su alcance. */
export interface Ambito {
  catalogo: string | null; // entity set OData: "TipoIdentificacion"; null si es por campo
  campo: string | null;    // campo de staging: "spread_tasa_interes"; null si es por catálogo
}

export interface Equivalencia extends Ambito {
  id: number;
  catalogoNombre: string;    // nombre del catálogo o del campo: "Tipo de identificación", "Spread tasa de interés"
  valorOriginal: string;
  valorNormalizado: string;  // mayúsculas, sin tildes ni espacios sobrantes; es lo que se compara al cargar
  codigo: string;            // código SFC, o número o fecha del campo; "" = el campo queda vacío
  codigoDescripcion: string | null; // por catálogo: null si el código ya no existe en él; por campo: siempre null
  observaciones: string | null;
  usuario: string | null;
  fechaActualizacion: string | null;
}

export interface EquivalenciaRequest {
  catalogo?: string | null;
  campo?: string | null;
  valorOriginal: string;
  codigo: string;
  observaciones?: string | null;
}

export interface ValorCatalogo {
  codigo: string;
  descripcion: string;
}

/** codigo: catálogo con lista de valores; numero o fecha: campo sin catálogo. */
export type TipoValorEquivalencia = 'codigo' | 'numero' | 'fecha';

/** Catálogo o campo que acepta equivalencias (GET /equivalencias/catalogos). */
export interface CatalogoEquivalencia extends Ambito {
  nombre: string;
  tipoValor: TipoValorEquivalencia;
  obligatorio: boolean; // solo campos: si es false, una equivalencia puede dejarlo vacío (código "")
  campos: string[]; // campos de staging que lo usan; los atributos van como "atributo_N"
  valores: ValorCatalogo[]; // vacío en los campos
}

/**
 * Valor de un lote que no es código de su catálogo, o que no tiene el formato de un campo que acepta
 * equivalencias (GET /cargas/{id}/codigos-invalidos), agrupado por alcance y valor normalizado: una
 * equivalencia lo resuelve en todas sus filas.
 */
export interface CodigoInvalido extends Ambito {
  catalogoNombre: string;
  valor: string;
  valorNormalizado: string;
  campos: string[]; // "001-001 tipo_identificacion", "001-002 atributo_5"…
  filas: number;
}

/** Valores precargados al crear una equivalencia desde un lote (fase EQ-D). */
export interface EquivalenciaInicial extends Ambito {
  valorOriginal: string;
}

/** Clave única del alcance, para selects y mapas: "TipoIdentificacion" o "campo:spread_tasa_interes". */
export function claveAmbito(a: Ambito): string {
  return a.catalogo ?? `campo:${a.campo ?? ''}`;
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

// Formatos que acepta el backend (FormatosCarga, CN1): número con punto decimal y sin separador de miles;
// fecha AAAA-MM-DD, DD/MM/AAAA o AAAAMMDD. El backend guarda la fecha como AAAA-MM-DD.
const NUMERO = /^-?\d+(\.\d+)?([eE][-+]?\d+)?$/;
const FECHA = /^(\d{4}-\d{2}-\d{2}|\d{2}\/\d{2}\/\d{4}|\d{8})$/;

/** Mensaje de error si el valor no tiene el formato del tipo; null si está bien (o si es un código de catálogo). */
export function validarValorDestino(tipo: TipoValorEquivalencia, valor: string): string | null {
  const v = valor.trim();
  if (tipo === 'numero' && !NUMERO.test(v))
    return 'Debe ser un número con punto decimal y sin separador de miles (por ejemplo 0 o 1234.56).';
  if (tipo === 'fecha' && !FECHA.test(v))
    return 'Debe ser una fecha AAAA-MM-DD (también DD/MM/AAAA o AAAAMMDD).';
  return null;
}
