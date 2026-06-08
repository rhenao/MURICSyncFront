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
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import Grid from "@mui/material/Grid";
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

interface LoteDetalleResponse extends LoteResponse {
  conteos: {
    creditos: number;
    atributos: number;
    movimientos: number;
  } | null;
}

interface UniversalidadOData {
  Codigo?: string | number;
  Descripcion?: string;
  Estado?: string;
}

const ESTADOS = ["", "Creado", "Validado", "Promovido", "Anulado"];

const ESTADO_COLOR: Record<
  string,
  "default" | "primary" | "warning" | "success" | "error"
> = {
  Creado: "primary",
  Validado: "warning",
  Promovido: "success",
  Anulado: "default",
};

export default function ConsultasMURIC() {
  const [fechaCorte, setFechaCorte] = useState("");
  const [codigoEntidad, setCodigoEntidad] = useState("");
  const [estado, setEstado] = useState("");

  const [lotes, setLotes] = useState<LoteDetalleResponse[]>([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
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

  const handleBuscar = async () => {
    setCargando(true);
    setError(null);
    setBuscado(false);
    try {
      const params: Record<string, string> = {};
      if (fechaCorte) params.fechaCorte = fechaCorte;
      if (codigoEntidad) params.codigoEntidad = codigoEntidad;
      if (estado) params.estado = estado;

      const { data: lista } = await axiosSecurityAPIClient.get<LoteResponse[]>(
        "/cargas",
        { params }
      );

      // Fetch detail per lote to get conteos (parallel; result sets are small when filtered)
      const detalles = await Promise.allSettled(
        lista.map((l) =>
          axiosSecurityAPIClient
            .get<LoteDetalleResponse>(`/cargas/${l.id}`)
            .then((r) => r.data)
        )
      );

      const merged: LoteDetalleResponse[] = lista.map((l, i) => {
        const d = detalles[i];
        return d.status === "fulfilled" ? d.value : { ...l, conteos: null };
      });

      setLotes(merged);
      setBuscado(true);
    } catch (err) {
      const d = (err as { response?: { data?: unknown } })?.response?.data;
      setError(
        typeof d === "string"
          ? d
          : err instanceof Error
          ? err.message
          : "Error al consultar lotes"
      );
    } finally {
      setCargando(false);
    }
  };

  return (
    <Box sx={{ p: 2, display: "flex", flexDirection: "column", gap: 2 }}>
      {/* ── Filtros ── */}
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" fontWeight={700} mb={2}>
          Consultas MURIC
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
              helperText="Opcional"
            />
          </Grid>
          <Grid size={4}>
            <FormControl fullWidth disabled={cargandoUniv || cargando}>
              <InputLabel>Universalidad</InputLabel>
              <Select
                value={codigoEntidad}
                label="Universalidad"
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
            <FormControl fullWidth disabled={cargando}>
              <InputLabel>Estado</InputLabel>
              <Select
                value={estado}
                label="Estado"
                onChange={(e) => setEstado(e.target.value)}
              >
                {ESTADOS.map((e) => (
                  <MenuItem key={e} value={e}>
                    {e || "Todos"}
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
              disabled={cargando}
            >
              Consultar
            </Button>
          </Grid>
        </Grid>
        {cargando && <LinearProgress sx={{ mt: 2 }} />}
      </Paper>

      {/* ── Error ── */}
      {error && (
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* ── Resultados ── */}
      {buscado && (
        <Paper sx={{ p: 2 }}>
          <Stack direction="row" spacing={1.5} alignItems="center" mb={1.5}>
            <Typography variant="subtitle1" fontWeight={600}>
              Resultados
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
              No se encontraron lotes con los filtros aplicados.
            </Alert>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>Fecha corte</TableCell>
                    <TableCell>Entidad</TableCell>
                    <TableCell>Estado</TableCell>
                    <TableCell align="right">Créditos</TableCell>
                    <TableCell align="right">Atributos</TableCell>
                    <TableCell align="right">Movimientos</TableCell>
                    <TableCell>Fecha promoción</TableCell>
                    <TableCell>Creado por</TableCell>
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
                      <TableCell>
                        <Chip
                          label={lote.estado}
                          size="small"
                          color={ESTADO_COLOR[lote.estado] ?? "default"}
                        />
                      </TableCell>
                      <TableCell align="right">
                        {lote.conteos?.creditos?.toLocaleString("es-CO") ?? "—"}
                      </TableCell>
                      <TableCell align="right">
                        {lote.conteos?.atributos?.toLocaleString("es-CO") ?? "—"}
                      </TableCell>
                      <TableCell align="right">
                        {lote.conteos?.movimientos?.toLocaleString("es-CO") ?? "—"}
                      </TableCell>
                      <TableCell>
                        {lote.fechaPromocion
                          ? new Date(lote.fechaPromocion).toLocaleDateString(
                              "es-CO"
                            )
                          : "—"}
                      </TableCell>
                      <TableCell>{lote.usuarioCreador}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      )}
    </Box>
  );
}
