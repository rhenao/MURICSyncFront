import { Route, Routes, Navigate } from "react-router-dom";
import LandingPage from "./features/home/components/LandingPage";
import Login from "./features/security/components/Login";
import Layout from "../src/components/Layout";
import ListCalidadDeudor from "./features/param/components/ListCalidadDeudor";
import ListCalificacionCredito from "./features/param/components/ListCalificacionCredito";
import ListCondicionBien from "./features/param/components/ListCondicionBien";
import ListDestinoCredito from "./features/param/components/ListDestinoCredito";
import ListEstadoCredito from "./features/param/components/ListEstadoCredito";
import ListEstadoRegistro from "./features/param/components/ListEstadoRegistro";
import ListFranquisiaCredito from "./features/param/components/ListFranquisiaCredito";
import ListIndicadorVictima from "./features/param/components/ListIndicadorVictima";
import ListModalidad from "./features/param/components/ListModalidad";
import ListModeloProvisiones from "./features/param/components/ListModeloProvisiones";
import ListPeriodoGracia from "./features/param/components/ListPeriodoGracia";
import ListTamanoEmpresa from "./features/param/components/ListTamanoEmpresa";
import ListTipoRecuperacion from "./features/param/components/ListTipoRecuperacion";
import ListTipoEmpleado from "./features/param/components/ListTipoEmpleado";
import ListTipoConsolidacion from "./features/param/components/ListTipoConsolidacion";
import ListTipoGarantia from "./features/param/components/ListTipoGarantia";
import ListTipoContratacion from "./features/param/components/ListTipoContratacion";
import ListUsers from "./features/security/components/ListUsers";
import PasswordChange from "./features/security/components/PasswordChange.tsx";
import CargaArchivos from "./features/upload/components/CargaArchivos.tsx";

export default function AppRoutes() {
  return (
    <Routes>
      {/* Redirect root to login */}
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* Login route (outside layout) */}
      <Route path="/login" element={<Login />} />

      {/* Main app routes with layout */}
      <Route path="/app" element={<Layout />}>
        <Route index element={<LandingPage />} />
        <Route path="lista-calidad-deudor" element={<ListCalidadDeudor />} />
        <Route
          path="lista-calificacion-credito"
          element={<ListCalificacionCredito />}
        />
        <Route path="lista-condicion-bien" element={<ListCondicionBien />} />
        <Route path="lista-destino-credito" element={<ListDestinoCredito />} />
        <Route path="lista-estado-credito" element={<ListEstadoCredito />} />
        <Route path="lista-estado-registro" element={<ListEstadoRegistro />} />
        <Route
          path="lista-franquisia-credito"
          element={<ListFranquisiaCredito />}
        />
        <Route
          path="lista-indicador-victima"
          element={<ListIndicadorVictima />}
        />
        <Route path="lista-modalidad" element={<ListModalidad />} />
        <Route
          path="lista-modelo-provisiones"
          element={<ListModeloProvisiones />}
        />
        <Route path="lista-periodo-gracia" element={<ListPeriodoGracia />} />
        <Route path="lista-tamano-empresa" element={<ListTamanoEmpresa />} />
        <Route
          path="lista-tipo-consolidacion"
          element={<ListTipoConsolidacion />}
        />
        <Route
          path="lista-tipo-contratacion"
          element={<ListTipoContratacion />}
        />
        <Route path="lista-tipo-empleado" element={<ListTipoEmpleado />} />
        <Route path="lista-tipo-garantia" element={<ListTipoGarantia />} />
        <Route
          path="lista-tipo-recuperacion"
          element={<ListTipoRecuperacion />}
        />
        <Route path="lista-usuarios" element={<ListUsers />} />
        <Route path="cambiar-contrasena" element={<PasswordChange />} />
        <Route path="carga-archivos" element={<CargaArchivos />} />
      </Route>

      {/* Catch all - redirect to login */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
