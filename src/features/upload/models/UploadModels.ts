export type EstadoCarga = "Sin archivo" | "Cargado" | "Validado" | "Procesado" | "Error" | "Reversado";
export type EstadoProcesamiento = "Pendiente" | "Procesando" | "Completado" | "Error";
export type OperacionAuditoria = "SUBIDA_CREAR" | "SUBIDA_VALIDAR" | "SUBIDA_PROCESAR" | "SUBIDA_REVERSAR" | "SUBIDA_ERROR";

export interface ArchivosCarga {
  idArchivo: string;
  nombre: string;
  ruta?: string; // ruta en servidor / storage
  tipoArchivo?: string;
  tamanoBytes?: number;
  fechaCargue: string; // ISO
  fechaCorte?: string; // ISO
  numeroProceso?: number; // número de procesos asociados
  codigoEmpresa?: string; // empresa asociada
  nombreEmpresa?: string; // empresa asociada
  usuario: string; // user id / email
  estado: EstadoCarga;
  mensajeError?: string;
  version?: number;
  totalLineas: number;
  extensionArchivo: string;
  tamanoOriginal: number;
  }

export interface ArchivosCargaDetalle {
  idDetalle: string;
  idArchivo: string;
  numeroLinea: number;
  data: Record<string, unknown>; // fila parseada en JSON (modelo flexible)
  normalizedData?: Record<string, unknown>; // datos transformados/normalizados
  estado: EstadoCarga;
  erroresValidacion?: ValidacionError[];
  mensajeError?: string;
  fechaCreacion: string;
  fechaProcesamiento?: string;

}

export interface ValidacionError {
  campo?: string;
  mensaje?: string;
  codigo?: string;
}

export interface RegistroAuditoria {
  id: string;
  idUsuario: string;
  operacion: OperacionAuditoria;
  marcaTiempo: string;
  metadatos: Record<string, unknown>;
  descripcion: string;
}
export interface VersionArchivo {
  idArchivoSubida: string;
  version: number;
  fechaCreacion: string;
  creadoPor: string;
  rutaArchivo: string;
  notas?: string;
}

export interface MetadatosCarga {
  fechaCargue: string;
  fechaCorte: string;
  codigoEmpresa: string;
  nombreEmpresa: string;
  numeroProceso: number;
  totalLineas: number;
  extensionArchivo: string;
  tamanoOriginal: number;
}

export interface ContenidoArchivo {
  numeroLinea: number;
  col01: string;
  col02: string;
  col03: string;
  col04: string;
  col05: string;
  col06: string;
  col07: string;
  col08: string;
  col09: string;
  col10: string;
  col11: string;
  col12: string;
  col13: string;
  col14: string;
  col15: string;
  col16: string;
  col17: string;
  col18: string;
  col19: string;
  col20: string;
  col21: string;
  col22: string;
  col23: string;
  col24: string;
  col25: string;
  col26: string;
  col27: string;
  col28: string;
  col29: string;
  col30: string;
  col31: string;
  col32: string;
  col33: string;
  col34: string;
  col35: string;
  col36: string;
  col37: string;
  col38: string;
  col39: string;
  col40: string;
  col41: string;
  col42: string;
  col43: string;
  col44: string;
  col45: string;
  col46: string;
  col47: string;
  col48: string;
  col49: string;
  col50: string;
}

// Funciones utilitarias para crear modelos
export const crearArchivoCarga = (
  archivo: File, 
  metadatos: MetadatosCarga, 
  idUsuario: string
): ArchivosCarga  => ({
  idArchivo: crypto.randomUUID(),
  nombre: archivo.name,
  ruta: `uploads/${Date.now()}-${archivo.name}`,
  tipoArchivo: archivo.type || obtenerTipoArchivo(archivo.name),
  tamanoBytes: archivo.size,
  fechaCargue: new Date().toISOString(),
  fechaCorte: metadatos.fechaCorte,
  numeroProceso: metadatos.numeroProceso,
  codigoEmpresa: metadatos.codigoEmpresa,
  nombreEmpresa: metadatos.nombreEmpresa,
  usuario: idUsuario,
  totalLineas: metadatos.totalLineas,
  extensionArchivo: metadatos.extensionArchivo,
  tamanoOriginal: metadatos.tamanoOriginal,
  estado: "Cargado",
  version: 1
});

export const crearDetalleCarga = (
  idArchivo: string,
  numeroLinea: number,
  datosCrudos: Record<string, unknown>
): ArchivosCargaDetalle => ({
  idDetalle: crypto.randomUUID(),
  idArchivo,
  numeroLinea,
  data: datosCrudos,
  estado: "Cargado",
  fechaCreacion: new Date().toISOString(),
  fechaProcesamiento: new Date().toISOString(),
});     

export const crearRegistroAuditoria = (
  idUsuario: string,
  operacion: OperacionAuditoria,
  descripcion: string,
  metadatos: Record<string, unknown> = {}
): RegistroAuditoria => ({
  id: crypto.randomUUID(),
  idUsuario,
  operacion,
  marcaTiempo: new Date().toISOString(),
  metadatos,
  descripcion,
});

// Función auxiliar para determinar el tipo MIME
const obtenerTipoArchivo = (nombreArchivo: string): string => {
  const extension = nombreArchivo.toLowerCase().substring(nombreArchivo.lastIndexOf("."));
  const tiposMime: Record<string, string> = {
    '.csv': 'text/csv',
    '.txt': 'text/plain',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.xls': 'application/vnd.ms-excel',
  };
  return tiposMime[extension] || 'application/octet-stream';
};