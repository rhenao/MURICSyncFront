import axiosSecurityAPIClient from '../../../api/axiosSecurityAPIClient';
import type {
  CatalogoEquivalencia,
  CodigoInvalido,
  Equivalencia,
  EquivalenciaRequest,
} from '../models/Equivalencia.model';

// api/equivalencias vive en la misma API que security (base /api).
const EquivalenciaService = {
  async listar(catalogo?: string): Promise<Equivalencia[]> {
    const { data } = await axiosSecurityAPIClient.get<Equivalencia[]>('/equivalencias', {
      params: catalogo ? { catalogo } : undefined,
    });
    return Array.isArray(data) ? data : [];
  },

  async catalogos(): Promise<CatalogoEquivalencia[]> {
    const { data } = await axiosSecurityAPIClient.get<CatalogoEquivalencia[]>('/equivalencias/catalogos');
    return Array.isArray(data) ? data : [];
  },

  async crear(request: EquivalenciaRequest): Promise<Equivalencia> {
    const { data } = await axiosSecurityAPIClient.post<Equivalencia>('/equivalencias', request);
    return data;
  },

  async actualizar(id: number, request: EquivalenciaRequest): Promise<Equivalencia> {
    const { data } = await axiosSecurityAPIClient.put<Equivalencia>(`/equivalencias/${id}`, request);
    return data;
  },

  async eliminar(id: number): Promise<void> {
    await axiosSecurityAPIClient.delete(`/equivalencias/${id}`);
  },

  /** Valores del lote que no son código de su catálogo, para crearles equivalencia (cargas.read). */
  async codigosInvalidos(loteId: number): Promise<CodigoInvalido[]> {
    const { data } = await axiosSecurityAPIClient.get<CodigoInvalido[]>(`/cargas/${loteId}/codigos-invalidos`);
    return Array.isArray(data) ? data : [];
  },
};

export default EquivalenciaService;
