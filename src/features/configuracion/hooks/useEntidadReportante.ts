import { useEffect, useState } from 'react';
import ConfiguracionService, { type EntidadReportante } from '../services/ConfiguracionService';

/** Entidad reportante (tipo y código de Titularice); null mientras carga o si la API falla. */
export function useEntidadReportante() {
  const [entidad, setEntidad] = useState<EntidadReportante | null>(null);

  useEffect(() => {
    let activo = true;
    ConfiguracionService.obtenerEntidadReportante()
      .then(e => { if (activo) setEntidad(e); })
      .catch(() => { /* dato informativo: si falla, no se muestra */ });
    return () => { activo = false; };
  }, []);

  return entidad;
}
