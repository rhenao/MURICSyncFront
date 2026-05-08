import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Stack,
  Typography,
} from "@mui/material";
import { Link } from "react-router-dom";
import useAuth from "../../auth/hooks/useAuth";

interface QuickAction {
  label: string;
  to: string;
}

export default function LandingPage() {
  const { user } = useAuth();
  const roles = user?.roles ?? [];

  const hasRole = (...allowedRoles: string[]) =>
    allowedRoles.some((role) => roles.includes(role));

  const quickActions: QuickAction[] = [];

  if (hasRole("ADMIN", "OPERADOR")) {
    quickActions.push({ label: "Cargue de archivos", to: "/app/carga-archivos" });
  }

  if (hasRole("ADMIN", "OPERADOR", "CONSULTA")) {
    quickActions.push({ label: "Consultas", to: "/app/archivos-cargados" });
  }

  if (hasRole("ADMIN", "SEGURIDAD")) {
    quickActions.push({ label: "Administración de usuarios", to: "/app/lista-usuarios" });
  }

  quickActions.push({ label: "Cambio de contraseña", to: "/app/cambiar-contrasena" });

  return (
    <Stack spacing={2.2} sx={{ pb: 1 }}>
      <Card
        sx={{
          position: "relative",
          overflow: "hidden",
          borderRadius: 3,
          border: "1px solid rgba(37,64,146,0.12)",
          background:
            "linear-gradient(120deg, rgba(37,64,146,0.93) 0%, rgba(0,114,206,0.88) 62%, rgba(0,114,206,0.78) 100%)",
          color: "common.white",
        }}
      >
        <Box
          sx={{
            position: "absolute",
            top: -82,
            right: -70,
            width: 240,
            height: 240,
            borderRadius: "50%",
            bgcolor: "rgba(255,255,255,0.10)",
          }}
        />
        <Box
          sx={{
            position: "absolute",
            bottom: -100,
            left: -30,
            width: 220,
            height: 220,
            borderRadius: "50%",
            bgcolor: "rgba(255,255,255,0.08)",
          }}
        />

        <CardContent sx={{ p: { xs: 2.25, md: 3 } }}>
          <Stack spacing={1.2} sx={{ position: "relative", zIndex: 1 }}>
            <Typography sx={{ opacity: 0.9, fontWeight: 600 }}>
              Plataforma Regulatoria
            </Typography>
            <Typography variant="h4" sx={{ fontSize: { xs: 26, md: 34 } }}>
              Bienvenido a MURIC Sync
            </Typography>
            <Typography sx={{ maxWidth: 760, opacity: 0.94 }}>
              Centraliza cargues, validaciones, consultas y envio de informacion
              en una sola experiencia para el equipo operativo.
            </Typography>

            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {roles.length > 0 ? (
                roles.map((role) => (
                  <Chip
                    key={role}
                    label={role}
                    size="small"
                    sx={{
                      bgcolor: "rgba(255,255,255,0.16)",
                      color: "common.white",
                      fontWeight: 600,
                    }}
                  />
                ))
              ) : (
                <Chip
                  label="Usuario autenticado"
                  size="small"
                  sx={{
                    bgcolor: "rgba(255,255,255,0.16)",
                    color: "common.white",
                    fontWeight: 600,
                  }}
                />
              )}
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      <Stack
        direction={{ xs: "column", lg: "row" }}
        spacing={2}
        alignItems="stretch"
      >
        <Card
          sx={{
            flex: 1,
            borderRadius: 3,
            border: "1px solid",
            borderColor: "divider",
          }}
        >
          <CardContent>
            <Typography variant="h6" sx={{ mb: 0.4 }}>
              Accesos rapidos
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 2 }}>
              Atajos recomendados segun tu perfil de acceso.
            </Typography>

            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {quickActions.map((action) => (
                <Button
                  key={action.to}
                  component={Link}
                  to={action.to}
                  variant="contained"
                  size="small"
                  sx={{ borderRadius: 2, px: 1.5 }}
                >
                  {action.label}
                </Button>
              ))}
            </Stack>
          </CardContent>
        </Card>

        <Card
          sx={{
            flex: 1,
            borderRadius: 3,
            border: "1px solid",
            borderColor: "divider",
            background:
              "linear-gradient(180deg, rgba(37,64,146,0.03) 0%, rgba(37,64,146,0) 100%)",
          }}
        >
          <CardContent>
            <Typography variant="h6" sx={{ mb: 1.2 }}>
              Flujo sugerido
            </Typography>
            <Stack spacing={0.9}>
              <Typography color="text.secondary">1. Configurar mapeo de carga.</Typography>
              <Typography color="text.secondary">2. Realizar cargue y validacion de archivos.</Typography>
              <Typography color="text.secondary">3. Ejecutar consultas y revisar resultados.</Typography>
              <Typography color="text.secondary">4. Enviar informacion a MURIC.</Typography>
            </Stack>
          </CardContent>
        </Card>
      </Stack>
    </Stack>
  );
}
