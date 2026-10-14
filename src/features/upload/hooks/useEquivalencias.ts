import { useState, useEffect, useCallback } from 'react';
import type { CatalogoEquivalencia, Equivalencia } from '../models/Equivalencia.model';
import EquivalenciaService from '../services/EquivalenciaService';
import { extractBackendErrors } from '../../../utils/extractBackendErrors';

/**
 * Equivalencias y catálogos que las aceptan. Los catálogos vienen del backend con sus códigos, así que
 * los desplegables no consultan OData ni dependen de params.read (un 403 del cliente OData cierra la sesión).
 */
export function useEquivalencias() {
  const [equivalencias, setEquivalencias] = useState<Equivalencia[]>([]);
  const [catalogos, setCatalogos] = useState<CatalogoEquivalencia[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const recargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const [lista, cats] = await Promise.all([
        EquivalenciaService.listar(),
        EquivalenciaService.catalogos(),
      ]);
      setEquivalencias(lista);
      setCatalogos(cats);
    } catch (err) {
      setError(
        extractBackendErrors(
          err,
          'No se pudieron cargar las equivalencias. Verifique la conexión con el servidor.'
        ).join(' ')
      );
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => { recargar(); }, [recargar]);

  return { equivalencias, catalogos, cargando, error, recargar };
}
