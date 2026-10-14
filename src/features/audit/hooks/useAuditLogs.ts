import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import AuditLogService from '../services/AuditLogService';
import type { AuditAction, AuditLogFilter, AuditLogPage, AuditModule } from '../models/AuditLog.model';

const DEFAULT_PAGE_SIZE = 20;

function filtersToSearchParams(filters: AuditLogFilter): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.userId) params.set('userId', filters.userId);
  if (filters.action) params.set('action', filters.action);
  if (filters.module) params.set('module', filters.module);
  if (filters.dateFrom) params.set('dateFrom', filters.dateFrom);
  if (filters.dateTo) params.set('dateTo', filters.dateTo);
  if (filters.ipAddress) params.set('ipAddress', filters.ipAddress);
  if (filters.page !== undefined) params.set('page', String(filters.page));
  if (filters.pageSize !== undefined) params.set('pageSize', String(filters.pageSize));
  return params;
}

function searchParamsToFilters(params: URLSearchParams): AuditLogFilter {
  return {
    userId: params.get('userId') ?? undefined,
    action: (params.get('action') as AuditAction) || undefined,
    module: (params.get('module') as AuditModule) || undefined,
    dateFrom: params.get('dateFrom') ?? undefined,
    dateTo: params.get('dateTo') ?? undefined,
    ipAddress: params.get('ipAddress') ?? undefined,
    page: params.has('page') ? Number(params.get('page')) : 1,
    pageSize: params.has('pageSize') ? Number(params.get('pageSize')) : DEFAULT_PAGE_SIZE,
  };
}

interface UseAuditLogsResult {
  data: AuditLogPage | null;
  loading: boolean;
  error: string | null;
  filters: AuditLogFilter;
  setFilters: (partial: Partial<AuditLogFilter>) => void;
  resetFilters: () => void;
  retry: () => void;
}

export function useAuditLogs(): UseAuditLogsResult {
  const [searchParams, setSearchParams] = useSearchParams();
  const [data, setData] = useState<AuditLogPage | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (f: AuditLogFilter) => {
    setLoading(true);
    setError(null);
    try {
      const result = await AuditLogService.getAuditLogs(f);
      setData(result);
    } catch {
      setError('Error al cargar los logs de auditoría. Intente nuevamente.');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(searchParamsToFilters(searchParams));
    // La dependencia es searchParams para que se re-ejecute cuando cambien los filtros en la URL
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const filters = searchParamsToFilters(searchParams);

  const setFilters = useCallback(
    (partial: Partial<AuditLogFilter>) => {
      const current = searchParamsToFilters(searchParams);
      const next: AuditLogFilter = { ...current, ...partial, page: 1 };
      setSearchParams(filtersToSearchParams(next));
    },
    [searchParams, setSearchParams]
  );

  const resetFilters = useCallback(() => {
    setSearchParams(filtersToSearchParams({ page: 1, pageSize: DEFAULT_PAGE_SIZE }));
  }, [setSearchParams]);

  const retry = useCallback(() => {
    fetchData(searchParamsToFilters(searchParams));
  }, [fetchData, searchParams]);

  return { data, loading, error, filters, setFilters, resetFilters, retry };
}
