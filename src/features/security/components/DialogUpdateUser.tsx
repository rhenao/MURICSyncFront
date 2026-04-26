import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  FormControl,
  FormControlLabel,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  OutlinedInput,
  CircularProgress,
  Alert,
  Switch,
  type SelectChangeEvent,
} from "@mui/material";
import type UpdateUserDto from "../models/UpdateUserDto";
import type { UserInfoDto } from "../models/UserInfoDto";
import axiosSecurityAPIClient from "../../../api/axiosSecurityAPIClient";

interface DialogUpdateUserProps {
  open: boolean;
  onClose: () => void;
  onUserUpdated?: () => void;
  user: UserInfoDto;
}

const availableRoles = ["ADMIN", "OPERADOR", "SEGURIDAD", "CONSULTA"];

export default function DialogUpdateUser({
  open,
  onClose,
  onUserUpdated,
  user,
}: DialogUpdateUserProps) {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    numDocument: "",
    isActive: true,
    roles: [] as string[],
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        numDocument: (user as unknown as Record<string, string>).numDocument || "",
        isActive: (user as unknown as Record<string, boolean>).isActive ?? true,
        roles: user.roles || [],
      });
      setErrors([]);
      setSuccess(false);
    }
  }, [user]);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    if (errors.length > 0) {
      setErrors([]);
    }
  };

  const handleRoleChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value;
    setFormData((prev) => ({
      ...prev,
      roles: typeof value === "string" ? value.split(",") : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors([]);
    setSuccess(false);

    try {
      const validationErrors: string[] = [];

      if (!formData.firstName.trim()) {
        validationErrors.push("El nombre es requerido");
      }
      if (!formData.lastName.trim()) {
        validationErrors.push("El apellido es requerido");
      }
      if (!formData.numDocument.trim()) {
        validationErrors.push("El número de documento es requerido");
      }
      if (formData.roles.length === 0) {
        validationErrors.push("Debe seleccionar al menos un rol");
      }

      if (validationErrors.length > 0) {
        setErrors(validationErrors);
        return;
      }

      const updateDto: UpdateUserDto = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        numDocument: formData.numDocument.trim(),
        isActive: formData.isActive,
        roles: formData.roles,
      };

      await axiosSecurityAPIClient.put(`/Auth/users/${user.id}`, updateDto);

      setSuccess(true);
      onUserUpdated?.();
    } catch (error: unknown) {
      console.error("Error al actualizar usuario:", error);

      let errorMessage = "Error al actualizar el usuario. Intente nuevamente.";
      if (error instanceof Error) {
        errorMessage += ` (${error.message})`;
      }
      setErrors([errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setErrors([]);
      setSuccess(false);
      onClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2 },
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>Editar Usuario</DialogTitle>

      <Box component="form" onSubmit={handleSubmit}>
        <DialogContent sx={{ pt: 1 }}>
          {errors.length > 0 && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {errors.map((error, index) => (
                <div key={index}>{error}</div>
              ))}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              Usuario actualizado exitosamente.
            </Alert>
          )}

          <TextField
            label="Nombre"
            fullWidth
            margin="normal"
            value={formData.firstName}
            onChange={(e) => handleInputChange("firstName", e.target.value)}
            disabled={loading}
            required
            inputProps={{ maxLength: 100 }}
          />

          <TextField
            label="Apellido"
            fullWidth
            margin="normal"
            value={formData.lastName}
            onChange={(e) => handleInputChange("lastName", e.target.value)}
            disabled={loading}
            required
            inputProps={{ maxLength: 100 }}
          />

          <TextField
            label="Número de Documento"
            fullWidth
            margin="normal"
            value={formData.numDocument}
            onChange={(e) => handleInputChange("numDocument", e.target.value)}
            disabled={loading}
            required
            inputProps={{ maxLength: 15 }}
          />

          <FormControlLabel
            control={
              <Switch
                checked={formData.isActive}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, isActive: e.target.checked }))
                }
                disabled={loading}
              />
            }
            label="Activo"
            sx={{ mt: 1, mb: 1 }}
          />

          <FormControl fullWidth margin="normal" required>
            <InputLabel>Roles</InputLabel>
            <Select
              multiple
              value={formData.roles}
              onChange={handleRoleChange}
              input={<OutlinedInput label="Roles" />}
              disabled={loading}
              renderValue={(selected) => (
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                  {selected.map((value) => (
                    <Chip key={value} label={value} size="small" />
                  ))}
                </Box>
              )}
            >
              {availableRoles.map((role) => (
                <MenuItem key={role} value={role}>
                  {role}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={handleClose} disabled={loading} color="inherit">
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            {loading ? "Guardando..." : "Guardar"}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
