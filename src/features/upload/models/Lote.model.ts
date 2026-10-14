// Estados del lote de carga (backend: LoteCargaService). Fallido ya no existe (decisión L5).
export type EstadoLote = 'Iniciado' | 'Parseado' | 'Validado' | 'Promovido' | 'Anulado';

// Solo puede haber un lote activo por fecha de corte y universalidad (decisión L4).
export const ESTADOS_ACTIVOS: EstadoLote[] = ['Iniciado', 'Parseado', 'Validado'];

export const ESTADO_LOTE_COLOR: Record<string, 'default' | 'primary' | 'warning' | 'success' | 'error'> = {
  Iniciado:  'primary',
  Parseado:  'warning',
  Validado:  'primary',
  Promovido: 'success',
  Anulado:   'default',
};

/** Respuesta de GET /cargas y GET /cargas/{id}: el lote con sus conteos y el resumen de errores. */
export interface LoteResumen {
  id: number;
  fechaCorte: string;
  universalidadCodigo: number;
  universalidadDescripcion: string | null;
  estado: string;
  fechaCreacion: string;
  usuarioCreador: string;
  fechaPromocion: string | null;
  usuarioPromotor: string | null;
  observaciones: string | null;
  conteos: { creditos: number; atributos: number; movimientos: number } | null;
  resumenErrores: { total: number; errores: number; advertencias: number } | null;
}

export interface FiltroLotes {
  estado?: EstadoLote[];
  fechaCorte?: string;
  fechaCorteDesde?: string;
  fechaCorteHasta?: string;
  universalidadCodigo?: number;
}
