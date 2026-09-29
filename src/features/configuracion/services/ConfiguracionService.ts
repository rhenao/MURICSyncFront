import axiosSecurityAPIClient from '../../../api/axiosSecurityAPIClient';

/** Entidad vigilada que reporta a la SFC (Titularice). Sale de la configuración del backend. */
export interface EntidadReportante {
  tipoEntidad: number;
  codigoEntidad: number;
  nombreArchivoEjemplo: string;
}

// No cambia mientras la API corre: se pide una vez por sesión del navegador.
let pendiente: Promise<EntidadReportante> | null = null;

const ConfiguracionService = {
  obtenerEntidadReportante(): Promise<EntidadReportante> {
    pendiente ??= axiosSecurityAPIClient
      .get<EntidadReportante>('/configuracion/entidad-reportante')
      .then(r => r.data)
      .catch(err => {
        pendiente = null; // reintentar en la próxima llamada
        throw err;
      });
    return pendiente;
  },
};

export default ConfiguracionService;
