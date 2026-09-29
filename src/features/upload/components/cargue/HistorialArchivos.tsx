import {
  Chip,
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
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon       from '@mui/icons-material/ErrorOutline';
import type { HistorialArchivo } from './tiposCargue';

/** Archivos subidos al lote, exitosos y fallidos. */
export default function HistorialArchivos({ historial }: { historial: HistorialArchivo[] }) {
  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="subtitle1" fontWeight={600} mb={1.5}>
        Historial de archivos cargados
      </Typography>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Insumo</TableCell>
              <TableCell>Archivo</TableCell>
              <TableCell align="right">Filas parseadas</TableCell>
              <TableCell>Resultado</TableCell>
              <TableCell>Fecha carga</TableCell>
              <TableCell>Usuario</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {historial.map(h => (
              <TableRow key={h.id}>
                <TableCell>
                  <Chip label={h.insumo} size="small" variant="outlined" color="primary" />
                </TableCell>
                <TableCell>{h.nombreArchivo}</TableCell>
                <TableCell align="right">{h.filasParseadas ?? '—'}</TableCell>
                <TableCell>
                  <Stack direction="row" spacing={0.5} alignItems="center">
                    {h.resultado === 'Exitoso'
                      ? <CheckCircleOutlineIcon color="success" fontSize="small" />
                      : <ErrorOutlineIcon color="error" fontSize="small" />
                    }
                    <Typography variant="caption">
                      {h.mensajeResultado ?? h.resultado}
                    </Typography>
                  </Stack>
                </TableCell>
                <TableCell>{new Date(h.fechaCarga).toLocaleString('es-CO')}</TableCell>
                <TableCell>{h.usuarioCarga}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}
