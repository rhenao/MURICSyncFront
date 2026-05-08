import * as React from "react";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Collapse from "@mui/material/Collapse";
import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";
import { NavLink } from "react-router-dom";
import {
  AdminPanelSettings,
  Settings,
  FileUpload,
  Summarize,
  SendAndArchive,
  AccountTree,
  CloudUpload,
  //FolderOpen,
  //ForwardToInbox,
  Group,
  VpnKey,
} from "@mui/icons-material";
import Logo from "./Logo";
import { Box, Divider, styled, Typography } from "@mui/material";
import theme from "../theme";
import useAuth from "../features/auth/hooks/useAuth";

const Banner = styled(Typography)(() => ({
  fontSize: 18,
  paddingLeft: 24,
  fontWeight: 600,
  textTransform: "uppercase",
  color: theme.palette.text.secondary,
}));
const VersionBanner = styled(Box)(() => ({
  position: "relative",
  left: 0,
  bottom: 0,
  padding: 8,
  textAlign: "center",
  fontSize: 14,
}));
const DividerLine = styled(Divider)(() => ({
  borderWidth: 1,
  marginBottom: 24,
  marginLeft: 16,
  marginRight: 16,
}));
export function Menu() {
  const [openAdminSeguridad, setOpenAdminSeguridad] = React.useState(false);
  const [openAdmin, setOpenAdmin] = React.useState(false);
  const [openCargue, setOpenCargue] = React.useState(false);
  const [openSendMuric, setOpenSendMuric] = React.useState(false);
  const [openReports, setOpenReports] = React.useState(false);
  const { user } = useAuth();

  const roles = user?.roles ?? [];
  const hasRole = (...r: string[]) => r.some((rol) => roles.includes(rol));

  const canAdmin = hasRole("ADMIN", "OPERADOR", "CONSULTA");
  const canCargue = hasRole("ADMIN", "OPERADOR");
  const canEnvio = hasRole("ADMIN", "OPERADOR");
  const canConsultas = hasRole("ADMIN", "OPERADOR", "CONSULTA");
  const canAdminUsuarios = hasRole("ADMIN", "SEGURIDAD");
  const canCambioContrasena = hasRole("ADMIN", "OPERADOR", "SEGURIDAD", "CONSULTA");
  const canSeguridad = canAdminUsuarios || canCambioContrasena;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <Logo />
      <DividerLine />
      <List
        component="nav"
        sx={{
          width: "100%",
          px: 0.5,
          "& > .MuiListItemButton-root": {
            minHeight: 42,
            mb: 0.35,
          },
          "& .MuiCollapse-root .MuiListItemButton-root": {
            minHeight: 36,
            mb: 0.2,
          },
          "& .MuiListItemText-primary": {
            lineHeight: 1.25,
          },
        }}
      >
        <Banner></Banner>
        {/* Primer nivel: Administración - tablas básicas */}
        {canAdmin && (
        <>
        <ListItemButton onClick={() => setOpenAdmin(!openAdmin)}>
          <ListItemIcon>
            <Settings color="primary" />
          </ListItemIcon>
          <ListItemText primary="Administración" />
          {openAdmin ? <ExpandLess /> : <ExpandMore />}
        </ListItemButton>
        <Collapse in={openAdmin} timeout="auto" unmountOnExit>
          <List component="div" disablePadding dense>
            <ListItemButton
              component={NavLink}
              to="/app/lista-antiguedad-empresa"
              sx={{ pl: 15, py: 0.1 }}
            >
              <ListItemText primary="Antigüedad Empresa" />
            </ListItemButton>
            <ListItemButton
              component={NavLink}
              to="/app/lista-calidad-deudor"
              sx={{ pl: 15, py: 0.1 }}
            >
              <ListItemText primary="Calidad Deudor" />
            </ListItemButton>
            <ListItemButton
              component={NavLink}
              to="/app/lista-calificacion-credito"
              sx={{ pl: 15, py: 0.1 }}
            >
              <ListItemText primary="Calificación Crédito" />
            </ListItemButton>
            <ListItemButton
              component={NavLink}
              to="/app/lista-canal-desembolso"
              sx={{ pl: 15, py: 0.1 }}
            >
              <ListItemText primary="Canal de Desembolso" />
            </ListItemButton>
            <ListItemButton
              component={NavLink}
              to="/app/lista-canal-originacion"
              sx={{ pl: 15, py: 0.1 }}
            >
              <ListItemText primary="Canal de Originación" />
            </ListItemButton>
            <ListItemButton
              component={NavLink}
              to="/app/lista-clase-de-deudor"
              sx={{ pl: 15, py: 0.1 }}
            >
              <ListItemText primary="Clase de Deudor" />
            </ListItemButton>
            <ListItemButton
              component={NavLink}
              to="/app/lista-condicion-bien"
              sx={{ pl: 15, py: 0.1 }}
            >
              <ListItemText primary="Condición Bien" />
            </ListItemButton>
            <ListItemButton
              component={NavLink}
              to="/app/lista-condicion-laboral"
              sx={{ pl: 15, py: 0.1 }}
            >
              <ListItemText primary="Condición Laboral" />
            </ListItemButton>
            <ListItemButton
              component={NavLink}
              to="/app/lista-destino-credito"
              sx={{ pl: 15, py: 0.1 }}
            >
              <ListItemText primary="Destino del Crédito" />
            </ListItemButton>
            <ListItemButton
              component={NavLink}
              to="/app/lista-estado-credito"
              sx={{ pl: 15, py: 0.1 }}
            >
              <ListItemText primary="Estado del Crédito" />
            </ListItemButton>
            <ListItemButton
              component={NavLink}
              to="/app/lista-estado-registro"
              sx={{ pl: 15, py: 0.1 }}
            >
              <ListItemText primary="Estado Registro" />
            </ListItemButton>
            <ListItemButton
              component={NavLink}
              to="/app/lista-franquisia-credito"
              sx={{ pl: 15, py: 0.1 }}
            >
              <ListItemText primary="Franquisia Crédito" />
            </ListItemButton>
            <ListItemButton
              component={NavLink}
              to="/app/lista-grupo-etnico"
              sx={{ pl: 15, py: 0.1 }}
            >
              <ListItemText primary="Grupo Étnico" />
            </ListItemButton>
            <ListItemButton
              component={NavLink}
              to="/app/lista-indicador-victima"
              sx={{ pl: 15, py: 0.1 }}
            >
              <ListItemText primary="Indicador Victima" />
            </ListItemButton>
            <ListItemButton
              component={NavLink}
              to="/app/lista-modalidad"
              sx={{ pl: 15, py: 0.1 }}
            >
              <ListItemText primary="Modalidades de Crédito" />
            </ListItemButton>
            <ListItemButton
              component={NavLink}
              to="/app/lista-modelo-provisiones"
              sx={{ pl: 15, py: 0.1 }}
            >
              <ListItemText primary="Modelo de Provisiones" />
            </ListItemButton>
            <ListItemButton
              component={NavLink}
              to="/app/lista-periodo-gracia"
              sx={{ pl: 15, py: 0.1 }}
            >
              <ListItemText primary="Periodo de Gracia" />
            </ListItemButton>
            <ListItemButton
              component={NavLink}
              to="/app/lista-periodicidad"
              sx={{ pl: 15, py: 0.1 }}
            >
              <ListItemText primary="Periodicidades" />
            </ListItemButton>
            <ListItemButton
              component={NavLink}
              to="/app/lista-plazo-credito"
              sx={{ pl: 15, py: 0.1 }}
            >
              <ListItemText primary="Plazo Crédito" />
            </ListItemButton>
            <ListItemButton
              component={NavLink}
              to="/app/lista-producto-credito"
              sx={{ pl: 15, py: 0.1 }}
            >
              <ListItemText primary="Producto Crédito" />
            </ListItemButton>
            <ListItemButton
              component={NavLink}
              to="/app/lista-rango-por-monto"
              sx={{ pl: 15, py: 0.1 }}
            >
              <ListItemText primary="Rango por Monto" />
            </ListItemButton>
            <ListItemButton
              component={NavLink}
              to="/app/lista-sexo-biologico"
              sx={{ pl: 15, py: 0.1 }}
            >
              <ListItemText primary="Sexo Biológico" />
            </ListItemButton>
            <ListItemButton
              component={NavLink}
              to="/app/lista-tamano-empresa"
              sx={{ pl: 15, py: 0.1 }}
            >
              <ListItemText primary="Tamaño Empresa" />
            </ListItemButton>
            <ListItemButton
              component={NavLink}
              to="/app/lista-tipo-contratacion"
              sx={{ pl: 15, py: 0.1 }}
            >
              <ListItemText primary="Tipo Contratación" />
            </ListItemButton>
            <ListItemButton
              component={NavLink}
              to="/app/lista-tipo-credito"
              sx={{ pl: 15, py: 0.1 }}
            >
              <ListItemText primary="Tipo Crédito" />
            </ListItemButton>
            <ListItemButton
              component={NavLink}
              to="/app/lista-tipo-consolidacion"
              sx={{ pl: 15, py: 0.1 }}
            >
              <ListItemText primary="Tipo de Consolidación" />
            </ListItemButton>
            <ListItemButton
              component={NavLink}
              to="/app/lista-tipo-recuperacion"
              sx={{ pl: 15, py: 0.1 }}
            >
              <ListItemText primary="Tipo de Recuperación" />
            </ListItemButton>
            <ListItemButton
              component={NavLink}
              to="/app/lista-tipo-tasa"
              sx={{ pl: 15, py: 0.1 }}
            >
              <ListItemText primary="Tipo de Tasa" />
            </ListItemButton>
            <ListItemButton
              component={NavLink}
              to="/app/lista-tipo-garantia"
              sx={{ pl: 15, py: 0.1 }}
            >
              <ListItemText primary="Tipo Garantía" />
            </ListItemButton>
            <ListItemButton
              component={NavLink}
              to="/app/lista-tipo-poliza"
              sx={{ pl: 15, py: 0.1 }}
            >
              <ListItemText primary="Tipo Póliza" />
            </ListItemButton>
            <ListItemButton
              component={NavLink}
              to="/app/lista-universalidades"
              sx={{ pl: 15, py: 0.1 }}
            >
              <ListItemText primary="Universalidades" />
            </ListItemButton>

          </List>
        </Collapse>
        </>
        )}

        {/* Primer nivel: Proceso de cargue de archivos */}
        {canCargue && (
        <>
        <ListItemButton onClick={() => setOpenCargue(!openCargue)}>
          <ListItemIcon>
            <FileUpload color="primary" />
          </ListItemIcon>
          <ListItemText primary="Proceso de cargue de archivos" />
          {openCargue ? <ExpandLess /> : <ExpandMore />}
        </ListItemButton>
        <Collapse in={openCargue} timeout="auto" unmountOnExit>
          <List component="div" disablePadding dense>
            <ListItemButton
              component={NavLink}
              to="/config-mapeo-carga"
              sx={{ pl: 6, py: 0.1 }}
            >
              <ListItemIcon><AccountTree fontSize="small" color="primary" /></ListItemIcon>
              <ListItemText primary="Configurar mapeo de carga" />
            </ListItemButton>
            <ListItemButton
              component={NavLink}
              to="/app/carga-archivos"
              sx={{ pl: 6, py: 0.1 }}
            >
              <ListItemIcon><CloudUpload fontSize="small" color="primary" /></ListItemIcon>
              <ListItemText primary="Cargue de archivos" />
            </ListItemButton>
          </List>
        </Collapse>
        </>
        )}

        {/* Primer nivel: Envío a MURIC */}
        {canEnvio && (
        <>
        <ListItemButton onClick={() => setOpenSendMuric(!openSendMuric)}>
          <ListItemIcon>
            <SendAndArchive color="primary" />
          </ListItemIcon>
          <ListItemText primary="Envío a MURIC" />
          {openSendMuric ? <ExpandLess /> : <ExpandMore />}
        </ListItemButton>
        <Collapse in={openSendMuric} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            <ListItemButton
              component={NavLink}
              to="/app/envio-muric"
              sx={{ pl: 6, py: 0.1 }}
            >
              <ListItemIcon><SendAndArchive fontSize="small" color="primary" /></ListItemIcon>
              <ListItemText primary="Formulario de envío a MURIC" />
            </ListItemButton>
          </List>
        </Collapse>
        </>
        )}

        {/* Primer nivel: Reportes (sin subnivel) */}
        {canConsultas && (
        <>
        <ListItemButton onClick={() => setOpenReports(!openReports)}>
          <ListItemIcon>
            <Summarize color="primary" />
          </ListItemIcon>
          <ListItemText primary="Consultas" />
          {openReports ? <ExpandLess /> : <ExpandMore />}
        </ListItemButton>
        <Collapse in={openReports} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            {/* <ListItemButton
              component={NavLink}
              to="/app/archivos-cargados"
              sx={{ pl: 6, py: 0.1 }}
            >
              <ListItemIcon><FolderOpen fontSize="small" color="primary" /></ListItemIcon>
              <ListItemText primary="Archivos Cargados" />
            </ListItemButton> */}
            <ListItemButton
              component={NavLink}
              to="/app/consultas-muric"
              sx={{ pl: 6, py: 0.1 }}
            >
              <ListItemIcon><Summarize fontSize="small" color="primary" /></ListItemIcon>
              <ListItemText primary="Consultas MURIC" />
            </ListItemButton>
          </List>
        </Collapse>
        </>
        )}

        {/* Primer nivel: Seguridad */}
        {canSeguridad && (
        <>
        <ListItemButton
          onClick={() => setOpenAdminSeguridad(!openAdminSeguridad)}
        >
          <ListItemIcon>
            <AdminPanelSettings color="primary" />
          </ListItemIcon>
          <ListItemText primary="Seguridad" />
          {openAdminSeguridad ? <ExpandLess /> : <ExpandMore />}
        </ListItemButton>
        <Collapse in={openAdminSeguridad} timeout="auto" unmountOnExit>
          <List component="div" disablePadding dense>
            {canAdminUsuarios && (
            <ListItemButton
              component={NavLink}
              to="/app/lista-usuarios"
              sx={{ pl: 6, py: 0.1 }}
            >
              <ListItemIcon><Group fontSize="small" color="primary" /></ListItemIcon>
              <ListItemText primary="Administración de usuarios" />
            </ListItemButton>
            )}
            {canCambioContrasena && (
            <ListItemButton
              component={NavLink}
              to="/app/cambiar-contrasena"
              sx={{ pl: 6, py: 0.1 }}
            >
              <ListItemIcon><VpnKey fontSize="small" color="primary" /></ListItemIcon>
              <ListItemText primary="Cambio de contraseña" />
            </ListItemButton>
            )}
          </List>
        </Collapse>
        </>
        )}
      </List>
      <VersionBanner sx={{ mt: "auto" }}>
        Version {import.meta.env.VITE_APP_VERSION}
      </VersionBanner>
    </Box>
  );
}
