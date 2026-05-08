import { useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  //Chip,
  FormControl,
  InputLabel,
  LinearProgress,
  MenuItem,
  Paper,
  Select,
  //Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import { useEntidades } from "../../../hooks/useEntidades";

type TipoInforme = "creditos" | "movimientos";

type ResultadoConsulta = {
  id: number;
  universalidad: string;
  periodo: string;
  totalRegistros: number;
  totalValor: number;
};

type ResultadosPorTipo = Record<TipoInforme, ResultadoConsulta[] | null>;

interface UniversalidadOData {
  Codigo?: string | number;
  Descripcion?: string;
  Estado?: string;
  Activo?: string;
  codigo?: string | number;
  descripcion?: string;
  estado?: string;
  activo?: string;
}

const INFORME_LABELS: Record<TipoInforme, string> = {
  creditos: "Totales de Créditos enviados",
  movimientos: "Totales de Movimiento de cartera",
};

const toPeriodoLabel = (periodo: string): string => periodo.replace("-", "/");

const buildMockResultados = (
  tipo: TipoInforme,
  periodoInicial: string,
  periodoFinal: string,
  universalidad: string
): ResultadoConsulta[] => {
  const base = tipo === "creditos" ? 1000 : 500;
  const mult = tipo === "creditos" ? 12 : 7;
  const uniLabel = universalidad === "TODAS" ? "Todas" : universalidad;

  return [1, 2, 3].map((row) => ({
    id: row,
    universalidad: uniLabel,
    periodo:
      row === 1
        ? `${toPeriodoLabel(periodoInicial)} - ${toPeriodoLabel(periodoFinal)}`
        : `${toPeriodoLabel(periodoInicial)}`,
    totalRegistros: base * row + Math.floor(Math.random() * 180),
    totalValor: (base * mult * row + Math.floor(Math.random() * 400)) * 1000,
  }));
};

export default function ConsultasMURIC() {
  const todayMonth = new Date().toISOString().slice(0, 7);

  const [periodoInicial, setPeriodoInicial] = useState<string>(todayMonth);
  const [periodoFinal, setPeriodoFinal] = useState<string>(todayMonth);
  const [codigoUniversalidad, setCodigoUniversalidad] =
    useState<string>("TODAS");
  const [tipoInforme, setTipoInforme] = useState<TipoInforme>("creditos");
  const [tabActiva, setTabActiva] = useState<TipoInforme>("creditos");
  const [resultados, setResultados] = useState<ResultadosPorTipo>({
    creditos: null,
    movimientos: null,
  });
  const [loading, setLoading] = useState(false);
  const [errorValidacion, setErrorValidacion] = useState<string | null>(null);

  const {
    entidades: universalidadesRaw,
    cargando: cargandoUniversalidades,
    error: errorUniversalidades,
  } = useEntidades<UniversalidadOData>("/Universalidades");

  const universalidades = useMemo(() => {
    const mapped = (universalidadesRaw ?? []).map((u) => {
      const codigo = String(u.Codigo ?? u.codigo ?? "").trim();
      const descripcion = String(u.Descripcion ?? u.descripcion ?? "").trim();
      const estado = String(u.Estado ?? u.estado ?? u.Activo ?? u.activo ?? "")
        .trim()
        .toUpperCase();

      return { codigo, descripcion, estado };
    });

    const activas = mapped
      .filter((u) => u.codigo && (u.estado === "A" || u.estado === "ACTIVO"))
      .sort((a, b) => a.codigo.localeCompare(b.codigo));

    return [{ codigo: "TODAS", descripcion: "Todas" }, ...activas];
  }, [universalidadesRaw]);

  const handleObtener = async () => {
    if (!periodoInicial || !periodoFinal) {
      setErrorValidacion("Debes seleccionar periodo inicial y final.");
      return;
    }

    if (periodoInicial > periodoFinal) {
      setErrorValidacion("El periodo inicial no puede ser mayor al periodo final.");
      return;
    }

    setErrorValidacion(null);
    setLoading(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 650));

      const data = buildMockResultados(
        tipoInforme,
        periodoInicial,
        periodoFinal,
        codigoUniversalidad
      );

      setResultados((prev) => ({
        ...prev,
        [tipoInforme]: data,
      }));

      setTabActiva(tipoInforme);
    } finally {
      setLoading(false);
    }
  };

  const renderTabla = (tipo: TipoInforme) => {
    const data = resultados[tipo];

    if (!data) {
      return (
        <Alert severity="info" variant="outlined">
          Aun no se ha ejecutado la consulta para {INFORME_LABELS[tipo]}.
        </Alert>
      );
    }

    return (
      <Box sx={{ overflowX: "auto" }}>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "180px 240px 160px 180px",
            minWidth: 760,
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 1,
          }}
        >
          <Box sx={{ p: 1.25, fontWeight: 700, bgcolor: "action.hover" }}>ID</Box>
          <Box sx={{ p: 1.25, fontWeight: 700, bgcolor: "action.hover" }}>
            Universalidad
          </Box>
          <Box sx={{ p: 1.25, fontWeight: 700, bgcolor: "action.hover" }}>
            Periodo
          </Box>
          <Box
            sx={{
              p: 1.25,
              fontWeight: 700,
              bgcolor: "action.hover",
              textAlign: "right",
            }}
          >
            Total valor
          </Box>

          {data.map((item, idx) => (
            <Box
              key={`${tipo}-${item.id}-${idx}`}
              sx={{ display: "contents" }}
            >
              <Box sx={{ p: 1.25, borderTop: "1px solid", borderColor: "divider" }}>
                {item.id}
              </Box>
              <Box sx={{ p: 1.25, borderTop: "1px solid", borderColor: "divider" }}>
                {item.universalidad}
              </Box>
              <Box sx={{ p: 1.25, borderTop: "1px solid", borderColor: "divider" }}>
                {item.periodo}
              </Box>
              <Box
                sx={{
                  p: 1.25,
                  borderTop: "1px solid",
                  borderColor: "divider",
                  textAlign: "right",
                }}
              >
                {item.totalValor.toLocaleString("es-CO")}
              </Box>
            </Box>
          ))}
        </Box>
      </Box>
    );
  };

  return (
    <Box sx={{ p: 2 }}>
      <Paper sx={{ p: 2, mb: 2 }}>
        {/* <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">Generar consultas MURIC</Typography>
          <Chip label="Prototipo" color="info" variant="outlined" />
        </Stack> */}

        <Grid container spacing={2} alignItems="flex-start">
          <Grid size={{ xs: 12, md: 3 }}>
            <TextField
              fullWidth
              label="Periodo inicial"
              type="month"
              value={periodoInicial}
              onChange={(e) => setPeriodoInicial(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 3 }}>
            <TextField
              fullWidth
              label="Periodo final"
              type="month"
              value={periodoFinal}
              onChange={(e) => setPeriodoFinal(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <FormControl fullWidth disabled={cargandoUniversalidades || loading}>
              <InputLabel>Universalidad</InputLabel>
              <Select
                value={codigoUniversalidad}
                label="Universalidad"
                onChange={(e) => setCodigoUniversalidad(String(e.target.value))}
              >
                {universalidades.map((u) => (
                  <MenuItem key={u.codigo} value={u.codigo}>
                    {u.codigo === "TODAS"
                      ? "Todas"
                      : `${u.codigo} - ${u.descripcion}`}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12, md: 2 }}>
            <FormControl fullWidth disabled={loading}>
              <InputLabel>Informe</InputLabel>
              <Select
                value={tipoInforme}
                label="Informe"
                onChange={(e) => setTipoInforme(e.target.value as TipoInforme)}
              >
                <MenuItem value="creditos">
                  Totales de Créditos enviados
                </MenuItem>
                <MenuItem value="movimientos">
                  Totales de Movimiento de cartera
                </MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid size={12}>
            <Button
              variant="contained"
              onClick={handleObtener}
              disabled={loading || cargandoUniversalidades}
            >
              Obtener
            </Button>
          </Grid>
        </Grid>

        {loading && <LinearProgress sx={{ mt: 2 }} />}

        {errorValidacion && (
          <Alert sx={{ mt: 2 }} severity="warning">
            {errorValidacion}
          </Alert>
        )}

        {errorUniversalidades && (
          <Alert sx={{ mt: 2 }} severity="error">
            Error al cargar universalidades: {errorUniversalidades}
          </Alert>
        )}
      </Paper>

      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Resultados de consulta
        </Typography>

        <Tabs
          value={tabActiva}
          onChange={(_, value: TipoInforme) => setTabActiva(value)}
          sx={{ mb: 2 }}
        >
          <Tab
            value="creditos"
            label="Totales de Créditos enviados"
          />
          <Tab
            value="movimientos"
            label="Totales de Movimiento de cartera"
          />
        </Tabs>

        {tabActiva === "creditos" && renderTabla("creditos")}
        {tabActiva === "movimientos" && renderTabla("movimientos")}
      </Paper>
    </Box>
  );
}
