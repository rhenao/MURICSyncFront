import { useEffect, useRef, useState } from 'react';
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
  Divider,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
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
} from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import DownloadIcon from '@mui/icons-material/Download';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import * as XLSX from 'xlsx';
import {
  CAMPOS_POR_INSUMO,
  INSUMO_LABELS,
  type CampoInsumo,
  type InsumoMURIC,
  type PlantillaCarga,
  type PlantillaCargaCampo,
  type PlantillaInput,
} from '../models/Plantilla.model';
import useAuth from '../../auth/hooks/useAuth';

// ─── Tipos internos ───────────────────────────────────────────────────────────

interface FilaMapeo {
  _tempId: string;
  nombreColumnaArchivo: string;
  campoStaging: string;
  valorPorDefecto: string;
  _sugerida: boolean;
}

// ─── Helpers de conversión ────────────────────────────────────────────────────

function campoToFila(c: PlantillaCargaCampo): FilaMapeo {
  return {
    _tempId: String(c.id ?? Math.random()),
    nombreColumnaArchivo: c.nombreColumnaArchivo ?? '',
    campoStaging: c.campoStaging,
    valorPorDefecto: c.valorPorDefecto ?? '',
    _sugerida: false,
  };
}

function filasToCampos(filas: FilaMapeo[], plantillaId: number): PlantillaCargaCampo[] {
  return filas.map((f, i) => ({
    plantillaId,
    nombreColumnaArchivo: f.nombreColumnaArchivo.trim() || null,
    campoStaging: f.campoStaging,
    valorPorDefecto: f.valorPorDefecto.trim() || null,
    ordenColumna: i + 1,
  }));
}

function nuevaFila(): FilaMapeo {
  return {
    _tempId: String(Math.random()),
    nombreColumnaArchivo: '',
    campoStaging: '',
    valorPorDefecto: '',
    _sugerida: false,
  };
}

// ─── Parseo de encabezados desde archivo ─────────────────────────────────────

async function parseHeadersFromFile(file: File): Promise<string[]> {
  const ext = file.name.split('.').pop()?.toLowerCase();

  if (ext === 'xlsx' || ext === 'xls') {
    const data = await file.arrayBuffer();
    const wb = XLSX.read(data, { type: 'array' });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, {
      header: 1,
      blankrows: false,
      defval: '',
    });
    const headerRow = (rows[0] ?? []) as unknown[];
    return headerRow
      .map(c => String(c ?? '').trim())
      .filter(c => c.length > 0);
  }

  // CSV / TXT: detectar separador automáticamente
  const text = await file.text();
  const firstLine = text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .find(l => l.trim());
  if (!firstLine) return [];

  const separador = [',', ';', '\t', '|'].reduce((best, sep) =>
    firstLine.split(sep).length > firstLine.split(best).length ? sep : best
  );

  return firstLine
    .split(separador)
    .map(c => c.trim().replace(/^["']|["']$/g, ''))
    .filter(Boolean);
}

// ─── Algoritmo de sugerencia de mapeo ─────────────────────────────────────────

function normalizar(s: string): string {
  return s.toLowerCase().trim().replace(/[\s\-.]+/g, '_');
}

function sugerirCampoStaging(encabezado: string, campos: CampoInsumo[]): string {
  const norm = normalizar(encabezado);

  const scores = campos.map(c => {
    const normCampo = c.campo; // ya está en snake_case
    let score = 0;

    if (norm === normCampo) return { campo: c.campo, score: 100 };

    // Contención completa
    if (normCampo.includes(norm) || norm.includes(normCampo)) {
      score = Math.max(score, 50);
    }

    // Palabras en común (ignorar palabras de 1-2 chars: "de", "la", etc.)
    const palabrasEnc = norm.split('_').filter(p => p.length > 2);
    const palabrasCampo = normCampo.split('_').filter(p => p.length > 2);
    const comunes = palabrasEnc.filter(p => palabrasCampo.includes(p));
    score = Math.max(score, comunes.length * 20);

    return { campo: c.campo, score };
  });

  const maxScore = Math.max(...scores.map(s => s.score));
  if (maxScore < 20) return ''; // ningún campo supera el umbral mínimo

  const mejores = scores.filter(s => s.score === maxScore);
  if (mejores.length > 1) return ''; // empate = ambigüedad, el usuario elige

  return mejores[0].campo;
}

// ─── Componente principal ─────────────────────────────────────────────────────

interface Props {
  open: boolean;
  plantilla: PlantillaCarga | null;
  onClose: () => void;
  onSave: (input: PlantillaInput) => void;
}

export default function FormPlantilla({ open, plantilla, onClose, onSave }: Props) {
  const { user } = useAuth();
  const esEdicion = plantilla !== null;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [insumo, setInsumo] = useState<InsumoMURIC | ''>('');
  const [filas, setFilas] = useState<FilaMapeo[]>([]);
  const [error, setError] = useState('');
  const [errorImport, setErrorImport] = useState('');

  // Encabezados pendientes de confirmar antes de reemplazar filas existentes
  const [pendingHeaders, setPendingHeaders] = useState<string[] | null>(null);

  useEffect(() => {
    if (!open) return;
    if (plantilla) {
      setNombre(plantilla.nombre);
      setDescripcion(plantilla.descripcion);
      setInsumo(plantilla.insumo);
      setFilas(plantilla.campos.map(campoToFila));
    } else {
      setNombre('');
      setDescripcion('');
      setInsumo('');
      setFilas([nuevaFila()]);
    }
    setError('');
    setErrorImport('');
    setPendingHeaders(null);
  }, [open, plantilla]);

  const camposDisponibles: CampoInsumo[] = insumo ? CAMPOS_POR_INSUMO[insumo] : [];
  const camposYaUsados = new Set(filas.map(f => f.campoStaging).filter(Boolean));

  // ── Handlers del formulario ──────────────────────────────────────────────────

  const handleInsumoChange = (v: InsumoMURIC) => {
    setInsumo(v);
    setFilas([nuevaFila()]);
  };

  const handleFilaChange = <K extends keyof FilaMapeo>(
    tempId: string,
    key: K,
    value: FilaMapeo[K]
  ) => {
    setFilas(prev =>
      prev.map(f =>
        f._tempId === tempId
          ? { ...f, [key]: value, _sugerida: key === 'campoStaging' ? false : f._sugerida }
          : f
      )
    );
  };

  const handleAgregarFila = () => setFilas(prev => [...prev, nuevaFila()]);

  const handleEliminarFila = (tempId: string) =>
    setFilas(prev => prev.filter(f => f._tempId !== tempId));

  // ── Importar desde archivo ───────────────────────────────────────────────────

  const tieneFilasConContenido = filas.some(
    f => f.nombreColumnaArchivo.trim() || f.campoStaging || f.valorPorDefecto.trim()
  );

  const aplicarImportacion = (headers: string[]) => {
    const campos = insumo ? CAMPOS_POR_INSUMO[insumo] : [];
    const nuevasFilas: FilaMapeo[] = headers.map(h => {
      const sugerencia = sugerirCampoStaging(h, campos);
      return {
        _tempId: String(Math.random()),
        nombreColumnaArchivo: h,
        campoStaging: sugerencia,
        valorPorDefecto: '',
        _sugerida: sugerencia !== '',
      };
    });
    setFilas(nuevasFilas);
    setPendingHeaders(null);
    setErrorImport('');
  };

  const handleImportarArchivo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!fileInputRef.current) return;
    fileInputRef.current.value = ''; // resetear para permitir re-selección del mismo archivo
    if (!file) return;

    setErrorImport('');
    try {
      const headers = await parseHeadersFromFile(file);
      if (headers.length === 0) {
        setErrorImport('No se encontraron encabezados en la primera fila del archivo.');
        return;
      }
      if (tieneFilasConContenido) {
        setPendingHeaders(headers); // mostrar confirmación
      } else {
        aplicarImportacion(headers);
      }
    } catch {
      setErrorImport('No se pudo leer el archivo. Verifica que sea un Excel o CSV válido.');
    }
  };

  // ── Descarga de plantilla vacía ──────────────────────────────────────────────

  const handleDescargarPlantilla = () => {
    if (!insumo) return;
    const encabezados = filas
      .filter(f => f.campoStaging && f.nombreColumnaArchivo.trim())
      .map(f => f.nombreColumnaArchivo.trim());
    if (encabezados.length === 0) return;
    const ws = XLSX.utils.aoa_to_sheet([encabezados]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `MURIC-${insumo}`);
    XLSX.writeFile(wb, `plantilla_${insumo}_${nombre || 'sin_nombre'}.xlsx`);
  };

  // ── Guardar ──────────────────────────────────────────────────────────────────

  const handleGuardar = () => {
    setError('');
    if (!nombre.trim()) { setError('El nombre es obligatorio.'); return; }
    if (!insumo) { setError('Selecciona el insumo MURIC.'); return; }

    const filasValidas = filas.filter(f => f.campoStaging);
    if (filasValidas.length === 0) {
      setError('Agrega al menos un campo mapeado.');
      return;
    }
    const sinCobertura = filasValidas.filter(
      f => !f.nombreColumnaArchivo.trim() && !f.valorPorDefecto.trim()
    );
    if (sinCobertura.length > 0) {
      setError('Cada fila debe tener al menos una "Columna en el archivo" o un "Valor por defecto".');
      return;
    }
    const camposDuplicados = filasValidas
      .map(f => f.campoStaging)
      .filter((c, i, arr) => arr.indexOf(c) !== i);
    if (camposDuplicados.length > 0) {
      setError('Un mismo campo destino aparece más de una vez en el mapeo.');
      return;
    }

    onSave({
      nombre: nombre.trim(),
      descripcion: descripcion.trim(),
      insumo,
      tipoEntidad: plantilla?.tipoEntidad ?? 1,
      codigoEntidad: plantilla?.codigoEntidad ?? 1,
      usuarioCreador: plantilla?.usuarioCreador ?? (user?.email ?? ''),
      esActiva: plantilla?.esActiva ?? true,
      campos: filasToCampos(filasValidas, plantilla?.id ?? 0),
    });
  };

  // ── Datos derivados para la UI ───────────────────────────────────────────────

  const obligatoriosFaltantes = camposDisponibles
    .filter(c => c.obligatorio)
    .filter(c => !new Set(filas.map(f => f.campoStaging)).has(c.campo));

  const sugeridosCount = filas.filter(f => f._sugerida).length;

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <>
      <Dialog open={open} onClose={onClose} fullWidth maxWidth="lg" scroll="paper">
        <DialogTitle sx={{ pb: 1 }}>
          {esEdicion ? `Editar plantilla: ${plantilla.nombre}` : 'Nueva plantilla de carga'}
        </DialogTitle>

        <DialogContent dividers>
          <Stack spacing={2.5}>
            {error && <Alert severity="error" onClose={() => setError('')}>{error}</Alert>}
            {errorImport && (
              <Alert severity="warning" onClose={() => setErrorImport('')}>{errorImport}</Alert>
            )}

            {/* ── Encabezado ── */}
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label="Nombre"
                value={nombre}
                onChange={e => setNombre(e.target.value)}
                fullWidth
                required
                inputProps={{ maxLength: 200 }}
              />
              <FormControl fullWidth required disabled={esEdicion}>
                <InputLabel>Insumo MURIC</InputLabel>
                <Select
                  value={insumo}
                  label="Insumo MURIC"
                  onChange={e => handleInsumoChange(e.target.value as InsumoMURIC)}
                >
                  {(Object.keys(INSUMO_LABELS) as InsumoMURIC[]).map(k => (
                    <MenuItem key={k} value={k}>{INSUMO_LABELS[k]}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>

            <TextField
              label="Descripción"
              value={descripcion}
              onChange={e => setDescripcion(e.target.value)}
              fullWidth
              multiline
              rows={2}
              placeholder="Describe cuándo usar esta plantilla y qué sistema genera el archivo"
            />

            <Divider />

            {/* ── Barra de acciones de la tabla ── */}
            <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="subtitle1" fontWeight={600}>
                  Mapeo de columnas
                </Typography>
                {sugeridosCount > 0 && (
                  <Chip
                    icon={<AutoFixHighIcon sx={{ fontSize: '0.85rem !important' }} />}
                    label={`${sugeridosCount} mapeo${sugeridosCount > 1 ? 's' : ''} sugerido${sugeridosCount > 1 ? 's' : ''}`}
                    size="small"
                    color="info"
                    variant="outlined"
                  />
                )}
              </Stack>

              <Stack direction="row" spacing={1} flexWrap="wrap">
                {/* Botón importar desde archivo */}
                <Tooltip title="Lee la primera fila del archivo y genera las filas de mapeo automáticamente">
                  <span>
                    <Button
                      size="small"
                      variant="outlined"
                      color="secondary"
                      startIcon={<UploadFileIcon />}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Importar columnas desde archivo
                    </Button>
                  </span>
                </Tooltip>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv,.txt"
                  style={{ display: 'none' }}
                  onChange={handleImportarArchivo}
                />

                {insumo && filas.some(f => f.nombreColumnaArchivo.trim()) && (
                  <Tooltip title="Descarga un Excel con las columnas definidas como encabezados">
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<DownloadIcon />}
                      onClick={handleDescargarPlantilla}
                    >
                      Descargar plantilla vacía
                    </Button>
                  </Tooltip>
                )}

                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<AddCircleOutlineIcon />}
                  onClick={handleAgregarFila}
                  disabled={!insumo}
                >
                  Agregar fila
                </Button>
              </Stack>
            </Stack>

            {!insumo && (
              <Typography variant="body2" color="text.secondary">
                Selecciona el insumo MURIC para comenzar a mapear columnas, o importa un archivo directamente (las sugerencias de mapeo requieren tener el insumo seleccionado).
              </Typography>
            )}

            {/* ── Alerta de obligatorios faltantes ── */}
            {insumo && obligatoriosFaltantes.length > 0 && (
              <Alert severity="warning" sx={{ py: 0.5 }}>
                Campos obligatorios sin mapear:{' '}
                {obligatoriosFaltantes.map(c => (
                  <Chip key={c.campo} label={c.etiqueta} size="small" sx={{ mr: 0.5 }} />
                ))}
              </Alert>
            )}

            {/* ── Tabla de mapeo ── */}
            {(insumo || filas.some(f => f.nombreColumnaArchivo)) && (
              <>
                <TableContainer sx={{ maxHeight: 420 }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700, width: 240 }}>
                          Columna en el archivo
                        </TableCell>
                        <TableCell sx={{ fontWeight: 700, width: 320 }}>
                          Campo destino (staging)
                        </TableCell>
                        <TableCell sx={{ fontWeight: 700, width: 200 }}>
                          Valor por defecto
                        </TableCell>
                        <TableCell sx={{ width: 48 }} />
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filas.map(fila => {
                        const opcionesDestino = camposDisponibles.filter(
                          c => c.campo === fila.campoStaging || !camposYaUsados.has(c.campo)
                        );
                        return (
                          <TableRow
                            key={fila._tempId}
                            sx={fila._sugerida ? { backgroundColor: 'rgba(2, 136, 209, 0.04)' } : {}}
                          >
                            <TableCell>
                              <TextField
                                size="small"
                                fullWidth
                                value={fila.nombreColumnaArchivo}
                                onChange={e =>
                                  handleFilaChange(fila._tempId, 'nombreColumnaArchivo', e.target.value)
                                }
                                placeholder="ej. nro_credito"
                              />
                            </TableCell>

                            <TableCell>
                              <FormControl size="small" fullWidth>
                                <Select
                                  displayEmpty
                                  value={fila.campoStaging}
                                  onChange={e =>
                                    handleFilaChange(fila._tempId, 'campoStaging', e.target.value)
                                  }
                                  renderValue={v =>
                                    v ? (
                                      <Stack direction="row" spacing={0.75} alignItems="center">
                                        <span>
                                          {camposDisponibles.find(c => c.campo === v)?.etiqueta ?? v}
                                        </span>
                                        {fila._sugerida && (
                                          <Chip
                                            icon={<AutoFixHighIcon sx={{ fontSize: '0.75rem !important' }} />}
                                            label="Sugerida"
                                            size="small"
                                            color="info"
                                            variant="outlined"
                                            sx={{ height: 18, fontSize: '0.68rem' }}
                                          />
                                        )}
                                      </Stack>
                                    ) : (
                                      <em style={{ color: '#aaa' }}>Selecciona campo</em>
                                    )
                                  }
                                >
                                  {opcionesDestino.map(c => (
                                    <MenuItem key={c.campo} value={c.campo}>
                                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                        {c.etiqueta}
                                        {c.obligatorio && (
                                          <Chip label="Obligatorio" size="small" color="warning" variant="outlined" />
                                        )}
                                      </Box>
                                    </MenuItem>
                                  ))}
                                </Select>
                              </FormControl>
                            </TableCell>

                            <TableCell>
                              <TextField
                                size="small"
                                fullWidth
                                value={fila.valorPorDefecto}
                                onChange={e =>
                                  handleFilaChange(fila._tempId, 'valorPorDefecto', e.target.value)
                                }
                                placeholder={
                                  !fila.nombreColumnaArchivo.trim()
                                    ? 'Requerido si no hay columna'
                                    : 'Opcional'
                                }
                                error={
                                  !fila.nombreColumnaArchivo.trim() &&
                                  !fila.valorPorDefecto.trim() &&
                                  !!fila.campoStaging
                                }
                              />
                            </TableCell>

                            <TableCell>
                              <IconButton
                                size="small"
                                onClick={() => handleEliminarFila(fila._tempId)}
                                disabled={filas.length === 1}
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

                <Typography variant="caption" color="text.secondary">
                  Deja vacía la "Columna en el archivo" si el campo siempre usa el valor por defecto (no viene en el archivo). El campo destino solo puede aparecer una vez. Los mapeos marcados como "Sugerida" son propuestas automáticas — revísalos antes de guardar.
                </Typography>
              </>
            )}
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={onClose} color="inherit">Cancelar</Button>
          <Button onClick={handleGuardar} variant="contained">
            {esEdicion ? 'Guardar cambios' : 'Crear plantilla'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Diálogo de confirmación de reemplazo ── */}
      <Dialog open={pendingHeaders !== null} onClose={() => setPendingHeaders(null)} maxWidth="xs">
        <DialogTitle>Reemplazar filas existentes</DialogTitle>
        <DialogContent>
          <DialogContentText>
            El formulario ya tiene {filas.filter(f => f.nombreColumnaArchivo.trim() || f.campoStaging).length} fila{filas.length !== 1 ? 's' : ''} definida{filas.length !== 1 ? 's' : ''}.
            El archivo seleccionado tiene <strong>{pendingHeaders?.length ?? 0} columna{(pendingHeaders?.length ?? 0) !== 1 ? 's' : ''}</strong>.
            ¿Reemplazar todo el mapeo actual con las columnas del archivo?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPendingHeaders(null)}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={() => pendingHeaders && aplicarImportacion(pendingHeaders)}
          >
            Reemplazar
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
