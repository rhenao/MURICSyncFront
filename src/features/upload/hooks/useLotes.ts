import { useState, useEffect, useCallback } from 'react';
import type { EstadoLote, LoteResumen } from '../models/Lote.model';
import LoteService from '../services/LoteService';
import { extractBackendErrors } from '../../../utils/extractBackendErrors';

/** Lotes de carga con sus conteos; `estados` vacío trae todos. */
export function useLotes(estados: EstadoLote[]) {
  const [lotes, setLotes] = useState<LoteResumen[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // La clave evita recargar cuando el llamador pasa un arreglo nuevo con los mismos estados.
  const claveEstados = estados.join(',');

  const recargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const estado = claveEstados ? (claveEstados.split(',') as EstadoLote[]) : undefined;
      setLotes(await LoteService.listar({ estado }));
    } catch (err) {
      setError(
        extractBackendErrors(
          err,
          'No se pudieron cargar los lotes. Verifique la conexión con el servidor.'
        ).join(' ')
      );
    } finally {
      setCargando(false);
    }
  }, [claveEstados]);

  useEffect(() => { recargar(); }, [recargar]);

  return { lotes, cargando, error, recargar };
}
