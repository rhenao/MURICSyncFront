import React, { useState } from "react";
import {
  Card,
  TextField,
  Button,
  Box,
  CircularProgress,
  Alert,
  //Typography,
  IconButton,
  InputAdornment,
  CardContent,
  CardHeader,
} from "@mui/material";
import {
  Visibility,
  VisibilityOff,
  VpnKey as KeyIcon,
  Save as SaveIcon,
} from "@mui/icons-material";
import { AxiosError } from "axios";
import AuthService from "../services/AuthService";

interface PasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export default function PasswordChange() {
  const [formData, setFormData] = useState<PasswordData>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const currentUser = AuthService.getUser();

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

    if (!formData.currentPassword.trim()) {
      validationErrors.push("La contraseña actual es requerida");
    }

    if (!formData.newPassword.trim()) {
      validationErrors.push("La nueva contraseña es requerida");
    } else if (formData.newPassword.length < 6) {
      validationErrors.push(
        "La nueva contraseña debe tener al menos 6 caracteres"
      );
    }

    if (!formData.confirmPassword.trim()) {
      validationErrors.push("La confirmación de contraseña es requerida");
    }

    if (formData.newPassword !== formData.confirmPassword) {
      validationErrors.push("Las contraseñas nuevas no coinciden");
    }

    if (formData.currentPassword === formData.newPassword) {
      validationErrors.push(
        "La nueva contraseña debe ser diferente a la actual"
      );
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
      console.log("Cambiando contraseña para usuario actual:", currentUser?.id);
      console.log("Contraseña actual:", formData.currentPassword);
      console.log("Nueva contraseña:", formData.newPassword);

      // Simulación de llamada a API
      // await UserService.changeMyPassword({
      //   currentPassword: formData.currentPassword,
      //   newPassword: formData.newPassword
      // });

      // Simular delay de API
      await new Promise((resolve) => setTimeout(resolve, 1500));

      setSuccessMessage("Contraseña cambiada exitosamente");

      // Limpiar formulario después del éxito
      setFormData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error: unknown) {
      console.error("Error al cambiar contraseña:", error);

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
          "Error inesperado al cambiar la contraseña. Intente nuevamente.",
        ];
      }

      setErrors(errorMessages);
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = (field: "current" | "new" | "confirm") => {
    switch (field) {
      case "current":
        setShowCurrentPassword(!showCurrentPassword);
        break;
      case "new":
        setShowNewPassword(!showNewPassword);
        break;
      case "confirm":
        setShowConfirmPassword(!showConfirmPassword);
        break;
    }
  };

  return (
    <Card
      sx={{
        maxWidth: 600,
        mx: "auto",
        mt: 2,
        backgroundColor: "background.paper",
      }}
    >
      <CardHeader
        avatar={<KeyIcon color="primary" />}
        title="Cambiar Contraseña"
        subheader={`Usuario: ${
          currentUser?.fullName || currentUser?.email || "No identificado"
        }`}
        sx={{ pb: 1 }}
      />

      <CardContent>
        {successMessage && (
          <Alert severity="success" sx={{ mb: 3 }}>
            {successMessage}
          </Alert>
        )}

        {errors.length > 0 && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {errors.map((error, index) => (
              <div key={index}>{error}</div>
            ))}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            label="Contraseña Actual"
            type={showCurrentPassword ? "text" : "password"}
            fullWidth
            margin="normal"
            value={formData.currentPassword}
            onChange={(e) =>
              handleInputChange("currentPassword", e.target.value)
            }
            disabled={loading}
            required
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => togglePasswordVisibility("current")}
                    edge="end"
                    disabled={loading}
                  >
                    {showCurrentPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <TextField
            label="Nueva Contraseña"
            type={showNewPassword ? "text" : "password"}
            fullWidth
            margin="normal"
            value={formData.newPassword}
            onChange={(e) => handleInputChange("newPassword", e.target.value)}
            disabled={loading}
            required
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => togglePasswordVisibility("new")}
                    edge="end"
                    disabled={loading}
                  >
                    {showNewPassword ? <VisibilityOff /> : <Visibility />}
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
            disabled={loading}
            required
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => togglePasswordVisibility("confirm")}
                    edge="end"
                    disabled={loading}
                  >
                    {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <Box
            sx={{ display: "flex", justifyContent: "flex-end", mt: 3, gap: 2 }}
          >
            <Button
              variant="outlined"
              onClick={() => {
                setFormData({
                  currentPassword: "",
                  newPassword: "",
                  confirmPassword: "",
                });
                setErrors([]);
                setSuccessMessage("");
              }}
              disabled={loading}
            >
              Limpiar
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={loading}
              startIcon={
                loading ? <CircularProgress size={20} /> : <SaveIcon />
              }
            >
              {loading ? "Guardando..." : "Cambiar Contraseña"}
            </Button>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
