import { useState, useEffect, useCallback } from "react";
import { Navigate } from "react-router-dom";
import { MaterialReactTable, type MRT_ColumnDef } from "material-react-table";
import {
  Button,
  Card,
  Typography,
  Chip,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Alert,
} from "@mui/material";
import { Add as AddIcon } from "@mui/icons-material";
import { AxiosError } from "axios";
import type { RoleWithPermissions } from "../models/Role.model";
import RoleService from "../services/RoleService";
import { usePermission } from "../../auth/hooks/usePermission";
import DialogRole from "./DialogRole";
import DialogAssignPermissions from "./DialogAssignPermissions";

function extractErrorMessage(err: unknown): string {
  if (err instanceof AxiosError && err.response?.data) {
    const data = err.response.data as { errors?: string[]; message?: string };
    if (data.errors?.length) return data.errors[0];
    if (data.message) return data.message;
  }
  if (err instanceof Error) return err.message;
  return "Error desconocido.";
}

const PREDEFINED_ROLES = new Set(["ADMIN", "CONSULTA", "OPERADOR", "SEGURIDAD"]);

export default function ListRoles() {
  const { hasPermission } = usePermission();
  const [roles, setRoles] = useState<RoleWithPermissions[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleWithPermissions | null>(null);
  const [assignPermOpen, setAssignPermOpen] = useState(false);
  const [assignPermRole, setAssignPermRole] = useState<RoleWithPermissions | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<RoleWithPermissions | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const loadRoles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await RoleService.getAll();
      setRoles(data);
    } catch {
      setError("No se pudieron cargar los roles. Intente nuevamente.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRoles();
  }, [loadRoles]);

  if (!hasPermission("roles.manage")) {
    return <Navigate to="/app" replace />;
  }

  const handleEdit = (role: RoleWithPermissions) => {
    setEditingRole(role);
    setRoleDialogOpen(true);
  };

  const handleAssignPerms = (role: RoleWithPermissions) => {
    setAssignPermRole(role);
    setAssignPermOpen(true);
  };

  const openDeleteConfirm = (role: RoleWithPermissions) => {
    setDeleteError(null);
    setDeleteTarget(role);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await RoleService.remove(deleteTarget.id);
      setDeleteTarget(null);
      loadRoles();
    } catch (err) {
      setDeleteError(extractErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  const columns: MRT_ColumnDef<RoleWithPermissions>[] = [
    {
      accessorKey: "name",
      header: "Nombre",
      size: 180,
    },
    {
      accessorKey: "description",
      header: "Descripción",
      size: 280,
    },
    {
      accessorKey: "isActive",
      header: "Activo",
      size: 100,
      Cell: ({ cell }) => (
        <Chip
          label={cell.getValue<boolean>() ? "Sí" : "No"}
          size="small"
          color={cell.getValue<boolean>() ? "success" : "default"}
        />
      ),
    },
    {
      accessorKey: "permissions",
      header: "Permisos",
      size: 130,
      Cell: ({ row }) => {
        const count = row.original.permissions.length;
        return (
          <Typography variant="body2" color="text.secondary">
            {count} {count === 1 ? "permiso" : "permisos"}
          </Typography>
        );
      },
    },
    {
      accessorKey: "createdAt",
      header: "Creado",
      size: 150,
      Cell: ({ cell }) => (
        <Typography variant="body2">
          {new Date(cell.getValue<string>()).toLocaleDateString("es-CO")}
        </Typography>
      ),
    },
    {
      header: "Acciones",
      size: 260,
      Cell: ({ row }) => (
        <Box sx={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <Button
            sx={{ fontSize: "0.675rem", minWidth: 0, px: 1 }}
            variant="contained"
            onClick={() => handleEdit(row.original)}
          >
            Editar
          </Button>
          <Button
            sx={{ fontSize: "0.675rem", minWidth: 0, px: 1 }}
            variant="contained"
            color="info"
            onClick={() => handleAssignPerms(row.original)}
          >
            Permisos
          </Button>
          <Button
            sx={{ fontSize: "0.675rem", minWidth: 0, px: 1 }}
            variant="contained"
            color="error"
            disabled={PREDEFINED_ROLES.has(row.original.name)}
            onClick={() => openDeleteConfirm(row.original)}
          >
            Eliminar
          </Button>
        </Box>
      ),
    },
  ];

  return (
    <>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Card
        sx={{
          width: "100%",
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "stretch",
          justifyContent: "flex-start",
          boxSizing: "border-box",
          backgroundColor: "background.default",
          p: 2,
          minWidth: 0,
          maxWidth: "100vw",
        }}
      >
        <MaterialReactTable
          columns={columns}
          data={roles}
          getRowId={(row) => row.id}
          state={{ isLoading: loading }}
          enableColumnActions={false}
          enableColumnFilters={false}
          enableSorting={true}
          enablePagination={false}
          muiTableProps={{ size: "small" }}
          muiTableBodyRowProps={{ hover: true }}
          muiTableContainerProps={{
            sx: {
              width: "100%",
              flex: 1,
              minWidth: 0,
              maxWidth: "100vw",
              backgroundColor: "background.paper",
              maxHeight: "65vh",
              overflowY: "auto",
              overflowX: "auto",
            },
          }}
          muiTablePaperProps={{
            sx: {
              width: "100%",
              flex: 1,
              minWidth: 0,
              maxWidth: "100vw",
              boxShadow: "none",
              backgroundColor: "background.paper",
            },
          }}
          muiTableHeadCellProps={{ sx: { fontSize: "1.15rem" } }}
          muiTableBodyCellProps={{ sx: { fontSize: "1.1rem" } }}
          renderTopToolbarCustomActions={() => (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                width: "100%",
                pl: 2,
                pr: 2,
              }}
            >
              <Typography variant="h6" color="text.secondary">
                Roles
              </Typography>
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={() => { setEditingRole(null); setRoleDialogOpen(true); }}
                sx={{ fontSize: "0.875rem", px: 2, py: 1 }}
              >
                Nuevo rol
              </Button>
            </Box>
          )}
        />
      </Card>

      <DialogRole
        open={roleDialogOpen}
        role={editingRole}
        onClose={() => setRoleDialogOpen(false)}
        onSaved={() => { setRoleDialogOpen(false); loadRoles(); }}
      />

      <DialogAssignPermissions
        open={assignPermOpen}
        role={assignPermRole}
        onClose={() => setAssignPermOpen(false)}
        onSaved={() => { setAssignPermOpen(false); loadRoles(); }}
      />

      <Dialog
        open={deleteTarget !== null}
        onClose={() => !deleting && setDeleteTarget(null)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2 } }}
      >
        <DialogTitle>Confirmar eliminación</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Está seguro de que desea eliminar el rol{" "}
            <strong>{deleteTarget?.name}</strong>? Esta acción no se puede deshacer.
          </DialogContentText>
          {deleteError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {deleteError}
            </Alert>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            onClick={() => setDeleteTarget(null)}
            disabled={deleting}
            color="inherit"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            disabled={deleting}
            variant="contained"
            color="error"
          >
            {deleting ? "Eliminando..." : "Eliminar"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
