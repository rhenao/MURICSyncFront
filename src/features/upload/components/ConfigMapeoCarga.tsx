import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Divider,
  FormControl,
  FormControlLabel,
  IconButton,
  InputLabel,
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
import type { SelectChangeEvent } from "@mui/material/Select";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import * as XLSX from "xlsx";
import type { MapeoCargaCampo } from "../models/MapeoCarga.model";
import type MapeoCarga from "../models/MapeoCarga.model";
import useAuth from "../../auth/hooks/useAuth";

type DestinationField = {
  value: string;
  label: string;
  description?: string;
  required?: boolean;
};

type DestinationTable = {
  value: string;
  label: string;
  fields: DestinationField[];
};

type FieldMapping = MapeoCargaCampo & {
  tempId: string;
  campoDestino?: string;
  valorPorDefecto?: string | null;
  esRequerido?: boolean;
  locked?: boolean;
};

const DESTINATION_TABLES: DestinationTable[] = [
  {
    value: "Creditos",
    label: "Créditos",
    fields: [
      { value: "NumeroCredito", label: "Número de crédito", required: true },
      {
        value: "NumeroDocumento",
        label: "Número de documento",
        required: true,
      },
      { value: "TipoDocumento", label: "Tipo de documento" },
      { value: "PrimerNombre", label: "Primer nombre" },
      { value: "PrimerApellido", label: "Primer apellido" },
      { value: "CorreoElectronico", label: "Correo electrónico" },
      { value: "Telefono", label: "Teléfono" },
      { value: "DireccionResidencia", label: "Dirección de residencia" },
      { value: "FechaNacimiento", label: "Fecha de nacimiento" },
      { value: "FechaDesembolso", label: "Fecha de desembolso" },
      { value: "Valor", label: "Valor del crédito" },
      { value: "Plazo", label: "Plazo" },
      { value: "Estado", label: "Estado" },
      { value: "TipoProducto", label: "Tipo de producto" },
      { value: "CodigoCliente", label: "Código del cliente", required: true },
    ],
  },
  {
    value: "Pagos",
    label: "Movimientos Cartera",
    fields: [
      { value: "NumeroPago", label: "Número de pago", required: true },
      { value: "NumeroCredito", label: "Número de crédito", required: true },
      { value: "FechaPago", label: "Fecha de pago" },
      { value: "ValorPago", label: "Valor pagado" },
      { value: "CanalPago", label: "Canal de pago" },
    ],
  },
];

const csvSplit = (line: string): string[] => {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];

    if (char === '"') {
      const nextChar = line[i + 1];
      if (inQuotes && nextChar === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      values.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  values.push(current.trim());
  return values;
};

const normalizeHeaders = (rawHeaders: Array<string | undefined>): string[] => {
  const seen = new Map<string, number>();
  return rawHeaders.map((header, index) => {
    const fallback = `Columna_${index + 1}`;
    const baseName = (header ?? "").trim() || fallback;
    const normalized = baseName.replace(/\s+/g, "_");
    const occurrences = seen.get(normalized) ?? 0;
    seen.set(normalized, occurrences + 1);

    if (occurrences === 0) {
      return normalized;
    }
    return `${normalized}_${occurrences + 1}`;
  });
};

const parseHeadersFromFile = async (file: File): Promise<string[]> => {
  const extension = file.name.split(".").pop()?.toLowerCase();
  if (extension === "xls" || extension === "xlsx") {
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data, { type: "array" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json<(string | number | boolean | null)[]>(
      worksheet,
      {
        header: 1,
        blankrows: false,
        defval: "",
      }
    );
    const headerRow = rows[0] ?? [];
    return normalizeHeaders(headerRow.map((cell) => (cell ?? "").toString()));
  }

  const text = await file.text();
  const normalized = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const firstNonEmptyLine = normalized
    .split("\n")
    .find((line) => line.trim().length > 0);

  if (!firstNonEmptyLine) {
    return [];
  }

  const headers = csvSplit(firstNonEmptyLine);
  return normalizeHeaders(headers);
};

const buildInitialMappings = (headers: string[]): FieldMapping[] =>
  headers.map((campoOrigen, index) => ({
    tempId: `${campoOrigen}-${index}-${Date.now()}`,
    idMapeoCarga: 0,
    campoOrigen,
    campoDestino: "",
    valorPorDefecto: null,
    esRequerido: false,
    locked: true,
  }));

const ConfigMapeoCarga: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mappings, setMappings] = useState<FieldMapping[]>([]);
  const [selectedTable, setSelectedTable] = useState<string>("");
  const [nombreMapeo, setNombreMapeo] = useState<string>("");
  const [usuarioId, setUsuarioId] = useState<string>("");
  const [payloadPreview, setPayloadPreview] = useState<MapeoCarga | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");

  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      return;
    }
    const inferredId = user.email || "";
    setUsuarioId(inferredId);
  }, [user]);

  const destinationTableOptions = DESTINATION_TABLES;

  const selectedDestinationFields = useMemo(() => {
    if (!selectedTable) {
      return [];
    }
    return (
      destinationTableOptions.find((table) => table.value === selectedTable)
        ?.fields ?? []
    );
  }, [destinationTableOptions, selectedTable]);

  const updateMappings = useCallback(
    (updater: (current: FieldMapping[]) => FieldMapping[]) => {
      setMappings((prev) => {
        const next = updater(prev);
        setPayloadPreview(null);
        setSuccessMessage("");
        return next;
      });
    },
    []
  );

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) {
      setSelectedFile(null);
      setHeaders([]);
      setMappings([]);
      return;
    }

    try {
      const parsedHeaders = await parseHeadersFromFile(file);
      if (parsedHeaders.length === 0) {
        throw new Error(
          "No se detectaron encabezados en la primera fila del archivo"
        );
      }

      setSelectedFile(file);
      setHeaders(parsedHeaders);
      setMappings(buildInitialMappings(parsedHeaders));
      setErrorMessage("");
      setPayloadPreview(null);
      setSuccessMessage("");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Error desconocido al procesar el archivo";
      setErrorMessage(message);
      setSelectedFile(null);
      setHeaders([]);
      setMappings([]);
    }
  };

  const handleTableChange = (event: SelectChangeEvent<string>) => {
    const tableValue = event.target.value;
    setSelectedTable(tableValue);
    setSuccessMessage("");
    setPayloadPreview(null);

    if (!tableValue) {
      return;
    }

    const destinationFields =
      destinationTableOptions.find((table) => table.value === tableValue)
        ?.fields ?? [];

    updateMappings((current) =>
      current.map((mapping) => {
        if (!mapping.campoDestino) {
          const autoMatch = destinationFields.find(
            (field) =>
              field.value.toLowerCase() === mapping.campoOrigen.toLowerCase()
          );
          if (autoMatch) {
            return { ...mapping, campoDestino: autoMatch.value };
          }
        }
        return mapping;
      })
    );
  };

  const handleUpdateMapping = <K extends keyof FieldMapping>(
    tempId: string,
    key: K,
    value: FieldMapping[K]
  ) => {
    updateMappings((current) =>
      current.map((mapping) =>
        mapping.tempId === tempId ? { ...mapping, [key]: value } : mapping
      )
    );
  };

  const handleRemoveMapping = (tempId: string) => {
    updateMappings((current) =>
      current.filter((mapping) => mapping.tempId !== tempId)
    );
  };

  const handleAddManualMapping = () => {
    const timestamp = Date.now();
    const tempId = `manual-${timestamp}`;
    updateMappings((current) => [
      ...current,
      {
        tempId,
        idMapeoCarga: 0,
        campoOrigen: "",
        campoDestino: "",
        valorPorDefecto: null,
        esRequerido: false,
        locked: false,
      },
    ]);
  };

  const handleReset = () => {
    setSelectedFile(null);
    setHeaders([]);
    setMappings([]);
    setSelectedTable("");
    setNombreMapeo("");
    setUsuarioId(user?.id?.toString() || user?.email || "");
    setPayloadPreview(null);
    setErrorMessage("");
    setSuccessMessage("");
  };

  const handleSave = () => {
    setErrorMessage("");
    setSuccessMessage("");

    if (!selectedFile) {
      setErrorMessage("Selecciona un archivo para configurar el mapeo");
      return;
    }

    if (!selectedTable) {
      setErrorMessage("Selecciona la tabla destino");
      return;
    }

    if (usuarioId === "") {
      setErrorMessage("Ingresa el usuario responsable");
      return;
    }

    const missingDestination = mappings.filter(
      (mapping) => !mapping.campoDestino || mapping.campoDestino.trim() === ""
    );

    if (missingDestination.length > 0) {
      setErrorMessage(
        "Hay campos sin destino asignado. Asegúrate de mapear todos los campos requeridos"
      );
      return;
    }

    const campos: MapeoCargaCampo[] = mappings.map((mapping) => ({
      idMapeoCargaCampo: mapping.idMapeoCargaCampo,
      idMapeoCarga: mapping.idMapeoCarga,
      campoOrigen: mapping.campoOrigen,
      campoDestino: mapping.campoDestino ?? "",
      valorPorDefecto: mapping.valorPorDefecto ?? null,
      esRequerido: Boolean(mapping.esRequerido),
    }));

    const payload: MapeoCarga = {
      usuario: usuarioId,
      nombreMapeo: nombreMapeo || null,
      tablaDestino: selectedTable,
      activo: true,
      campos,
    };

    setPayloadPreview(payload);
    setSuccessMessage(
      "Mapeo preparado correctamente. Revisa el resumen antes de enviarlo al backend."
    );
  };

  const selectedFileName = selectedFile?.name ?? "Ningún archivo seleccionado";

  return (
    <Box component="section" sx={{ p: 2 }}>
      <Paper elevation={1} sx={{ p: 3 }}>
        <Stack spacing={3}>
          <Stack direction="row" spacing={2} alignItems="center">
            <UploadFileIcon color="primary" sx={{ fontSize: 32 }} />
            <Typography variant="h5" component="h1">
              Configuración de mapeo de carga
            </Typography>
          </Stack>

          <Typography variant="body1" color="text.secondary">
            Sube un archivo con encabezados en la primera fila, selecciona la
            tabla destino y mapea cada campo al esquema del sistema. Puedes
            definir valores por defecto y marcar campos requeridos antes de
            guardar el mapeo.
          </Typography>

          {errorMessage && (
            <Alert severity="error" onClose={() => setErrorMessage("")}>
              {errorMessage}
            </Alert>
          )}

          {successMessage && (
            <Alert severity="success" onClose={() => setSuccessMessage("")}>
              {successMessage}
            </Alert>
          )}

          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 4, lg: 3 }}>
              <Stack spacing={2}>
                <Button
                  variant="contained"
                  component="label"
                  startIcon={<UploadFileIcon />}
                >
                  Seleccionar archivo (Excel o CSV)
                  <input
                    hidden
                    type="file"
                    accept=".csv,.xls,.xlsx"
                    onChange={handleFileChange}
                  />
                </Button>
                <Typography variant="body2" color="text.secondary">
                  {selectedFileName}
                </Typography>
              </Stack>
            </Grid>
            <Grid size={{ xs: 12, md: 4, lg: 6 }}>
              <Stack direction="row" spacing={2}>
                <TextField
                  label="Nombre del mapeo"
                  value={nombreMapeo}
                  onChange={(event) => setNombreMapeo(event.target.value)}
                  placeholder="Ej. Mapeo clientes noviembre"
                  fullWidth
                />
                <TextField
                  label="Usuario"
                  type="text"
                  value={usuarioId}
                  onChange={(event) => {
                    const { value } = event.target;
                    setUsuarioId(value);
                  }}
                  fullWidth
                />
              </Stack>
            </Grid>
            <Grid size={{ xs: 12, md: 4, lg: 3 }}>
              <FormControl fullWidth>
                <InputLabel id="tabla-destino-label">Tabla destino</InputLabel>
                <Select
                  labelId="tabla-destino-label"
                  label="Tabla destino"
                  value={selectedTable}
                  onChange={handleTableChange}
                >
                  <MenuItem value="">
                    <em>Selecciona una tabla</em>
                  </MenuItem>
                  {destinationTableOptions.map((table) => (
                    <MenuItem key={table.value} value={table.value}>
                      {table.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          <Divider flexItem />

          <Stack spacing={2}>
            <Stack
              direction="row"
              spacing={2}
              alignItems="center"
              justifyContent="space-between"
            >
              <Typography variant="h6">Campos detectados</Typography>
              <Button
                variant="outlined"
                startIcon={<AddCircleOutlineIcon />}
                onClick={handleAddManualMapping}
              >
                Agregar campo manual
              </Button>
            </Stack>
            {headers.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                Aún no hay campos para mapear. Sube un archivo para comenzar.
              </Typography>
            ) : (
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Campo origen</TableCell>
                      <TableCell>Campo destino</TableCell>
                      <TableCell>Valor por defecto</TableCell>
                      <TableCell align="center">Es requerido</TableCell>
                      <TableCell align="center" sx={{ width: 48 }}>
                        Acción
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {mappings.map((mapping) => {
                      const destinationOptions =
                        selectedDestinationFields.length
                          ? selectedDestinationFields
                          : [];
                      const destinationFieldMetadata = destinationOptions.find(
                        (field) => field.value === mapping.campoDestino
                      );

                      return (
                        <TableRow key={mapping.tempId}>
                          <TableCell sx={{ minWidth: 200 }}>
                            <TextField
                              value={mapping.campoOrigen}
                              disabled={Boolean(mapping.locked)}
                              placeholder="Nombre del campo origen"
                              onChange={(event) =>
                                handleUpdateMapping(
                                  mapping.tempId,
                                  "campoOrigen",
                                  event.target.value
                                )
                              }
                              size="small"
                              fullWidth
                            />
                          </TableCell>
                          <TableCell sx={{ minWidth: 220 }}>
                            <FormControl fullWidth size="small">
                              <Select
                                displayEmpty
                                value={mapping.campoDestino ?? ""}
                                onChange={(event) =>
                                  handleUpdateMapping(
                                    mapping.tempId,
                                    "campoDestino",
                                    event.target.value
                                  )
                                }
                              >
                                <MenuItem value="">
                                  <em>
                                    {selectedTable
                                      ? "Selecciona un campo destino"
                                      : "Selecciona primero la tabla destino"}
                                  </em>
                                </MenuItem>
                                {destinationOptions.map((field) => (
                                  <MenuItem
                                    key={field.value}
                                    value={field.value}
                                  >
                                    {field.label}
                                    {field.required ? " *" : ""}
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                            {destinationFieldMetadata?.description && (
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                {destinationFieldMetadata.description}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell sx={{ minWidth: 200 }}>
                            <TextField
                              value={mapping.valorPorDefecto ?? ""}
                              onChange={(event) =>
                                handleUpdateMapping(
                                  mapping.tempId,
                                  "valorPorDefecto",
                                  event.target.value || null
                                )
                              }
                              size="small"
                              placeholder="Ingresa un valor opcional"
                              fullWidth
                            />
                          </TableCell>
                          <TableCell align="center">
                            <FormControlLabel
                              control={
                                <Checkbox
                                  checked={Boolean(mapping.esRequerido)}
                                  onChange={(event) =>
                                    handleUpdateMapping(
                                      mapping.tempId,
                                      "esRequerido",
                                      event.target.checked
                                    )
                                  }
                                  size="small"
                                />
                              }
                              label=""
                            />
                          </TableCell>
                          <TableCell align="center">
                            <IconButton
                              aria-label="Eliminar"
                              size="small"
                              disabled={
                                mapping.locked &&
                                headers.includes(mapping.campoOrigen)
                              }
                              onClick={() =>
                                handleRemoveMapping(mapping.tempId)
                              }
                            >
                              <DeleteOutlineIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Stack>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleSave}
              disabled={mappings.length === 0}
            >
              Guardar mapeo
            </Button>
            <Button variant="outlined" color="secondary" onClick={handleReset}>
              Reiniciar
            </Button>
          </Stack>

          {payloadPreview && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Resumen del mapeo preparado
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Esta información puede enviarse al servicio backend para
                persistir la configuración.
              </Typography>
              <Box
                component="pre"
                sx={{
                  backgroundColor: "grey.100",
                  borderRadius: 1,
                  p: 2,
                  overflowX: "auto",
                  fontFamily: "monospace",
                  fontSize: "0.85rem",
                }}
              >
                {JSON.stringify(payloadPreview, null, 2)}
              </Box>
            </Box>
          )}
        </Stack>
      </Paper>
    </Box>
  );
};

export default ConfigMapeoCarga;
