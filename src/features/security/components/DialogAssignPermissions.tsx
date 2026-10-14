import { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Checkbox,
  FormControlLabel,
  CircularProgress,
  Alert,
  Divider,
  Tooltip,
} from "@mui/material";
import { AxiosError } from "axios";
import type { Permission } from "../models/Permission.model";
import type { RoleWithPermissions } from "../models/Role.model";
import PermissionService from "../services/PermissionService";
import RoleService from "../services/RoleService";

interface DialogAssignPermissionsProps {
  open: boolean;
  role: RoleWithPermissions | null;
  onClose: () => void;
  onSaved: () => void;
}

function groupByModule(permissions: Permission[]): Record<string, Permission[]> {
  return permissions.reduce<Record<string, Permission[]>>((acc, perm) => {
    const key = perm.module ?? "Sin módulo";
    if (!acc[key]) acc[key] = [];
    acc[key].push(perm);
    return acc;
  }, {});
}

function extractErrorMessage(err: unknown): string {
  if (err instanceof AxiosError && err.response?.data) {
    const data = err.response.data as { errors?: string[]; message?: string };
    if (data.errors?.length) return data.errors[0];
    if (data.message) return data.message;
  }
  if (err instanceof Error) return err.message;
  return "Error al guardar los permisos.";
}

export default function DialogAssignPermissions({
  open,
  role,
  onClose,
  onSaved,
}: DialogAssignPermissionsProps) {
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loadingPerms, setLoadingPerms] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !role) return;

    setLoadingPerms(true);
    setError(null);

    PermissionService.getAll()
      .then((perms) => {
        setAllPermissions(perms);
        setSelectedIds(new Set(role.permissions.map((p) => p.id)));
      })
      .catch(() => setError("No se pudieron cargar los permisos."))
      .finally(() => setLoadingPerms(false));
  }, [open, role]);

  const togglePermission = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSave = async () => {
    if (!role) return;
    setSaving(true);
    setError(null);
    try {
      await RoleService.replacePermissions(role.id, {
        permissionIds: [...selectedIds],
      });
      onSaved();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    if (!saving) onClose();
  };

  const grouped = groupByModule(allPermissions);

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: { borderRadius: 2 } }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        Permisos del rol: <strong>{role?.name}</strong>
      </DialogTitle>

      <DialogContent sx={{ pt: 1 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {loadingPerms ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          Object.entries(grouped).map(([module, perms], idx) => (
            <Box key={module} sx={{ mb: 2 }}>
              {idx > 0 && <Divider sx={{ mb: 2 }} />}
              <Typography
                variant="subtitle2"
                color="primary"
                sx={{ textTransform: "uppercase", mb: 0.5 }}
              >
                {module}
              </Typography>
              {perms.map((perm) => (
                <Tooltip
                  key={perm.id}
                  title={
                    <span>
                      <strong>{perm.code}</strong>
                      {perm.description ? ` — ${perm.description}` : ""}
                    </span>
                  }
                  placement="right"
                >
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={selectedIds.has(perm.id)}
                        onChange={() => togglePermission(perm.id)}
                        disabled={saving}
                        size="small"
                      />
                    }
                    label={perm.name}
                    sx={{ display: "flex", ml: 0 }}
                  />
                </Tooltip>
              ))}
            </Box>
          ))
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={handleClose} disabled={saving} color="inherit">
          Cancelar
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={saving || loadingPerms}
          startIcon={saving ? <CircularProgress size={20} /> : null}
        >
          {saving ? "Guardando..." : "Guardar"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
