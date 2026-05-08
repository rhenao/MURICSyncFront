import React, { useMemo, useRef, useState } from "react";
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
import * as XLSX from "xlsx";
import { useEntidades } from "../../../hooks/useEntidades";
import {
  //type ArchivosCarga,
  type ArchivosCargaDetalle,
  type MetadatosCarga,
  //type RegistroAuditoria,
  type VersionArchivo,
  crearArchivoCarga,
  crearDetalleCarga,
  crearRegistroAuditoria,
} from "../models/UploadModels";

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
  contentPreview: string[];
  content: string[]; // primeras n líneas
}

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

    return [...activas];
  }, [universalidadesRaw]);

  // preview rows for grid
  const [previewRows, setPreviewRows] = useState<Record<string, string>[]>([]);
  const [detallesCarga, setDetallesCarga] = useState<ArchivosCargaDetalle[]>(
    []
  );

  const openFilePicker = () => fileInputRef.current?.click();

  const handleEmpresaChange = (codigo: string) => {
    const empresa = universalidades.find((e) => e.codigo === codigo);
    setCodigoEmpresa(codigo);
    setNombreEmpresa(empresa?.descripcion || "");
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
        try {
          const data = reader.result;
          let rows: string[][] = [];
          let lines = 0;

          // Determinar tipo de archivo
          const isExcel =
            file.name.toLowerCase().endsWith(".xlsx") ||
            file.name.toLowerCase().endsWith(".xls");

          if (isExcel) {
            // Procesar archivo Excel
            const workbook = XLSX.read(data, { type: "array" });
            const sheetName = workbook.SheetNames[0]; // Primera hoja
            const worksheet = workbook.Sheets[sheetName];

            // Convertir a array de arrays
            const jsonData = XLSX.utils.sheet_to_json(worksheet, {
              header: 1,
              defval: "",
            }) as string[][];

            rows = jsonData;
            lines = jsonData.length;
          } else {
            // Procesar archivo CSV/TXT
            const text = String(data ?? "");
            const normalized = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
            const textRows = normalized.split("\n");
            lines = textRows.length;

            // Convertir CSV a array de arrays
            rows = textRows.map((line) => {
              // Simple CSV parser (para casos complejos usar papaparse)
              return line
                .split(",")
                .map((cell) => cell.trim().replace(/"/g, ""));
            });
          }

          // Tomar las primeras 10 filas para preview
          const preview = rows.slice(0, 10).map((row) => row.join(","));
          const content = rows.map((row) => row.join(","));

          resolve({
            name: file.name,
            sizeBytes: file.size,
            lines,
            contentPreview: preview,
            content,
          });
        } catch (err) {
          reject(new Error(`Error procesando archivo: ${err}`));
        }
      };

      // Leer como ArrayBuffer para Excel o como texto para CSV
      const isExcel =
        file.name.toLowerCase().endsWith(".xlsx") ||
        file.name.toLowerCase().endsWith(".xls");

      if (isExcel) {
        reader.readAsArrayBuffer(file);
      } else {
        reader.readAsText(file, "UTF-8");
      }
    });
  };

  const handleCargarArchivo = async () => {
    if (!selectedFile) return;
    setLoading(true);
    setValidationErrors([]);

    try {
      // Validar tipo de archivo
      const allowedTypes = [".csv", ".txt", ".xlsx", ".xls"];
      const fileExtension = selectedFile.name
        .toLowerCase()
        .substring(selectedFile.name.lastIndexOf("."));

      if (!allowedTypes.includes(fileExtension)) {
        throw new Error(
          `Tipo de archivo no soportado: ${fileExtension}. Tipos permitidos: ${allowedTypes.join(
            ", "
          )}`
        );
      }

      // Validar tamaño del archivo (máximo 10MB)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (selectedFile.size > maxSize) {
        throw new Error(
          `El archivo es demasiado grande. Tamaño máximo permitido: ${
            maxSize / (1024 * 1024)
          }MB`
        );
      }

      const summary = await countLinesAndPreview(selectedFile);
      setFileSummary(summary);
      console.log("Resumen del archivo:", summary);
      // Generar número de proceso si no existe
      const numeroProceso =
        processNumber || Math.floor(Math.random() * 900000) + 100000;
      setProcessNumber(numeroProceso);

      // Crear metadatos
      const metadatos: MetadatosCarga = {
        fechaCargue,
        fechaCorte,
        codigoEmpresa,
        nombreEmpresa,
        numeroProceso,
        totalLineas: summary.lines,
        extensionArchivo: fileExtension,
        tamanoOriginal: selectedFile.size,
      };

      // Crear modelo ArchivoSubida usando función utilitaria
      const archivoCarga = crearArchivoCarga(
        selectedFile,
        metadatos,
        "usuario@ejemplo.com" // TODO: obtener del contexto
      );

      // Crear detalles de carga
      const detallesCarga: ArchivosCargaDetalle[] = [];
      const allRows = summary.content;

      for (let i = 0; i < allRows.length; i++) {
        const cols = allRows[i].split(",");
        const datosCrudos: Record<string, unknown> = {};

        cols.forEach((valor, indiceCol) => {
          datosCrudos[`col${indiceCol + 1}`] = valor.trim();
        });

        const detalleCarga = crearDetalleCarga(
          archivoCarga.idArchivo,
          i + 1,
          datosCrudos
        );
        detallesCarga.push(detalleCarga);
      }

      // Crear registro de auditoría
      const registroAuditoria = crearRegistroAuditoria(
        "usuario@ejemplo.com",
        "SUBIDA_CREAR",
        `Archivo cargado: ${selectedFile.name} con ${summary.lines} líneas`,
        {
          nombreArchivo: selectedFile.name,
          tamanoArchivo: selectedFile.size,
          empresa: codigoEmpresa,
          numeroProceso,
        }
      );

      // Crear versión del archivo
      const versionArchivo: VersionArchivo = {
        idArchivoSubida: archivoCarga.idArchivo,
        version: 1,
        fechaCreacion: new Date().toISOString(),
        creadoPor: "usuario@ejemplo.com",
        rutaArchivo: archivoCarga.ruta ?? "N/A",
        notas: `Versión inicial - Carga desde ${fileExtension.toUpperCase()}`,
      };

      // Actualizar estado de la UI
      const rows = summary.content.map((line, index) => {
        const cols = line.split(",");
        const obj: Record<string, string> = {};

        if (index === 0) {
          cols.forEach((c, i) => (obj[`${c || `col${i + 1}`}`] = c.trim()));
        } else {
          cols.forEach((c, i) => (obj[`col${i + 1}`] = c.trim()));
        }
        return obj;
      });

      setPreviewRows(rows);
      setStatus("Cargado");
      setDetallesCarga(detallesCarga);

      // Preparar datos para envío al backend
      const datosCarga = {
        archivoCarga,
        detallesCarga,
        registroAuditoria,
        versionArchivo,
        metadatos,
      };

      console.log("Datos preparados para envío al backend:", datosCarga);

      // TODO: Enviar al servicio backend
      // await servicioSubidaArchivos.crear(datosCarga);
    } catch (err) {
      console.error("Error cargando archivo:", err);
      const mensajeError =
        err instanceof Error
          ? err.message
          : "Error desconocido al leer el archivo";
      setValidationErrors([mensajeError]);
      setStatus("Error");

      // Crear registro de error en auditoría
      const registroError = crearRegistroAuditoria(
        "usuario@ejemplo.com",
        "SUBIDA_ERROR",
        `Error al cargar archivo: ${mensajeError}`,
        {
          nombreArchivo: selectedFile?.name,
          error: mensajeError,
          tamanoArchivo: selectedFile?.size,
        }
      );

      console.log("Registro de error:", registroError);
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
      if (!codigoEmpresa) errors.push("Código de universalidad esrequerido");
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
                accept=".csv, text/csv, .txt, .xlsx, .xls, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
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
            <FormControl fullWidth disabled={loading || cargandoUniversalidades}>
              <InputLabel>Universalidad</InputLabel>
              <Select
                value={codigoEmpresa}
                label="Universalidad"
                onChange={(e) => handleEmpresaChange(e.target.value)}
              >
                {universalidades.map((empresa) => (
                  <MenuItem key={empresa.codigo} value={empresa.codigo}>
                    {`${empresa.codigo} - ${empresa.descripcion}`}
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

        {errorUniversalidades && (
          <Alert sx={{ mt: 2 }} severity="error">
            Error al cargar universalidades: {errorUniversalidades}
          </Alert>
        )}

        <Typography
          variant="caption"
          color="text.secondary"
          display="block"
          mt={1}
        >
          Soporta archivos CSV, TXT y Excel (.xlsx, .xls). Tamaño máximo: 10MB
        </Typography>
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
                        <TableCell>Código universalidad</TableCell>
                        <TableCell>{codigoEmpresa || "-"}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Nombre universalidad</TableCell>
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
      <ResultadoCargue detalles={detallesCarga} />
    </Box>
  );
}
