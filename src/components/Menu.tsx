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
        <Banner> MURIC Sync v1.0</Banner>
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
          <List component="div" disablePadding>
            <ListItemButton component={NavLink} to="/usuarios" sx={{ pl: 4 }}>
              <ListItemText primary="Usuarios" />
            </ListItemButton>
            <ListItemButton component={NavLink} to="/roles" sx={{ pl: 4 }}>
              <ListItemText primary="Roles" />
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
          <List component="div" disablePadding>
            <ListItemButton
              component={NavLink}
              to="/lista-calidad-deudor"
              sx={{ pl: 4 }}
            >
              <ListItemText primary="Calidad Deudor" />
            </ListItemButton>
            <ListItemButton
              component={NavLink}
              to="/lista-calificacion-credito"
              sx={{ pl: 4 }}
            >
              <ListItemText primary="Calificación Crédito" />
            </ListItemButton>
            <ListItemButton
              component={NavLink}
              to="/lista-condicion-bien"
              sx={{ pl: 4 }}
            >
              <ListItemText primary="Condición de un Bien" />
            </ListItemButton>
            <ListItemButton
              component={NavLink}
              to="/lista-destino-credito"
              sx={{ pl: 4 }}
            >
              <ListItemText primary="Destino Crédito" />
            </ListItemButton>
            <ListItemButton
              component={NavLink}
              to="/lista-estado-credito"
              sx={{ pl: 4 }}
            >
              <ListItemText primary="Estado Crédito" />
            </ListItemButton>
            <ListItemButton
              component={NavLink}
              to="/lista-estado-registro"
              sx={{ pl: 4 }}
            >
              <ListItemText primary="Estado Registro" />
            </ListItemButton>
            <ListItemButton
              component={NavLink}
              to="/lista-franquisia-credito"
              sx={{ pl: 4 }}
            >
              <ListItemText primary="Franquisia Crédito" />
            </ListItemButton>
            <ListItemButton
              component={NavLink}
              to="/lista-indicador-victima"
              sx={{ pl: 4 }}
            >
              <ListItemText primary="Indicador Victima" />
            </ListItemButton>
            <ListItemButton
              component={NavLink}
              to="/lista-modalidad"
              sx={{ pl: 4 }}
            >
              <ListItemText primary="Modalidad" />
            </ListItemButton>
            <ListItemButton
              component={NavLink}
              to="/lista-modelo-provisiones"
              sx={{ pl: 4 }}
            >
              <ListItemText primary="Modelo Provisiones" />
            </ListItemButton>
            <ListItemButton
              component={NavLink}
              to="/lista-periodo-gracia"
              sx={{ pl: 4 }}
            >
              <ListItemText primary="Periodo Gracia" />
            </ListItemButton>
            <ListItemButton
              component={NavLink}
              to="/lista-tamano-empresa"
              sx={{ pl: 4 }}
            >
              <ListItemText primary="Tamaño Empresa" />
            </ListItemButton>
            <ListItemButton
              component={NavLink}
              to="/lista-tipo-consolidacion"
              sx={{ pl: 4 }}
            >
              <ListItemText primary="Tipo Consolidación" />
            </ListItemButton>
            <ListItemButton
              component={NavLink}
              to="/lista-tipo-contratacion"
              sx={{ pl: 4 }}
            >
              <ListItemText primary="Tipo Contratación" />
            </ListItemButton>
            <ListItemButton
              component={NavLink}
              to="/lista-tipo-empleado"
              sx={{ pl: 4 }}
            >
              <ListItemText primary="Tipo Empleado" />
            </ListItemButton>
            <ListItemButton
              component={NavLink}
              to="/lista-tipo-garantia"
              sx={{ pl: 4 }}
            >
              <ListItemText primary="Tipo Garantía" />
            </ListItemButton>
            <ListItemButton
              component={NavLink}
              to="/lista-tipo-recuperacion"
              sx={{ pl: 4 }}
            >
              <ListItemText primary="Tipo Recuperación" />
            </ListItemButton>
          </List>
        </Collapse>

        {/* Primer nivel: Cargue de archivos */}
        <ListItemButton component={NavLink} to="/informes">
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
            <ListItemButton component={NavLink} to="/muric001" sx={{ pl: 4 }}>
              <ListItemText primary="Información general de los créditos" />
            </ListItemButton>
            <ListItemButton component={NavLink} to="/muric002" sx={{ pl: 4 }}>
              <ListItemText primary="Atributos de los créditos y deudores" />
            </ListItemButton>
            <ListItemButton component={NavLink} to="/muric003" sx={{ pl: 4 }}>
              <ListItemText primary="Movimientos de cartera" />
            </ListItemButton>
          </List>
        </Collapse>

        {/* Primer nivel: Reportes (sin subnivel) */}
        <ListItemButton onClick={() => setOpenReports(!openReports)}>
          <ListItemIcon>
            <Summarize color="primary" />
          </ListItemIcon>
          <ListItemText primary="Reportes" />
          {openReports ? <ExpandLess /> : <ExpandMore />}
        </ListItemButton>
        <Collapse in={openReports} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            <ListItemButton component={NavLink} to="/procesos" sx={{ pl: 4 }}>
              <ListItemText primary="Procesos" />
            </ListItemButton>
            <ListItemButton component={NavLink} to="/tareas" sx={{ pl: 4 }}>
              <ListItemText primary="Tareas" />
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
