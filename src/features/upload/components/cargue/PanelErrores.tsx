import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
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
import PanelCodigosInvalidos from './PanelCodigosInvalidos';

/** GET /cargas/{id}/errores/resumen: errores agrupados por regla, severidad, insumo y campo (CC-D). */
interface ResumenError {
  codigoRegla: string;
  severidad: string;
  insumo: string;
  campo: string | null;
  filas: number;
  valorEjemplo: string | null;
  mensajeEjemplo: string;
}

type FiltroErrores = Pick<ResumenError, 'codigoRegla' | 'insumo' | 'campo' | 'filas'>;

const mismoGrupo = (a: FiltroErrores | null, b: ResumenError) =>
  !!a && a.codigoRegla === b.codigoRegla && a.insumo === b.insumo && a.campo === b.campo;

/** Parámetros de /errores y /errores/exportar para el grupo elegido en el resumen. */
const paramsDe = (filtro: FiltroErrores | null): Record<string, string> =>
  filtro
    ? { codigoRegla: filtro.codigoRegla, insumo: filtro.insumo, ...(filtro.campo ? { campo: filtro.campo } : {}) }
    : {};

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
  // Para crear equivalencias desde los códigos no válidos y volver a validar (fase EQ-D).
  canWrite: boolean;
  canValidar: boolean;
  isBusy: boolean;
  onValidar: () => void;
}

/**
 * Errores de validación por celda (ADR 0007): fila, campo, valor, regla y mensaje. Arriba, el resumen por regla y
 * campo (plan de consistencia de cargues, CC-D); al hacer clic en un renglón la tabla y el CSV se filtran por él.
 */
export default function PanelErrores({
  loteId,
  total,
  errores,
  version,
  canWrite,
  canValidar,
  isBusy,
  onValidar,
}: PanelErroresProps) {
  const [filas, setFilas] = useState<ErrorValidacion[]>([]);
  const [resumen, setResumen] = useState<ResumenError[]>([]);
  const [filtro, setFiltro] = useState<FiltroErrores | null>(null);
  const [cargando, setCargando] = useState(false);
  const [exportando, setExportando] = useState(false);
  const [falla, setFalla] = useState<string | null>(null);

  // Al recargar el lote (subir, validar) el resumen cambia: se pide de nuevo y se quita el filtro.
  useEffect(() => {
    let activo = true;
    setFiltro(null);
    axiosSecurityAPIClient
      .get<ResumenError[]>(`/cargas/${loteId}/errores/resumen`)
      .then(r => { if (activo) setResumen(r.data); })
      .catch(err => { if (activo) setFalla(extractBackendErrors(err, 'No se pudo cargar el resumen de errores.').join(' ')); });
    return () => { activo = false; };
  }, [loteId, total, version]);

  useEffect(() => {
    let activo = true;
    setCargando(true);
    setFalla(null);
    axiosSecurityAPIClient
      .get<ErrorValidacion[]>(`/cargas/${loteId}/errores`, {
        params: { ...paramsDe(filtro), tamanoPagina: MAX_EN_PANTALLA },
      })
      .then(r => { if (activo) setFilas(r.data); })
      .catch(err => { if (activo) setFalla(extractBackendErrors(err, 'No se pudieron cargar los errores.').join(' ')); })
      .finally(() => { if (activo) setCargando(false); });
    return () => { activo = false; };
  }, [loteId, total, version, filtro]);

  const totalMostrado = filtro?.filas ?? total;

  const exportar = async () => {
    setExportando(true);
    setFalla(null);
    try {
      const query = new URLSearchParams(paramsDe(filtro)).toString();
      const res = await fetchConToken(`/cargas/${loteId}/errores/exportar${query ? `?${query}` : ''}`);
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
          Los errores bloquean la promoción. Corrija los archivos y vuelva a subirlos, o cree equivalencias
          para los códigos no válidos, y valide de nuevo.
        </Alert>
      )}

      <PanelCodigosInvalidos
        loteId={loteId}
        version={version}
        canWrite={canWrite}
        canValidar={canValidar}
        isBusy={isBusy}
        onValidar={onValidar}
      />

      {falla && <Alert severity="error" sx={{ mb: 1.5 }}>{falla}</Alert>}
      {resumen.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" fontWeight={600} mb={0.5}>
            Resumen por regla y campo
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block" mb={1}>
            Haga clic en un renglón para ver solo esos errores; el CSV exporta lo que esté filtrado.
          </Typography>
          <TableContainer sx={{ maxHeight: 260 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>Regla</TableCell>
                  <TableCell>Severidad</TableCell>
                  <TableCell>Insumo</TableCell>
                  <TableCell>Campo</TableCell>
                  <TableCell align="right">Filas</TableCell>
                  <TableCell>Ejemplo</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {resumen.map(r => (
                  <TableRow
                    key={`${r.codigoRegla}|${r.insumo}|${r.campo ?? ''}|${r.severidad}`}
                    hover
                    selected={mismoGrupo(filtro, r)}
                    onClick={() => setFiltro(mismoGrupo(filtro, r) ? null : r)}
                    sx={{ cursor: 'pointer' }}
                  >
                    <TableCell>
                      <Typography variant="caption">{r.codigoRegla}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={r.severidad}
                        size="small"
                        color={r.severidad === 'Error' ? 'error' : 'warning'}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>{r.insumo}</TableCell>
                    <TableCell>{r.campo ?? '—'}</TableCell>
                    <TableCell align="right">{r.filas.toLocaleString('es-CO')}</TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary">
                        {r.valorEjemplo ? `ej. ${r.valorEjemplo} · ` : ''}
                        {r.mensajeEjemplo}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {filtro && (
        <Alert
          severity="info"
          sx={{ mb: 1 }}
          action={
            <Button color="inherit" size="small" onClick={() => setFiltro(null)}>
              Ver todos
            </Button>
          }
        >
          Filtrado por {filtro.codigoRegla} · {filtro.insumo}
          {filtro.campo ? ` · ${filtro.campo}` : ''}.
        </Alert>
      )}
      {cargando && <LinearProgress sx={{ mb: 1 }} />}
      {totalMostrado > filas.length && !cargando && (
        <Typography variant="caption" color="text.secondary" display="block" mb={1}>
          Se muestran {filas.length} de {totalMostrado.toLocaleString('es-CO')}. Exporte el CSV para verlos todos.
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
