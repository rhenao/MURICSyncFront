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
import type { Permission } from "../models/Permission.model";
import PermissionService from "../services/PermissionService";
import { usePermission } from "../../auth/hooks/usePermission";
import DialogPermission from "./DialogPermission";

const MODULE_COLORS: Record<string, "primary" | "info" | "success" | "warning" | "error" | "default"> = {
  params: "primary",
  cargas: "info",
  usuarios: "success",
  roles: "warning",
  seguridad: "error",
};

function moduleColor(mod?: string): "primary" | "info" | "success" | "warning" | "error" | "default" {
  if (!mod) return "default";
  return MODULE_COLORS[mod.toLowerCase()] ?? "default";
}

function extractErrorMessage(err: unknown): string {
  if (err instanceof AxiosError && err.response?.data) {
    const data = err.response.data as { errors?: string[]; message?: string };
    if (data.errors?.length) return data.errors[0];
    if (data.message) return data.message;
  }
  if (err instanceof Error) return err.message;
  return "Error desconocido.";
}

export default function ListPermissions() {
  const { hasPermission } = usePermission();
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [permDialogOpen, setPermDialogOpen] = useState(false);
  const [editingPerm, setEditingPerm] = useState<Permission | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Permission | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const loadPermissions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await PermissionService.getAll();
      setPermissions(data);
    } catch {
      setError("No se pudieron cargar los permisos. Intente nuevamente.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPermissions();
  }, [loadPermissions]);

  if (!hasPermission("roles.manage")) {
    return <Navigate to="/app" replace />;
  }

  const handleEdit = (perm: Permission) => {
    setEditingPerm(perm);
    setPermDialogOpen(true);
  };

  const openDeleteConfirm = (perm: Permission) => {
    setDeleteError(null);
    setDeleteTarget(perm);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await PermissionService.remove(deleteTarget.id);
      setDeleteTarget(null);
      loadPermissions();
    } catch (err) {
      setDeleteError(extractErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  const columns: MRT_ColumnDef<Permission>[] = [
    {
      accessorKey: "code",
      header: "Código",
      size: 180,
      Cell: ({ cell }) => (
        <Typography variant="body2" sx={{ fontFamily: "monospace" }}>
          {cell.getValue<string>()}
        </Typography>
      ),
    },
    {
      accessorKey: "name",
      header: "Nombre",
      size: 220,
    },
    {
      accessorKey: "module",
      header: "Módulo",
      size: 130,
      Cell: ({ cell }) => {
        const mod = cell.getValue<string | undefined>();
        return mod ? (
          <Chip label={mod} size="small" color={moduleColor(mod)} />
        ) : (
          <Typography variant="body2" color="text.disabled">
            —
          </Typography>
        );
      },
    },
    {
      accessorKey: "description",
      header: "Descripción",
      size: 300,
    },
    {
      header: "Acciones",
      size: 180,
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
            color="error"
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
          data={permissions}
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
                Permisos
              </Typography>
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={() => { setEditingPerm(null); setPermDialogOpen(true); }}
                sx={{ fontSize: "0.875rem", px: 2, py: 1 }}
              >
                Nuevo permiso
              </Button>
            </Box>
          )}
        />
      </Card>

      <DialogPermission
        open={permDialogOpen}
        permission={editingPerm}
        onClose={() => setPermDialogOpen(false)}
        onSaved={() => { setPermDialogOpen(false); loadPermissions(); }}
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
            ¿Está seguro de que desea eliminar el permiso{" "}
            <strong>{deleteTarget?.code}</strong>? Esta acción no se puede deshacer.
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
