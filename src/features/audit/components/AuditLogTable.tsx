import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Collapse,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import { useState } from 'react';
import type { AuditAction, AuditLogEntry, AuditLogPage } from '../models/AuditLog.model';
import AuditLogDetail from './AuditLogDetail';

interface AuditLogTableProps {
  data: AuditLogPage | null;
  loading: boolean;
  error: string | null;
  onPageChange: (page: number, pageSize: number) => void;
  onRetry: () => void;
}

const ACTION_COLORS: Record<AuditAction, { bg: string; color: string }> = {
  LOGIN: { bg: '#e8f5e9', color: '#2e7d32' },
  LOGIN_FAILED: { bg: '#ffebee', color: '#c62828' },
  INSERT: { bg: '#e3f2fd', color: '#1565c0' },
  UPDATE: { bg: '#fff8e1', color: '#e65100' },
  DELETE: { bg: '#ffebee', color: '#c62828' },
};

function ActionBadge({ action }: { action: AuditAction }) {
  const style = ACTION_COLORS[action] ?? { bg: '#f5f5f5', color: '#333' };
  return (
    <Chip
      label={action}
      size="small"
      sx={{ bgcolor: style.bg, color: style.color, fontWeight: 600, fontSize: '0.7rem' }}
    />
  );
}

function StatusBadge({ code }: { code: number | null }) {
  if (code === null) return <Typography variant="body2">—</Typography>;
  const isOk = code >= 200 && code < 300;
  return (
    <Chip
      label={code}
      size="small"
      sx={{
        bgcolor: isOk ? '#e8f5e9' : '#ffebee',
        color: isOk ? '#2e7d32' : '#c62828',
        fontWeight: 600,
        fontSize: '0.7rem',
      }}
    />
  );
}

function formatTimestamp(ts: string): string {
  return new Intl.DateTimeFormat('es-CO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(new Date(ts));
}

function ExpandableRow({ row }: { row: AuditLogEntry }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <TableRow hover sx={{ '& > *': { borderBottom: 'unset' } }}>
        <TableCell>{formatTimestamp(row.timestamp)}</TableCell>
        <TableCell>{row.userName ?? row.userId ?? '—'}</TableCell>
        <TableCell><ActionBadge action={row.action} /></TableCell>
        <TableCell>{row.module ?? '—'}</TableCell>
        <TableCell>
          {row.entityType && row.entityId
            ? `${row.entityType} #${row.entityId}`
            : row.entityType ?? '—'}
        </TableCell>
        <TableCell>{row.ipAddress ?? '—'}</TableCell>
        <TableCell><StatusBadge code={row.statusCode} /></TableCell>
        <TableCell>
          {row.durationMs !== null ? (
            <Tooltip title={`${row.durationMs} ms`}>
              <Typography variant="body2">{row.durationMs} ms</Typography>
            </Tooltip>
          ) : '—'}
        </TableCell>
        <TableCell padding="checkbox">
          <IconButton size="small" onClick={() => setOpen(prev => !prev)}>
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell colSpan={9} sx={{ p: 0, border: open ? undefined : 'none' }}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ px: 2, pb: 2 }}>
              <AuditLogDetail entry={row} />
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
}

export default function AuditLogTable({
  data,
  loading,
  error,
  onPageChange,
  onRetry,
}: AuditLogTableProps) {
  const page = (data?.page ?? 1) - 1; // TablePagination es base 0
  const pageSize = data?.pageSize ?? 20;
  const totalCount = data?.totalCount ?? 0;

  const handleChangePage = (_: unknown, newPage: number) => {
    onPageChange(newPage + 1, pageSize);
  };

  const handleChangeRowsPerPage = (e: React.ChangeEvent<HTMLInputElement>) => {
    onPageChange(1, parseInt(e.target.value, 10));
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert
        severity="error"
        action={<Button color="inherit" size="small" onClick={onRetry}>Reintentar</Button>}
        sx={{ my: 2 }}
      >
        {error}
      </Alert>
    );
  }

  if (!data || data.items.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 6, color: 'text.secondary' }}>
        <Typography variant="body1">No se encontraron registros de auditoría.</Typography>
        <Typography variant="body2">Ajusta los filtros o amplía el rango de fechas.</Typography>
      </Box>
    );
  }

  return (
    <Paper variant="outlined">
      <TableContainer>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>Fecha y hora</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Usuario</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Acción</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Módulo</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Entidad</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>IP</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Estado HTTP</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Duración</TableCell>
              <TableCell />
            </TableRow>
          </TableHead>
          <TableBody>
            {data.items.map(row => (
              <ExpandableRow key={row.id} row={row} />
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        component="div"
        count={totalCount}
        page={page}
        rowsPerPage={pageSize}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        rowsPerPageOptions={[10, 20, 50, 100]}
        labelRowsPerPage="Registros por página:"
        labelDisplayedRows={({ from, to, count }) =>
          `${from}–${to} de ${count !== -1 ? count : `más de ${to}`}`
        }
      />
    </Paper>
  );
}
