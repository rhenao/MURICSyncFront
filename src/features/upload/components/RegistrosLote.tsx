import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  MaterialReactTable,
  type MRT_ColumnDef,
  type MRT_PaginationState,
} from 'material-react-table';
import {
  Alert,
  Box,
  Button,
  Card,
  Chip,
  FormControlLabel,
  Stack,
  Switch,
  Tab,
  Tabs,
  Tooltip,
  Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import {
  ESTADO_LOTE_COLOR,
  type FilaRegistro,
  type InsumoRegistros,
  type LoteResumen,
  type RegistrosLote as RegistrosLoteData,
} from '../models/Lote.model';
import LoteService, { queryExportarRegistros } from '../services/LoteService';
import { fetchConToken } from '../../../api/fetchConToken';
import { cardSx } from '../../param/shared/tableStyles';
import { extractBackendErrors } from '../../../utils/extractBackendErrors';

const INSUMOS: { insumo: InsumoRegistros; label: string; conteo: (l: LoteResumen) => number }[] = [
  { insumo: '001-001', label: 'Créditos (001-001)', conteo: l => l.conteos?.creditos ?? 0 },
  { insumo: '001-002', label: 'Atributos (001-002)', conteo: l => l.conteos?.atributos ?? 0 },
  { insumo: '001-003', label: 'Movimientos (001-003)', conteo: l => l.conteos?.movimientos ?? 0 },
];

const PAGINA_INICIAL: MRT_PaginationState = { pageIndex: 0, pageSize: 50 };

/**
 * Registros cargados (staging) de un lote, en cualquier estado: una pestaña por insumo, paginación, búsqueda y
 * exportación en el servidor, y filas y celdas con errores de validación marcadas. Los atributos van en columnas,
 * una fila por crédito. Plan: docs/prompts/plan-registros-lote.md.
 */
export default function RegistrosLote() {
  const { id } = useParams();
  const loteId = Number(id);
  const navigate = useNavigate();

  const [lote, setLote] = useState<LoteResumen | null>(null);
  const [insumo, setInsumo] = useState<InsumoRegistros>('001-001');
  const [paginacion, setPaginacion] = useState<MRT_PaginationState>(PAGINA_INICIAL);
  const [buscar, setBuscar] = useState('');
  const [soloConErrores, setSoloConErrores] = useState(false);
  const [datos, setDatos] = useState<RegistrosLoteData | null>(null);
  const [cargando, setCargando] = useState(false);
  const [exportando, setExportando] = useState(false);
  const [falla, setFalla] = useState<string | null>(null);

  useEffect(() => {
    let activo = true;
    LoteService.obtener(loteId)
      .then(l => { if (activo) setLote(l); })
      .catch(err => { if (activo) setFalla(extractBackendErrors(err, 'No se pudo cargar el lote.').join(' ')); });
    return () => { activo = false; };
  }, [loteId]);

  useEffect(() => {
    let activo = true;
    setCargando(true);
    setFalla(null);
    LoteService.registros(loteId, {
      insumo,
      pagina: paginacion.pageIndex + 1,
      tamano: paginacion.pageSize,
      buscar: buscar.trim() || undefined,
      soloConErrores: soloConErrores || undefined,
    })
      .then(d => { if (activo) setDatos(d); })
      .catch(err => { if (activo) setFalla(extractBackendErrors(err, 'No se pudieron cargar los registros.').join(' ')); })
      .finally(() => { if (activo) setCargando(false); });
    return () => { activo = false; };
  }, [loteId, insumo, paginacion, buscar, soloConErrores]);

  // Las columnas vienen del backend: en atributos dependen de las claves que trae el lote.
  const columnas = useMemo<MRT_ColumnDef<FilaRegistro>[]>(
    () =>
      (datos?.columnas ?? []).map(col => ({
        id: col.campo,
        header: col.titulo,
        accessorFn: fila => fila.valores?.[col.campo] ?? '',
        size: col.campo === 'fila' ? 70 : 170,
        Cell: ({ row }) => {
          const valor = row.original.valores?.[col.campo];
          const errores = (row.original.errores ?? []).filter(e => e.campo === col.campo);
          if (errores.length === 0) return valor ?? '';
          const esError = errores.some(e => e.severidad === 'Error');
          return (
            <Tooltip title={errores.map(e => `${e.codigoRegla}: ${e.mensaje}`).join(' · ')}>
              <Box
                component="span"
                sx={{
                  px: 0.5,
                  borderRadius: 0.5,
                  color: esError ? 'error.main' : 'warning.dark',
                  bgcolor: esError ? 'rgba(211, 47, 47, 0.08)' : 'rgba(237, 108, 2, 0.08)',
                  fontWeight: 600,
                }}
              >
                {valor ?? <em>(vacío)</em>}
              </Box>
            </Tooltip>
          );
        },
      })),
    [datos?.columnas]
  );

  const cambiarInsumo = (nuevo: InsumoRegistros) => {
    setInsumo(nuevo);
    setDatos(null); // las columnas cambian con el insumo
    setPaginacion(p => ({ ...p, pageIndex: 0 }));
  };

  const exportar = async () => {
    setExportando(true);
    setFalla(null);
    try {
      const query = queryExportarRegistros({ insumo, buscar: buscar.trim() || undefined, soloConErrores });
      const res = await fetchConToken(`/cargas/${loteId}/registros/exportar?${query}`);
      if (!res.ok) throw new Error(`Error ${res.status} al exportar los registros.`);
      const url = URL.createObjectURL(await res.blob());
      const a = document.createElement('a');
      a.href = url;
      a.download = `registros-lote-${loteId}-${insumo}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setFalla(err instanceof Error ? err.message : 'No se pudieron exportar los registros.');
    } finally {
      setExportando(false);
    }
  };

  const conErrores = (lote?.resumenErrores?.total ?? 0) > 0;

  return (
    <Card sx={cardSx}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1} mb={1}>
        <Stack direction="row" alignItems="center" gap={1} flexWrap="wrap">
          <Typography variant="h6" fontWeight={700}>
            Registros del lote #{loteId}
          </Typography>
          {lote && (
            <>
              <Chip label={lote.estado} size="small" color={ESTADO_LOTE_COLOR[lote.estado] ?? 'default'} />
              <Typography variant="body2" color="text.secondary">
                Corte {lote.fechaCorte} · Universalidad {lote.universalidadCodigo}
                {lote.universalidadDescripcion ? ` — ${lote.universalidadDescripcion}` : ''}
              </Typography>
            </>
          )}
        </Stack>
        <Stack direction="row" gap={1}>
          <Button size="small" startIcon={<ArrowBackIcon />} onClick={() => navigate('/app/lotes-carga')}>
            Lotes de carga
          </Button>
          <Button size="small" startIcon={<OpenInNewIcon />} onClick={() => navigate(`/app/carga-archivos/${loteId}`)}>
            Abrir lote
          </Button>
        </Stack>
      </Stack>

      <Alert severity="info" sx={{ mb: 1 }}>
        Se muestran los valores tal como vinieron en el archivo, sin aplicar las equivalencias de carga. Los valores con
        error de validación se marcan en rojo (advertencias en naranja); pase el mouse para ver el detalle.
      </Alert>
      {falla && <Alert severity="error" sx={{ mb: 1 }}>{falla}</Alert>}

      <Tabs value={insumo} onChange={(_, v) => cambiarInsumo(v)} sx={{ mb: 1 }}>
        {INSUMOS.map(i => (
          <Tab key={i.insumo} value={i.insumo} label={lote ? `${i.label} · ${i.conteo(lote).toLocaleString('es-CO')}` : i.label} />
        ))}
      </Tabs>

      <MaterialReactTable
        columns={columnas}
        data={datos?.filas ?? []}
        // Mientras carga, la tabla usa filas esqueleto sin numerosFila ni valores: se identifican por posición.
        getRowId={(fila, indice) =>
          fila.numerosFila?.length ? fila.numerosFila.join('-') : `fila-${indice}`
        }
        rowCount={datos?.total ?? 0}
        manualPagination
        manualFiltering
        onPaginationChange={setPaginacion}
        onGlobalFilterChange={valor => {
          setBuscar(valor ?? '');
          setPaginacion(p => ({ ...p, pageIndex: 0 }));
        }}
        state={{ pagination: paginacion, globalFilter: buscar, isLoading: cargando && !datos, showProgressBars: cargando }}
        muiPaginationProps={{ rowsPerPageOptions: [25, 50, 100, 200] }}
        enableGlobalFilter
        positionGlobalFilter="left"
        muiSearchTextFieldProps={{ placeholder: 'Buscar crédito o identificación', sx: { minWidth: 280 } }}
        enableSorting={false}
        enableColumnActions={false}
        enableColumnFilters={false}
        enableDensityToggle={false}
        enableFullScreenToggle={false}
        enableStickyHeader
        muiTableProps={{ size: 'small' }}
        muiTableContainerProps={{
          sx: { maxHeight: '60vh', border: '1px solid', borderColor: 'divider', borderRadius: 2 },
        }}
        muiTablePaperProps={{ sx: { boxShadow: 'none' } }}
        muiTableHeadCellProps={{
          sx: { fontWeight: 700, backgroundColor: 'rgba(37, 64, 146, 0.08)', whiteSpace: 'nowrap' },
        }}
        muiTableBodyCellProps={{ sx: { fontSize: '0.85rem', whiteSpace: 'nowrap' } }}
        muiTableBodyRowProps={({ row }) => {
          const errores = row.original.errores ?? [];
          if (errores.length === 0) return { hover: true };
          const esError = errores.some(e => e.severidad === 'Error');
          return {
            hover: true,
            sx: { backgroundColor: esError ? 'rgba(211, 47, 47, 0.04)' : 'rgba(237, 108, 2, 0.04)' },
          };
        }}
        renderTopToolbarCustomActions={() => (
          <Stack direction="row" alignItems="center" gap={1} sx={{ px: 1 }}>
            <Tooltip title={conErrores ? '' : 'El lote no tiene errores de validación'}>
              <span>
                <FormControlLabel
                  control={
                    <Switch
                      size="small"
                      checked={soloConErrores}
                      disabled={!conErrores}
                      onChange={e => {
                        setSoloConErrores(e.target.checked);
                        setPaginacion(p => ({ ...p, pageIndex: 0 }));
                      }}
                    />
                  }
                  label="Solo filas con error"
                />
              </span>
            </Tooltip>
            <Button
              size="small"
              variant="outlined"
              startIcon={<FileDownloadIcon />}
              onClick={exportar}
              disabled={exportando || (datos?.total ?? 0) === 0}
            >
              {exportando ? 'Exportando…' : 'Exportar CSV'}
            </Button>
          </Stack>
        )}
      />
    </Card>
  );
}
