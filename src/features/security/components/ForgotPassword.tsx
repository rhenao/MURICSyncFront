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
} from "@mui/material";
import { Email as EmailIcon, ArrowBack as BackIcon } from "@mui/icons-material";
import { AxiosError } from "axios";

interface ForgotPasswordProps {
  open: boolean;
  onClose: () => void;
}

export default function ForgotPassword({ open, onClose }: ForgotPasswordProps) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [successMessage, setSuccessMessage] = useState("");
  const [emailSent, setEmailSent] = useState(false);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors([]);
    setSuccessMessage("");

    try {
      // Validaciones
      if (!email.trim()) {
        setErrors(["El email es requerido"]);
        return;
      }

      if (!validateEmail(email)) {
        setErrors(["Ingrese un email válido"]);
        return;
      }

      // TODO: Implementar llamada a la API
      console.log("Enviando email de recuperación a:", email);

      // Simulación de llamada a API
      // await AuthService.forgotPassword(email);

      // Simular delay de API
      await new Promise((resolve) => setTimeout(resolve, 2000));

      setEmailSent(true);
      setSuccessMessage(
        `Se ha enviado un enlace de recuperación a ${email}. Revisa tu bandeja de entrada y spam.`
      );
    } catch (error: unknown) {
      console.error("Error al enviar email de recuperación:", error);

      let errorMessages: string[] = [];

      if (error instanceof AxiosError) {
        if (error.response?.data?.errors) {
          errorMessages = error.response.data.errors;
        } else if (error.response?.data?.message) {
          errorMessages = [error.response.data.message];
        } else if (error.response?.status === 404) {
          errorMessages = ["No se encontró una cuenta con este email"];
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
        errorMessages = ["Error inesperado. Intente nuevamente."];
      }

      setErrors(errorMessages);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setEmail("");
      setErrors([]);
      setSuccessMessage("");
      setEmailSent(false);
      onClose();
    }
  };

  const handleTryAgain = () => {
    setEmailSent(false);
    setSuccessMessage("");
    setErrors([]);
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
        <EmailIcon color="primary" />
        {emailSent ? "Email Enviado" : "¿Olvidaste tu contraseña?"}
      </DialogTitle>

      <Box component="form" onSubmit={handleSubmit}>
        <DialogContent sx={{ pt: 1 }}>
          {!emailSent ? (
            <>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Ingresa tu email y te enviaremos un enlace para restablecer tu
                contraseña.
              </Typography>

              {errors.length > 0 && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {errors.map((error, index) => (
                    <div key={index}>{error}</div>
                  ))}
                </Alert>
              )}

              <TextField
                label="Email"
                type="email"
                fullWidth
                margin="normal"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.length > 0) setErrors([]);
                }}
                disabled={loading}
                required
                autoFocus
                placeholder="ejemplo@correo.com"
              />
            </>
          ) : (
            <>
              {successMessage && (
                <Alert severity="success" sx={{ mb: 2 }}>
                  {successMessage}
                </Alert>
              )}

              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Si no recibes el email en los próximos minutos:
              </Typography>

              <Box component="ul" sx={{ pl: 2, mt: 1 }}>
                <Typography
                  component="li"
                  variant="body2"
                  color="text.secondary"
                >
                  Verifica tu carpeta de spam
                </Typography>
                <Typography
                  component="li"
                  variant="body2"
                  color="text.secondary"
                >
                  Asegúrate de que el email sea correcto
                </Typography>
                <Typography
                  component="li"
                  variant="body2"
                  color="text.secondary"
                >
                  Contacta al administrador si persiste el problema
                </Typography>
              </Box>
            </>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3 }}>
          {!emailSent ? (
            <>
              <Button onClick={handleClose} disabled={loading} color="inherit">
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={loading || !email}
                startIcon={
                  loading ? <CircularProgress size={20} /> : <EmailIcon />
                }
              >
                {loading ? "Enviando..." : "Enviar Email"}
              </Button>
            </>
          ) : (
            <>
              <Button
                onClick={handleTryAgain}
                startIcon={<BackIcon />}
                color="inherit"
              >
                Intentar con otro email
              </Button>
              <Button onClick={handleClose} variant="contained">
                Cerrar
              </Button>
            </>
          )}
        </DialogActions>
      </Box>
    </Dialog>
  );
}
