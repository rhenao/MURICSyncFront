import { Box, Chip, Stack, Typography } from '@mui/material';
import type { ReactNode } from 'react';

interface ValueDiffProps {
  oldValues: Record<string, unknown> | null;
  newValues: Record<string, unknown> | null;
}

function parseIfString(val: Record<string, unknown> | null): Record<string, unknown> | null {
  if (val === null) return null;
  if (typeof val === 'string') {
    try { return JSON.parse(val); } catch { return null; }
  }
  return val;
}

function formatValue(val: unknown): string {
  if (val === null || val === undefined) return '(vacío)';
  if (typeof val === 'object') return JSON.stringify(val);
  return String(val);
}

export default function ValueDiff({ oldValues, newValues }: ValueDiffProps) {
  const old = parseIfString(oldValues);
  const nw = parseIfString(newValues);

  const allKeys = Array.from(
    new Set([...Object.keys(old ?? {}), ...Object.keys(nw ?? {})])
  );

  if (allKeys.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        Sin cambios de valores registrados.
      </Typography>
    );
  }

  const rows: ReactNode[] = [];

  for (const key of allKeys) {
    const inOld = old !== null && key in old;
    const inNew = nw !== null && key in nw;
    const oldVal = old?.[key];
    const newVal = nw?.[key];

    if (inOld && !inNew) {
      rows.push(
        <Box
          key={key}
          sx={{
            display: 'flex', gap: 1, alignItems: 'center',
            backgroundColor: '#ffebee', px: 1.5, py: 0.75,
            borderRadius: 1, borderLeft: '3px solid #ef5350',
          }}
        >
          <Chip label="−" size="small" sx={{ bgcolor: '#ef5350', color: '#fff', fontWeight: 700, minWidth: 28 }} />
          <Typography variant="body2" fontWeight={600}>{key}:</Typography>
          <Typography variant="body2" sx={{ color: '#c62828', textDecoration: 'line-through' }}>
            {formatValue(oldVal)}
          </Typography>
        </Box>
      );
    } else if (!inOld && inNew) {
      rows.push(
        <Box
          key={key}
          sx={{
            display: 'flex', gap: 1, alignItems: 'center',
            backgroundColor: '#e8f5e9', px: 1.5, py: 0.75,
            borderRadius: 1, borderLeft: '3px solid #66bb6a',
          }}
        >
          <Chip label="+" size="small" sx={{ bgcolor: '#66bb6a', color: '#fff', fontWeight: 700, minWidth: 28 }} />
          <Typography variant="body2" fontWeight={600}>{key}:</Typography>
          <Typography variant="body2" sx={{ color: '#2e7d32' }}>
            {formatValue(newVal)}
          </Typography>
        </Box>
      );
    } else {
      const changed = formatValue(oldVal) !== formatValue(newVal);
      if (!changed) continue;
      rows.push(
        <Box
          key={key}
          sx={{
            backgroundColor: '#fff8e1', px: 1.5, py: 0.75,
            borderRadius: 1, borderLeft: '3px solid #ffa726',
          }}
        >
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 0.5 }}>
            <Chip label="~" size="small" sx={{ bgcolor: '#ffa726', color: '#fff', fontWeight: 700, minWidth: 28 }} />
            <Typography variant="body2" fontWeight={600}>{key}</Typography>
          </Box>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, pl: 4 }}>
            <Typography variant="body2" sx={{ color: '#c62828' }}>
              Antes: {formatValue(oldVal)}
            </Typography>
            <Typography variant="body2" sx={{ color: '#2e7d32' }}>
              Después: {formatValue(newVal)}
            </Typography>
          </Box>
        </Box>
      );
    }
  }

  if (rows.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        Sin diferencias detectadas.
      </Typography>
    );
  }

  return <Stack spacing={0.75}>{rows}</Stack>;
}
