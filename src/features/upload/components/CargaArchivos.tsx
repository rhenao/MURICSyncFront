import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Chip,
  LinearProgress,
  Paper,
  Snackbar,
  Stack,
  Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import axiosSecurityAPIClient from '../../../api/axiosSecurityAPIClient';
import { fetchConToken } from '../../../api/fetchConToken';
import {
  insumosGeneradosTodos,
  type InsumoMURIC,
  type PlantillaResumen,
} from '../models/Plantilla.model';
import PlantillaService from '../services/PlantillaService';
import { ESTADO_LOTE_COLOR, ESTADOS_ACTIVOS, type LoteResumen } from '../models/Lote.model';
import {
  INSUMOS,
  type HistorialArchivo,
  type InsumoEnum,
  type TransmisionSfc,
  type TransmitirResponse,
} from './cargue/tiposCargue';
import FormNuevoLote from './cargue/FormNuevoLote';
import ResumenLote from './cargue/ResumenLote';
import PanelArchivos from './cargue/PanelArchivos';
import PanelAcciones from './cargue/PanelAcciones';
import PanelTransmision from './cargue/PanelTransmision';
import HistorialArchivos from './cargue/HistorialArchivos';
import DialogConfirmarAccion from './cargue/DialogConfirmarAccion';
import useAuth from '../../auth/hooks/useAuth';

const extractAxiosError = (err: unknown): string => {
  const d = (err as { response?: { data?: unknown } })?.response?.data;
  if (!d) return err instanceof Error ? err.message : 'Error desconocido';
  if (typeof d === 'string') return d;
  const rec = d as Record<string, unknown>;
  const msg = String(rec.mensaje ?? rec.message ?? 'Error desconocido');
  const faltantes = (rec.columnasFaltantes as string[] | undefined) ?? [];
  return faltantes.length ? `${msg} Columnas faltantes: ${faltantes.join(', ')}` : msg;
};

const respuestaDe = (err: unknown) =>
  (err as { response?: { status?: number; data?: unknown } })?.response;

// Estados en los que se pueden subir archivos (en Validado el lote vuelve a Parseado).
const ESTADOS_CON_SUBIDA = ['Iniciado', 'Parseado', 'Validado'];

// Orquesta el ciclo de vida del lote: crear → subir → validar → promover → AVRO / transmitir, o anular.
// El estado y las llamadas al API viven aquí; los paneles de ./cargue solo pintan.
// /app/carga-archivos crea un lote nuevo; /app/carga-archivos/:id abre uno existente.
export default function CargaArchivos() {
  const { id: idParam } = useParams();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  // Sin cargas.write la pantalla es de consulta: un 403 del API cierra la sesión.
  const canWrite = hasPermission('cargas.write');

  // Lote state
  const [lote, setLote]         = useState<LoteResumen | null>(null);
  const [historial, setHistorial] = useState<HistorialArchivo[]>([]);
  const [transmisiones, setTransmisiones] = useState<TransmisionSfc[]>([]);

  // File selection (one per insumo)
  const [archivos, setArchivos] = useState<Record<InsumoEnum, File | null>>({
    Credito: null, Atributo: null, Movimiento: null, Todos: null,
  });

  // Plantilla selection (optional, one per insumo)
  const [plantillasMap, setPlantillasMap] = useState<Record<InsumoEnum, PlantillaResumen[]>>({
    Credito: [], Atributo: [], Movimiento: [], Todos: [],
  });
  const [plantillaIds, setPlantillaIds] = useState<Record<InsumoEnum, number | ''>>(
    { Credito: '', Atributo: '', Movimiento: '', Todos: '' }
  );
  // N2: slots con datos que un archivo 001-999 va a reemplazar, pendientes de confirmar.
  const [confirmarTodos, setConfirmarTodos] = useState<InsumoMURIC[] | null>(null);
  const [cargandoPlantillas, setCargandoPlantillas] = useState(false);

  // UI state
  const [loading, setLoading]               = useState(false);
  const [subiendoInsumo, setSubiendoInsumo] = useState<InsumoEnum | null>(null);
  const [descargandoAvro, setDescargandoAvro] = useState(false);
  const [transmitiendo, setTransmitiendo]   = useState(false);
  const [consultandoTxId, setConsultandoTxId] = useState<number | null>(null);
  const [errores, setErrores]               = useState<string[]>([]);
  const [snackMsg, setSnackMsg]             = useState<string | null>(null);
  const [cargandoLote, setCargandoLote]     = useState(false);
  const [noEncontrado, setNoEncontrado]     = useState(false);
  // 409 al crear: ya hay un lote activo para ese corte y universalidad.
  const [loteExistente, setLoteExistente]   = useState<number | null>(null);
  // Al crear con un lote promovido del mismo corte; se muestra mientras ese lote siga abierto.
  const [advertencia, setAdvertencia]       = useState<{ loteId: number; texto: string } | null>(null);
  const [confirmarAccion, setConfirmarAccion] = useState<'promover' | 'anular' | null>(null);

  // ─── API helpers ─────────────────────────────────────────────────────────────

  // Las plantillas son globales: no dependen de la universalidad del lote.
  const fetchPlantillas = useCallback(async () => {
    setCargandoPlantillas(true);
    try {
      const results = await Promise.all(
        INSUMOS.map(ins =>
          PlantillaService
            .listar({ insumo: ins.codigo, soloActivas: true })
            .then(data => ({ insumo: ins.enum as InsumoEnum, data }))
        )
      );
      const map: Record<InsumoEnum, PlantillaResumen[]> = { Credito: [], Atributo: [], Movimiento: [], Todos: [] };
      for (const { insumo, data } of results) map[insumo] = data;
      setPlantillasMap(map);
    } catch {
      // plantillas are optional — silently ignore
    } finally {
      setCargandoPlantillas(false);
    }
  }, []);

  const fetchTransmisiones = useCallback(async (loteId: number) => {
    try {
      const { data } = await axiosSecurityAPIClient.get<TransmisionSfc[]>(
        `/cargas/${loteId}/transmisiones`
      );
      setTransmisiones(data);
    } catch {
      // silently ignore
    }
  }, []);

  const refrescarLote = useCallback(async (id: number) => {
    const [loteRes, historialRes] = await Promise.all([
      axiosSecurityAPIClient.get<LoteResumen>(`/cargas/${id}`),
      axiosSecurityAPIClient.get<HistorialArchivo[]>(`/cargas/${id}/historial`),
    ]);
    setLote(loteRes.data);
    setHistorial(historialRes.data);
    if (loteRes.data.estado === 'Promovido') {
      await fetchTransmisiones(id);
    }
  }, [fetchTransmisiones]);

  const handleReset = useCallback(() => {
    setLote(null);
    setHistorial([]);
    setTransmisiones([]);
    setArchivos({ Credito: null, Atributo: null, Movimiento: null, Todos: null });
    setPlantillasMap({ Credito: [], Atributo: [], Movimiento: [], Todos: [] });
    setPlantillaIds({ Credito: '', Atributo: '', Movimiento: '', Todos: '' });
    setConfirmarTodos(null);
    setConfirmarAccion(null);
    setErrores([]);
    setLoteExistente(null);
    setNoEncontrado(false);
  }, []);

  // El lote sale de la URL: al abrirlo desde la lista, al crearlo o al recargar la página.
  useEffect(() => {
    if (!idParam) {
      handleReset();
      return;
    }
    const id = Number(idParam);
    if (id === lote?.id) return;
    if (!Number.isInteger(id)) {
      handleReset();
      setNoEncontrado(true);
      return;
    }
    (async () => {
      handleReset();
      setCargandoLote(true);
      try {
        await refrescarLote(id);
        if (canWrite) fetchPlantillas();
      } catch (err) {
        if (respuestaDe(err)?.status === 404) setNoEncontrado(true);
        else setErrores([extractAxiosError(err)]);
      } finally {
        setCargandoLote(false);
      }
    })();
  }, [idParam, lote?.id, canWrite, refrescarLote, fetchPlantillas, handleReset]);

  // ─── Handlers ────────────────────────────────────────────────────────────────

  const handleCrearLote = async (fechaCorte: string, universalidadCodigo: number, observaciones: string | null) => {
    setLoading(true);
    setErrores([]);
    setLoteExistente(null);
    try {
      const { data } = await axiosSecurityAPIClient.post<LoteResumen & { advertencia?: string }>('/cargas', {
        fechaCorte,
        universalidadCodigo,
        observaciones,
      });
      if (data.advertencia) setAdvertencia({ loteId: data.id, texto: data.advertencia });
      setSnackMsg(`Lote #${data.id} creado exitosamente.`);
      // La URL del lote hace que una recarga de la página no lo pierda; el efecto lo carga.
      navigate(`/app/carga-archivos/${data.id}`, { replace: true });
    } catch (err) {
      setErrores([extractAxiosError(err)]);
      const res = respuestaDe(err);
      const existente = (res?.data as { loteIdExistente?: unknown } | undefined)?.loteIdExistente;
      if (res?.status === 409 && typeof existente === 'number') setLoteExistente(existente);
    } finally {
      setLoading(false);
    }
  };

  const handleSubirArchivo = async (insumo: InsumoEnum) => {
    if (insumo === 'Todos') await prepararSubidaTodos();
    else await subirArchivo(insumo);
  };

  // N2: el archivo 001-999 reemplaza los slots que genera su plantilla; si ya tienen datos, se confirma antes.
  const prepararSubidaTodos = async () => {
    if (!lote || !archivos.Todos || plantillaIds.Todos === '') return;
    setErrores([]);
    try {
      const plantilla = await PlantillaService.obtener(plantillaIds.Todos);
      const generados = insumosGeneradosTodos(plantilla.campos);
      const filasPorSlot: Record<string, number> = {
        '001-001': lote.conteos?.creditos ?? 0,
        '001-002': lote.conteos?.atributos ?? 0,
        '001-003': lote.conteos?.movimientos ?? 0,
      };
      const conDatos = generados.filter(
        ins => filasPorSlot[ins] > 0 || historial.some(h => h.insumo === ins && h.resultado === 'Exitoso')
      );
      if (conDatos.length > 0) setConfirmarTodos(conDatos);
      else await subirArchivo('Todos');
    } catch (err) {
      setErrores([extractAxiosError(err)]);
    }
  };

  // Uses native fetch so the browser sets the correct multipart boundary automatically.
  const subirArchivo = async (insumo: InsumoEnum) => {
    if (!lote || !archivos[insumo]) return;
    setSubiendoInsumo(insumo);
    setErrores([]);
    try {
      const fd = new FormData();
      fd.append('insumo', insumo);
      fd.append('archivo', archivos[insumo]!);
      if (plantillaIds[insumo] !== '') fd.append('plantillaId', String(plantillaIds[insumo]));

      const res = await fetchConToken(`/cargas/${lote.id}/archivos`, { method: 'POST', body: fd });

      if (!res.ok) {
        const data = await res.json().catch(() => ({})) as Record<string, unknown>;
        const msg = String(data?.mensaje ?? data ?? `Error HTTP ${res.status}`);
        const faltantes = (data?.columnasFaltantes as string[] | undefined) ?? [];
        throw new Error(faltantes.length ? `${msg} Columnas faltantes: ${faltantes.join(', ')}` : msg);
      }

      if (insumo === 'Todos') {
        // 001-999 responde un historial por slot llenado.
        const llenados = ((await res.json().catch(() => [])) as HistorialArchivo[]).map(h => h.insumo);
        await refrescarLote(lote.id);
        setSnackMsg(`Archivo 001-999 cargado. Llenó: ${llenados.join(', ') || '—'}.`);
      } else {
        await refrescarLote(lote.id);
        setSnackMsg('Archivo subido y parseado exitosamente.');
      }
    } catch (err) {
      setErrores([err instanceof Error ? err.message : 'Error al subir el archivo']);
      // El backend registra el intento fallido en el historial; se refresca para mostrarlo.
      await refrescarLote(lote.id).catch(() => {});
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
      const res = await fetchConToken(`/cargas/${lote.id}/avro`);
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

  // ─── Derived state ────────────────────────────────────────────────────────────

  const canUpload    = !!lote && ESTADOS_CON_SUBIDA.includes(lote.estado);
  const canValidar   = !!lote && ['Parseado', 'Validado'].includes(lote.estado);
  const canPromover  = !!lote && lote.estado === 'Validado';
  const canAnular    = !!lote && (ESTADOS_ACTIVOS as string[]).includes(lote.estado);
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
                color={ESTADO_LOTE_COLOR[lote.estado] ?? 'default'}
              />
            )}
          </Stack>
          <Button size="small" startIcon={<ArrowBackIcon />} onClick={() => navigate('/app/lotes-carga')}>
            Volver a la lista
          </Button>
        </Stack>
      </Paper>

      {cargandoLote && <LinearProgress />}

      {noEncontrado && (
        <Alert severity="warning">El lote #{idParam} no existe.</Alert>
      )}

      {/* ── Step 1: Configuración del lote / resumen ── */}
      {lote ? (
        <Paper sx={{ p: 2 }}>
          <ResumenLote lote={lote} />
        </Paper>
      ) : !idParam && (
        <Paper sx={{ p: 2 }}>
          {canWrite
            ? <FormNuevoLote loading={loading} onCrear={handleCrearLote} />
            : <Alert severity="info">No tiene permiso para crear lotes. Puede consultarlos en la lista.</Alert>}
        </Paper>
      )}

      {lote && advertencia?.loteId === lote.id && (
        <Alert severity="warning" onClose={() => setAdvertencia(null)}>{advertencia.texto}</Alert>
      )}

      {lote && !canWrite && (
        <Alert severity="info">Solo consulta: no tiene permiso para modificar lotes.</Alert>
      )}

      {/* ── Step 2: Carga de archivos ── */}
      {lote && canWrite && (
        <PanelArchivos
          archivos={archivos}
          plantillasMap={plantillasMap}
          plantillaIds={plantillaIds}
          historial={historial}
          subiendoInsumo={subiendoInsumo}
          canUpload={canUpload}
          aviso={lote.estado === 'Validado'
            ? 'El lote ya está validado. Si sube un archivo, vuelve a Parseado y hay que validarlo de nuevo.'
            : undefined}
          isBusy={isBusy}
          cargandoPlantillas={cargandoPlantillas}
          onArchivo={(insumo, f) => setArchivos(prev => ({ ...prev, [insumo]: f }))}
          onPlantilla={(insumo, id) => setPlantillaIds(prev => ({ ...prev, [insumo]: id }))}
          onSubir={handleSubirArchivo}
          confirmarTodos={confirmarTodos}
          onCancelarTodos={() => setConfirmarTodos(null)}
          onConfirmarTodos={() => {
            setConfirmarTodos(null);
            subirArchivo('Todos');
          }}
        />
      )}

      {/* ── Step 3: Validación y promoción ── */}
      {lote && canWrite && (
        <PanelAcciones
          canValidar={canValidar}
          canPromover={canPromover}
          canAnular={canAnular}
          isBusy={isBusy}
          onValidar={handleValidar}
          onPromover={() => setConfirmarAccion('promover')}
          onAnular={() => setConfirmarAccion('anular')}
        />
      )}

      {/* Promover y anular no se pueden deshacer (A1). */}
      <DialogConfirmarAccion
        open={confirmarAccion === 'promover'}
        titulo={`Promover el lote #${lote?.id ?? ''}`}
        mensaje="Los créditos, atributos y movimientos del lote pasan a las tablas MURIC. Esta acción no se puede deshacer."
        textoConfirmar="Promover"
        color="success"
        onCancelar={() => setConfirmarAccion(null)}
        onConfirmar={() => {
          setConfirmarAccion(null);
          handlePromover();
        }}
      />
      <DialogConfirmarAccion
        open={confirmarAccion === 'anular'}
        titulo={`Anular el lote #${lote?.id ?? ''}`}
        mensaje="El lote queda anulado: ya no se puede modificar, validar ni promover. Esta acción no se puede deshacer."
        textoConfirmar="Anular"
        color="error"
        onCancelar={() => setConfirmarAccion(null)}
        onConfirmar={() => {
          setConfirmarAccion(null);
          handleAnular();
        }}
      />

      {/* ── Step 4: Transmisión a la SFC ── */}
      {canTransmitir && (
        <PanelTransmision
          transmisiones={transmisiones}
          descargandoAvro={descargandoAvro}
          transmitiendo={transmitiendo}
          consultandoTxId={consultandoTxId}
          isBusy={isBusy}
          soloLectura={!canWrite}
          onDescargarAvro={handleDescargarAvro}
          onTransmitir={handleTransmitir}
          onConsultarEstado={handleConsultarEstado}
        />
      )}

      {/* ── Loading bar ── */}
      {(loading || (subiendoInsumo !== null)) && <LinearProgress />}

      {/* ── Error display ── */}
      {errores.length > 0 && (
        <Alert
          severity="error"
          onClose={() => { setErrores([]); setLoteExistente(null); }}
          action={loteExistente !== null && (
            <Button color="inherit" size="small" onClick={() => navigate(`/app/carga-archivos/${loteExistente}`)}>
              Abrir lote #{loteExistente}
            </Button>
          )}
        >
          <ul style={{ margin: 0, paddingLeft: 16 }}>
            {errores.map((e, i) => <li key={i}>{e}</li>)}
          </ul>
        </Alert>
      )}

      {/* ── Historial de archivos ── */}
      {historial.length > 0 && <HistorialArchivos historial={historial} />}

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
