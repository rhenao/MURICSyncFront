import React, { useState, useRef } from "react";
import {
  Button,
  TextField,
  Typography,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  LinearProgress,
  Stack,
  Alert,
  Chip,
  Divider,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import Grid from "@mui/material/Grid";
import CloudUploadOutlinedIcon from "@mui/icons-material/CloudUploadOutlined";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
//import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";

import Paper from "@mui/material/Paper";
import Box from "@mui/material/Box";
import ResultadoCargue from "./ResultadoCargue";

type UploadStatus =
  | "Sin archivo"
  | "Cargado"
  | "Validado"
  | "Procesado"
  | "Error"
  | "Reversado";

interface FileSummary {
  name: string;
  sizeBytes: number;
  lines: number;
  contentPreview: string[]; // primeras n líneas
}

interface Empresa {
  codigo: string;
  nombre: string;
}

// Datos de prueba - después conectar con API
const empresasPrueba: Empresa[] = [
  { codigo: "001", nombre: "Ban100" },
  { codigo: "002", nombre: "Compensar" },
  { codigo: "003", nombre: "Bancolombia" },
  { codigo: "004", nombre: "Banco de Bogotá" },
  { codigo: "005", nombre: "Banco Popular" },
  { codigo: "006", nombre: "BBVA" },
  { codigo: "007", nombre: "Banco Caja Social" },
  { codigo: "008", nombre: "Banco Agrario de Colombia" },
  { codigo: "009", nombre: "Banco AV Villas" },
  { codigo: "010", nombre: "Banco Cooperativo Coopcentral" },
];

// Función para obtener el último día del mes anterior
const getLastDayOfPreviousMonth = (): Date => {
  const now = new Date();
  const year = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
  const month = now.getMonth() === 0 ? 11 : now.getMonth() - 1;

  // El día 0 del mes actual es el último día del mes anterior
  return new Date(year, month + 1, 0);
};

export default function CargaArchivos() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileSummary, setFileSummary] = useState<FileSummary | null>(null);

  const [fechaCargue, setFechaCargue] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );
  const [fechaCorte, setFechaCorte] = useState<string>(
    getLastDayOfPreviousMonth().toISOString().slice(0, 10)
  );
  const [codigoEmpresa, setCodigoEmpresa] = useState<string>("");
  const [nombreEmpresa, setNombreEmpresa] = useState<string>("");
  const [processNumber, setProcessNumber] = useState<number | null>(null);
  const [status, setStatus] = useState<UploadStatus>("Sin archivo");

  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // preview rows for grid
  const [previewRows, setPreviewRows] = useState<Record<string, string>[]>([]);

  const openFilePicker = () => fileInputRef.current?.click();

  const handleEmpresaChange = (codigo: string) => {
    const empresa = empresasPrueba.find((e) => e.codigo === codigo);
    setCodigoEmpresa(codigo);
    setNombreEmpresa(empresa?.nombre || "");
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files && e.target.files[0];
    setValidationErrors([]);
    if (!f) {
      setSelectedFile(null);
      setFileSummary(null);
      setPreviewRows([]);
      setStatus("Sin archivo");
      return;
    }
    setSelectedFile(f);
    setStatus("Sin archivo");
    // auto-fill fechaCargue
    setFechaCargue(new Date().toISOString().slice(0, 10)); // YYYY-MM-DD
  };

  const countLinesAndPreview = async (file: File): Promise<FileSummary> => {
    return new Promise<FileSummary>((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error("Error leyendo el archivo"));
      reader.onload = () => {
        const text = String(reader.result ?? "");
        // Normalize line breaks
        const normalized = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
        const lines =
          normalized.length === 0 ? 0 : normalized.split("\n").length;
        const preview = normalized.split("\n").slice(0, 10);
        resolve({
          name: file.name,
          sizeBytes: file.size,
          lines,
          contentPreview: preview,
        });
      };
      // For simplicity support CSV / text. Excel (.xlsx) requires xlsx lib.
      reader.readAsText(file);
    });
  };

  const handleCargarArchivo = async () => {
    if (!selectedFile) return;
    setLoading(true);
    setValidationErrors([]);
    try {
      const summary = await countLinesAndPreview(selectedFile);
      setFileSummary(summary);
      // produce previewRows as simple CSV split (naive)
      const rows = summary.contentPreview.map((line) => {
        const cols = line.split(",");
        const obj: Record<string, string> = {};
        cols.forEach((c, i) => (obj[`col${i + 1}`] = c.trim()));
        return obj;
      });
      setPreviewRows(rows);
      setStatus("Cargado");
      // assign a process number if not present
      if (!processNumber) {
        setProcessNumber(Math.floor(Math.random() * 900000) + 100000); // ejemplo
      }
      // TODO: llamar API para subir file (multipart/form-data) y crear UploadFile
    } catch (err) {
      console.error(err);
      setValidationErrors(["Error al leer el archivo"]);
      setStatus("Error");
    } finally {
      setLoading(false);
    }
  };

  const handleValidarArchivo = async () => {
    if (!fileSummary) return;
    setLoading(true);
    setValidationErrors([]);
    try {
      // TODO: Ejecutar validaciones en backend (recomendado). Aquí simulamos.
      await new Promise((r) => setTimeout(r, 800));
      // Simular error si no hay codigoEmpresa o fechas
      const errors: string[] = [];
      if (!fechaCargue) errors.push("Fecha de cargue es requerida");
      if (!fechaCorte) errors.push("Fecha de corte es requerida");
      if (!codigoEmpresa) errors.push("Código de empresa es requerido");
      if (fileSummary.lines === 0) errors.push("El archivo no contiene líneas");
      if (errors.length > 0) {
        setValidationErrors(errors);
        setStatus("Error");
        return;
      }
      setStatus("Validado");
    } catch (err) {
      console.error(err);
      setValidationErrors(["Error durante la validación"]);
      setStatus("Error");
    } finally {
      setLoading(false);
    }
  };

  const handleProcesarArchivo = async () => {
    if (!fileSummary) return;
    setLoading(true);
    setValidationErrors([]);
    try {
      // TODO: Llamar endpoint que procesa filas / exporta a staging o MURIC
      await new Promise((r) => setTimeout(r, 1200));
      setStatus("Procesado");
    } catch (err) {
      console.error(err);
      setValidationErrors(["Error al procesar el archivo"]);
      setStatus("Error");
    } finally {
      setLoading(false);
    }
  };

  const handleReversarArchivo = async () => {
    if (!fileSummary) return;
    setLoading(true);
    setValidationErrors([]);
    try {
      // TODO: Llamar API para reversar proceso (crear job de reversión)
      await new Promise((r) => setTimeout(r, 800));
      setStatus("Reversado");
    } catch (err) {
      console.error(err);
      setValidationErrors(["Error al reversar el archivo"]);
      setStatus("Error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Stack
          direction="row"
          alignItems="center"
          spacing={2}
          justifyContent="space-between"
          mb={2}
        >
          <Typography variant="h6">Carga de Archivos</Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            <Chip
              icon={
                status === "Error" ? (
                  <ErrorOutlineIcon />
                ) : status === "Procesado" ? (
                  <CheckCircleOutlineIcon />
                ) : (
                  <CloudUploadOutlinedIcon />
                )
              }
              label={status}
              color={
                status === "Error"
                  ? "error"
                  : status === "Procesado"
                  ? "success"
                  : "default"
              }
              variant="outlined"
            />
            <IconButton
              size="small"
              onClick={() => {
                setSelectedFile(null);
                setFileSummary(null);
                setPreviewRows([]);
                setProcessNumber(null);
                setStatus("Sin archivo");
                setValidationErrors([]);
                setCodigoEmpresa("");
                setNombreEmpresa("");
              }}
            >
              <RestartAltIcon />
            </IconButton>
          </Stack>
        </Stack>

        <Grid container spacing={2} alignItems="center">
          <Grid size={12}>
            <Box>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv, text/csv, .txt"
                onChange={handleFileSelect}
                style={{ display: "none" }}
                data-testid="file-input"
              />
              <Stack direction="row" spacing={1} alignItems="center">
                <Button
                  startIcon={<CloudUploadOutlinedIcon />}
                  variant="contained"
                  onClick={openFilePicker}
                >
                  Seleccionar archivo
                </Button>
                <Typography variant="body2" color="text.secondary">
                  {selectedFile
                    ? `${selectedFile.name} (${selectedFile.size} bytes)`
                    : "No hay archivo seleccionado"}
                </Typography>
              </Stack>
              <Typography
                variant="caption"
                color="text.secondary"
                display="block"
                mt={1}
              >
                Soporta CSV / TXT. Excel (.xlsx) requiere librería adicional.
              </Typography>
            </Box>
          </Grid>

          <Grid size={2}>
            <TextField
              label="Fecha de cargue"
              type="date"
              fullWidth
              value={fechaCargue}
              onChange={(e) => setFechaCargue(e.target.value)}
              slotProps={{
                inputLabel: {
                  shrink: true,
                },
              }}
              sx={{
                "& .MuiInputBase-input::-webkit-calendar-picker-indicator": {
                  filter:
                    "invert(65%) sepia(90%) saturate(3000%) hue-rotate(210deg) brightness(100%) contrast(120%)", // Azul
                  cursor: "pointer",
                },
              }}
            />
          </Grid>

          <Grid size={2}>
            <TextField
              label="Fecha de corte"
              type="date"
              fullWidth
              value={fechaCorte}
              onChange={(e) => setFechaCorte(e.target.value)}
              slotProps={{
                inputLabel: {
                  shrink: true,
                },
              }}
              sx={{
                "& .MuiInputBase-input::-webkit-calendar-picker-indicator": {
                  filter:
                    "invert(65%) sepia(90%) saturate(3000%) hue-rotate(210deg) brightness(100%) contrast(120%)", // Azul
                  cursor: "pointer",
                },
              }}
            />
          </Grid>

          <Grid size={4}>
            <FormControl fullWidth>
              <InputLabel>Empresa</InputLabel>
              <Select
                value={codigoEmpresa}
                label="Empresa"
                onChange={(e) => handleEmpresaChange(e.target.value)}
                disabled={loading}
              >
                {empresasPrueba.map((empresa) => (
                  <MenuItem key={empresa.codigo} value={empresa.codigo}>
                    {empresa.codigo} - {empresa.nombre}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid size={1}>
            <TextField
              label="Nro. proceso"
              fullWidth
              value={processNumber ? String(processNumber) : ""}
              slotProps={{ input: { readOnly: true } }}
            />
          </Grid>

          <Grid size={1}>
            <TextField
              label="Estado"
              fullWidth
              value={status}
              slotProps={{ input: { readOnly: true } }}
            />
          </Grid>

          <Grid size={12}>
            <Stack direction="row" spacing={1} flexWrap="wrap">
              <Button
                variant="contained"
                onClick={handleCargarArchivo}
                disabled={!selectedFile || loading}
              >
                Cargar archivo
              </Button>
              <Button
                variant="outlined"
                onClick={handleValidarArchivo}
                disabled={!fileSummary || loading}
              >
                Validar archivo
              </Button>
              <Button
                variant="contained"
                color="primary"
                onClick={handleProcesarArchivo}
                disabled={status !== "Validado" || loading}
              >
                Procesar archivo
              </Button>
              <Button
                variant="outlined"
                color="warning"
                onClick={handleReversarArchivo}
                disabled={!fileSummary || loading}
              >
                Reversar archivo
              </Button>
            </Stack>
          </Grid>
        </Grid>

        {loading && <LinearProgress sx={{ mt: 2 }} />}

        {validationErrors.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Alert severity="error">
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                Errores:
              </Typography>
              <ul style={{ margin: 0, paddingLeft: 16 }}>
                {validationErrors.map((err, i) => (
                  <li key={i}>
                    <Typography variant="body2">{err}</Typography>
                  </li>
                ))}
              </ul>
            </Alert>
          </Box>
        )}
      </Paper>

      {/* Información del archivo seleccionado */}

      <Accordion>
        <AccordionSummary
          expandIcon={<ArrowDownwardIcon />}
          aria-controls="panel1-content"
          id="panel1-header"
        >
          <Typography variant="h6" color="text.secondary">
            Información archivo seleccionado
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Paper sx={{ p: 2 }}>
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              mb={1}
            >
              <Typography variant="body2" color="text.secondary">
                Preview: características del archivo
              </Typography>
            </Stack>
            <Divider sx={{ mb: 2 }} />

            <Grid container spacing={2}>
              <Grid size={12}>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Propiedad</TableCell>
                        <TableCell>Valor</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      <TableRow>
                        <TableCell>Nombre archivo</TableCell>
                        <TableCell>{fileSummary?.name ?? "-"}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Tamaño (bytes)</TableCell>
                        <TableCell>{fileSummary?.sizeBytes ?? "-"}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Número de líneas</TableCell>
                        <TableCell>{fileSummary?.lines ?? "-"}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Fecha de cargue</TableCell>
                        <TableCell>{fechaCargue || "-"}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Fecha de corte</TableCell>
                        <TableCell>{fechaCorte || "-"}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Código empresa</TableCell>
                        <TableCell>{codigoEmpresa || "-"}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Nombre empresa</TableCell>
                        <TableCell>{nombreEmpresa || "-"}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Proceso N°</TableCell>
                        <TableCell>{processNumber ?? "-"}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Estado</TableCell>
                        <TableCell>{status}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>

              <Grid size={12}>
                <TableContainer sx={{ maxHeight: 300 }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        {(previewRows[0]
                          ? Object.keys(previewRows[0])
                          : ["col1"]
                        ).map((col) => (
                          <TableCell key={col}>{col}</TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {previewRows.length > 0 ? (
                        previewRows.map((r, idx) => (
                          <TableRow key={idx}>
                            {Object.keys(r).map((k) => (
                              <TableCell key={k}>{r[k]}</TableCell>
                            ))}
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={10}>
                            <Typography variant="body2" color="text.secondary">
                              No hay datos de preview
                            </Typography>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>
            </Grid>
          </Paper>
        </AccordionDetails>
      </Accordion>

      {/* Resultados del proceso de cargue */}
      <ResultadoCargue />
    </Box>
  );
}
