import { useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  FormControl,
  InputLabel,
  LinearProgress,
  MenuItem,
  Paper,
  Select,
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
import Grid from "@mui/material/Grid";
import SendIcon from "@mui/icons-material/Send";
import SearchIcon from "@mui/icons-material/Search";
import axiosSecurityAPIClient from "../../../api/axiosSecurityAPIClient";
import { useEntidades } from "../../../hooks/useEntidades";

interface LoteResponse {
  id: number;
  fechaCorte: string;
  tipoEntidad: number;
  codigoEntidad: number;
  estado: string;
  fechaCreacion: string;
  usuarioCreador: string;
  fechaPromocion: string | null;
  usuarioPromotor: string | null;
  observaciones: string | null;
}

interface TransmitirResponse {
  transmisionId: number;
  idTransmisionSfc: string;
  estado: string;
  nombreArchivo: string;
  hashSha256: string;
  totalCreditos: number;
  totalDemograficos: number;
  totalMovimientos: number;
  fechaTransmision: string;
}

interface UniversalidadOData {
  Codigo?: string | number;
  Descripcion?: string;
  Estado?: string;
}

const getLastDayOfPreviousMonth = (): string => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 0).toISOString().slice(0, 10);
};

export default function EnviaMURIC() {
  const [fechaCorte, setFechaCorte] = useState(getLastDayOfPreviousMonth);
  const [codigoEntidad, setCodigoEntidad] = useState("");

  const [lotes, setLotes] = useState<LoteResponse[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [transmitiendo, setTransmitiendo] = useState<number | null>(null);
  const [ultimaTransmision, setUltimaTransmision] = useState<{
    loteId: number;
    resultado: TransmitirResponse;
  } | null>(null);
  const [errores, setErrores] = useState<string[]>([]);
  const [snackMsg, setSnackMsg] = useState<string | null>(null);
  const [buscado, setBuscado] = useState(false);

  const { entidades: uRaw, cargando: cargandoUniv } =
    useEntidades<UniversalidadOData>("/Universalidades");
  const universalidades = useMemo(
    () =>
      (uRaw ?? [])
        .filter((u) => String(u.Estado ?? "").toUpperCase() === "A")
        .map((u) => ({
          codigo: String(u.Codigo ?? ""),
          descripcion: String(u.Descripcion ?? ""),
        }))
        .sort((a, b) => a.codigo.localeCompare(b.codigo)),
    [uRaw]
  );

  const extractError = (err: unknown): string => {
    const d = (err as { response?: { data?: unknown } })?.response?.data;
    if (!d) return err instanceof Error ? err.message : "Error desconocido";
    if (typeof d === "string") return d;
    const rec = d as Record<string, unknown>;
    return String(rec.mensaje ?? rec.message ?? "Error desconocido");
  };

  const handleBuscar = async () => {
    setBuscando(true);
    setErrores([]);
    setUltimaTransmision(null);
    setBuscado(false);
    try {
      const params: Record<string, string> = { estado: "Promovido" };
      if (fechaCorte) params.fechaCorte = fechaCorte;
      if (codigoEntidad) params.codigoEntidad = codigoEntidad;
      const { data } = await axiosSecurityAPIClient.get<LoteResponse[]>("/cargas", { params });
      setLotes(data);
      setBuscado(true);
    } catch (err) {
      setErrores([extractError(err)]);
    } finally {
      setBuscando(false);
    }
  };

  const handleTransmitir = async (loteId: number) => {
    setTransmitiendo(loteId);
    setErrores([]);
    try {
      const { data } = await axiosSecurityAPIClient.post<TransmitirResponse>(
        `/cargas/${loteId}/transmitir`
      );
      setUltimaTransmision({ loteId, resultado: data });
      setSnackMsg(`Transmisión exitosa — ID SFC: ${data.idTransmisionSfc}`);
      setLotes((prev) => prev.filter((l) => l.id !== loteId));
    } catch (err) {
      setErrores([extractError(err)]);
    } finally {
      setTransmitiendo(null);
    }
  };

  return (
    <Box sx={{ p: 2, display: "flex", flexDirection: "column", gap: 2 }}>
      {/* ── Filtros ── */}
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" fontWeight={700} mb={2}>
          Envío a MURIC
        </Typography>
        <Grid container spacing={2} alignItems="flex-end">
          <Grid size={2}>
            <TextField
              label="Fecha de corte"
              type="date"
              fullWidth
              value={fechaCorte}
              onChange={(e) => setFechaCorte(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Grid>
          <Grid size={4}>
            <FormControl fullWidth disabled={cargandoUniv || buscando}>
              <InputLabel>Universalidad (opcional)</InputLabel>
              <Select
                value={codigoEntidad}
                label="Universalidad (opcional)"
                onChange={(e) => setCodigoEntidad(e.target.value)}
              >
                <MenuItem value="">
                  <em>Todas</em>
                </MenuItem>
                {universalidades.map((u) => (
                  <MenuItem key={u.codigo} value={u.codigo}>
                    {u.codigo} — {u.descripcion}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={2}>
            <Button
              variant="contained"
              startIcon={<SearchIcon />}
              onClick={handleBuscar}
              disabled={buscando}
            >
              Buscar lotes
            </Button>
          </Grid>
        </Grid>
        {buscando && <LinearProgress sx={{ mt: 2 }} />}
      </Paper>

      {/* ── Errores ── */}
      {errores.length > 0 && (
        <Alert severity="error" onClose={() => setErrores([])}>
          <ul style={{ margin: 0, paddingLeft: 16 }}>
            {errores.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        </Alert>
      )}

      {/* ── Tabla de lotes promovidos ── */}
      {buscado && (
        <Paper sx={{ p: 2 }}>
          <Stack direction="row" spacing={1.5} alignItems="center" mb={1.5}>
            <Typography variant="subtitle1" fontWeight={600}>
              Lotes listos para transmitir
            </Typography>
            <Chip
              label={`${lotes.length} lote${lotes.length !== 1 ? "s" : ""}`}
              size="small"
              color={lotes.length > 0 ? "primary" : "default"}
              variant="outlined"
            />
          </Stack>

          {lotes.length === 0 ? (
            <Alert severity="info" variant="outlined">
              No hay lotes en estado Promovido con los filtros aplicados.
            </Alert>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>ID Lote</TableCell>
                    <TableCell>Fecha corte</TableCell>
                    <TableCell>Entidad</TableCell>
                    <TableCell>Tipo</TableCell>
                    <TableCell>Promovido por</TableCell>
                    <TableCell>Fecha promoción</TableCell>
                    <TableCell align="center">Acción</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {lotes.map((lote) => (
                    <TableRow key={lote.id}>
                      <TableCell>
                        <Chip
                          label={`#${lote.id}`}
                          size="small"
                          variant="outlined"
                          color="primary"
                        />
                      </TableCell>
                      <TableCell>{lote.fechaCorte}</TableCell>
                      <TableCell>{lote.codigoEntidad}</TableCell>
                      <TableCell>{lote.tipoEntidad}</TableCell>
                      <TableCell>
                        {lote.usuarioPromotor ?? lote.usuarioCreador}
                      </TableCell>
                      <TableCell>
                        {lote.fechaPromocion
                          ? new Date(lote.fechaPromocion).toLocaleString("es-CO")
                          : "—"}
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="Transmitir a la SFC">
                          <span>
                            <Button
                              variant="contained"
                              size="small"
                              startIcon={<SendIcon />}
                              onClick={() => handleTransmitir(lote.id)}
                              disabled={transmitiendo !== null}
                            >
                              {transmitiendo === lote.id
                                ? "Transmitiendo…"
                                : "Transmitir"}
                            </Button>
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
      )}

      {/* ── Resultado de la última transmisión ── */}
      {ultimaTransmision && (
        <Paper sx={{ p: 2 }}>
          <Typography variant="subtitle1" fontWeight={600} mb={1.5}>
            Resultado de transmisión — Lote #{ultimaTransmision.loteId}
          </Typography>
          <Grid container spacing={2}>
            <Grid size={3}>
              <Typography variant="caption" color="text.secondary">
                ID SFC
              </Typography>
              <Typography variant="body2" fontFamily="monospace">
                {ultimaTransmision.resultado.idTransmisionSfc}
              </Typography>
            </Grid>
            <Grid size={2}>
              <Typography variant="caption" color="text.secondary">
                Estado
              </Typography>
              <Typography variant="body2">
                {ultimaTransmision.resultado.estado}
              </Typography>
            </Grid>
            <Grid size={4}>
              <Typography variant="caption" color="text.secondary">
                Archivo
              </Typography>
              <Typography variant="body2" noWrap>
                {ultimaTransmision.resultado.nombreArchivo}
              </Typography>
            </Grid>
            <Grid size={3}>
              <Typography variant="caption" color="text.secondary">
                Registros (Créd. / Demog. / Mov.)
              </Typography>
              <Typography variant="body2">
                {ultimaTransmision.resultado.totalCreditos} /{" "}
                {ultimaTransmision.resultado.totalDemograficos} /{" "}
                {ultimaTransmision.resultado.totalMovimientos}
              </Typography>
            </Grid>
            <Grid size={12}>
              <Typography variant="caption" color="text.secondary">
                SHA-256
              </Typography>
              <Typography
                variant="body2"
                fontFamily="monospace"
                sx={{ wordBreak: "break-all" }}
              >
                {ultimaTransmision.resultado.hashSha256}
              </Typography>
            </Grid>
          </Grid>
        </Paper>
      )}

      <Snackbar
        open={!!snackMsg}
        autoHideDuration={5000}
        onClose={() => setSnackMsg(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity="success"
          onClose={() => setSnackMsg(null)}
          variant="filled"
        >
          {snackMsg}
        </Alert>
      </Snackbar>
    </Box>
  );
}
