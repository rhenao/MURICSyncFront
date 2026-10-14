import axiosSecurityAPIClient from '../../../api/axiosSecurityAPIClient';
import type {
  Permission,
  CreatePermissionDto,
  UpdatePermissionDto,
} from '../models/Permission.model';

const PermissionService = {
  async getAll(): Promise<Permission[]> {
    const response = await axiosSecurityAPIClient.get<{ data: Permission[] }>('/permissions');
    return response.data.data;
  },

  async getById(id: string): Promise<Permission> {
    const response = await axiosSecurityAPIClient.get<{ data: Permission }>(`/permissions/${id}`);
    return response.data.data;
  },

  async getByModule(module: string): Promise<Permission[]> {
    const response = await axiosSecurityAPIClient.get<{ data: Permission[] }>(`/permissions/module/${module}`);
    return response.data.data;
  },

  async create(dto: CreatePermissionDto): Promise<Permission> {
    const response = await axiosSecurityAPIClient.post<{ data: Permission }>('/permissions', dto);
    return response.data.data;
  },

  async update(id: string, dto: UpdatePermissionDto): Promise<Permission> {
    const response = await axiosSecurityAPIClient.put<{ data: Permission }>(`/permissions/${id}`, dto);
    return response.data.data;
  },

  async remove(id: string): Promise<void> {
    await axiosSecurityAPIClient.delete(`/permissions/${id}`);
  },
};

export default PermissionService;
