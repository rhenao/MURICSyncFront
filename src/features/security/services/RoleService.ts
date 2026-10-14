import axiosSecurityAPIClient from '../../../api/axiosSecurityAPIClient';
import type { Permission } from '../models/Permission.model';
import type {
  RoleWithPermissions,
  CreateRoleDto,
  UpdateRoleDto,
  AssignPermissionsDto,
} from '../models/Role.model';

const RoleService = {
  async getAll(): Promise<RoleWithPermissions[]> {
    const response = await axiosSecurityAPIClient.get<{ data: RoleWithPermissions[] }>('/roles');
    return response.data.data;
  },

  async getById(id: string): Promise<RoleWithPermissions> {
    const response = await axiosSecurityAPIClient.get<{ data: RoleWithPermissions }>(`/roles/${id}`);
    return response.data.data;
  },

  async create(dto: CreateRoleDto): Promise<RoleWithPermissions> {
    const response = await axiosSecurityAPIClient.post<{ data: RoleWithPermissions }>('/roles', dto);
    return response.data.data;
  },

  async update(id: string, dto: UpdateRoleDto): Promise<RoleWithPermissions> {
    const response = await axiosSecurityAPIClient.put<{ data: RoleWithPermissions }>(`/roles/${id}`, dto);
    return response.data.data;
  },

  async remove(id: string): Promise<void> {
    await axiosSecurityAPIClient.delete(`/roles/${id}`);
  },

  async getPermissions(roleId: string): Promise<Permission[]> {
    const response = await axiosSecurityAPIClient.get<{ data: Permission[] }>(`/roles/${roleId}/permissions`);
    return response.data.data;
  },

  async assignPermissions(roleId: string, dto: AssignPermissionsDto): Promise<void> {
    await axiosSecurityAPIClient.post(`/roles/${roleId}/permissions`, dto);
  },

  async replacePermissions(roleId: string, dto: AssignPermissionsDto): Promise<void> {
    await axiosSecurityAPIClient.put(`/roles/${roleId}/permissions`, dto);
  },

  async removePermission(roleId: string, permissionId: string): Promise<void> {
    await axiosSecurityAPIClient.delete(`/roles/${roleId}/permissions/${permissionId}`);
  },
};

export default RoleService;
