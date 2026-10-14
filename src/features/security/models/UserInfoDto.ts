export interface UserInfoDto {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  dateOfBirth?: string;
  isActive?: boolean;
  numDocument?: string;
  roles: string[];
  permissions: string[];
}

