import { useState, useEffect, useCallback, useRef } from "react";
import axiosOdataAPIClient from "../api/axiosOdataAPIClient";
import { AxiosError } from "axios";

export interface ODataResponse<T> {
  value: T[];
  count?: number;
}

export function useEntidades<T>(endpoint: string) {
  const [entidades, setEntidades] = useState<T[] | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Descarta respuestas de peticiones anteriores (cambio de endpoint o recargas seguidas).
  const ultimaPeticion = useRef(0);

  const fetchEntidades = useCallback(async () => {
    const peticion = ++ultimaPeticion.current;
    try {
      setCargando(true);
      const response = await axiosOdataAPIClient.get<ODataResponse<T> | T[]>(endpoint);
      if (peticion !== ultimaPeticion.current) return;

      let data: T[] = [];

      // Manejar diferentes formatos de respuesta
      if (response.data) {
        if ("value" in response.data && Array.isArray(response.data.value)) {
          // Formato OData
          data = response.data.value;
        } else if (Array.isArray(response.data)) {
          // Array directo
          data = response.data;
        } else {
          console.warn("Formato de respuesta inesperado:", response.data);
          data = [];
        }
      }

      setEntidades(data);
      setError(null);
    } catch (err: unknown) {
      if (peticion !== ultimaPeticion.current) return;

      let errorMessage = "Error al cargar datos";

      // Type guard para AxiosError
      if (err instanceof AxiosError) {
        if (err.response) {
          // Error de respuesta HTTP
          errorMessage =
            err.response.data?.message ||
            `Error ${err.response.status}: ${err.response.statusText}`;
        } else if (err.request) {
          // Error de red
          errorMessage = "Error de conexión. Verifique su conexión a internet.";
        } else {
          // Otro tipo de error de Axios
          errorMessage = err.message || errorMessage;
        }
      } else if (err instanceof Error) {
        // Error genérico de JavaScript
        errorMessage = err.message || errorMessage;
      }

      setError(errorMessage);
      setEntidades(null);
      console.error(`Error al cargar ${endpoint}:`, err);
    } finally {
      if (peticion === ultimaPeticion.current) setCargando(false);
    }
  }, [endpoint]);

  useEffect(() => {
    fetchEntidades();
  }, [fetchEntidades]);

  return { entidades, cargando, error, recargar: fetchEntidades };
}
