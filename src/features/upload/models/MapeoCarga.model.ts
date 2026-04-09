export interface MapeoCargaCampo {
  idMapeoCargaCampo?: number;
  idMapeoCarga: number;
  campoOrigen: string;
  campoDestino: string;
  valorPorDefecto?: string | null;
  esRequerido?: boolean;
}

export default interface MapeoCarga {
  idMapeoCarga?: number;
  usuario: string;
  nombreMapeo?: string | null;
  tablaDestino?: string | null;
  activo?: boolean;
  campos?: MapeoCargaCampo[];
}
