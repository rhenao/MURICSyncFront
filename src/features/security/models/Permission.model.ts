export interface Permission {
  id: string;
  code: string;
  name: string;
  description?: string;
  module?: string;
}

export interface CreatePermissionDto {
  code: string;
  name: string;
  description?: string;
  module?: string;
}

export interface UpdatePermissionDto {
  name?: string;
  description?: string;
  module?: string;
}
