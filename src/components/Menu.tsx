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
} from "@mui/icons-material";
import Logo from "./Logo";
import { Box, Divider, styled, Typography } from "@mui/material";
import theme from "../theme";

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
              to="lista-usuarios"
              relative="route"
              sx={{ pl: 15, py: 0.1 }}
            >
              <ListItemText primary="Administración de usuarios" />
            </ListItemButton>
            <ListItemButton
              component={NavLink}
              to="cambiar-contrasena"
              relative="route"
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
              to="lista-antiguedad-empresa"
              relative="route"
              sx={{ pl: 15, py: 0.1 }}
            >
              <ListItemText primary="Antigüedad Empresa" />
            </ListItemButton>
            <ListItemButton
              component={NavLink}
              to="lista-calidad-deudor"
              relative="route"
              sx={{ pl: 15, py: 0.1 }}
            >
              <ListItemText primary="Calidad Deudor" />
            </ListItemButton>
            <ListItemButton
              component={NavLink}
              to="lista-calificacion-credito"
              relative="route"
              sx={{ pl: 15, py: 0.1 }}
            >
              <ListItemText primary="Calificación Crédito" />
            </ListItemButton>
            <ListItemButton
              component={NavLink}
              to="lista-clase-de-deudor"
              relative="route"
              sx={{ pl: 15, py: 0.1 }}
            >
              <ListItemText primary="Clase de Deudor" />
            </ListItemButton>
            <ListItemButton
              component={NavLink}
              to="lista-condicion-bien"
              relative="route"
              sx={{ pl: 15, py: 0.1 }}
            >
              <ListItemText primary="Condición Bien" />
            </ListItemButton>
            <ListItemButton
              component={NavLink}
              to="lista-condicion-laboral"
              relative="route"
              sx={{ pl: 15, py: 0.1 }}
            >
              <ListItemText primary="Condición Laboral" />
            </ListItemButton>
            <ListItemButton
              component={NavLink}
              to="lista-destino-credito"
              relative="route"
              sx={{ pl: 15, py: 0.1 }}
            >
              <ListItemText primary="Destino del Crédito" />
            </ListItemButton>
            <ListItemButton
              component={NavLink}
              to="lista-estado-credito"
              relative="route"
              sx={{ pl: 15, py: 0.1 }}
            >
              <ListItemText primary="Estado del Crédito" />
            </ListItemButton>
            <ListItemButton
              component={NavLink}
              to="lista-estado-registro"
              relative="route"
              sx={{ pl: 15, py: 0.1 }}
            >
              <ListItemText primary="Estado Registro" />
            </ListItemButton>
            <ListItemButton
              component={NavLink}
              to="lista-franquisia-credito"
              relative="route"
              sx={{ pl: 15, py: 0.1 }}
            >
              <ListItemText primary="Franquisia Crédito" />
            </ListItemButton>
            <ListItemButton
              component={NavLink}
              to="lista-grupo-etnico"
              relative="route"
              sx={{ pl: 15, py: 0.1 }}
            >
              <ListItemText primary="Grupo Étnico" />
            </ListItemButton>
            <ListItemButton
              component={NavLink}
              to="lista-indicador-victima"
              relative="route"
              sx={{ pl: 15, py: 0.1 }}
            >
              <ListItemText primary="Indicador Victima" />
            </ListItemButton>
            <ListItemButton
              component={NavLink}
              to="lista-modalidad"
              relative="route"
              sx={{ pl: 15, py: 0.1 }}
            >
              <ListItemText primary="Modalidades de Crédito" />
            </ListItemButton>
            <ListItemButton
              component={NavLink}
              to="lista-modelo-provisiones"
              relative="route"
              sx={{ pl: 15, py: 0.1 }}
            >
              <ListItemText primary="Modelo de Provisiones" />
            </ListItemButton>
            <ListItemButton
              component={NavLink}
              to="lista-periodo-gracia"
              relative="route"
              sx={{ pl: 15, py: 0.1 }}
            >
              <ListItemText primary="Periodo de Gracia" />
            </ListItemButton>
            <ListItemButton
              component={NavLink}
              to="lista-plazo-credito"
              relative="route"
              sx={{ pl: 15, py: 0.1 }}
            >
              <ListItemText primary="Plazo Crédito" />
            </ListItemButton>
            <ListItemButton
              component={NavLink}
              to="lista-producto-credito"
              relative="route"
              sx={{ pl: 15, py: 0.1 }}
            >
              <ListItemText primary="Producto Crédito" />
            </ListItemButton>
            <ListItemButton
              component={NavLink}
              to="lista-rango-por-monto"
              relative="route"
              sx={{ pl: 15, py: 0.1 }}
            >
              <ListItemText primary="Rango por Monto" />
            </ListItemButton>
            <ListItemButton
              component={NavLink}
              to="lista-tamano-empresa"
              relative="route"
              sx={{ pl: 15, py: 0.1 }}
            >
              <ListItemText primary="Tamaño Empresa" />
            </ListItemButton>
            <ListItemButton
              component={NavLink}
              to="lista-tipo-credito"
              relative="route"
              sx={{ pl: 15, py: 0.1 }}
            >
              <ListItemText primary="Tipo Crédito" />
            </ListItemButton>
            <ListItemButton
              component={NavLink}
              to="lista-tipo-contratacion"
              relative="route"
              sx={{ pl: 15, py: 0.1 }}
            >
              <ListItemText primary="Tipo Contratación" />
            </ListItemButton>
            <ListItemButton
              component={NavLink}
              to="lista-tipo-consolidacion"
              relative="route"
              sx={{ pl: 15, py: 0.1 }}
            >
              <ListItemText primary="Tipo de Consolidación" />
            </ListItemButton>
            <ListItemButton
              component={NavLink}
              to="lista-tipo-recuperacion"
              relative="route"
              sx={{ pl: 15, py: 0.1 }}
            >
              <ListItemText primary="Tipo de Recuperación" />
            </ListItemButton>
            <ListItemButton
              component={NavLink}
              to="lista-tipo-garantia"
              relative="route"
              sx={{ pl: 15, py: 0.1 }}
            >
              <ListItemText primary="Tipo Garantía" />
            </ListItemButton>
            <ListItemButton
              component={NavLink}
              to="lista-tipo-poliza"
              relative="route"
              sx={{ pl: 15, py: 0.1 }}
            >
              <ListItemText primary="Tipo Póliza" />
            </ListItemButton>
          </List>
        </Collapse>

        {/* Primer nivel: Cargue de archivos */}
        <ListItemButton
          component={NavLink}
          to="carga-archivos"
          relative="route"
        >
          <ListItemIcon>
            <FileUpload color="primary" />
          </ListItemIcon>
          <ListItemText primary="Cargue de Archivos" />
        </ListItemButton>

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
              to="muric001"
              relative="route"
              sx={{ pl: 15, py: 0.1 }}
            >
              <ListItemText primary="Información general de los créditos" />
            </ListItemButton>
            <ListItemButton
              component={NavLink}
              to="muric002"
              relative="route"
              sx={{ pl: 15, py: 0.1 }}
            >
              <ListItemText primary="Atributos de los créditos y deudores" />
            </ListItemButton>
            <ListItemButton
              component={NavLink}
              to="muric003"
              relative="route"
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
              to="archivos-cargados"
              relative="route"
              sx={{ pl: 15, py: 0.1 }}
            >
              <ListItemText primary="Archivos Cargados" />
            </ListItemButton>
            <ListItemButton
              component={NavLink}
              to="archivos-enviados"
              relative="route"
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
