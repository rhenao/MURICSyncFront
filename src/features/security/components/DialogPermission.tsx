import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  CircularProgress,
  Alert,
  Autocomplete,
} from "@mui/material";
import { AxiosError } from "axios";
import type { Permission, CreatePermissionDto, UpdatePermissionDto } from "../models/Permission.model";
import PermissionService from "../services/PermissionService";

const MODULE_SUGGESTIONS = ["params", "cargas", "usuarios", "roles", "seguridad"];

interface DialogPermissionProps {
  open: boolean;
  permission?: Permission | null;
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
  return ["Error al guardar el permiso. Intente nuevamente."];
}

export default function DialogPermission({
  open,
  permission,
  onClose,
  onSaved,
}: DialogPermissionProps) {
  const isEditing = permission != null;

  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [module, setModule] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    if (open) {
      setCode(permission?.code ?? "");
      setName(permission?.name ?? "");
      setModule(permission?.module ?? null);
      setDescription(permission?.description ?? "");
      setErrors([]);
    }
  }, [open, permission]);

  const clearErrors = () => { if (errors.length > 0) setErrors([]); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationErrors: string[] = [];
    if (!isEditing && !code.trim()) validationErrors.push("El código es requerido.");
    if (!isEditing && code.trim().length > 200) validationErrors.push("El código no puede superar 200 caracteres.");
    if (!name.trim()) validationErrors.push("El nombre es requerido.");
    if (name.trim().length > 200) validationErrors.push("El nombre no puede superar 200 caracteres.");
    if ((module ?? "").length > 100) validationErrors.push("El módulo no puede superar 100 caracteres.");

    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    setSaving(true);
    setErrors([]);

    try {
      if (isEditing) {
        const dto: UpdatePermissionDto = {
          name: name.trim(),
          module: module?.trim() || undefined,
          description: description.trim() || undefined,
        };
        await PermissionService.update(permission.id, dto);
      } else {
        const dto: CreatePermissionDto = {
          code: code.trim(),
          name: name.trim(),
          module: module?.trim() || undefined,
          description: description.trim() || undefined,
        };
        await PermissionService.create(dto);
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
        {isEditing ? `Editar permiso: ${permission.code}` : "Nuevo permiso"}
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
            label="Código"
            fullWidth
            margin="normal"
            value={code}
            onChange={(e) => { setCode(e.target.value); clearErrors(); }}
            disabled={saving || isEditing}
            required={!isEditing}
            inputProps={{ maxLength: 200 }}
            helperText={isEditing ? "El código no se puede modificar después de creado." : 'Ej: "params.read"'}
          />

          <TextField
            label="Nombre"
            fullWidth
            margin="normal"
            value={name}
            onChange={(e) => { setName(e.target.value); clearErrors(); }}
            disabled={saving}
            required
            inputProps={{ maxLength: 200 }}
          />

          <Autocomplete
            freeSolo
            options={MODULE_SUGGESTIONS}
            value={module}
            onChange={(_, newValue) => { setModule(newValue); clearErrors(); }}
            onInputChange={(_, newInput) => { setModule(newInput || null); clearErrors(); }}
            disabled={saving}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Módulo"
                margin="normal"
                fullWidth
                inputProps={{ ...params.inputProps, maxLength: 100 }}
                helperText="Agrupa el permiso. Ej: params, cargas, usuarios"
              />
            )}
          />

          <TextField
            label="Descripción"
            fullWidth
            margin="normal"
            multiline
            minRows={2}
            value={description}
            onChange={(e) => { setDescription(e.target.value); clearErrors(); }}
            disabled={saving}
          />
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
