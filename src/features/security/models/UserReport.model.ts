export interface UserReportItemDto {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  fullName: string;
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
  roles: string[];
}

export interface UserReportFilterDto {
  isActive?: boolean;
  role?: string;
  search?: string;
  lastLoginFrom?: string;
  lastLoginTo?: string;
  page?: number;
  pageSize?: number;
  sortBy?: 'lastName' | 'email' | 'lastLoginAt' | 'createdAt';
  sortDir?: 'asc' | 'desc';
}

export interface UserReportResponseDto {
  items: UserReportItemDto[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
