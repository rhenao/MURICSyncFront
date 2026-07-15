import {
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import { useState, useEffect } from 'react';
import type { AuditAction, AuditLogFilter, AuditModule } from '../models/AuditLog.model';

const AUDIT_ACTIONS: AuditAction[] = ['LOGIN', 'LOGIN_FAILED', 'INSERT', 'UPDATE', 'DELETE'];
const AUDIT_MODULES: AuditModule[] = [
  'MURIC_001_001',
  'MURIC_001_002',
  'MURIC_001_003',
  'TRANSMISION',
  'AUTH',
];

interface AuditLogFiltersProps {
  filters: AuditLogFilter;
  onApply: (filters: AuditLogFilter) => void;
  onReset: () => void;
}

export default function AuditLogFilters({ filters, onApply, onReset }: AuditLogFiltersProps) {
  const [local, setLocal] = useState<AuditLogFilter>(filters);

  // Sincronizar estado local cuando los filtros externos cambian (ej: reset)
  useEffect(() => {
    setLocal(filters);
  }, [filters]);

  const handleApply = () => {
    onApply(local);
  };

  const handleReset = () => {
    setLocal({});
    onReset();
  };

  return (
    <Box
      sx={{
        p: 2,
        mb: 2,
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        bgcolor: 'background.paper',
      }}
    >
      <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2 }}>
        Filtros
      </Typography>

      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 2,
          alignItems: 'flex-end',
        }}
      >
        <TextField
          label="Desde"
          type="date"
          size="small"
          value={local.dateFrom ?? ''}
          onChange={e => setLocal(prev => ({ ...prev, dateFrom: e.target.value || undefined }))}
          InputLabelProps={{ shrink: true }}
          sx={{ minWidth: 160 }}
        />

        <TextField
          label="Hasta"
          type="date"
          size="small"
          value={local.dateTo ?? ''}
          onChange={e => setLocal(prev => ({ ...prev, dateTo: e.target.value || undefined }))}
          InputLabelProps={{ shrink: true }}
          sx={{ minWidth: 160 }}
        />

        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Acción</InputLabel>
          <Select
            label="Acción"
            value={local.action ?? ''}
            onChange={e =>
              setLocal(prev => ({
                ...prev,
                action: (e.target.value as AuditAction) || undefined,
              }))
            }
          >
            <MenuItem value=""><em>Todas</em></MenuItem>
            {AUDIT_ACTIONS.map(a => (
              <MenuItem key={a} value={a}>{a}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Módulo</InputLabel>
          <Select
            label="Módulo"
            value={local.module ?? ''}
            onChange={e =>
              setLocal(prev => ({
                ...prev,
                module: (e.target.value as AuditModule) || undefined,
              }))
            }
          >
            <MenuItem value=""><em>Todos</em></MenuItem>
            {AUDIT_MODULES.map(m => (
              <MenuItem key={m} value={m}>{m}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          label="Usuario (ID o nombre)"
          size="small"
          value={local.userId ?? ''}
          onChange={e => setLocal(prev => ({ ...prev, userId: e.target.value || undefined }))}
          sx={{ minWidth: 200 }}
        />

        <TextField
          label="Dirección IP"
          size="small"
          value={local.ipAddress ?? ''}
          onChange={e => setLocal(prev => ({ ...prev, ipAddress: e.target.value || undefined }))}
          sx={{ minWidth: 160 }}
        />

        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="contained"
            size="small"
            startIcon={<FilterListIcon />}
            onClick={handleApply}
          >
            Aplicar
          </Button>
          <Button
            variant="outlined"
            size="small"
            startIcon={<RestartAltIcon />}
            onClick={handleReset}
          >
            Limpiar
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
