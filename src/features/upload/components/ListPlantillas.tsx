import { useState } from 'react';
import { MaterialReactTable, type MRT_ColumnDef } from 'material-react-table';
import {
  Box,
  Button,
  Card,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Snackbar,
  Alert,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import ToggleOnIcon from '@mui/icons-material/ToggleOn';
import ToggleOffIcon from '@mui/icons-material/ToggleOff';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import {
  INSUMO_LABELS_CORTO,
  type InsumoMURIC,
  type PlantillaCarga,
  type PlantillaInput,
} from '../models/Plantilla.model';
import { usePlantillas } from '../hooks/usePlantillas';
import FormPlantilla from './FormPlantilla';
import useAuth from '../../auth/hooks/useAuth';

const INSUMOS: { value: InsumoMURIC | 'todos'; label: string }[] = [
  { value: 'todos', label: 'Todos' },
  { value: '001-001', label: '001-001 Créditos' },
  { value: '001-002', label: '001-002 Atributos' },
  { value: '001-003', label: '001-003 Movimientos' },
];

export default function ListPlantillas() {
  const { user } = useAuth();
  const canEdit = user?.roles?.some(r => ['ADMIN', 'OPERADOR'].includes(r)) ?? false;

  const { plantillas, cargando, error, createPlantilla, updatePlantilla, toggleActiva, deletePlantilla } =
    usePlantillas();

  const [filtroInsumo, setFiltroInsumo] = useState<InsumoMURIC | 'todos'>('todos');
  const [formOpen, setFormOpen] = useState(false);
  const [editando, setEditando] = useState<PlantillaCarga | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<PlantillaCarga | null>(null);
  const [snackbar, setSnackbar] = useState<{
    mensaje: string;
    tipo: 'success' | 'info' | 'error';
  } | null>(null);

  const datosFiltrados = plantillas.filter(
    p => filtroInsumo === 'todos' || p.insumo === filtroInsumo
  );

  const handleNueva = () => {
    setEditando(null);
    setFormOpen(true);
  };

  const handleEditar = (p: PlantillaCarga) => {
    setEditando(p);
    setFormOpen(true);
  };

  const handleGuardar = async (input: PlantillaInput) => {
    try {
      if (editando) {
        await updatePlantilla(editando.id, input);
        setSnackbar({ mensaje: 'Plantilla actualizada.', tipo: 'success' });
      } else {
        await createPlantilla(input);
        setSnackbar({ mensaje: 'Plantilla creada.', tipo: 'success' });
      }
      setFormOpen(false);
      setEditando(null);
    } catch {
      setSnackbar({ mensaje: 'Error al guardar la plantilla.', tipo: 'error' });
    }
  };

  const handleToggleActiva = async (p: PlantillaCarga) => {
    try {
      await toggleActiva(p.id);
      setSnackbar({
        mensaje: p.esActiva ? 'Plantilla desactivada.' : 'Plantilla activada.',
        tipo: 'info',
      });
    } catch {
      setSnackbar({ mensaje: 'Error al cambiar el estado de la plantilla.', tipo: 'error' });
    }
  };

  const handleConfirmarEliminar = async () => {
    if (!confirmDelete) return;
    try {
      await deletePlantilla(confirmDelete.id);
      setSnackbar({ mensaje: 'Plantilla eliminada.', tipo: 'info' });
      setConfirmDelete(null);
    } catch {
      setSnackbar({ mensaje: 'No se puede eliminar: la plantilla está referenciada en un lote.', tipo: 'error' });
      setConfirmDelete(null);
    }
  };

  const columns: MRT_ColumnDef<PlantillaCarga>[] = [
    {
      accessorKey: 'nombre',
      header: 'Nombre',
      size: 260,
      Cell: ({ row }) => (
        <Stack spacing={0.25}>
          <Typography variant="body2" fontWeight={600}>
            {row.original.nombre}
          </Typography>
          {row.original.descripcion && (
            <Typography variant="caption" color="text.secondary">
              {row.original.descripcion.length > 80
                ? row.original.descripcion.slice(0, 80) + '…'
                : row.original.descripcion}
            </Typography>
          )}
        </Stack>
      ),
    },
    {
      accessorKey: 'insumo',
      header: 'Insumo',
      size: 170,
      Cell: ({ cell }) => (
        <Chip
          label={INSUMO_LABELS_CORTO[cell.getValue<InsumoMURIC>()]}
          size="small"
          variant="outlined"
          color="primary"
        />
      ),
    },
    {
      accessorKey: 'campos',
      header: 'Campos mapeados',
      size: 140,
      enableSorting: false,
      Cell: ({ row }) => (
        <Typography variant="body2">{row.original.campos?.length ?? 0}</Typography>
      ),
    },
    {
      accessorKey: 'usuarioCreador',
      header: 'Creada por',
      size: 200,
    },
    {
      accessorKey: 'fechaCreacion',
      header: 'Fecha creación',
      size: 140,
      Cell: ({ cell }) =>
        new Date(cell.getValue<string>()).toLocaleDateString('es-CO'),
    },
    {
      accessorKey: 'esActiva',
      header: 'Estado',
      size: 100,
      Cell: ({ cell }) =>
        cell.getValue<boolean>() ? (
          <Chip label="Activa" size="small" color="success" variant="outlined" />
        ) : (
          <Chip label="Inactiva" size="small" color="default" variant="outlined" />
        ),
    },
    ...(canEdit
      ? [
          {
            id: 'acciones',
            header: 'Acciones',
            size: 130,
            enableSorting: false,
            Cell: ({ row }: { row: { original: PlantillaCarga } }) => (
              <Stack direction="row" spacing={0.5}>
                <Tooltip title="Editar">
                  <IconButton size="small" onClick={() => handleEditar(row.original)}>
                    <EditIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title={row.original.esActiva ? 'Desactivar' : 'Activar'}>
                  <IconButton size="small" onClick={() => handleToggleActiva(row.original)}>
                    {row.original.esActiva ? (
                      <ToggleOnIcon fontSize="small" color="success" />
                    ) : (
                      <ToggleOffIcon fontSize="small" color="disabled" />
                    )}
                  </IconButton>
                </Tooltip>
                <Tooltip title="Eliminar">
                  <IconButton
                    size="small"
                    onClick={() => setConfirmDelete(row.original)}
                    color="error"
                  >
                    <DeleteOutlineIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Stack>
            ),
          } as MRT_ColumnDef<PlantillaCarga>,
        ]
      : []),
  ];

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Card
      sx={{
        width: '100%',
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        border: '1px solid',
        borderColor: 'divider',
        backgroundColor: 'background.paper',
        p: { xs: 1, md: 1.5 },
        borderRadius: 3,
      }}
    >
      <MaterialReactTable
        columns={columns}
        data={datosFiltrados}
        getRowId={row => String(row.id)}
        state={{ isLoading: cargando }}
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
            opacity: row.original.esActiva ? 1 : 0.55,
            backgroundColor:
              row.index % 2 === 0 ? 'rgba(37, 64, 146, 0.02)' : 'transparent',
          },
        })}
        muiTableContainerProps={{
          sx: {
            maxHeight: '68vh',
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
          <Box
            sx={{
              px: 1,
              py: 0.5,
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 1,
              flexWrap: 'wrap',
            }}
          >
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
              <Typography variant="h6" fontWeight={700}>
                Plantillas de carga
              </Typography>
              <Chip
                label={`${datosFiltrados.length} plantilla${datosFiltrados.length !== 1 ? 's' : ''}`}
                size="small"
                color="primary"
                variant="outlined"
              />
            </Stack>

            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
              {INSUMOS.map(op => (
                <Chip
                  key={op.value}
                  label={op.label}
                  size="small"
                  onClick={() => setFiltroInsumo(op.value as typeof filtroInsumo)}
                  color={filtroInsumo === op.value ? 'primary' : 'default'}
                  variant={filtroInsumo === op.value ? 'filled' : 'outlined'}
                  clickable
                />
              ))}
              {canEdit && (
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={handleNueva}
                >
                  Nueva plantilla
                </Button>
              )}
            </Stack>
          </Box>
        )}
      />

      <FormPlantilla
        open={formOpen}
        plantilla={editando}
        onClose={() => { setFormOpen(false); setEditando(null); }}
        onSave={handleGuardar}
      />

      <Dialog open={!!confirmDelete} onClose={() => setConfirmDelete(null)} maxWidth="xs">
        <DialogTitle>Confirmar eliminación</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Eliminar la plantilla <strong>{confirmDelete?.nombre}</strong>? Esta acción no se
            puede deshacer.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDelete(null)}>Cancelar</Button>
          <Button color="error" variant="contained" onClick={handleConfirmarEliminar}>
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={!!snackbar}
        autoHideDuration={3000}
        onClose={() => setSnackbar(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity={snackbar?.tipo ?? 'success'}
          onClose={() => setSnackbar(null)}
          variant="filled"
        >
          {snackbar?.mensaje}
        </Alert>
      </Snackbar>
    </Card>
  );
}
