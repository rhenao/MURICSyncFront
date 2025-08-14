import React, { useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";
import Typography from "@mui/material/Typography";
import Link from "@mui/material/Link";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import { useNavigate } from "react-router-dom";
import AuthService from "../services/AuthService";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors([]);

    console.log("🚀 Iniciando login con:", {
      username,
      password: "***",
      remember,
    });

    try {
      const response = await AuthService.login({
        username,
        password,
        rememberMe: remember,
      });

      console.log("✅ Respuesta del login:", response);

      if (response.success) {
        console.log("✅ Login exitoso, navegando a /app");
        navigate("/app");
      } else {
        console.log("❌ Login fallido:", response.errors);
        const errorMessages =
          response.errors && response.errors.length > 0
            ? response.errors
            : ["Credenciales incorrectas. Intente nuevamente."];
        setErrors(errorMessages);
      }
    } catch (error) {
      console.error("💥 Error en catch del login:", error);
      // Manejo seguro del error sin concatenación directa
      let errorMessage = "Error inesperado. Intente nuevamente.";

      if (error instanceof Error) {
        errorMessage += ` (${error.message})`;
      }

      setErrors([errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "background.default",
        zIndex: 1,
      }}
    >
      <Typography variant="h3" gutterBottom color="primary" align="center">
        MURIC Sync v1.0
      </Typography>
      <Typography variant="h5" gutterBottom align="center">
        Ingreso a la aplicación
      </Typography>

      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{
          width: 300,
          maxWidth: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        {errors.length > 0 && (
          <Alert severity="error" sx={{ width: "100%", mb: 2 }}>
            {errors.map((error, index) => (
              <div key={index}>{error}</div>
            ))}
          </Alert>
        )}

        <TextField
          label="Usuario"
          variant="outlined"
          margin="normal"
          fullWidth
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoFocus
          disabled={loading}
          required
        />
        <TextField
          label="Clave"
          type="password"
          variant="outlined"
          margin="normal"
          fullWidth
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={loading}
          required
        />
        <FormControlLabel
          control={
            <Checkbox
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              color="primary"
              disabled={loading}
            />
          }
          label="Recordar usuario"
          sx={{ alignSelf: "flex-start" }}
        />
        <Button
          type="submit"
          variant="contained"
          color="primary"
          fullWidth
          sx={{ mt: 2 }}
          disabled={loading || !username || !password}
        >
          {loading ? <CircularProgress size={24} /> : "Entrar"}
        </Button>
        <Box display="flex" justifyContent="flex-end" width="100%" mt={1}>
          <Link href="#" variant="body2">
            ¿Olvidaste tu contraseña?
          </Link>
        </Box>
      </Box>
    </Box>
  );
}
