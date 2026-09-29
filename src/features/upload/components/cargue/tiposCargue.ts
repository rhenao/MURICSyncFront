// Tipos y constantes compartidos por CargaArchivos y sus paneles.

export interface HistorialArchivo {
  id: number;
  insumo: string;
  nombreArchivo: string;
  tamanoBytes: number;
  filasParseadas: number | null;
  resultado: string;
  mensajeResultado: string | null;
  fechaCarga: string;
  usuarioCarga: string;
}

export const INSUMOS = [
  { enum: 'Credito',    codigo: '001-001', label: 'Información general de créditos' },
  { enum: 'Atributo',   codigo: '001-002', label: 'Atributos del crédito y deudor' },
  { enum: 'Movimiento', codigo: '001-003', label: 'Movimientos de cartera' },
  // Un archivo con campos de los tres insumos; solo con plantilla (ADR 0009 del backend).
  { enum: 'Todos',      codigo: '001-999', label: 'Todos (un solo archivo)' },
] as const;

export type InsumoEnum = 'Credito' | 'Atributo' | 'Movimiento' | 'Todos';
