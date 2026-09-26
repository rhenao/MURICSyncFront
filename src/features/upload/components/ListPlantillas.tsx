import { useState } from 'react';
import { AxiosError } from 'axios';
import { MaterialReactTable, type MRT_ColumnDef } from 'material-react-table';
import {
  Box,
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
  type PlantillaDetalle,
  type PlantillaResumen,
} from '../models/Plantilla.model';
import { usePlantillas } from '../hooks/usePlantillas';
import PlantillaService from '../services/PlantillaService';
import FormPlantilla, { type PlantillaFormData } from './FormPlantilla';
import useAuth from '../../auth/hooks/useAuth';
import { extractBackendErrors } from '../../../utils/extractBackendErrors';

const INSUMOS: { value: InsumoMURIC | 'todos'; label: string }[] = [
  { value: 'todos', label: 'Todos' },
  { value: '001-001', label: '001-001 Créditos' },
  { value: '001-002', label: '001-002 Atributos' },
  { value: '001-003', label: '001-003 Movimientos' },
];

// Mientras las plantillas estén asociadas a una entidad (ver plan-plantillas-carga.md, Fase B).
const TIPO_ENTIDAD_PLANTILLA = 1;
const CODIGO_ENTIDAD_PLANTILLA = 1;

interface ConfirmDeleteState {
  plantilla: PlantillaResumen;
  eliminando: boolean;
  errores: string[];
  enUso: boolean; // 409: referenciada por un lote; se ofrece desactivarla
}

const statusDe = (err: unknown) => (err instanceof AxiosError ? err.response?.status : undefined);

export default function ListPlantillas() {
  const { hasPermission } = useAuth();
  // Sin permiso las acciones no se renderizan: un 403 del API cierra la sesión.
  // Es solo UX; la autorización real la hace el backend con [RequirePermission("cargas.write")].
  const canEdit = hasPermission('cargas.write');

  const { plantillas, cargando, error, recargar } = usePlantillas();

  const [filtroInsumo, setFiltroInsumo] = useState<InsumoMURIC | 'todos'>('todos');
  const [formOpen, setFormOpen] = useState(false);
  const [editando, setEditando] = useState<PlantillaDetalle | null>(null);
  const [ocupadoId, setOcupadoId] = useState<number | null>(null); // fila con una acción en curso
  const [confirmDelete, setConfirmDelete] = useState<ConfirmDeleteState | null>(null);
  const [snackbar, setSnackbar] = useState<{
    mensaje: string;
    tipo: 'success' | 'info' | 'warning' | 'error';
  } | null>(null);

  const datosFiltrados = plantillas.filter(
    p => filtroInsumo === 'todos' || p.insumo === filtroInsumo
  );

  const handleNueva = () => {
    setEditando(null);
    setFormOpen(true);
  };

  // El listado no trae los campos del mapeo: se pide el detalle antes de abrir el formulario.
  const handleEditar = async (p: PlantillaResumen) => {
    setOcupadoId(p.id);
    try {
      setEditando(await PlantillaService.obtener(p.id));
      setFormOpen(true);
    } catch (err) {
      if (statusDe(err) === 404) {
        setSnackbar({ mensaje: 'La plantilla ya no existe. Se actualizó la lista.', tipo: 'warning' });
        recargar();
      } else {
        setSnackbar({
          mensaje: extractBackendErrors(err, 'No se pudo abrir la plantilla.').join(' '),
          tipo: 'error',
        });
      }
    } finally {
      setOcupadoId(null);
    }
  };

  const cerrarFormulario = () => {
    setFormOpen(false);
    setEditando(null);
  };

  // Si falla, el error sube a FormPlantilla, que lo muestra sin cerrar el diálogo.
  const handleGuardar = async (data: PlantillaFormData) => {
    if (editando) {
      await PlantillaService.actualizar(editando.id, {
        nombre: data.nombre,
        descripcion: data.descripcion,
        campos: data.campos,
      });
      setSnackbar({ mensaje: 'Plantilla actualizada.', tipo: 'success' });
    } else {
      await PlantillaService.crear({
        ...data,
        tipoEntidad: TIPO_ENTIDAD_PLANTILLA,
        codigoEntidad: CODIGO_ENTIDAD_PLANTILLA,
      });
      setSnackbar({ mensaje: 'Plantilla creada.', tipo: 'success' });
    }
    cerrarFormulario();
    recargar();
  };

  const cambiarActiva = async (p: PlantillaResumen): Promise<boolean> => {
    setOcupadoId(p.id);
    try {
      await PlantillaService.cambiarActiva(p.id, !p.esActiva);
      setSnackbar({
        mensaje: p.esActiva ? 'Plantilla desactivada.' : 'Plantilla activada.',
        tipo: 'info',
      });
      recargar();
      return true;
    } catch (err) {
      setSnackbar({
        mensaje: extractBackendErrors(err, 'No se pudo cambiar el estado de la plantilla.').join(' '),
        tipo: 'error',
      });
      if (statusDe(err) === 404) recargar();
      return false;
    } finally {
      setOcupadoId(null);
    }
  };

  const handleConfirmarEliminar = async () => {
    if (!confirmDelete || confirmDelete.eliminando) return;
    const { plantilla } = confirmDelete;
    setConfirmDelete({ ...confirmDelete, eliminando: true, errores: [] });
    try {
      await PlantillaService.eliminar(plantilla.id);
      setConfirmDelete(null);
      setSnackbar({ mensaje: 'Plantilla eliminada.', tipo: 'info' });
      recargar();
    } catch (err) {
      const status = statusDe(err);
      if (status === 404) {
        setConfirmDelete(null);
        setSnackbar({ mensaje: 'La plantilla ya no existe. Se actualizó la lista.', tipo: 'warning' });
        recargar();
        return;
      }
      setConfirmDelete({
        plantilla,
        eliminando: false,
        errores: extractBackendErrors(err, 'No se pudo eliminar la plantilla.'),
        enUso: status === 409,
      });
    }
  };

  // Alternativa ofrecida cuando la plantilla está referenciada por un lote (409).
  const handleDesactivarEnVezDeEliminar = async () => {
    if (!confirmDelete) return;
    const ok = await cambiarActiva(confirmDelete.plantilla);
    if (ok) setConfirmDelete(null);
  };

  const columns: MRT_ColumnDef<PlantillaResumen>[] = [
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
      accessorKey: 'numeroCampos',
      header: 'Campos mapeados',
      size: 140,
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
            Cell: ({ row }: { row: { original: PlantillaResumen } }) => (
              <Stack direction="row" spacing={0.5}>
                <Tooltip title="Editar">
                  <span>
                    <IconButton
                      size="small"
                      onClick={() => handleEditar(row.original)}
                      disabled={ocupadoId !== null}
                    >
                      {ocupadoId === row.original.id ? (
                        <CircularProgress size={16} />
                      ) : (
                        <EditIcon fontSize="small" />
                      )}
                    </IconButton>
                  </span>
                </Tooltip>
                <Tooltip title={row.original.esActiva ? 'Desactivar' : 'Activar'}>
                  <span>
                    <IconButton
                      size="small"
                      onClick={() => cambiarActiva(row.original)}
                      disabled={ocupadoId !== null}
                    >
                      {row.original.esActiva ? (
                        <ToggleOnIcon fontSize="small" color="success" />
                      ) : (
                        <ToggleOffIcon fontSize="small" color="disabled" />
                      )}
                    </IconButton>
                  </span>
                </Tooltip>
                <Tooltip title="Eliminar">
                  <span>
                    <IconButton
                      size="small"
                      onClick={() =>
                        setConfirmDelete({
                          plantilla: row.original,
                          eliminando: false,
                          errores: [],
                          enUso: false,
                        })
                      }
                      disabled={ocupadoId !== null}
                      color="error"
                    >
                      <DeleteOutlineIcon fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>
              </Stack>
            ),
          } as MRT_ColumnDef<PlantillaResumen>,
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
        onClose={cerrarFormulario}
        onSave={handleGuardar}
      />

      <Dialog
        open={!!confirmDelete}
        onClose={() => !confirmDelete?.eliminando && setConfirmDelete(null)}
        maxWidth="xs"
      >
        <DialogTitle>Confirmar eliminación</DialogTitle>
        <DialogContent>
          {confirmDelete && confirmDelete.errores.length > 0 && (
            <Alert severity={confirmDelete.enUso ? 'warning' : 'error'} sx={{ mb: 2 }}>
              {confirmDelete.errores.map((msg, i) => (
                <div key={i}>{msg}</div>
              ))}
            </Alert>
          )}
          <DialogContentText>
            ¿Eliminar la plantilla <strong>{confirmDelete?.plantilla.nombre}</strong>? Esta acción no se
            puede deshacer.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDelete(null)} disabled={confirmDelete?.eliminando}>
            Cancelar
          </Button>
          {confirmDelete?.enUso && confirmDelete.plantilla.esActiva ? (
            <Button
              variant="contained"
              onClick={handleDesactivarEnVezDeEliminar}
              disabled={ocupadoId !== null}
            >
              Desactivar
            </Button>
          ) : (
            <Button
              color="error"
              variant="contained"
              onClick={handleConfirmarEliminar}
              disabled={confirmDelete?.eliminando || confirmDelete?.enUso}
              startIcon={confirmDelete?.eliminando ? <CircularProgress size={20} /> : null}
            >
              {confirmDelete?.eliminando ? 'Eliminando...' : 'Eliminar'}
            </Button>
          )}
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
