import axiosSecurityAPIClient from '../../../api/axiosSecurityAPIClient';
import type { AuditLogFilter, AuditLogPage } from '../models/AuditLog.model';

const AuditLogService = {
  getAuditLogs: async (filter: AuditLogFilter): Promise<AuditLogPage> => {
    const params: Record<string, string> = {};
    if (filter.userId) params.userId = filter.userId;
    if (filter.action) params.action = filter.action;
    if (filter.module) params.module = filter.module;
    if (filter.dateFrom) params.dateFrom = filter.dateFrom;
    if (filter.dateTo) params.dateTo = filter.dateTo;
    if (filter.ipAddress) params.ipAddress = filter.ipAddress;
    if (filter.page !== undefined) params.page = String(filter.page);
    if (filter.pageSize !== undefined) params.pageSize = String(filter.pageSize);

    const response = await axiosSecurityAPIClient.get<AuditLogPage>('/audit/logs', { params });
    return response.data;
  },
};

export default AuditLogService;
