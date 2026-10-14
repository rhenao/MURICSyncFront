// Transmisión a la SFC: un archivo AVRO por fecha de corte con todas las universalidades
// (backend ADR 0008, plan de entidad reportante Fase C).

export interface TransmisionSfc {
  id: number;
  fechaCorte: string;
  loteId: number | null; // solo en transmisiones por lote anteriores a la Fase C
  nombreArchivo: string;
  hashSha256: string;
  idTransmisionSfc: string;
  estado: string;
  codigoEstadoSfc: string | null;
  mensajeEstado: string | null;
  fechaTransmision: string;
  usuarioTransmisor: string;
  fechaUltimaConsulta: string | null;
  totalCreditos: number;
  totalDemograficos: number;
  totalMovimientos: number;
}

export interface TransmitirResponse {
  transmisionId: number;
  idTransmisionSfc: string;
  estado: string;
  nombreArchivo: string;
  hashSha256: string;
  totalCreditos: number;
  totalDemograficos: number;
  totalMovimientos: number;
  fechaTransmision: string;
}

export const ESTADO_TX_COLOR: Record<string, 'default' | 'warning' | 'success' | 'error'> = {
  Enviado:   'warning',
  Aprobado:  'success',
  Rechazado: 'error',
  Error:     'error',
};
