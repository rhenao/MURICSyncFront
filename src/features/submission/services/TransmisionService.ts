import axiosSecurityAPIClient from '../../../api/axiosSecurityAPIClient';
import { fetchConToken } from '../../../api/fetchConToken';
import type { TransmisionSfc, TransmitirResponse } from '../models/Transmision.model';

export interface ArchivoAvro {
  blob: Blob;
  nombre: string;
  sha256: string;
}

/** Mensaje de un error de fetch: el backend responde { mensaje } o texto plano. */
async function mensajeDeError(res: Response): Promise<string> {
  const texto = await res.text().catch(() => '');
  try {
    const body = JSON.parse(texto) as { mensaje?: string; message?: string };
    return body.mensaje ?? body.message ?? `Error ${res.status}`;
  } catch {
    return texto || `Error ${res.status}`;
  }
}

// api/transmisiones vive en la misma API que security (base /api).
const TransmisionService = {
  async listar(fechaCorte?: string): Promise<TransmisionSfc[]> {
    const { data } = await axiosSecurityAPIClient.get<TransmisionSfc[]>('/transmisiones', {
      params: fechaCorte ? { fechaCorte } : {},
    });
    return Array.isArray(data) ? data : [];
  },

  async transmitir(fechaCorte: string): Promise<TransmitirResponse> {
    const { data } = await axiosSecurityAPIClient.post<TransmitirResponse>('/transmisiones', { fechaCorte });
    return data;
  },

  async consultarEstado(transmisionId: number): Promise<void> {
    await axiosSecurityAPIClient.post(`/transmisiones/${transmisionId}/consultar`);
  },

  /** El AVRO del corte; fetch nativo para leer el binario y sus cabeceras. */
  async descargarAvro(fechaCorte: string): Promise<ArchivoAvro> {
    const res = await fetchConToken(`/transmisiones/avro?fechaCorte=${encodeURIComponent(fechaCorte)}`);
    if (!res.ok) throw new Error(await mensajeDeError(res));

    const disposition = res.headers.get('content-disposition') ?? '';
    const match = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(disposition);
    return {
      blob: await res.blob(),
      nombre: match?.[1]?.replace(/['"]/g, '') ?? `muric_${fechaCorte}.avro.p7z`,
      sha256: res.headers.get('x-sha256') ?? '',
    };
  },
};

export default TransmisionService;
