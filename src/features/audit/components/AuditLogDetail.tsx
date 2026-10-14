import {
  Box,
  Divider,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { useState } from 'react';
import type { AuditLogEntry } from '../models/AuditLog.model';
import ValueDiff from './ValueDiff';

interface AuditLogDetailProps {
  entry: AuditLogEntry;
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

function Field({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <Box sx={{ minWidth: 180 }}>
      <Typography
        variant="caption"
        color="text.secondary"
        fontWeight={600}
        sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}
      >
        {label}
      </Typography>
      <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
        {value !== null && value !== undefined ? String(value) : '—'}
      </Typography>
    </Box>
  );
}

export default function AuditLogDetail({ entry }: AuditLogDetailProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!entry.correlationId) return;
    await navigator.clipboard.writeText(entry.correlationId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
      <Typography variant="subtitle2" fontWeight={700} gutterBottom>
        Detalle del registro #{entry.id}
      </Typography>
      <Divider sx={{ mb: 2 }} />

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 2 }}>
        <Field label="Fecha y hora" value={formatTimestamp(entry.timestamp)} />
        <Field label="Usuario ID" value={entry.userId} />
        <Field label="Nombre de usuario" value={entry.userName} />
        <Field label="Acción" value={entry.action} />
        <Field label="Módulo" value={entry.module} />
        <Field label="Dirección IP" value={entry.ipAddress} />
        <Field label="Tipo de entidad" value={entry.entityType} />
        <Field label="ID de entidad" value={entry.entityId} />
        <Field label="Período de corte" value={entry.periodoCorte} />
        <Field label="Método HTTP" value={entry.httpMethod} />
        <Field label="Endpoint" value={entry.endpoint} />
        <Field label="Código HTTP" value={entry.statusCode} />
        <Field label="Duración" value={entry.durationMs !== null ? `${entry.durationMs} ms` : null} />
      </Box>

      <Box>
        <Typography
          variant="caption"
          color="text.secondary"
          fontWeight={600}
          sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}
        >
          Correlation ID
        </Typography>
        <Stack direction="row" alignItems="center" gap={0.5}>
          <Typography variant="body2" sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
            {entry.correlationId ?? '—'}
          </Typography>
          {entry.correlationId && (
            <Tooltip title={copied ? 'Copiado' : 'Copiar al portapapeles'}>
              <IconButton size="small" onClick={handleCopy}>
                {copied
                  ? <CheckCircleOutlineIcon fontSize="small" color="success" />
                  : <ContentCopyIcon fontSize="small" />}
              </IconButton>
            </Tooltip>
          )}
        </Stack>
      </Box>

      {(entry.oldValues || entry.newValues) && (
        <>
          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle2" fontWeight={700} gutterBottom>
            Cambios en los datos
          </Typography>
          <ValueDiff oldValues={entry.oldValues} newValues={entry.newValues} />
        </>
      )}
    </Box>
  );
}
