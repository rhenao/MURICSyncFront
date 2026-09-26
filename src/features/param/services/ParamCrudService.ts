import { AxiosError } from "axios";
import axiosOdataAPIClient from "../../../api/axiosOdataAPIClient";
import { extractBackendErrors } from "../../../utils/extractBackendErrors";
import type { Row } from "../shared/columnConfig";

export type KeyType = "number" | "string";

/**
 * Segmento de clave OData: `(3)` para claves numéricas y `('ABC')` para claves de texto
 * (la comilla simple se escapa duplicándola).
 */
export function buildKeySegment(key: unknown, keyType: KeyType): string {
  if (keyType === "number") {
    const n = Number(key);
    if (!Number.isInteger(n)) throw new Error(`Clave numérica inválida: ${String(key)}`);
    return `(${n})`;
  }
  return `('${encodeURIComponent(String(key).replace(/'/g, "''"))}')`;
}

// CRUD genérico sobre los endpoints OData de param (POST, PUT con la entidad completa, DELETE).
const ParamCrudService = {
  async crear(endpoint: string, row: Row): Promise<Row> {
    const response = await axiosOdataAPIClient.post<Row>(endpoint, row);
    return response.data;
  },

  async actualizar(endpoint: string, key: unknown, keyType: KeyType, row: Row): Promise<void> {
    await axiosOdataAPIClient.put(`${endpoint}${buildKeySegment(key, keyType)}`, row);
  },

  async eliminar(endpoint: string, key: unknown, keyType: KeyType): Promise<void> {
    await axiosOdataAPIClient.delete(`${endpoint}${buildKeySegment(key, keyType)}`);
  },
};

export default ParamCrudService;

export type TipoErrorParam = "duplicado" | "noExiste" | "otro";

export interface ErrorParam {
  tipo: TipoErrorParam;
  mensajes: string[];
}

/**
 * Traduce los errores de los controladores de param a mensajes para el usuario.
 * Los textos que se buscan son los que devuelven hoy los controladores OData
 * ("Llave primaria duplicada (X)", "... Fila no existe.").
 */
export function interpretarErrorParam(
  err: unknown,
  key?: unknown,
  fallback = "No se pudo guardar el registro. Intente nuevamente."
): ErrorParam {
  const mensajes = extractBackendErrors(err, fallback);
  const status = err instanceof AxiosError ? err.response?.status : undefined;
  const texto = mensajes.join(" ").toLowerCase();

  if ((status === 400 || status === 409) && texto.includes("duplicada")) {
    return {
      tipo: "duplicado",
      mensajes: [`Ya existe un registro con el código ${key != null ? String(key) : ""}.`.replace(" .", ".")],
    };
  }
  if ((status === 400 || status === 404) && texto.includes("no existe")) {
    return { tipo: "noExiste", mensajes: ["El registro ya no existe."] };
  }
  return { tipo: "otro", mensajes };
}
