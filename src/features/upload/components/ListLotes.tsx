import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MaterialReactTable,
  type MRT_ColumnDef,
  type MRT_TableOptions,
} from 'material-react-table';
import {
  Alert,
  Button,
  Card,
  Chip,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RefreshIcon from '@mui/icons-material/Refresh';
import NotesIcon from '@mui/icons-material/Notes';
import {
  ESTADO_LOTE_COLOR,
  ESTADOS_ACTIVOS,
  type EstadoLote,
  type LoteResumen,
} from '../models/Lote.model';
import { useLotes } from '../hooks/useLotes';
import useAuth from '../../auth/hooks/useAuth';
import ListaHeader from '../../param/shared/ListaHeader';
import { baseTableOptions, cardSx } from '../../param/shared/tableStyles';

type FiltroEstado = 'activos' | 'promovidos' | 'anulados' | 'todos';

const FILTROS_ESTADO: { value: FiltroEstado; label: string; estados: EstadoLote[] }[] = [
  { value: 'activos',    label: 'Activos',    estados: ESTADOS_ACTIVOS },
  { value: 'promovidos', label: 'Promovidos', estados: ['Promovido'] },
  { value: 'anulados',   label: 'Anulados',   estados: ['Anulado'] },
  { value: 'todos',      label: 'Todos',      estados: [] },
];

const tableOptions = baseTableOptions as unknown as Partial<MRT_TableOptions<LoteResumen>>;

const fechaCorta = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString('es-CO') : '—');

const universalidadTexto = (l: LoteResumen) =>
  l.universalidadDescripcion
    ? `${l.universalidadCodigo} — ${l.universalidadDescripcion}`
    : String(l.universalidadCodigo);

/** Fecha y usuario en una celda. */
function FechaUsuario({ fecha, usuario }: { fecha: string | null; usuario: string | null }) {
  if (!fecha) return <>—</>;
  return (
    <Stack spacing={0.25}>
      <Typography variant="body2">{fechaCorta(fecha)}</Typography>
      {usuario && (
        <Typography variant="caption" color="text.secondary" sx={{ wordBreak: 'break-all' }}>
          {usuario}
        </Typography>
      )}
    </Stack>
  );
}

export default function ListLotes() {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  // Sin permiso el botón no se muestra: un 403 del API cierra la sesión.
  const canWrite = hasPermission('cargas.write');

  const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>('activos');
  const [filtroUniversalidad, setFiltroUniversalidad] = useState('');
  const [filtroCorte, setFiltroCorte] = useState('');

  const estados = FILTROS_ESTADO.find(f => f.value === filtroEstado)!.estados;
  const { lotes, cargando, error, recargar } = useLotes(estados);

  // Universalidad y corte se filtran en el cliente con las opciones de los lotes cargados,
  // sin consultar Universalidades por OData (requiere params.read).
  const universalidades = useMemo(() => {
    const mapa = new Map<number, string>();
    lotes.forEach(l => mapa.set(l.universalidadCodigo, universalidadTexto(l)));
    return [...mapa.entries()].sort((a, b) => a[0] - b[0]);
  }, [lotes]);

  const cortes = useMemo(
    () => [...new Set(lotes.map(l => l.fechaCorte))].sort().reverse(),
    [lotes]
  );

  const datosFiltrados = lotes.filter(
    l =>
      (filtroUniversalidad === '' || String(l.universalidadCodigo) === filtroUniversalidad) &&
      (filtroCorte === '' || l.fechaCorte === filtroCorte)
  );

  const cambiarFiltroEstado = (valor: FiltroEstado) => {
    setFiltroEstado(valor);
    setFiltroUniversalidad('');
    setFiltroCorte('');
  };

  const columns: MRT_ColumnDef<LoteResumen>[] = [
    {
      accessorKey: 'id',
      header: 'Lote',
      size: 90,
      Cell: ({ row }) => (
        <Stack direction="row" spacing={0.5} alignItems="center">
          <Chip label={`#${row.original.id}`} size="small" variant="outlined" color="primary" />
          {row.original.observaciones && (
            <Tooltip title={row.original.observaciones}>
              <NotesIcon fontSize="small" color="action" />
            </Tooltip>
          )}
        </Stack>
      ),
    },
    { accessorKey: 'fechaCorte', header: 'Corte', size: 110 },
    {
      id: 'universalidad',
      accessorFn: universalidadTexto,
      header: 'Universalidad',
      size: 300,
    },
    {
      accessorKey: 'estado',
      header: 'Estado',
      size: 110,
      Cell: ({ cell }) => (
        <Chip
          label={cell.getValue<string>()}
          size="small"
          color={ESTADO_LOTE_COLOR[cell.getValue<string>()] ?? 'default'}
        />
      ),
    },
    {
      id: 'conteos',
      header: 'Filas 001 / 002 / 003',
      size: 150,
      enableSorting: false,
      accessorFn: l =>
        `${l.conteos?.creditos ?? 0} / ${l.conteos?.atributos ?? 0} / ${l.conteos?.movimientos ?? 0}`,
    },
    {
      id: 'errores',
      header: 'Errores / Advert.',
      size: 130,
      accessorFn: l => l.resumenErrores?.total ?? 0,
      Cell: ({ row }) => {
        const r = row.original.resumenErrores;
        if (!r || r.total === 0) return '—';
        return (
          <Typography variant="body2" color={r.errores > 0 ? 'error.main' : 'warning.main'}>
            {r.errores} / {r.advertencias}
          </Typography>
        );
      },
    },
    {
      accessorKey: 'fechaCreacion',
      header: 'Creado',
      size: 190,
      Cell: ({ row }) => (
        <FechaUsuario fecha={row.original.fechaCreacion} usuario={row.original.usuarioCreador} />
      ),
    },
    {
      accessorKey: 'fechaPromocion',
      header: 'Promovido',
      size: 190,
      Cell: ({ row }) => (
        <FechaUsuario fecha={row.original.fechaPromocion} usuario={row.original.usuarioPromotor} />
      ),
    },
  ];

  if (error) {
    return (
      <Alert
        severity="error"
        sx={{ m: 2 }}
        action={
          <Button color="inherit" size="small" onClick={recargar}>
            Reintentar
          </Button>
        }
      >
        {error}
      </Alert>
    );
  }

  return (
    <Card sx={cardSx}>
      <MaterialReactTable
        {...tableOptions}
        columns={columns}
        data={datosFiltrados}
        getRowId={row => String(row.id)}
        state={{ isLoading: cargando }}
        initialState={{ sorting: [{ id: 'id', desc: true }] }}
        renderTopToolbarCustomActions={() => (
          <ListaHeader
            title="Lotes de carga"
            count={datosFiltrados.length}
            slot={
              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                {FILTROS_ESTADO.map(op => (
                  <Chip
                    key={op.value}
                    label={op.label}
                    size="small"
                    onClick={() => cambiarFiltroEstado(op.value)}
                    color={filtroEstado === op.value ? 'primary' : 'default'}
                    variant={filtroEstado === op.value ? 'filled' : 'outlined'}
                    clickable
                  />
                ))}
                <TextField
                  select
                  size="small"
                  label="Universalidad"
                  value={filtroUniversalidad}
                  onChange={e => setFiltroUniversalidad(e.target.value)}
                  sx={{ minWidth: 220 }}
                >
                  <MenuItem value=""><em>Todas</em></MenuItem>
                  {universalidades.map(([codigo, texto]) => (
                    <MenuItem key={codigo} value={String(codigo)}>{texto}</MenuItem>
                  ))}
                </TextField>
                <TextField
                  select
                  size="small"
                  label="Corte"
                  value={filtroCorte}
                  onChange={e => setFiltroCorte(e.target.value)}
                  sx={{ minWidth: 140 }}
                >
                  <MenuItem value=""><em>Todos</em></MenuItem>
                  {cortes.map(c => (
                    <MenuItem key={c} value={c}>{c}</MenuItem>
                  ))}
                </TextField>
                <Tooltip title="Actualizar">
                  <span>
                    <IconButton size="small" onClick={recargar} disabled={cargando}>
                      <RefreshIcon fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>
                {canWrite && (
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={<AddIcon />}
                    onClick={() => navigate('/app/carga-archivos')}
                  >
                    Nuevo lote
                  </Button>
                )}
              </Stack>
            }
          />
        )}
      />
    </Card>
  );
}
