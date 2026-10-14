import { useState, useEffect, useCallback } from 'react';
import type { PlantillaResumen } from '../models/Plantilla.model';
import PlantillaService from '../services/PlantillaService';
import { extractBackendErrors } from '../../../utils/extractBackendErrors';

/**
 * Listado de plantillas. Las operaciones de escritura se hacen con PlantillaService y luego
 * se llama a recargar(): el listado (resumen) y las respuestas de escritura (detalle) tienen
 * formas distintas, así que no se mezclan en el mismo estado.
 */
export function usePlantillas() {
  const [plantillas, setPlantillas] = useState<PlantillaResumen[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const recargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      setPlantillas(await PlantillaService.listar());
    } catch (err) {
      setError(
        extractBackendErrors(
          err,
          'No se pudieron cargar las plantillas. Verifique la conexión con el servidor.'
        ).join(' ')
      );
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => { recargar(); }, [recargar]);

  return { plantillas, cargando, error, recargar };
}
