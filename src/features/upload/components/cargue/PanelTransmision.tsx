import {
  Box,
  Button,
  Chip,
  IconButton,
  LinearProgress,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import SendIcon         from '@mui/icons-material/Send';
import RefreshIcon      from '@mui/icons-material/Refresh';
import { ESTADO_TX_COLOR, type TransmisionSfc } from './tiposCargue';

interface PanelTransmisionProps {
  transmisiones: TransmisionSfc[];
  descargandoAvro: boolean;
  transmitiendo: boolean;
  consultandoTxId: number | null;
  isBusy: boolean;
  // Sin cargas.write: solo el historial; generar, transmitir y consultar son POST o requieren escritura.
  soloLectura: boolean;
  onDescargarAvro: () => void;
  onTransmitir: () => void;
  onConsultarEstado: (txId: number) => void;
}

/** Paso 4 (lote promovido): AVRO, transmisión a la SFC e historial de transmisiones. */
export default function PanelTransmision({
  transmisiones,
  descargandoAvro,
  transmitiendo,
  consultandoTxId,
  isBusy,
  soloLectura,
  onDescargarAvro,
  onTransmitir,
  onConsultarEstado,
}: PanelTransmisionProps) {
  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="subtitle1" fontWeight={600} mb={1.5}>
        4. Transmisión a la SFC
      </Typography>
      {!soloLectura && (
        <Stack direction="row" spacing={1.5} alignItems="center" mb={transmitiendo ? 1.5 : 0}>
          <Button
            variant="outlined"
            startIcon={<FileDownloadIcon />}
            onClick={onDescargarAvro}
            disabled={isBusy}
          >
            {descargandoAvro ? 'Generando…' : 'Descargar AVRO (.avro.p7z)'}
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={<SendIcon />}
            onClick={onTransmitir}
            disabled={isBusy}
          >
            {transmitiendo ? 'Transmitiendo…' : 'Transmitir a SFC'}
          </Button>
        </Stack>
      )}
      {soloLectura && transmisiones.length === 0 && (
        <Typography variant="body2" color="text.secondary">Sin transmisiones.</Typography>
      )}
      {transmitiendo && <LinearProgress sx={{ mt: 1 }} />}

      {/* Historial de transmisiones */}
      {transmisiones.length > 0 && (
        <Box mt={2}>
          <Typography variant="subtitle2" fontWeight={600} mb={1}>
            Historial de transmisiones
          </Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>ID SFC</TableCell>
                  <TableCell>Archivo</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell align="center">Cód. SFC</TableCell>
                  <TableCell align="center">Créditos / Demog. / Mov.</TableCell>
                  <TableCell>Fecha transmisión</TableCell>
                  <TableCell>Usuario</TableCell>
                  {!soloLectura && <TableCell align="center">Acciones</TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {transmisiones.map(tx => (
                  <TableRow key={tx.id}>
                    <TableCell>
                      <Tooltip title={`SHA-256: ${tx.hashSha256}`}>
                        <Typography variant="body2" fontFamily="monospace">
                          {tx.idTransmisionSfc}
                        </Typography>
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      <Tooltip title={tx.nombreArchivo}>
                        <Typography variant="body2" noWrap sx={{ maxWidth: 180 }}>
                          {tx.nombreArchivo}
                        </Typography>
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={tx.estado}
                        size="small"
                        color={ESTADO_TX_COLOR[tx.estado] ?? 'default'}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2" color="text.secondary">
                        {tx.codigoEstadoSfc ?? '—'}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2">
                        {tx.totalCreditos} / {tx.totalDemograficos} / {tx.totalMovimientos}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {new Date(tx.fechaTransmision).toLocaleString('es-CO')}
                    </TableCell>
                    <TableCell>{tx.usuarioTransmisor}</TableCell>
                    {!soloLectura && (
                      <TableCell align="center">
                        <Tooltip title="Consultar estado en SFC">
                          <span>
                            <IconButton
                              size="small"
                              onClick={() => onConsultarEstado(tx.id)}
                              disabled={consultandoTxId === tx.id || isBusy}
                            >
                              <RefreshIcon fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}
    </Paper>
  );
}
