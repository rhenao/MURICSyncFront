import axiosSecurityAPIClient from '../../../api/axiosSecurityAPIClient';
import type { FiltroLotes, LoteResumen } from '../models/Lote.model';

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
};

export default LoteService;
