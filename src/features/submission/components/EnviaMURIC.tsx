import { useCallback, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  LinearProgress,
  Link,
  Paper,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import SearchIcon from "@mui/icons-material/Search";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import RefreshIcon from "@mui/icons-material/Refresh";
import ChipEntidadReportante from "../../configuracion/components/ChipEntidadReportante";
import LoteService from "../../upload/services/LoteService";
import { ESTADO_LOTE_COLOR, type LoteResumen } from "../../upload/models/Lote.model";
import TransmisionService from "../services/TransmisionService";
import { ESTADO_TX_COLOR, type TransmisionSfc } from "../models/Transmision.model";

const getLastDayOfPreviousMonth = (): string => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 0).toISOString().slice(0, 10);
};

const mensajeDe = (err: unknown): string => {
  const d = (err as { response?: { data?: unknown } })?.response?.data;
  if (!d) return err instanceof Error ? err.message : "Error desconocido";
  if (typeof d === "string") return d;
  const rec = d as Record<string, unknown>;
  return String(rec.mensaje ?? rec.message ?? "Error desconocido");
};

/**
 * Envío a la SFC por fecha de corte: un solo AVRO de Titularice con todas las universalidades del corte
 * (backend ADR 0008). Solo se genera y transmite cuando cada lote no anulado del corte está promovido.
 * Acepta ?fechaCorte=AAAA-MM-DD (lo usa el enlace desde un lote promovido en Cargue de archivos).
 */
export default function EnviaMURIC() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [fechaCorte, setFechaCorte] = useState(
    () => searchParams.get("fechaCorte") ?? getLastDayOfPreviousMonth()
  );
  const [corteConsultado, setCorteConsultado] = useState<string | null>(null);

  const [lotes, setLotes] = useState<LoteResumen[]>([]);
  const [transmisiones, setTransmisiones] = useState<TransmisionSfc[]>([]);
  const [cargando, setCargando] = useState(false);
  const [descargando, setDescargando] = useState(false);
  const [transmitiendo, setTransmitiendo] = useState(false);
  const [consultandoTxId, setConsultandoTxId] = useState<number | null>(null);
  const [confirmar, setConfirmar] = useState(false);
  const [errores, setErrores] = useState<string[]>([]);
  const [snackMsg, setSnackMsg] = useState<string | null>(null);

  const consultarCorte = useCallback(async (corte: string) => {
    setCargando(true);
    setErrores([]);
    try {
      const [lotesCorte, txCorte] = await Promise.all([
        LoteService.listar({ fechaCorte: corte }),
        TransmisionService.listar(corte),
      ]);
      setLotes(lotesCorte);
      setTransmisiones(txCorte);
      setCorteConsultado(corte);
    } catch (err) {
      setErrores([mensajeDe(err)]);
    } finally {
      setCargando(false);
    }
  }, []);

  // Al entrar se consulta el corte de la URL o el más reciente.
  useEffect(() => {
    consultarCorte(fechaCorte);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- solo al montar; luego lo dispara "Consultar"
  }, [consultarCorte]);

  // E10: un corte se transmite cuando todos sus lotes no anulados están promovidos.
  const activos = lotes.filter((l) => l.estado !== "Anulado");
  const pendientes = activos.filter((l) => l.estado !== "Promovido");
  const promovidos = activos.filter((l) => l.estado === "Promovido");
  const universalidades = new Set(promovidos.map((l) => l.universalidadCodigo)).size;
  const listo = corteConsultado !== null && promovidos.length > 0 && pendientes.length === 0;
  const ocupado = cargando || descargando || transmitiendo;

  const handleDescargar = async () => {
    if (!corteConsultado) return;
    setDescargando(true);
    setErrores([]);
    try {
      const { blob, nombre, sha256 } = await TransmisionService.descargarAvro(corteConsultado);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = nombre;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setSnackMsg(sha256 ? `Descargado: ${nombre} — SHA-256: ${sha256.slice(0, 16)}…` : `Descargado: ${nombre}`);
    } catch (err) {
      setErrores([mensajeDe(err)]);
    } finally {
      setDescargando(false);
    }
  };

  const handleTransmitir = async () => {
    if (!corteConsultado) return;
    setConfirmar(false);
    setTransmitiendo(true);
    setErrores([]);
    try {
      const data = await TransmisionService.transmitir(corteConsultado);
      setSnackMsg(`Transmisión exitosa — ${data.nombreArchivo} — ID SFC: ${data.idTransmisionSfc}`);
    } catch (err) {
      setErrores([mensajeDe(err)]);
    } finally {
      setTransmitiendo(false);
      await consultarCorte(corteConsultado);
    }
  };

  const handleConsultarEstado = async (txId: number) => {
    if (!corteConsultado) return;
    setConsultandoTxId(txId);
    setErrores([]);
    try {
      await TransmisionService.consultarEstado(txId);
      setTransmisiones(await TransmisionService.listar(corteConsultado));
      setSnackMsg("Estado de transmisión actualizado.");
    } catch (err) {
      setErrores([mensajeDe(err)]);
    } finally {
      setConsultandoTxId(null);
    }
  };

  const abrirLote = (id: number) => navigate(`/app/carga-archivos/${id}`);

  return (
    <Box sx={{ p: 2, display: "flex", flexDirection: "column", gap: 2 }}>
      {/* ── Corte ── */}
      <Paper sx={{ p: 2 }}>
        <Stack direction="row" spacing={1.5} alignItems="center" mb={2}>
          <Typography variant="h6" fontWeight={700}>
            Envío a MURIC
          </Typography>
          <ChipEntidadReportante />
        </Stack>
        <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
          <TextField
            label="Fecha de corte"
            type="date"
            size="small"
            value={fechaCorte}
            onChange={(e) => setFechaCorte(e.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <Button
            variant="outlined"
            startIcon={<SearchIcon />}
            onClick={() => consultarCorte(fechaCorte)}
            disabled={!fechaCorte || ocupado}
          >
            Consultar
          </Button>
          <Typography variant="body2" color="text.secondary">
            Se genera un solo archivo por corte, con todas las universalidades.
          </Typography>
        </Stack>
        {cargando && <LinearProgress sx={{ mt: 2 }} />}
      </Paper>

      {errores.length > 0 && (
        <Alert severity="error" onClose={() => setErrores([])}>
          <ul style={{ margin: 0, paddingLeft: 16 }}>
            {errores.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        </Alert>
      )}

      {corteConsultado && (
        <>
          {/* ── Estado del corte ── */}
          <Paper sx={{ p: 2 }}>
            <Stack direction="row" spacing={1.5} alignItems="center" mb={1.5}>
              <Typography variant="subtitle1" fontWeight={600}>
                Lotes del corte {corteConsultado}
              </Typography>
              <Chip label={`${lotes.length} lote${lotes.length !== 1 ? "s" : ""}`} size="small" variant="outlined" />
            </Stack>

            {pendientes.length > 0 ? (
              <Alert severity="warning" sx={{ mb: 2 }}>
                El corte no se puede transmitir: {pendientes.length} lote(s) sin promover. Promuévalos, o anule los
                que no deban ir en este corte.
              </Alert>
            ) : promovidos.length === 0 ? (
              <Alert severity="info" sx={{ mb: 2 }}>
                No hay lotes promovidos para este corte.
              </Alert>
            ) : (
              <Alert severity="success" sx={{ mb: 2 }}>
                Listo para transmitir: {promovidos.length} lote(s) promovido(s) de {universalidades} universalidad(es).
              </Alert>
            )}

            {lotes.length > 0 && (
              <TableContainer sx={{ mb: 2 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Lote</TableCell>
                      <TableCell>Universalidad</TableCell>
                      <TableCell>Estado</TableCell>
                      <TableCell align="center">Filas 001 / 002 / 003</TableCell>
                      <TableCell>Promovido</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {lotes.map((l) => (
                      <TableRow key={l.id} sx={{ opacity: l.estado === "Anulado" ? 0.5 : 1 }}>
                        <TableCell>
                          <Link component="button" variant="body2" onClick={() => abrirLote(l.id)}>
                            #{l.id}
                          </Link>
                        </TableCell>
                        <TableCell>
                          {l.universalidadCodigo} — {l.universalidadDescripcion ?? ""}
                        </TableCell>
                        <TableCell>
                          <Chip label={l.estado} size="small" color={ESTADO_LOTE_COLOR[l.estado] ?? "default"} />
                        </TableCell>
                        <TableCell align="center">
                          {l.conteos?.creditos ?? 0} / {l.conteos?.atributos ?? 0} / {l.conteos?.movimientos ?? 0}
                        </TableCell>
                        <TableCell>
                          {l.fechaPromocion ? new Date(l.fechaPromocion).toLocaleString("es-CO") : "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}

            <Stack direction="row" spacing={1.5}>
              <Button
                variant="outlined"
                startIcon={<FileDownloadIcon />}
                onClick={handleDescargar}
                disabled={!listo || ocupado}
              >
                {descargando ? "Generando…" : "Descargar AVRO (.avro.p7z)"}
              </Button>
              <Button
                variant="contained"
                startIcon={<SendIcon />}
                onClick={() => setConfirmar(true)}
                disabled={!listo || ocupado}
              >
                {transmitiendo ? "Transmitiendo…" : "Transmitir a SFC"}
              </Button>
            </Stack>
            {transmitiendo && <LinearProgress sx={{ mt: 1.5 }} />}
          </Paper>

          {/* ── Transmisiones del corte ── */}
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle1" fontWeight={600} mb={1.5}>
              Transmisiones del corte
            </Typography>
            {transmisiones.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                Sin transmisiones.
              </Typography>
            ) : (
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
                      <TableCell align="center">Estado SFC</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {transmisiones.map((tx) => (
                      <TableRow key={tx.id}>
                        <TableCell>
                          <Tooltip title={`SHA-256: ${tx.hashSha256}`}>
                            <Typography variant="body2" fontFamily="monospace">
                              {tx.idTransmisionSfc}
                            </Typography>
                          </Tooltip>
                        </TableCell>
                        <TableCell>
                          {tx.nombreArchivo}
                          {tx.loteId !== null && (
                            <Typography variant="caption" color="text.secondary" display="block">
                              Por lote (#{tx.loteId}), antes del envío por corte
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Tooltip title={tx.mensajeEstado ?? ""}>
                            <Chip label={tx.estado} size="small" color={ESTADO_TX_COLOR[tx.estado] ?? "default"} />
                          </Tooltip>
                        </TableCell>
                        <TableCell align="center">{tx.codigoEstadoSfc ?? "—"}</TableCell>
                        <TableCell align="center">
                          {tx.totalCreditos} / {tx.totalDemograficos} / {tx.totalMovimientos}
                        </TableCell>
                        <TableCell>{new Date(tx.fechaTransmision).toLocaleString("es-CO")}</TableCell>
                        <TableCell>{tx.usuarioTransmisor}</TableCell>
                        <TableCell align="center">
                          <Tooltip title="Consultar estado en la SFC">
                            <span>
                              <IconButton
                                size="small"
                                onClick={() => handleConsultarEstado(tx.id)}
                                disabled={consultandoTxId !== null || ocupado}
                              >
                                <RefreshIcon fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        </>
      )}

      <Dialog open={confirmar} onClose={() => setConfirmar(false)} maxWidth="xs">
        <DialogTitle>Transmitir el corte {corteConsultado}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Se envía a la SFC un solo archivo con {promovidos.length} lote(s) de {universalidades} universalidad(es).
            {transmisiones.length > 0 &&
              ` Este corte ya tiene ${transmisiones.length} transmisión(es); se enviará de nuevo.`}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmar(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleTransmitir}>
            Transmitir
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={!!snackMsg}
        autoHideDuration={6000}
        onClose={() => setSnackMsg(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity="success" onClose={() => setSnackMsg(null)} variant="filled">
          {snackMsg}
        </Alert>
      </Snackbar>
    </Box>
  );
}
