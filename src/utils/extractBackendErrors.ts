import { AxiosError } from "axios";

// Formatos de error que devuelven los dos APIs del backend.
interface BackendErrorBody {
  message?: string;
  traceId?: string;
  // Security API: string[]; ModelState de ASP.NET: { campo: string[] }
  errors?: string[] | Record<string, string[]>;
  // OData: { error: { message, details: [{ message }] } }
  error?: { message?: string; details?: { message?: string }[] };
}

const MENSAJE_RED = "Error de conexión. Verifique su conexión a internet.";

/**
 * Convierte un error de Axios (o cualquier otro) en una lista de mensajes para mostrar al usuario.
 * `fallback` se usa cuando la respuesta no trae ningún mensaje legible.
 */
export function extractBackendErrors(
  err: unknown,
  fallback = "Ocurrió un error. Intente nuevamente."
): string[] {
  if (err instanceof AxiosError) {
    if (!err.response) return err.request ? [MENSAJE_RED] : [err.message || fallback];

    const data: unknown = err.response.data;

    // Los controladores OData devuelven BadRequest("texto") como cuerpo de texto plano.
    if (typeof data === "string") return data.trim() ? [data.trim()] : [fallback];

    if (data && typeof data === "object") {
      const body = data as BackendErrorBody;
      const mensajes: string[] = [];

      if (Array.isArray(body.errors)) {
        mensajes.push(...body.errors);
      } else if (body.errors && typeof body.errors === "object") {
        mensajes.push(...Object.values(body.errors).flat());
      }
      if (body.error?.message) mensajes.push(body.error.message);
      body.error?.details?.forEach((d) => d.message && mensajes.push(d.message));
      if (mensajes.length === 0 && body.message) mensajes.push(body.message);

      if (mensajes.length > 0) {
        if (body.traceId) mensajes.push(`Código de soporte: ${body.traceId}`);
        return mensajes;
      }
    }
    return [fallback];
  }
  if (err instanceof Error) return [err.message || fallback];
  return [fallback];
}
