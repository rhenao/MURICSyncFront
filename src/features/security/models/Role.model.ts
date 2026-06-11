import type { Permission } from './Permission.model';

export default interface Role {
    id: string;
    name: string;
    normalizedName?: string;
    description?: string;
    isActive: boolean;
    createdAt: string;
}

export interface RoleWithPermissions {
    id: string;
    name: string;
    description?: string;
    isActive: boolean;
    createdAt: string;
    permissions: Permission[];
}

export interface CreateRoleDto {
    name: string;
    description?: string;
}

export interface UpdateRoleDto {
    name?: string;
    description?: string;
    isActive?: boolean;
}

export interface AssignPermissionsDto {
    permissionIds: string[];
}