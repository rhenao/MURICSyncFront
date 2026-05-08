import { useState } from "react";
import {
  Button,
  TextField,
  Typography,
  LinearProgress,
  Stack,
  Alert,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  RadioGroup,
  FormControlLabel,
  Radio,
  FormLabel,
  Divider,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Box from "@mui/material/Box";
import SendIcon from "@mui/icons-material/Send";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
// import type Universalidades from "../../param/models/Universalidades.model";
import { useEntidades } from "../../../hooks/useEntidades";

type TipoInformacion = "creditos" | "atributos" | "movimiento_cartera";
type EnvioStatus = "Pendiente" | "Enviando" | "Exitoso" | "Error";

interface ResultadoEnvio {
  mensaje: string;
  filasEnviadas: number;
}

// Función para obtener el último día del mes anterior
const getLastDayOfPreviousMonth = (): string => {
  const now = new Date();
  const lastDay = new Date(now.getFullYear(), now.getMonth(), 0);
  return lastDay.toISOString().slice(0, 10);
};

// OData devuelve las propiedades en PascalCase
interface UniversalidadOData {
  Codigo: string | number;
  Descripcion: string;
  Estado: string;
}

export default function EnviaMURIC() {
  const [fechaCorte, setFechaCorte] = useState<string>(
    getLastDayOfPreviousMonth()
  );
  const [codigoUniversalidad, setCodigoUniversalidad] = useState<string>("");
  const [tipoInformacion, setTipoInformacion] =
    useState<TipoInformacion>("creditos");
  const [status, setStatus] = useState<EnvioStatus>("Pendiente");
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<ResultadoEnvio | null>(null);

  const {
    entidades: universalidades,
    cargando: cargandoUniversalidades,
    error: errorUniversalidades,
  } = useEntidades<UniversalidadOData>("/Universalidades");

  const tipoInformacionLabels: Record<TipoInformacion, string> = {
    creditos: "Créditos",
    atributos: "Atributos",
    movimiento_cartera: "Movimiento de cartera",
  };

  const handleReset = () => {
    setFechaCorte(getLastDayOfPreviousMonth());
    setCodigoUniversalidad("");
    setTipoInformacion("creditos");
    setStatus("Pendiente");
    setLoading(false);
    setResultado(null);
  };

  const handleEnviar = async () => {
    setLoading(true);
    setResultado(null);
    setStatus("Enviando");

    try {
      // TODO: Llamar API de envío a MURIC
      // await axiosOdataAPIClient.post("/EnvioMURIC", {
      //   fechaCorte,
      //   codigoUniversalidad,
      //   tipoInformacion,
      // });

      // Simulación de envío
      await new Promise((r) => setTimeout(r, 1500));

      // Simular respuesta exitosa
      setResultado({
        mensaje: `Envío exitoso de ${tipoInformacionLabels[tipoInformacion]} a MURIC.`,
        filasEnviadas: Math.floor(Math.random() * 5000) + 100,
      });
      setStatus("Exitoso");
    } catch (err) {
      console.error("Error al enviar a MURIC:", err);
      const mensajeError =
        err instanceof Error ? err.message : "Error desconocido al enviar";
      setResultado({
        mensaje: mensajeError,
        filasEnviadas: 0,
      });
      setStatus("Error");
    } finally {
      setLoading(false);
    }
  };

  const puedeEnviar =
    !!fechaCorte && !!codigoUniversalidad && !!tipoInformacion && !loading;

  const statusColor =
    status === "Exitoso"
      ? "success"
      : status === "Error"
      ? "error"
      : status === "Enviando"
      ? "warning"
      : "default";

  const statusIcon =
    status === "Exitoso" ? (
      <CheckCircleOutlineIcon />
    ) : status === "Error" ? (
      <ErrorOutlineIcon />
    ) : status === "Enviando" ? (
      <HourglassEmptyIcon />
    ) : (
      <SendIcon />
    );

  return (
    <Box sx={{ p: 2 }}>
      {/* Formulario principal */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Stack
          direction="row"
          alignItems="center"
          spacing={2}
          justifyContent="space-between"
          mb={2}
        >
          <Typography variant="h6">Envío a MURIC</Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            <Chip
              icon={statusIcon}
              label={status}
              color={statusColor}
              variant="outlined"
            />
            <Button
              size="small"
              startIcon={<RestartAltIcon />}
              onClick={handleReset}
              disabled={loading}
            >
              Reiniciar
            </Button>
          </Stack>
        </Stack>

        <Grid container spacing={2} alignItems="flex-start">
          {/* Fecha de corte */}
          <Grid size={3}>
            <TextField
              label="Fecha de corte"
              type="date"
              fullWidth
              value={fechaCorte}
              onChange={(e) => setFechaCorte(e.target.value)}
              disabled={loading}
              slotProps={{
                inputLabel: { shrink: true },
              }}
              sx={{
                "& .MuiInputBase-input::-webkit-calendar-picker-indicator": {
                  filter:
                    "invert(65%) sepia(90%) saturate(3000%) hue-rotate(210deg) brightness(100%) contrast(120%)",
                  cursor: "pointer",
                },
              }}
            />
          </Grid>

          {/* Universalidad */}
          <Grid size={5}>
            <FormControl fullWidth disabled={loading || cargandoUniversalidades}>
              <InputLabel>Universalidad</InputLabel>
              <Select
                value={codigoUniversalidad}
                label="Universalidad"
                onChange={(e) => setCodigoUniversalidad(e.target.value)}
              >
                {errorUniversalidades && (
                  <MenuItem disabled value="">
                    Error al cargar universalidades
                  </MenuItem>
                )}
                {(universalidades ?? [])
                  .filter((u) => u.Estado === "A")
                  .map((u) => (
                    <MenuItem key={String(u.Codigo)} value={String(u.Codigo)}>
                      {u.Codigo} - {u.Descripcion}
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Tipo de información */}
          <Grid size={4}>
            <FormControl component="fieldset" disabled={loading}>
              <FormLabel component="legend">Tipo de información</FormLabel>
              <RadioGroup
                value={tipoInformacion}
                onChange={(e) =>
                  setTipoInformacion(e.target.value as TipoInformacion)
                }
              >
                <FormControlLabel
                  value="creditos"
                  control={<Radio size="small" />}
                  label="Créditos"
                />
                <FormControlLabel
                  value="atributos"
                  control={<Radio size="small" />}
                  label="Atributos"
                />
                <FormControlLabel
                  value="movimiento_cartera"
                  control={<Radio size="small" />}
                  label="Movimiento de cartera"
                />
              </RadioGroup>
            </FormControl>
          </Grid>

          {/* Botón de envío */}
          <Grid size={12}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<SendIcon />}
              onClick={handleEnviar}
              disabled={!puedeEnviar}
            >
              Enviar a MURIC
            </Button>
          </Grid>
        </Grid>

        {loading && <LinearProgress sx={{ mt: 2 }} />}
      </Paper>

      {/* Sección de resultados */}
      {resultado && (
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Resultado del envío
          </Typography>
          <Divider sx={{ mb: 2 }} />

          {status === "Exitoso" ? (
            <Alert
              severity="success"
              icon={<CheckCircleOutlineIcon />}
              sx={{ mb: 1 }}
            >
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {resultado.mensaje}
              </Typography>
              <Typography variant="body2">
                Filas enviadas:{" "}
                <strong>{resultado.filasEnviadas.toLocaleString()}</strong>
              </Typography>
            </Alert>
          ) : (
            <Alert
              severity="error"
              icon={<ErrorOutlineIcon />}
              sx={{ mb: 1 }}
            >
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {resultado.mensaje}
              </Typography>
              <Typography variant="body2">
                Filas enviadas:{" "}
                <strong>{resultado.filasEnviadas.toLocaleString()}</strong>
              </Typography>
            </Alert>
          )}

          <Stack direction="row" spacing={2} mt={1}>
            <Typography variant="caption" color="text.secondary">
              Fecha de corte: <strong>{fechaCorte}</strong>
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Universalidad: <strong>{codigoUniversalidad}</strong>
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Tipo: <strong>{tipoInformacionLabels[tipoInformacion]}</strong>
            </Typography>
          </Stack>
        </Paper>
      )}
    </Box>
  );
}
