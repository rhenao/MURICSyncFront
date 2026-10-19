import axiosSecurityAPIClient from '../../../api/axiosSecurityAPIClient';
import type { FiltroLotes, FiltroRegistros, LoteResumen, RegistrosLote } from '../models/Lote.model';

// api/cargas vive en la misma API que security (base /api).
const LoteService = {
  async listar(filtro: FiltroLotes = {}): Promise<LoteResumen[]> {
    const { data } = await axiosSecurityAPIClient.get<LoteResumen[]>('/cargas', {
      params: filtro,
      // estado se repite (?estado=Iniciado&estado=Parseado), como lo espera el backend.
      paramsSerializer: { indexes: null },
    });
    return Array.isArray(data) ? data : [];
  },

  async obtener(id: number): Promise<LoteResumen> {
    const { data } = await axiosSecurityAPIClient.get<LoteResumen>(`/cargas/${id}`);
    return data;
  },

  /** Una página de los registros cargados (staging) de un insumo, en cualquier estado del lote. */
  async registros(id: number, filtro: FiltroRegistros): Promise<RegistrosLote> {
    const { data } = await axiosSecurityAPIClient.get<RegistrosLote>(`/cargas/${id}/registros`, { params: filtro });
    return data;
  },
};

/** Query string de /cargas/{id}/registros/exportar: el insumo completo con el filtro actual, sin paginar. */
export function queryExportarRegistros(filtro: Omit<FiltroRegistros, 'pagina' | 'tamano'>): string {
  const params = new URLSearchParams({ insumo: filtro.insumo });
  if (filtro.buscar) params.set('buscar', filtro.buscar);
  if (filtro.soloConErrores) params.set('soloConErrores', 'true');
  return params.toString();
}

export default LoteService;
