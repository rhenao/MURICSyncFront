import React, { useState } from "react";
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
  Typography,
  IconButton,
  InputAdornment,
} from "@mui/material";
import {
  Visibility,
  VisibilityOff,
  VpnKey as KeyIcon,
} from "@mui/icons-material";
import { AxiosError } from "axios";
import { type UserInfoDto } from "../models/UserInfoDto";

interface DialogResetPasswordProps {
  open: boolean;
  onClose: () => void;
  user: UserInfoDto;
  onPasswordReset: (userId: string) => void;
}

interface PasswordData {
  newPassword: string;
  confirmPassword: string;
}

export default function DialogResetPassword({
  open,
  onClose,
  user,
  onPasswordReset,
}: DialogResetPasswordProps) {
  const [formData, setFormData] = useState<PasswordData>({
    newPassword: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const handleInputChange = (field: keyof PasswordData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    // Limpiar errores cuando el usuario empiece a escribir
    if (errors.length > 0) {
      setErrors([]);
    }
    // Limpiar mensaje de éxito
    if (successMessage) {
      setSuccessMessage("");
    }
  };

  const validatePasswords = (): string[] => {
    const validationErrors: string[] = [];

    if (!formData.newPassword.trim()) {
      validationErrors.push("La nueva contraseña es requerida");
    } else if (formData.newPassword.length < 6) {
      validationErrors.push("La contraseña debe tener al menos 6 caracteres");
    }

    if (!formData.confirmPassword.trim()) {
      validationErrors.push("La confirmación de contraseña es requerida");
    }

    if (formData.newPassword !== formData.confirmPassword) {
      validationErrors.push("Las contraseñas no coinciden");
    }

    return validationErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors([]);
    setSuccessMessage("");

    try {
      // Validaciones
      const validationErrors = validatePasswords();
      if (validationErrors.length > 0) {
        setErrors(validationErrors);
        return;
      }

      // TODO: Implementar llamada a la API
      console.log("Reseteando contraseña para usuario:", user.id);
      console.log("Nueva contraseña:", formData.newPassword);

      // Simulación de llamada a API
      // await UserService.resetPassword(user.id, formData.newPassword);

      // Simular delay de API
      await new Promise((resolve) => setTimeout(resolve, 1500));

      setSuccessMessage("Contraseña asignada exitosamente");
      onPasswordReset(user.id);

      // Limpiar formulario después de 2 segundos y cerrar
      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (error: unknown) {
      console.error("Error al resetear contraseña:", error);

      let errorMessages: string[] = [];

      if (error instanceof AxiosError) {
        if (error.response?.data?.errors) {
          errorMessages = error.response.data.errors;
        } else if (error.response?.data?.message) {
          errorMessages = [error.response.data.message];
        } else {
          errorMessages = [
            `Error ${error.response?.status}: ${
              error.response?.statusText || "Error del servidor"
            }`,
          ];
        }
      } else if (error instanceof Error) {
        errorMessages = [`Error: ${error.message}`];
      } else {
        errorMessages = [
          "Error inesperado al asignar la contraseña. Intente nuevamente.",
        ];
      }

      setErrors(errorMessages);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setFormData({
        newPassword: "",
        confirmPassword: "",
      });
      setErrors([]);
      setSuccessMessage("");
      setShowPassword(false);
      setShowConfirmPassword(false);
      onClose();
    }
  };

  const togglePasswordVisibility = (field: "password" | "confirm") => {
    if (field === "password") {
      setShowPassword(!showPassword);
    } else {
      setShowConfirmPassword(!showConfirmPassword);
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
      <DialogTitle
        sx={{ pb: 1, display: "flex", alignItems: "center", gap: 1 }}
      >
        <KeyIcon color="primary" />
        Asignar Nueva Contraseña
      </DialogTitle>

      <Box component="form" onSubmit={handleSubmit}>
        <DialogContent sx={{ pt: 1 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Asignando nueva contraseña para:{" "}
            <strong>{user.fullName || user.email}</strong>
          </Typography>

          <Alert severity="info" sx={{ mb: 2 }}>
            Como administrador, puedes asignar una nueva contraseña sin conocer
            la actual.
          </Alert>

          {successMessage && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {successMessage}
            </Alert>
          )}

          {errors.length > 0 && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {errors.map((error, index) => (
                <div key={index}>{error}</div>
              ))}
            </Alert>
          )}

          <TextField
            label="Nueva Contraseña"
            type={showPassword ? "text" : "password"}
            fullWidth
            margin="normal"
            value={formData.newPassword}
            onChange={(e) => handleInputChange("newPassword", e.target.value)}
            disabled={loading || !!successMessage}
            required
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => togglePasswordVisibility("password")}
                    edge="end"
                    disabled={loading || !!successMessage}
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            helperText="La contraseña debe tener al menos 6 caracteres"
          />

          <TextField
            label="Confirmar Nueva Contraseña"
            type={showConfirmPassword ? "text" : "password"}
            fullWidth
            margin="normal"
            value={formData.confirmPassword}
            onChange={(e) =>
              handleInputChange("confirmPassword", e.target.value)
            }
            disabled={loading || !!successMessage}
            required
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => togglePasswordVisibility("confirm")}
                    edge="end"
                    disabled={loading || !!successMessage}
                  >
                    {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={handleClose} disabled={loading} color="inherit">
            {successMessage ? "Cerrar" : "Cancelar"}
          </Button>
          {!successMessage && (
            <Button
              type="submit"
              variant="contained"
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : <KeyIcon />}
            >
              {loading ? "Asignando..." : "Asignar Contraseña"}
            </Button>
          )}
        </DialogActions>
      </Box>
    </Dialog>
  );
}
