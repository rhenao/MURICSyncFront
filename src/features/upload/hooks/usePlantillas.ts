import { useState, useEffect, useCallback } from 'react';
import axiosSecurityAPIClient from '../../../api/axiosSecurityAPIClient';
import type { PlantillaCarga, PlantillaInput } from '../models/Plantilla.model';

export function usePlantillas() {
  const [plantillas, setPlantillas] = useState<PlantillaCarga[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const { data } = await axiosSecurityAPIClient.get<PlantillaCarga[]>('/plantillas');
      setPlantillas(Array.isArray(data) ? data : []);
    } catch {
      setError('No se pudieron cargar las plantillas. Verifique la conexión con el servidor.');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const createPlantilla = useCallback(async (input: PlantillaInput): Promise<void> => {
    const { data } = await axiosSecurityAPIClient.post<PlantillaCarga>('/plantillas', input);
    setPlantillas(prev => [...prev, data]);
  }, []);

  const updatePlantilla = useCallback(async (id: number, input: PlantillaInput): Promise<void> => {
    const { data } = await axiosSecurityAPIClient.put<PlantillaCarga>(`/plantillas/${id}`, input);
    setPlantillas(prev => prev.map(p => (p.id === id ? data : p)));
  }, []);

  const toggleActiva = useCallback(async (id: number): Promise<void> => {
    const plantilla = plantillas.find(p => p.id === id);
    if (!plantilla) return;
    const nuevoEstado = !plantilla.esActiva;
    // Optimistic update
    setPlantillas(prev => prev.map(p => (p.id === id ? { ...p, esActiva: nuevoEstado } : p)));
    try {
      await axiosSecurityAPIClient.patch(`/plantillas/${id}`, { esActiva: nuevoEstado });
    } catch (err) {
      // Revert on failure
      setPlantillas(prev => prev.map(p => (p.id === id ? { ...p, esActiva: !nuevoEstado } : p)));
      throw err;
    }
  }, [plantillas]);

  const deletePlantilla = useCallback(async (id: number): Promise<void> => {
    await axiosSecurityAPIClient.delete(`/plantillas/${id}`);
    setPlantillas(prev => prev.filter(p => p.id !== id));
  }, []);

  return { plantillas, cargando, error, createPlantilla, updatePlantilla, toggleActiva, deletePlantilla };
}
