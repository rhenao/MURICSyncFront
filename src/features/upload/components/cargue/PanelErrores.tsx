import { useEffect, useState } from 'react';
import {
  Alert,
  Button,
  Chip,
  LinearProgress,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import axiosSecurityAPIClient from '../../../../api/axiosSecurityAPIClient';
import { fetchConToken } from '../../../../api/fetchConToken';
import { extractBackendErrors } from '../../../../utils/extractBackendErrors';

interface ErrorValidacion {
  id: number;
  insumo: string;
  numeroFila: number | null;
  campo: string | null;
  valorObservado: string | null;
  codigoRegla: string;
  severidad: string;
  mensaje: string;
}

// La tabla muestra hasta este número; el CSV trae todos.
const MAX_EN_PANTALLA = 500;

interface PanelErroresProps {
  loteId: number;
  total: number;
  errores: number;
  // Cambia cada vez que se recarga el lote (subir, validar): vuelve a pedir los errores.
  version: unknown;
}

/** Errores de validación por celda (ADR 0007): fila, campo, valor, regla y mensaje. */
export default function PanelErrores({ loteId, total, errores, version }: PanelErroresProps) {
  const [filas, setFilas] = useState<ErrorValidacion[]>([]);
  const [cargando, setCargando] = useState(false);
  const [exportando, setExportando] = useState(false);
  const [falla, setFalla] = useState<string | null>(null);

  useEffect(() => {
    let activo = true;
    setCargando(true);
    setFalla(null);
    axiosSecurityAPIClient
      .get<ErrorValidacion[]>(`/cargas/${loteId}/errores`, { params: { tamanoPagina: MAX_EN_PANTALLA } })
      .then(r => { if (activo) setFilas(r.data); })
      .catch(err => { if (activo) setFalla(extractBackendErrors(err, 'No se pudieron cargar los errores.').join(' ')); })
      .finally(() => { if (activo) setCargando(false); });
    return () => { activo = false; };
  }, [loteId, total, version]);

  const exportar = async () => {
    setExportando(true);
    setFalla(null);
    try {
      const res = await fetchConToken(`/cargas/${loteId}/errores/exportar`);
      if (!res.ok) throw new Error(`Error ${res.status} al exportar los errores.`);
      const url = URL.createObjectURL(await res.blob());
      const a = document.createElement('a');
      a.href = url;
      a.download = `errores-lote-${loteId}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setFalla(err instanceof Error ? err.message : 'No se pudieron exportar los errores.');
    } finally {
      setExportando(false);
    }
  };

  return (
    <Paper sx={{ p: 2 }}>
      <Stack direction="row" spacing={1.5} alignItems="center" justifyContent="space-between" mb={1.5}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Typography variant="subtitle1" fontWeight={600}>
            Errores de validación
          </Typography>
          <Chip label={`${total}`} size="small" color={errores > 0 ? 'error' : 'warning'} />
        </Stack>
        <Button
          size="small"
          variant="outlined"
          startIcon={<FileDownloadIcon />}
          onClick={exportar}
          disabled={exportando}
        >
          Exportar CSV
        </Button>
      </Stack>

      {errores > 0 && (
        <Alert severity="error" sx={{ mb: 1.5 }}>
          Los errores bloquean la promoción. Corrija los archivos, vuelva a subirlos y valide de nuevo.
        </Alert>
      )}
      {falla && <Alert severity="error" sx={{ mb: 1.5 }}>{falla}</Alert>}
      {cargando && <LinearProgress sx={{ mb: 1 }} />}
      {total > filas.length && !cargando && (
        <Typography variant="caption" color="text.secondary" display="block" mb={1}>
          Se muestran {filas.length} de {total}. Exporte el CSV para verlos todos.
        </Typography>
      )}

      <TableContainer sx={{ maxHeight: 400 }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>Insumo</TableCell>
              <TableCell align="right">Fila</TableCell>
              <TableCell>Campo</TableCell>
              <TableCell>Valor</TableCell>
              <TableCell>Severidad</TableCell>
              <TableCell>Mensaje</TableCell>
              <TableCell>Regla</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filas.map(e => (
              <TableRow key={e.id}>
                <TableCell>{e.insumo}</TableCell>
                <TableCell align="right">{e.numeroFila ?? '—'}</TableCell>
                <TableCell>{e.campo ?? '—'}</TableCell>
                <TableCell sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
                  {e.valorObservado ?? <em>(vacío)</em>}
                </TableCell>
                <TableCell>
                  <Chip
                    label={e.severidad}
                    size="small"
                    color={e.severidad === 'Error' ? 'error' : 'warning'}
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>{e.mensaje}</TableCell>
                <TableCell>
                  <Typography variant="caption" color="text.secondary">{e.codigoRegla}</Typography>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}
