import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  FormControlLabel,
  Switch,
  CircularProgress,
  Alert,
} from "@mui/material";
import { AxiosError } from "axios";
import type { RoleWithPermissions, CreateRoleDto, UpdateRoleDto } from "../models/Role.model";
import RoleService from "../services/RoleService";

interface DialogRoleProps {
  open: boolean;
  role?: RoleWithPermissions | null;
  onClose: () => void;
  onSaved: () => void;
}

function extractBackendErrors(err: unknown): string[] {
  if (err instanceof AxiosError && err.response?.data) {
    const data = err.response.data as { errors?: string[]; message?: string };
    if (data.errors?.length) return data.errors;
    if (data.message) return [data.message];
  }
  if (err instanceof Error) return [err.message];
  return ["Error al guardar el rol. Intente nuevamente."];
}

export default function DialogRole({ open, role, onClose, onSaved }: DialogRoleProps) {
  const isEditing = role != null;

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    if (open) {
      setName(role?.name ?? "");
      setDescription(role?.description ?? "");
      setIsActive(role?.isActive ?? true);
      setErrors([]);
    }
  }, [open, role]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationErrors: string[] = [];
    if (!name.trim()) validationErrors.push("El nombre es requerido.");
    if (name.trim().length > 256) validationErrors.push("El nombre no puede superar 256 caracteres.");
    if (description.length > 500) validationErrors.push("La descripción no puede superar 500 caracteres.");

    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    setSaving(true);
    setErrors([]);

    try {
      if (isEditing) {
        const dto: UpdateRoleDto = {
          name: name.trim(),
          description: description.trim() || undefined,
          isActive,
        };
        await RoleService.update(role.id, dto);
      } else {
        const dto: CreateRoleDto = {
          name: name.trim(),
          description: description.trim() || undefined,
        };
        await RoleService.create(dto);
      }
      onSaved();
    } catch (err) {
      setErrors(extractBackendErrors(err));
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    if (!saving) onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: { borderRadius: 2 } }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        {isEditing ? `Editar rol: ${role.name}` : "Nuevo rol"}
      </DialogTitle>

      <Box component="form" onSubmit={handleSubmit}>
        <DialogContent sx={{ pt: 1 }}>
          {errors.length > 0 && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {errors.map((msg, i) => (
                <div key={i}>{msg}</div>
              ))}
            </Alert>
          )}

          <TextField
            label="Nombre"
            fullWidth
            margin="normal"
            value={name}
            onChange={(e) => { setName(e.target.value); setErrors([]); }}
            disabled={saving}
            required
            inputProps={{ maxLength: 256 }}
          />

          <TextField
            label="Descripción"
            fullWidth
            margin="normal"
            multiline
            minRows={2}
            value={description}
            onChange={(e) => { setDescription(e.target.value); setErrors([]); }}
            disabled={saving}
            inputProps={{ maxLength: 500 }}
          />

          {isEditing && (
            <FormControlLabel
              control={
                <Switch
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  disabled={saving}
                />
              }
              label="Activo"
              sx={{ mt: 1 }}
            />
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={handleClose} disabled={saving} color="inherit">
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={saving}
            startIcon={saving ? <CircularProgress size={20} /> : null}
          >
            {saving ? "Guardando..." : "Guardar"}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
