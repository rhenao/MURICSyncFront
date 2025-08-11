import React, { useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";
import Typography from "@mui/material/Typography";
import Link from "@mui/material/Link";
import { useNavigate } from "react-router-dom";
import { isAuthenticated } from "../../../utils/auth";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Aquí iría la lógica de autenticación
    isAuthenticated(username);
    //alert(`Usuario: ${username}\nClave: ${password}\nRecordar: ${remember}`);
    navigate("/");
  };

  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      minHeight="60vh"
    >
      <Typography variant="h3" gutterBottom color="primary">
        MURIC Sync v1.0
      </Typography>
      <Typography variant="h5" gutterBottom>
        Ingreso a la aplicación
      </Typography>
      <Box component="form" onSubmit={handleSubmit} sx={{ width: 300 }}>
        <TextField
          label="Usuario"
          variant="outlined"
          margin="normal"
          fullWidth
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoFocus
        />
        <TextField
          label="Clave"
          type="password"
          variant="outlined"
          margin="normal"
          fullWidth
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <FormControlLabel
          control={
            <Checkbox
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              color="primary"
            />
          }
          label="Recordar usuario"
        />
        <Button
          type="submit"
          variant="contained"
          color="primary"
          fullWidth
          sx={{ mt: 2 }}
        >
          Entrar
        </Button>
        <Box display="flex" justifyContent="flex-end" mt={1}>
          <Link href="#" variant="body2">
            ¿Olvidaste tu contraseña?
          </Link>
        </Box>
      </Box>
    </Box>
  );
}
