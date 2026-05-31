import { useMemo, useRef, useState, type RefObject } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  FormControl,
  IconButton,
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
} from '@mui/material';
import Grid from '@mui/material/Grid';
import RestartAltIcon        from '@mui/icons-material/RestartAlt';
import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon      from '@mui/icons-material/ErrorOutline';
import PublishIcon           from '@mui/icons-material/Publish';
import BlockIcon             from '@mui/icons-material/Block';
import VerifiedIcon          from '@mui/icons-material/Verified';
import FileDownloadIcon      from '@mui/icons-material/FileDownload';
import SendIcon              from '@mui/icons-material/Send';
import RefreshIcon           from '@mui/icons-material/Refresh';
import axiosSecurityAPIClient from '../../../api/axiosSecurityAPIClient';
import { useEntidades }      from '../../../hooks/useEntidades';
import type { PlantillaCarga } from '../models/Plantilla.model';

// ─── API response types ───────────────────────────────────────────────────────

interface LoteDetalle {
  id: number;
  fechaCorte: string;
  tipoEntidad: number;
  codigoEntidad: number;
  estado: string;
  fechaCreacion: string;
  usuarioCreador: string;
  conteos: { creditos: number; atributos: number; movimientos: number } | null;
  resumenErrores: { total: number; errores: number; advertencias: number } | null;
}

interface HistorialArchivo {
  id: number;
  insumo: string;
  nombreArchivo: string;
  tamanoBytes: number;
  filasParseadas: number | null;
  resultado: string;
  mensajeResultado: string | null;
  fechaCarga: string;
  usuarioCarga: string;
}

interface TransmisionSfc {
  id: number;
  loteId: number;
  nombreArchivo: string;
  hashSha256: string;
  idTransmisionSfc: string;
  estado: string;
  codigoEstadoSfc: string | null;
  mensajeEstado: string | null;
  fechaTransmision: string;
  usuarioTransmisor: string;
  fechaUltimaConsulta: string | null;
  totalCreditos: number;
  totalDemograficos: number;
  totalMovimientos: number;
}

interface TransmitirResponse {
  transmisionId: number;
  idTransmisionSfc: string;
  estado: string;
  nombreArchivo: string;
  hashSha256: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TIPO_ENTIDAD_DEFAULT = 1;

const INSUMOS = [
  { enum: 'Credito',    codigo: '001-001', label: 'Información general de créditos' },
  { enum: 'Atributo',   codigo: '001-002', label: 'Atributos del crédito y deudor' },
  { enum: 'Movimiento', codigo: '001-003', label: 'Movimientos de cartera' },
] as const;

type InsumoEnum = 'Credito' | 'Atributo' | 'Movimiento';

const ESTADO_COLOR: Record<string, 'default' | 'primary' | 'warning' | 'success' | 'error'> = {
  Iniciado:  'primary',
  Parseado:  'warning',
  Validado:  'primary',
  Promovido: 'success',
  Anulado:   'default',
  Fallido:   'error',
};

const ESTADO_TX_COLOR: Record<string, 'default' | 'warning' | 'success' | 'error'> = {
  Enviado:   'warning',
  Aprobado:  'success',
  Rechazado: 'error',
  Error:     'error',
};

interface UniversalidadOData {
  Codigo?: string | number;
  Descripcion?: string;
  Estado?: string;
}

const getLastDayOfPreviousMonth = (): string => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 0).toISOString().slice(0, 10);
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function CargaArchivos() {
  // Step 1 — lote creation form
  const [fechaCorte, setFechaCorte]     = useState(getLastDayOfPreviousMonth);
  const [codigoEntidad, setCodigoEntidad] = useState('');
  const [tipoEntidad, setTipoEntidad]   = useState(TIPO_ENTIDAD_DEFAULT);

  // Lote state
  const [lote, setLote]         = useState<LoteDetalle | null>(null);
  const [historial, setHistorial] = useState<HistorialArchivo[]>([]);
  const [transmisiones, setTransmisiones] = useState<TransmisionSfc[]>([]);

  // File selection (one per insumo)
  const [archivos, setArchivos] = useState<Record<InsumoEnum, File | null>>({
    Credito: null, Atributo: null, Movimiento: null,
  });
  const refCredito    = useRef<HTMLInputElement>(null);
  const refAtributo   = useRef<HTMLInputElement>(null);
  const refMovimiento = useRef<HTMLInputElement>(null);
  const fileRefs: Record<InsumoEnum, RefObject<HTMLInputElement | null>> = {
    Credito: refCredito, Atributo: refAtributo, Movimiento: refMovimiento,
  };

  // Plantilla selection (optional, one per insumo)
  const [plantillasMap, setPlantillasMap] = useState<Record<InsumoEnum, PlantillaCarga[]>>({
    Credito: [], Atributo: [], Movimiento: [],
  });
  const [plantillaIds, setPlantillaIds] = useState<Record<InsumoEnum, number | ''>>(
    { Credito: '', Atributo: '', Movimiento: '' }
  );
  const [cargandoPlantillas, setCargandoPlantillas] = useState(false);

  // UI state
  const [loading, setLoading]               = useState(false);
  const [subiendoInsumo, setSubiendoInsumo] = useState<InsumoEnum | null>(null);
  const [descargandoAvro, setDescargandoAvro] = useState(false);
  const [transmitiendo, setTransmitiendo]   = useState(false);
  const [consultandoTxId, setConsultandoTxId] = useState<number | null>(null);
  const [errores, setErrores]               = useState<string[]>([]);
  const [snackMsg, setSnackMsg]             = useState<string | null>(null);

  // Universalidades
  const { entidades: uRaw, cargando: cargandoUniv } = useEntidades<UniversalidadOData>('/Universalidades');
  const universalidades = useMemo(() =>
    (uRaw ?? [])
      .filter(u => String(u.Estado ?? '').toUpperCase() === 'A')
      .map(u => ({ codigo: String(u.Codigo ?? ''), descripcion: String(u.Descripcion ?? '') }))
      .sort((a, b) => a.codigo.localeCompare(b.codigo)),
    [uRaw]
  );

  // ─── API helpers ─────────────────────────────────────────────────────────────

  const fetchPlantillas = async (codEntidad: number, tipEntidad: number) => {
    setCargandoPlantillas(true);
    try {
      const results = await Promise.all(
        INSUMOS.map(ins =>
          axiosSecurityAPIClient
            .get<PlantillaCarga[]>('/plantillas', {
              params: { insumo: ins.codigo, codigoEntidad: codEntidad, tipoEntidad: tipEntidad, soloActivas: true },
            })
            .then(r => ({ insumo: ins.enum as InsumoEnum, data: r.data }))
        )
      );
      const map: Record<InsumoEnum, PlantillaCarga[]> = { Credito: [], Atributo: [], Movimiento: [] };
      for (const { insumo, data } of results) map[insumo] = data;
      setPlantillasMap(map);
    } catch {
      // plantillas are optional — silently ignore
    } finally {
      setCargandoPlantillas(false);
    }
  };

  const fetchTransmisiones = async (loteId: number) => {
    try {
      const { data } = await axiosSecurityAPIClient.get<TransmisionSfc[]>(
        `/cargas/${loteId}/transmisiones`
      );
      setTransmisiones(data);
    } catch {
      // silently ignore
    }
  };

  const refrescarLote = async (id: number) => {
    const [loteRes, historialRes] = await Promise.all([
      axiosSecurityAPIClient.get<LoteDetalle>(`/cargas/${id}`),
      axiosSecurityAPIClient.get<HistorialArchivo[]>(`/cargas/${id}/historial`),
    ]);
    setLote(loteRes.data);
    setHistorial(historialRes.data);
    if (loteRes.data.estado === 'Promovido') {
      await fetchTransmisiones(id);
    }
  };

  const extractAxiosError = (err: unknown): string => {
    const d = (err as { response?: { data?: unknown } })?.response?.data;
    if (!d) return err instanceof Error ? err.message : 'Error desconocido';
    if (typeof d === 'string') return d;
    const rec = d as Record<string, unknown>;
    const msg = String(rec.mensaje ?? rec.message ?? 'Error desconocido');
    const faltantes = (rec.columnasFaltantes as string[] | undefined) ?? [];
    return faltantes.length ? `${msg} Columnas faltantes: ${faltantes.join(', ')}` : msg;
  };

  // ─── Handlers ────────────────────────────────────────────────────────────────

  const handleCrearLote = async () => {
    setLoading(true);
    setErrores([]);
    try {
      const codEntidad = parseInt(codigoEntidad);
      const { data } = await axiosSecurityAPIClient.post<LoteDetalle>('/cargas', {
        fechaCorte,
        tipoEntidad,
        codigoEntidad: codEntidad,
      });
      setLote(data);
      setSnackMsg(`Lote #${data.id} creado exitosamente.`);
      fetchPlantillas(codEntidad, tipoEntidad);
    } catch (err) {
      setErrores([extractAxiosError(err)]);
    } finally {
      setLoading(false);
    }
  };

  // Uses native fetch so the browser sets the correct multipart boundary automatically.
  const handleSubirArchivo = async (insumo: InsumoEnum) => {
    if (!lote || !archivos[insumo]) return;
    setSubiendoInsumo(insumo);
    setErrores([]);
    try {
      const fd = new FormData();
      fd.append('insumo', insumo);
      fd.append('archivo', archivos[insumo]!);
      if (plantillaIds[insumo] !== '') fd.append('plantillaId', String(plantillaIds[insumo]));

      const token = localStorage.getItem('token');
      const res = await fetch(
        `${import.meta.env.VITE_API_URL_SECURITY}/cargas/${lote.id}/archivos`,
        {
          method: 'POST',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: fd,
        }
      );

      if (!res.ok) {
        const data = await res.json().catch(() => ({})) as Record<string, unknown>;
        const msg = String(data?.mensaje ?? data ?? `Error HTTP ${res.status}`);
        const faltantes = (data?.columnasFaltantes as string[] | undefined) ?? [];
        throw new Error(faltantes.length ? `${msg} Columnas faltantes: ${faltantes.join(', ')}` : msg);
      }

      await refrescarLote(lote.id);
      setSnackMsg('Archivo subido y parseado exitosamente.');
    } catch (err) {
      setErrores([err instanceof Error ? err.message : 'Error al subir el archivo']);
    } finally {
      setSubiendoInsumo(null);
    }
  };

  const handleValidar = async () => {
    if (!lote) return;
    setLoading(true);
    setErrores([]);
    try {
      await axiosSecurityAPIClient.post(`/cargas/${lote.id}/validar`);
      await refrescarLote(lote.id);
      setSnackMsg('Validación completada.');
    } catch (err) {
      setErrores([extractAxiosError(err)]);
    } finally {
      setLoading(false);
    }
  };

  const handlePromover = async () => {
    if (!lote) return;
    setLoading(true);
    setErrores([]);
    try {
      await axiosSecurityAPIClient.post(`/cargas/${lote.id}/promover`);
      await refrescarLote(lote.id);
      setSnackMsg('Lote promovido exitosamente a las tablas MURIC.');
    } catch (err) {
      setErrores([extractAxiosError(err)]);
    } finally {
      setLoading(false);
    }
  };

  const handleAnular = async () => {
    if (!lote) return;
    setLoading(true);
    setErrores([]);
    try {
      await axiosSecurityAPIClient.post(`/cargas/${lote.id}/anular`);
      await refrescarLote(lote.id);
      setSnackMsg('Lote anulado.');
    } catch (err) {
      setErrores([extractAxiosError(err)]);
    } finally {
      setLoading(false);
    }
  };

  const handleDescargarAvro = async () => {
    if (!lote) return;
    setDescargandoAvro(true);
    setErrores([]);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(
        `${import.meta.env.VITE_API_URL_SECURITY}/cargas/${lote.id}/avro`,
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as Record<string, unknown>;
        throw new Error(String(body?.message ?? `Error ${res.status}`));
      }
      const sha256 = res.headers.get('x-sha256') ?? '';
      const blob   = await res.blob();

      // Extraer nombre del header Content-Disposition
      const disposition = res.headers.get('content-disposition') ?? '';
      const match = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(disposition);
      const filename = match?.[1]?.replace(/['"]/g, '') ?? `AVRO_lote${lote.id}.avro.p7z`;

      const url = URL.createObjectURL(blob);
      const a   = document.createElement('a');
      a.href     = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setSnackMsg(sha256
        ? `Descargado: ${filename} — SHA-256: ${sha256.slice(0, 16)}…`
        : `Archivo descargado: ${filename}`);
    } catch (err) {
      setErrores([err instanceof Error ? err.message : 'Error al descargar el archivo AVRO']);
    } finally {
      setDescargandoAvro(false);
    }
  };

  const handleTransmitir = async () => {
    if (!lote) return;
    setTransmitiendo(true);
    setErrores([]);
    try {
      const { data } = await axiosSecurityAPIClient.post<TransmitirResponse>(
        `/cargas/${lote.id}/transmitir`
      );
      setSnackMsg(`Transmisión exitosa — ID SFC: ${data.idTransmisionSfc}`);
      await fetchTransmisiones(lote.id);
    } catch (err) {
      setErrores([extractAxiosError(err)]);
    } finally {
      setTransmitiendo(false);
    }
  };

  const handleConsultarEstado = async (txId: number) => {
    if (!lote) return;
    setConsultandoTxId(txId);
    setErrores([]);
    try {
      await axiosSecurityAPIClient.post(
        `/cargas/${lote.id}/transmisiones/${txId}/consultar`
      );
      await fetchTransmisiones(lote.id);
      setSnackMsg('Estado de transmisión actualizado.');
    } catch (err) {
      setErrores([extractAxiosError(err)]);
    } finally {
      setConsultandoTxId(null);
    }
  };

  const handleReset = () => {
    setLote(null);
    setHistorial([]);
    setTransmisiones([]);
    setArchivos({ Credito: null, Atributo: null, Movimiento: null });
    setPlantillasMap({ Credito: [], Atributo: [], Movimiento: [] });
    setPlantillaIds({ Credito: '', Atributo: '', Movimiento: '' });
    setErrores([]);
    setCodigoEntidad('');
    setFechaCorte(getLastDayOfPreviousMonth());
  };

  // ─── Derived state ────────────────────────────────────────────────────────────

  const canUpload    = !!lote && ['Iniciado', 'Parseado'].includes(lote.estado);
  const canValidar   = !!lote && ['Parseado', 'Validado'].includes(lote.estado);
  const canPromover  = !!lote && lote.estado === 'Validado';
  const canAnular    = !!lote && ['Iniciado', 'Parseado', 'Validado', 'Fallido'].includes(lote.estado);
  const canTransmitir = !!lote && lote.estado === 'Promovido';
  const isBusy       = loading || subiendoInsumo !== null || transmitiendo || descargandoAvro;

  // ─── Render ───────────────────────────────────────────────────────────────────

  return (
    <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>

      {/* ── Header ── */}
      <Paper sx={{ p: 2 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Typography variant="h6" fontWeight={700}>
              Cargue de archivos MURIC
            </Typography>
            {lote && (
              <Chip label={`Lote #${lote.id}`} size="small" variant="outlined" color="primary" />
            )}
            {lote && (
              <Chip
                label={lote.estado}
                size="small"
                color={ESTADO_COLOR[lote.estado] ?? 'default'}
              />
            )}
          </Stack>
          <Tooltip title="Reiniciar">
            <IconButton size="small" onClick={handleReset}>
              <RestartAltIcon />
            </IconButton>
          </Tooltip>
        </Stack>
      </Paper>

      {/* ── Step 1: Configuración del lote / resumen ── */}
      <Paper sx={{ p: 2 }}>
        {!lote ? (
          <>
            <Typography variant="subtitle1" fontWeight={600} mb={2}>
              1. Configuración del lote
            </Typography>
            <Grid container spacing={2} alignItems="flex-end">
              <Grid size={2}>
                <TextField
                  label="Fecha de corte"
                  type="date"
                  fullWidth
                  value={fechaCorte}
                  onChange={e => setFechaCorte(e.target.value)}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              </Grid>
              <Grid size={4}>
                <FormControl fullWidth disabled={cargandoUniv || loading}>
                  <InputLabel>Universalidad</InputLabel>
                  <Select
                    value={codigoEntidad}
                    label="Universalidad"
                    onChange={e => setCodigoEntidad(e.target.value)}
                  >
                    {universalidades.map(u => (
                      <MenuItem key={u.codigo} value={u.codigo}>
                        {u.codigo} — {u.descripcion}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={1.5}>
                <TextField
                  label="Tipo entidad"
                  type="number"
                  fullWidth
                  value={tipoEntidad}
                  onChange={e => setTipoEntidad(Number(e.target.value))}
                  slotProps={{ htmlInput: { min: 1 } }}
                />
              </Grid>
              <Grid size={2}>
                <Button
                  variant="contained"
                  size="large"
                  onClick={handleCrearLote}
                  disabled={!fechaCorte || !codigoEntidad || loading}
                >
                  Crear lote
                </Button>
              </Grid>
            </Grid>
          </>
        ) : (
          <>
            <Typography variant="subtitle1" fontWeight={600} mb={1.5}>
              Información del lote
            </Typography>
            <Grid container spacing={2}>
              <Grid size={2}>
                <Typography variant="caption" color="text.secondary">Fecha de corte</Typography>
                <Typography variant="body2">{lote.fechaCorte}</Typography>
              </Grid>
              <Grid size={1.5}>
                <Typography variant="caption" color="text.secondary">Tipo entidad</Typography>
                <Typography variant="body2">{lote.tipoEntidad}</Typography>
              </Grid>
              <Grid size={1.5}>
                <Typography variant="caption" color="text.secondary">Código entidad</Typography>
                <Typography variant="body2">{lote.codigoEntidad}</Typography>
              </Grid>
              <Grid size={2}>
                <Typography variant="caption" color="text.secondary">Creado por</Typography>
                <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>{lote.usuarioCreador}</Typography>
              </Grid>
              <Grid size={3}>
                <Typography variant="caption" color="text.secondary">Filas parseadas (001 / 002 / 003)</Typography>
                <Typography variant="body2">
                  {lote.conteos?.creditos ?? 0} / {lote.conteos?.atributos ?? 0} / {lote.conteos?.movimientos ?? 0}
                </Typography>
              </Grid>
              {(lote.resumenErrores?.total ?? 0) > 0 && (
                <Grid size={2}>
                  <Typography variant="caption" color="text.secondary">Errores / Advertencias</Typography>
                  <Typography variant="body2" color="error.main">
                    {lote.resumenErrores?.errores} / {lote.resumenErrores?.advertencias}
                  </Typography>
                </Grid>
              )}
            </Grid>
          </>
        )}
      </Paper>

      {/* ── Step 2: Carga de archivos ── */}
      {lote && (
        <Paper sx={{ p: 2 }}>
          <Typography variant="subtitle1" fontWeight={600} mb={1.5}>
            2. Carga de archivos
          </Typography>
          <Stack spacing={2}>
            {INSUMOS.map(ins => {
              const insumo   = ins.enum as InsumoEnum;
              const archivo  = archivos[insumo];
              const subiendo = subiendoInsumo === insumo;
              const yaSubido = historial.some(h => h.insumo === ins.codigo);
              const plantillas = plantillasMap[insumo];
              return (
                <Box key={ins.enum}>
                  <input
                    ref={fileRefs[insumo]}
                    type="file"
                    accept=".csv,.txt,.xlsx,.xls"
                    style={{ display: 'none' }}
                    onChange={e => {
                      const f = e.target.files?.[0] ?? null;
                      setArchivos(prev => ({ ...prev, [insumo]: f }));
                      e.target.value = '';
                    }}
                  />
                  <Stack direction="row" spacing={1.5} alignItems="center" mb={0.5}>
                    <Chip
                      label={ins.codigo}
                      size="small"
                      variant="outlined"
                      color="primary"
                      sx={{ minWidth: 72 }}
                    />
                    <Typography variant="body2" sx={{ minWidth: 290 }}>{ins.label}</Typography>
                    {yaSubido && !subiendo && <CheckCircleOutlineIcon color="success" fontSize="small" />}
                  </Stack>
                  <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" pl={1}>
                    <FormControl size="small" sx={{ minWidth: 220 }} disabled={!canUpload || isBusy || cargandoPlantillas}>
                      <InputLabel id={`plantilla-${insumo}-label`}>Plantilla (opcional)</InputLabel>
                      <Select
                        labelId={`plantilla-${insumo}-label`}
                        label="Plantilla (opcional)"
                        value={plantillaIds[insumo]}
                        onChange={e => setPlantillaIds(prev => ({ ...prev, [insumo]: e.target.value as number | '' }))}
                      >
                        <MenuItem value=""><em>Sin plantilla</em></MenuItem>
                        {plantillas.map(p => (
                          <MenuItem key={p.id} value={p.id}>
                            {p.nombre}
                            <Typography component="span" variant="caption" color="text.secondary" ml={0.5}>
                              ({p.campos?.length} campos)
                            </Typography>
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<CloudUploadOutlinedIcon />}
                      onClick={() => fileRefs[insumo].current?.click()}
                      disabled={!canUpload || isBusy}
                    >
                      Seleccionar archivo
                    </Button>
                    <Typography variant="caption" color="text.secondary" sx={{ minWidth: 180 }}>
                      {archivo ? archivo.name : 'Sin archivo'}
                    </Typography>
                    <Button
                      size="small"
                      variant="contained"
                      startIcon={<PublishIcon />}
                      onClick={() => handleSubirArchivo(insumo)}
                      disabled={!archivo || !canUpload || isBusy}
                    >
                      {subiendo ? 'Subiendo…' : 'Subir'}
                    </Button>
                    {subiendo && <LinearProgress sx={{ width: 80 }} />}
                  </Stack>
                </Box>
              );
            })}
          </Stack>
        </Paper>
      )}

      {/* ── Step 3: Validación y promoción ── */}
      {lote && (
        <Paper sx={{ p: 2 }}>
          <Typography variant="subtitle1" fontWeight={600} mb={1.5}>
            3. Validación y promoción
          </Typography>
          <Stack direction="row" spacing={1.5} flexWrap="wrap">
            <Button
              variant="outlined"
              startIcon={<VerifiedIcon />}
              onClick={handleValidar}
              disabled={!canValidar || isBusy}
            >
              Validar lote
            </Button>
            <Button
              variant="contained"
              color="success"
              startIcon={<CheckCircleOutlineIcon />}
              onClick={handlePromover}
              disabled={!canPromover || isBusy}
            >
              Promover a MURIC
            </Button>
            <Button
              variant="outlined"
              color="error"
              startIcon={<BlockIcon />}
              onClick={handleAnular}
              disabled={!canAnular || isBusy}
            >
              Anular lote
            </Button>
          </Stack>
        </Paper>
      )}

      {/* ── Step 4: Transmisión a la SFC ── */}
      {canTransmitir && (
        <Paper sx={{ p: 2 }}>
          <Typography variant="subtitle1" fontWeight={600} mb={1.5}>
            4. Transmisión a la SFC
          </Typography>
          <Stack direction="row" spacing={1.5} alignItems="center" mb={transmitiendo ? 1.5 : 0}>
            <Button
              variant="outlined"
              startIcon={<FileDownloadIcon />}
              onClick={handleDescargarAvro}
              disabled={isBusy}
            >
              {descargandoAvro ? 'Generando…' : 'Descargar AVRO (.avro.p7z)'}
            </Button>
            <Button
              variant="contained"
              color="primary"
              startIcon={<SendIcon />}
              onClick={handleTransmitir}
              disabled={isBusy}
            >
              {transmitiendo ? 'Transmitiendo…' : 'Transmitir a SFC'}
            </Button>
          </Stack>
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
                      <TableCell align="center">Acciones</TableCell>
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
                        <TableCell align="center">
                          <Tooltip title="Consultar estado en SFC">
                            <span>
                              <IconButton
                                size="small"
                                onClick={() => handleConsultarEstado(tx.id)}
                                disabled={consultandoTxId === tx.id || isBusy}
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
            </Box>
          )}
        </Paper>
      )}

      {/* ── Loading bar ── */}
      {(loading || (subiendoInsumo !== null)) && <LinearProgress />}

      {/* ── Error display ── */}
      {errores.length > 0 && (
        <Alert severity="error" onClose={() => setErrores([])}>
          <ul style={{ margin: 0, paddingLeft: 16 }}>
            {errores.map((e, i) => <li key={i}>{e}</li>)}
          </ul>
        </Alert>
      )}

      {/* ── Historial de archivos ── */}
      {historial.length > 0 && (
        <Paper sx={{ p: 2 }}>
          <Typography variant="subtitle1" fontWeight={600} mb={1.5}>
            Historial de archivos cargados
          </Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Insumo</TableCell>
                  <TableCell>Archivo</TableCell>
                  <TableCell align="right">Filas parseadas</TableCell>
                  <TableCell>Resultado</TableCell>
                  <TableCell>Fecha carga</TableCell>
                  <TableCell>Usuario</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {historial.map(h => (
                  <TableRow key={h.id}>
                    <TableCell>
                      <Chip label={h.insumo} size="small" variant="outlined" color="primary" />
                    </TableCell>
                    <TableCell>{h.nombreArchivo}</TableCell>
                    <TableCell align="right">{h.filasParseadas ?? '—'}</TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={0.5} alignItems="center">
                        {h.resultado === 'Ok'
                          ? <CheckCircleOutlineIcon color="success" fontSize="small" />
                          : <ErrorOutlineIcon color="error" fontSize="small" />
                        }
                        <Typography variant="caption">
                          {h.mensajeResultado ?? h.resultado}
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>{new Date(h.fechaCarga).toLocaleString('es-CO')}</TableCell>
                    <TableCell>{h.usuarioCarga}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* ── Success snackbar ── */}
      <Snackbar
        open={!!snackMsg}
        autoHideDuration={5000}
        onClose={() => setSnackMsg(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" onClose={() => setSnackMsg(null)} variant="filled">
          {snackMsg}
        </Alert>
      </Snackbar>
    </Box>
  );
}
