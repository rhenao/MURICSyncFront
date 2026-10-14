export type AuditAction =
  | 'LOGIN'
  | 'LOGIN_FAILED'
  | 'INSERT'
  | 'UPDATE'
  | 'DELETE';

export type AuditModule =
  | 'MURIC_001_001'
  | 'MURIC_001_002'
  | 'MURIC_001_003'
  | 'TRANSMISION'
  | 'AUTH';

export interface AuditLogEntry {
  id: number;
  timestamp: string;
  userId: string | null;
  userName: string | null;
  ipAddress: string | null;
  action: AuditAction;
  module: AuditModule | null;
  entityType: string | null;
  entityId: string | null;
  httpMethod: string | null;
  endpoint: string | null;
  statusCode: number | null;
  durationMs: number | null;
  oldValues: Record<string, unknown> | null;
  newValues: Record<string, unknown> | null;
  correlationId: string | null;
  periodoCorte: string | null;
}

export interface AuditLogFilter {
  userId?: string;
  action?: AuditAction;
  module?: AuditModule;
  dateFrom?: string;
  dateTo?: string;
  ipAddress?: string;
  page?: number;
  pageSize?: number;
}

export interface AuditLogPage {
  items: AuditLogEntry[];
  totalCount: number;
  page: number;
  pageSize: number;
}
