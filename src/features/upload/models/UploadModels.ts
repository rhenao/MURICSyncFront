export type EstadoCarga = "Pendiente" | "Procesado" | "Error" | "EnProceso";

export interface ArchivosCarga {
  idArchivo: string;
  nombre: string;
  ruta?: string; // ruta en servidor / storage
  tipoArchivo?: string;
  tamano?: number;
  fechaCreacion: string; // ISO
  fechaCorte?: string; // ISO
  numeroProceso?: number; // número de procesos asociados
  codigoEmpresa?: string; // empresa asociada
  nombreEmpresa?: string; // empresa asociada
  usuario: string; // user id / email
  estado: EstadoCarga;
  mensajeError?: string;
  version?: number;
}

export interface ArchivosCargaDetalle {
  idDetalle: string;
  idArchivo: string;
  numeroLineas: number;
  data: Record<string, unknown>; // fila parseada en JSON (modelo flexible)
  normalizedData?: Record<string, unknown>; // datos transformados/normalizados
  estado: EstadoCarga;
  erroresValidacion?: ValidacionError[];
  mensajeError?: string;
  fechaCreacion: string;
}

export interface ValidacionError {
  campo?: string;
  mensaje?: string;
  codigo?: string;
}

export interface ArchivoVersion {
  idArchivo: string;
  version: number;
  fechaCreacion: string;
  usuario: string;
  rutaArchivo?: string;
  notas?: string;
}

export interface AuditLog {
  id: string;
  usuario: string;
  operacion: string; // e.g. UPLOAD_CREATE, VALIDATION_RUN, EXPORT_TO_MURIC
  timestamp: string;
  metadata?: Record<string, unknown>;
  descripcion?: string;
}