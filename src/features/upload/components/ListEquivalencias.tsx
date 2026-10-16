import { useMemo, useState } from 'react';
import { AxiosError } from 'axios';
import { MaterialReactTable, type MRT_ColumnDef } from 'material-react-table';
import {
  Alert,
  Button,
  Card,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  MenuItem,
  Snackbar,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import { claveAmbito, type Equivalencia } from '../models/Equivalencia.model';
import { useEquivalencias } from '../hooks/useEquivalencias';
import EquivalenciaService from '../services/EquivalenciaService';
import DialogEquivalencia from './DialogEquivalencia';
import ListaHeader from '../../param/shared/ListaHeader';
import { cardSx } from '../../param/shared/tableStyles';
import useAuth from '../../auth/hooks/useAuth';
import { extractBackendErrors } from '../../../utils/extractBackendErrors';

const TODOS = 'todos';

interface ConfirmDeleteState {
  equivalencia: Equivalencia;
  eliminando: boolean;
  errores: string[];
}

const celdaCsv = (v: string | null | undefined) => `"${(v ?? '').replace(/"/g, '""')}"`;

function exportarCsv(filas: Equivalencia[]) {
  const encabezado = ['Catálogo o campo', 'Valor original', 'Valor SFC', 'Descripción', 'Observaciones', 'Usuario', 'Fecha'];
  const lineas = filas.map(e =>
    [
      e.catalogoNombre,
      e.valorOriginal,
      e.codigo,
      e.codigoDescripcion,
      e.observaciones,
      e.usuario,
      e.fechaActualizacion ? new Date(e.fechaActualizacion).toLocaleString('es-CO') : '',
    ]
      .map(celdaCsv)
      .join(';')
  );
  // BOM para que Excel abra el UTF-8 con tildes.
  const blob = new Blob(['﻿' + [encabezado.map(celdaCsv).join(';'), ...lineas].join('\r\n')], {
    type: 'text/csv;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'equivalencias-carga.csv';
  a.click();
  URL.revokeObjectURL(url);
}

export default function ListEquivalencias() {
  const { hasPermission } = useAuth();
  // Sin permiso las acciones no se renderizan: un 403 del API cierra la sesión.
  // Es solo UX; la autorización real la hace el backend con [RequirePermission("cargas.write")].
  const canEdit = hasPermission('cargas.write');

  const { equivalencias, catalogos, cargando, error, recargar } = useEquivalencias();

  const [filtroCatalogo, setFiltroCatalogo] = useState(TODOS);
  const [formOpen, setFormOpen] = useState(false);
  const [editando, setEditando] = useState<Equivalencia | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<ConfirmDeleteState | null>(null);
  const [snackbar, setSnackbar] = useState<{
    mensaje: string;
    tipo: 'success' | 'info' | 'warning' | 'error';
  } | null>(null);

  const datosFiltrados = useMemo(
    () => equivalencias.filter(e => filtroCatalogo === TODOS || claveAmbito(e) === filtroCatalogo),
    [equivalencias, filtroCatalogo]
  );

  const abrirFormulario = (equivalencia: Equivalencia | null) => {
    setEditando(equivalencia);
    setFormOpen(true);
  };

  const cerrarFormulario = () => {
    setFormOpen(false);
    setEditando(null);
  };

  const handleGuardada = () => {
    setSnackbar({ mensaje: editando ? 'Equivalencia actualizada.' : 'Equivalencia creada.', tipo: 'success' });
    cerrarFormulario();
    recargar();
  };

  const handleNoExiste = () => {
    cerrarFormulario();
    setConfirmDelete(null);
    setSnackbar({ mensaje: 'La equivalencia ya no existe. Se actualizó la lista.', tipo: 'warning' });
    recargar();
  };

  const handleConfirmarEliminar = async () => {
    if (!confirmDelete || confirmDelete.eliminando) return;
    const { equivalencia } = confirmDelete;
    setConfirmDelete({ ...confirmDelete, eliminando: true, errores: [] });
    try {
      await EquivalenciaService.eliminar(equivalencia.id);
      setConfirmDelete(null);
      setSnackbar({ mensaje: 'Equivalencia eliminada.', tipo: 'info' });
      recargar();
    } catch (err) {
      if (err instanceof AxiosError && err.response?.status === 404) {
        handleNoExiste();
        return;
      }
      setConfirmDelete({
        equivalencia,
        eliminando: false,
        errores: extractBackendErrors(err, 'No se pudo eliminar la equivalencia.'),
      });
    }
  };

  const columns: MRT_ColumnDef<Equivalencia>[] = [
    {
      accessorKey: 'catalogoNombre',
      header: 'Catálogo o campo',
      size: 200,
      Cell: ({ row }) => (
        <Stack spacing={0.25}>
          <Typography variant="body2">{row.original.catalogoNombre}</Typography>
          {row.original.campo && (
            <Typography variant="caption" color="text.secondary">
              Campo {row.original.campo}
            </Typography>
          )}
        </Stack>
      ),
    },
    {
      accessorKey: 'valorOriginal',
      header: 'Valor en el archivo',
      size: 260,
      Cell: ({ row }) => (
        <Typography variant="body2" fontWeight={600}>
          {row.original.valorOriginal}
        </Typography>
      ),
    },
    {
      accessorKey: 'codigo',
      header: 'Valor SFC',
      size: 280,
      Cell: ({ row }) =>
        // Por campo no hay descripción: el valor es un número o una fecha.
        row.original.campo ? (
          row.original.codigo === '' ? (
            <Typography variant="body2" color="text.secondary">
              <em>(vacío)</em>
            </Typography>
          ) : (
            <Typography variant="body2">
              <strong>{row.original.codigo}</strong>
            </Typography>
          )
        ) : row.original.codigoDescripcion !== null ? (
          <Typography variant="body2">
            <strong>{row.original.codigo}</strong> – {row.original.codigoDescripcion}
          </Typography>
        ) : (
          <Tooltip title="El código ya no existe en el catálogo: corrija la equivalencia.">
            <Chip label={`${row.original.codigo} (no existe)`} size="small" color="error" variant="outlined" />
          </Tooltip>
        ),
    },
    {
      accessorKey: 'observaciones',
      header: 'Observaciones',
      size: 220,
      Cell: ({ cell }) => (
        <Typography variant="caption" color="text.secondary">
          {cell.getValue<string | null>() ?? ''}
        </Typography>
      ),
    },
    {
      accessorKey: 'fechaActualizacion',
      header: 'Última modificación',
      size: 200,
      Cell: ({ row }) => (
        <Stack spacing={0.25}>
          <Typography variant="body2">{row.original.usuario ?? ''}</Typography>
          <Typography variant="caption" color="text.secondary">
            {row.original.fechaActualizacion
              ? new Date(row.original.fechaActualizacion).toLocaleString('es-CO')
              : ''}
          </Typography>
        </Stack>
      ),
    },
    ...(canEdit
      ? [
          {
            id: 'acciones',
            header: 'Acciones',
            size: 100,
            enableSorting: false,
            Cell: ({ row }: { row: { original: Equivalencia } }) => (
              <Stack direction="row" spacing={0.5}>
                <Tooltip title="Editar">
                  <IconButton size="small" onClick={() => abrirFormulario(row.original)}>
                    <EditIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Eliminar">
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() =>
                      setConfirmDelete({ equivalencia: row.original, eliminando: false, errores: [] })
                    }
                  >
                    <DeleteOutlineIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Stack>
            ),
          } as MRT_ColumnDef<Equivalencia>,
        ]
      : []),
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
      <Alert severity="info" sx={{ mb: 1 }}>
        Traducen el valor que trae el archivo del cliente al código SFC de un catálogo o, en algunos campos sin
        catálogo, a un número o una fecha (por ejemplo "NO APLICA" → 0 en el spread). El valor se compara sin
        tildes, mayúsculas ni espacios de más. Si un valor tiene equivalencia, se usa aunque el valor ya sea
        válido. Las equivalencias se aplican al validar y promover el lote.
      </Alert>

      <MaterialReactTable
        columns={columns}
        data={datosFiltrados}
        getRowId={row => String(row.id)}
        state={{ isLoading: cargando }}
        initialState={{ sorting: [{ id: 'catalogoNombre', desc: false }] }}
        enableColumnActions={false}
        enableColumnFilters={false}
        enableSorting
        enablePagination={false}
        enableStickyHeader
        enableGlobalFilter
        enableDensityToggle={false}
        enableFullScreenToggle={false}
        muiTableProps={{ size: 'small' }}
        muiTableBodyRowProps={({ row }) => ({
          hover: true,
          sx: {
            backgroundColor: row.index % 2 === 0 ? 'rgba(37, 64, 146, 0.02)' : 'transparent',
          },
        })}
        muiTableContainerProps={{
          sx: {
            maxHeight: '62vh',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2,
            backgroundColor: 'background.paper',
          },
        }}
        muiTablePaperProps={{ sx: { boxShadow: 'none', backgroundColor: 'background.paper' } }}
        muiTableHeadCellProps={{
          sx: {
            fontSize: '0.95rem',
            fontWeight: 700,
            backgroundColor: 'rgba(37, 64, 146, 0.08)',
            borderBottom: '1px solid',
            borderColor: 'divider',
          },
        }}
        muiTableBodyCellProps={{ sx: { fontSize: '0.9rem', verticalAlign: 'middle' } }}
        renderTopToolbarCustomActions={() => (
          <ListaHeader
            title="Equivalencias de carga"
            count={datosFiltrados.length}
            slot={
              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                <TextField
                  select
                  size="small"
                  label="Catálogo o campo"
                  value={filtroCatalogo}
                  onChange={e => setFiltroCatalogo(e.target.value)}
                  sx={{ minWidth: 220 }}
                >
                  <MenuItem value={TODOS}>Todos</MenuItem>
                  {catalogos.map(c => (
                    <MenuItem key={claveAmbito(c)} value={claveAmbito(c)}>
                      {c.nombre}
                    </MenuItem>
                  ))}
                </TextField>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<FileDownloadIcon />}
                  onClick={() => exportarCsv(datosFiltrados)}
                  disabled={datosFiltrados.length === 0}
                >
                  Exportar CSV
                </Button>
                {canEdit && (
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={<AddIcon />}
                    onClick={() => abrirFormulario(null)}
                    disabled={catalogos.length === 0}
                  >
                    Nueva equivalencia
                  </Button>
                )}
              </Stack>
            }
          />
        )}
      />

      {canEdit && (
        <DialogEquivalencia
          open={formOpen}
          equivalencia={editando}
          catalogos={catalogos}
          onClose={cerrarFormulario}
          onSaved={handleGuardada}
          onNoExiste={handleNoExiste}
        />
      )}

      <Dialog
        open={!!confirmDelete}
        onClose={() => !confirmDelete?.eliminando && setConfirmDelete(null)}
        maxWidth="xs"
      >
        <DialogTitle>Confirmar eliminación</DialogTitle>
        <DialogContent>
          {confirmDelete && confirmDelete.errores.length > 0 && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {confirmDelete.errores.map((msg, i) => (
                <div key={i}>{msg}</div>
              ))}
            </Alert>
          )}
          <DialogContentText>
            ¿Eliminar la equivalencia <strong>{confirmDelete?.equivalencia.valorOriginal}</strong> →{' '}
            <strong>{confirmDelete?.equivalencia.codigo}</strong> de{' '}
            {confirmDelete?.equivalencia.catalogoNombre}? Los lotes que la usen tendrán que validarse de nuevo.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDelete(null)} disabled={confirmDelete?.eliminando}>
            Cancelar
          </Button>
          <Button
            color="error"
            variant="contained"
            onClick={handleConfirmarEliminar}
            disabled={confirmDelete?.eliminando}
            startIcon={confirmDelete?.eliminando ? <CircularProgress size={20} /> : null}
          >
            {confirmDelete?.eliminando ? 'Eliminando...' : 'Eliminar'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={!!snackbar}
        autoHideDuration={3000}
        onClose={() => setSnackbar(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar?.tipo ?? 'success'} onClose={() => setSnackbar(null)} variant="filled">
          {snackbar?.mensaje}
        </Alert>
      </Snackbar>
    </Card>
  );
}
