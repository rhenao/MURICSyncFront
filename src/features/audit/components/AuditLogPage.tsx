import { Box, Typography } from '@mui/material';
import { useAuditLogs } from '../hooks/useAuditLogs';
import AuditLogFilters from './AuditLogFilters';
import AuditLogTable from './AuditLogTable';
import type { AuditLogFilter } from '../models/AuditLog.model';

export default function AuditLogPage() {
  const { data, loading, error, filters, setFilters, resetFilters, retry } = useAuditLogs();

  const handleApply = (applied: AuditLogFilter) => {
    setFilters({ ...applied, page: 1 });
  };

  const handlePageChange = (page: number, pageSize: number) => {
    setFilters({ page, pageSize });
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" fontWeight={700} gutterBottom>
        Logs de auditoría
      </Typography>

      <AuditLogFilters
        filters={filters}
        onApply={handleApply}
        onReset={resetFilters}
      />

      <AuditLogTable
        data={data}
        loading={loading}
        error={error}
        onPageChange={handlePageChange}
        onRetry={retry}
      />
    </Box>
  );
}
