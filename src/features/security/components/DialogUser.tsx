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
  InputLabel,
  Select,
  MenuItem,
  Chip,
  OutlinedInput,
  CircularProgress,
  Alert,
  type SelectChangeEvent,
} from "@mui/material";
import { type UserInfoDto } from "../models/UserInfoDto.ts";

interface DialogUserProps {
  open: boolean;
  onClose: () => void;
  onSave: (user: Partial<UserInfoDto>) => Promise<void>;
  user?: UserInfoDto; // Para edición (opcional)
  title?: string;
}

const availableRoles = ["Admin", "Operador", "Supervisor", "Consulta"]; // Obtener de API o constantes

export default function DialogUser({
  open,
  onClose,
  onSave,
  user,
  title = "Agregar Usuario",
}: DialogUserProps) {
  const [formData, setFormData] = useState({
    email: user?.email || "",
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    roles: user?.roles || [],
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  // Agregar useEffect para actualizar el formulario cuando cambie el usuario
  useEffect(() => {
    if (user) {
      setFormData({
        email: user.email || "",
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        roles: user.roles || [],
      });
    } else {
      setFormData({
        email: "",
        firstName: "",
        lastName: "",
        roles: [],
      });
    }
  }, [user]);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    // Limpiar errores cuando el usuario empiece a escribir
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

    try {
      // Validaciones básicas
      const validationErrors: string[] = [];

      if (!formData.email.trim()) {
        validationErrors.push("El email es requerido");
      }
      if (!formData.firstName.trim()) {
        validationErrors.push("El nombre es requerido");
      }
      if (!formData.lastName.trim()) {
        validationErrors.push("El apellido es requerido");
      }
      if (formData.roles.length === 0) {
        validationErrors.push("Debe seleccionar al menos un rol");
      }

      if (validationErrors.length > 0) {
        setErrors(validationErrors);
        return;
      }

      await onSave({
        ...formData,
        fullName: `${formData.firstName} ${formData.lastName}`.trim(),
      });

      // Limpiar formulario y cerrar
      setFormData({
        email: "",
        firstName: "",
        lastName: "",
        roles: [],
      });
      onClose();
    } catch (error: unknown) {
      console.error("Error al guardar usuario:", error);

      let errorMessage = "Error al guardar el usuario. Intente nuevamente.";

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
      setFormData({
        email: "",
        firstName: "",
        lastName: "",
        roles: [],
      });
      setErrors([]);
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
      <DialogTitle sx={{ pb: 1 }}>{title}</DialogTitle>

      <Box component="form" onSubmit={handleSubmit}>
        <DialogContent sx={{ pt: 1 }}>
          {errors.length > 0 && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {errors.map((error, index) => (
                <div key={index}>{error}</div>
              ))}
            </Alert>
          )}

          <TextField
            label="Usuario/Email"
            type="email"
            fullWidth
            margin="normal"
            value={formData.email}
            onChange={(e) => handleInputChange("email", e.target.value)}
            disabled={loading}
            required
          />

          <TextField
            label="Nombre"
            fullWidth
            margin="normal"
            value={formData.firstName}
            onChange={(e) => handleInputChange("firstName", e.target.value)}
            disabled={loading}
            required
          />

          <TextField
            label="Apellido"
            fullWidth
            margin="normal"
            value={formData.lastName}
            onChange={(e) => handleInputChange("lastName", e.target.value)}
            disabled={loading}
            required
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
