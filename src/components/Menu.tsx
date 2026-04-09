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
  const [openSendMuric, setOpenSendMuric] = React.useState(false);
  const [openReports, setOpenReports] = React.useState(false);
  const { isAuthenticated } = useAuth();

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <Logo />
      <DividerLine />
      <List component="nav" sx={{ width: "100%" }}>
        <Banner></Banner>
        {/* Primer nivel: Seguridad */}
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
            <ListItemButton
              component={NavLink}
              to="/app/lista-usuarios"
              sx={{ pl: 15, py: 0.1 }}
            >
              <ListItemText primary="Administración de usuarios" />
            </ListItemButton>
            <ListItemButton
              component={NavLink}
              to="/app/cambiar-contrasena"
              sx={{ pl: 15, py: 0.1 }}
            >
              <ListItemText primary="Cambio de contraseña" />
            </ListItemButton>
          </List>
        </Collapse>

        {/* Primer nivel: Administración - tablas básicas */}
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
              to="/app/lista-tamano-empresa"
              sx={{ pl: 15, py: 0.1 }}
            >
              <ListItemText primary="Tamaño Empresa" />
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
              to="/app/lista-tipo-contratacion"
              sx={{ pl: 15, py: 0.1 }}
            >
              <ListItemText primary="Tipo Contratación" />
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
          </List>
        </Collapse>

        {/* Primer nivel: Cargue de archivos */}
        <ListItemButton component={NavLink} to="/app/carga-archivos">
          <ListItemIcon>
            <FileUpload color="primary" />
          </ListItemIcon>
          <ListItemText primary="Cargue de Archivos" />
        </ListItemButton>

        {isAuthenticated && (
          <ListItemButton component={NavLink} to="/config-mapeo-carga">
            <ListItemIcon>
              <AccountTree color="primary" />
            </ListItemIcon>
            <ListItemText primary="Configurar Mapeo de Carga" />
          </ListItemButton>
        )}

        {/* Primer nivel: Envío a MURIC */}
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
              to="/app/muric001"
              sx={{ pl: 15, py: 0.1 }}
            >
              <ListItemText primary="Información general de los créditos" />
            </ListItemButton>
            <ListItemButton
              component={NavLink}
              to="/app/muric002"
              sx={{ pl: 15, py: 0.1 }}
            >
              <ListItemText primary="Atributos de los créditos y deudores" />
            </ListItemButton>
            <ListItemButton
              component={NavLink}
              to="/app/muric003"
              sx={{ pl: 15, py: 0.1 }}
            >
              <ListItemText primary="Movimientos de cartera" />
            </ListItemButton>
          </List>
        </Collapse>

        {/* Primer nivel: Reportes (sin subnivel) */}
        <ListItemButton onClick={() => setOpenReports(!openReports)}>
          <ListItemIcon>
            <Summarize color="primary" />
          </ListItemIcon>
          <ListItemText primary="Consultas" />
          {openReports ? <ExpandLess /> : <ExpandMore />}
        </ListItemButton>
        <Collapse in={openReports} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            <ListItemButton
              component={NavLink}
              to="/app/archivos-cargados"
              sx={{ pl: 15, py: 0.1 }}
            >
              <ListItemText primary="Archivos Cargados" />
            </ListItemButton>
            <ListItemButton
              component={NavLink}
              to="/app/archivos-enviados"
              sx={{ pl: 15, py: 0.1 }}
            >
              <ListItemText primary="Archivos Enviados" />
            </ListItemButton>
          </List>
        </Collapse>
      </List>
      <VersionBanner sx={{ mt: "auto" }}>
        Version {import.meta.env.VITE_APP_VERSION}
      </VersionBanner>
    </Box>
  );
}
