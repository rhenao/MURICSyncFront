import axiosSecurityAPIClient from '../../../api/axiosSecurityAPIClient';
import type {
  ActualizarPlantillaRequest,
  CrearPlantillaRequest,
  FiltroPlantillas,
  PlantillaDetalle,
  PlantillaResumen,
} from '../models/Plantilla.model';

// api/plantillas vive en la misma API que security (base /api).
const PlantillaService = {
  async listar(filtro: FiltroPlantillas = {}): Promise<PlantillaResumen[]> {
    const { data } = await axiosSecurityAPIClient.get<PlantillaResumen[]>('/plantillas', {
      params: filtro,
    });
    return Array.isArray(data) ? data : [];
  },

  async obtener(id: number): Promise<PlantillaDetalle> {
    const { data } = await axiosSecurityAPIClient.get<PlantillaDetalle>(`/plantillas/${id}`);
    return data;
  },

  async crear(request: CrearPlantillaRequest): Promise<PlantillaDetalle> {
    const { data } = await axiosSecurityAPIClient.post<PlantillaDetalle>('/plantillas', request);
    return data;
  },

  async actualizar(id: number, request: ActualizarPlantillaRequest): Promise<PlantillaDetalle> {
    const { data } = await axiosSecurityAPIClient.put<PlantillaDetalle>(`/plantillas/${id}`, request);
    return data;
  },

  async cambiarActiva(id: number, esActiva: boolean): Promise<PlantillaDetalle> {
    const { data } = await axiosSecurityAPIClient.patch<PlantillaDetalle>(`/plantillas/${id}`, {
      esActiva,
    });
    return data;
  },

  async eliminar(id: number): Promise<void> {
    await axiosSecurityAPIClient.delete(`/plantillas/${id}`);
  },
};

export default PlantillaService;
