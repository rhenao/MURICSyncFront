import React, { useState } from "react";
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
import type RegisterDto from "../models/RegisterDto";
import axiosSecurityAPIClient from "../../../api/axiosSecurityAPIClient";

interface CrearUserProps {
  open: boolean;
  onClose: () => void;
  onUserCreated?: () => void;
}

const availableRoles = ["ADMIN", "OPERADOR", "SEGURIDAD", "CONSULTA"];

export default function DialogRegisterUser({
  open,
  onClose,
  onUserCreated,
}: CrearUserProps) {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    numDocument: "",
    roles: [] as string[],
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [success, setSuccess] = useState(false);

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

      if (!formData.email.trim()) {
        validationErrors.push("El email es requerido");
      }
      if (!formData.password.trim()) {
        validationErrors.push("La contraseña es requerida");
      } else if (formData.password.length < 6) {
        validationErrors.push("La contraseña debe tener al menos 6 caracteres");
      }
      if (formData.password !== formData.confirmPassword) {
        validationErrors.push("Las contraseñas no coinciden");
      }
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

      const registerDto: RegisterDto = {
        email: formData.email.trim(),
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        numDocument: formData.numDocument.trim(),
        dateOfBirth: new Date().toISOString(),
        roles: formData.roles,
      };

      await axiosSecurityAPIClient.post("/Auth/register", registerDto);

      setSuccess(true);
      setFormData({
        email: "",
        password: "",
        confirmPassword: "",
        firstName: "",
        lastName: "",
        numDocument: "",
        roles: [],
      });
      onUserCreated?.();
    } catch (error: unknown) {
      console.error("Error al registrar usuario:", error);

      let errorMessage = "Error al registrar el usuario. Intente nuevamente.";
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
        password: "",
        confirmPassword: "",
        firstName: "",
        lastName: "",
        numDocument: "",
        roles: [],
      });
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
      <DialogTitle sx={{ pb: 1 }}>Crear Usuario</DialogTitle>

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
              Usuario registrado exitosamente.
            </Alert>
          )}

          <TextField
            label="Email"
            type="email"
            fullWidth
            margin="normal"
            value={formData.email}
            onChange={(e) => handleInputChange("email", e.target.value)}
            disabled={loading}
            required
            autoComplete="off"
            inputProps={{ maxLength: 100 }}
          />

          <TextField
            label="Contraseña"
            type="password"
            fullWidth
            margin="normal"
            value={formData.password}
            onChange={(e) => handleInputChange("password", e.target.value)}
            disabled={loading}
            required
            autoComplete="new-password"
            inputProps={{ maxLength: 100 }}
          />

          <TextField
            label="Confirmar Contraseña"
            type="password"
            fullWidth
            margin="normal"
            value={formData.confirmPassword}
            onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
            disabled={loading}
            required
            inputProps={{ maxLength: 100 }}
          />

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
            {loading ? "Registrando..." : "Registrar"}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
