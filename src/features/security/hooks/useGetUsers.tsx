import { useState, useEffect } from "react";
import { AxiosError } from "axios";
import axiosSecurityAPIClient from "../../../api/axiosSecurityAPIClient";

export function useGetUsers<T>(endpoint: string) {
  const [securityEntities, setSecurityEntities] = useState<T[] | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSecurityEntities = async () => {
      try {
        setCargando(true);
        const response = await axiosSecurityAPIClient.get<T | T[]>(endpoint);

        let data: T[] = [];

        // Manejar diferentes formatos de respuesta
        if (response.data) {
          if (Array.isArray(response.data)) {
            // Array directo
            data = response.data;
          } else {
            console.warn("Formato de respuesta inesperado:", response.data);
            data = [];
          }
        }

        setSecurityEntities(data);
        setError(null);
      } catch (err: unknown) {
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
            errorMessage =
              "Error de conexión. Verifique su conexión a internet.";
          } else {
            // Otro tipo de error de Axios
            errorMessage = err.message || errorMessage;
          }
        } else if (err instanceof Error) {
          // Error genérico de JavaScript
          errorMessage = err.message || errorMessage;
        }

        setError(errorMessage);
        setSecurityEntities(null);
        console.error(`Error al cargar ${endpoint}:`, err);
      } finally {
        setCargando(false);
      }
    };

    fetchSecurityEntities();
  }, [endpoint]);

  return { entidades: securityEntities, cargando, error };
}
