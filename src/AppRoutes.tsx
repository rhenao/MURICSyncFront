import { Route, Routes, Navigate } from "react-router-dom";
import LandingPage from "./features/home/components/LandingPage";
import Login from "./features/security/components/Login";
import Layout from "./components/Layout";
import ListAntiguedadEmpresa from "./features/param/components/ListAntiguedadEmpresa";
import ListCalidadDeudor from "./features/param/components/ListCalidadDeudor";
import ListCalificacionCredito from "./features/param/components/ListCalificacionCredito";
import ListClaseDeDeudor from "./features/param/components/ListClaseDeDeudor";
import ListCondicionBien from "./features/param/components/ListCondicionBien";
import ListCondicionLaboral from "./features/param/components/ListCondicionLaboral.tsx";
import ListDestinoCredito from "./features/param/components/ListDestinoCredito";
import ListEstadoCredito from "./features/param/components/ListEstadoCredito";
import ListEstadoRegistro from "./features/param/components/ListEstadoRegistro";
import ListFranquisiaCredito from "./features/param/components/ListFranquisiaCredito";
import ListGrupoEtnico from "./features/param/components/ListGrupoEtnico";
import ListIndicadorVictima from "./features/param/components/ListIndicadorVictima";
import ListModalidad from "./features/param/components/ListModalidad";
import ListModeloProvisiones from "./features/param/components/ListModeloProvisiones";
import ListPeriodoGracia from "./features/param/components/ListPeriodoGracia";
import ListPlazoCredito from "./features/param/components/ListPlazoCredito";
import ListProductoCredito from "./features/param/components/ListProductoCredito";
import ListRangoPorMonto from "./features/param/components/ListRangoPorMonto";
import ListTamanoEmpresa from "./features/param/components/ListTamanoEmpresa";
import ListTipoConsolidacion from "./features/param/components/ListTipoConsolidacion";
import ListTipoContratacion from "./features/param/components/ListTipoContratacion";
import ListTipoCredito from "./features/param/components/ListTipoCredito";
import ListTipoGarantia from "./features/param/components/ListTipoGarantia";
import ListTipoPoliza from "./features/param/components/ListTipoPoliza";
import ListTipoRecuperacion from "./features/param/components/ListTipoRecuperacion";
import ListCanalDesembolso from "./features/param/components/ListCanalDesembolso";
import ListCanalOriginacion from "./features/param/components/ListCanalOriginacion";
import ListPeriodicidad from "./features/param/components/ListPeriodicidad";
import ListSexoBiologico from "./features/param/components/ListSexoBiologico";
import ListTipoTasa from "./features/param/components/ListTipoTasa";
import ListUsers from "./features/security/components/ListUsers";
import ListRoles from "./features/security/components/ListRoles";
import ListPermissions from "./features/security/components/ListPermissions";
import PasswordChange from "./features/security/components/PasswordChange.tsx";
import CargaArchivos from "./features/upload/components/CargaArchivos.tsx";
import ConfigMapeoCarga from "./features/upload/components/ConfigMapeoCarga";
import ListPlantillas from "./features/upload/components/ListPlantillas";
import EnviaMURIC from "./features/submission/components/EnviaMURIC";
import RequireAuth from "./features/auth/components/RequireAuth";
import ListUniversalidades from "./features/param/components/ListUniversalidades.tsx";
import ConsultasMURIC from "./features/queries/components/ConsultasMURIC";
import ReporteUsuarios from "./features/security/components/ReporteUsuarios";
import FormConfigSeguridad from "./features/security/components/FormConfigSeguridad";
import AuditLogPage from "./features/audit/components/AuditLogPage";
import Forbidden from "./components/Forbidden";

export default function AppRoutes() {
  return (
    <Routes>
      {/* Redirect root to login */}
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* Login route (outside layout) */}
      <Route path="/login" element={<Login />} />

      {/* Protected routes with shared layout */}
      <Route
        element={
          <RequireAuth>
            <Layout />
          </RequireAuth>
        }
      >
        <Route path="/app" element={<LandingPage />} />
        <Route
          path="/app/lista-antiguedad-empresa"
          element={<ListAntiguedadEmpresa />}
        />
        <Route
          path="/app/lista-calidad-deudor"
          element={<ListCalidadDeudor />}
        />
        <Route
          path="/app/lista-calificacion-credito"
          element={<ListCalificacionCredito />}
        />
        <Route
          path="/app/lista-clase-de-deudor"
          element={<ListClaseDeDeudor />}
        />
        <Route
          path="/app/lista-condicion-bien"
          element={<ListCondicionBien />}
        />
        <Route
          path="/app/lista-condicion-laboral"
          element={<ListCondicionLaboral />}
        />
        <Route
          path="/app/lista-destino-credito"
          element={<ListDestinoCredito />}
        />
        <Route
          path="/app/lista-estado-credito"
          element={<ListEstadoCredito />}
        />
        <Route
          path="/app/lista-estado-registro"
          element={<ListEstadoRegistro />}
        />
        <Route
          path="/app/lista-franquisia-credito"
          element={<ListFranquisiaCredito />}
        />
        <Route path="/app/lista-grupo-etnico" element={<ListGrupoEtnico />} />
        <Route
          path="/app/lista-indicador-victima"
          element={<ListIndicadorVictima />}
        />
        <Route path="/app/lista-modalidad" element={<ListModalidad />} />
        <Route
          path="/app/lista-modelo-provisiones"
          element={<ListModeloProvisiones />}
        />
        <Route
          path="/app/lista-periodo-gracia"
          element={<ListPeriodoGracia />}
        />
        <Route path="/app/lista-plazo-credito" element={<ListPlazoCredito />} />
        <Route
          path="/app/lista-producto-credito"
          element={<ListProductoCredito />}
        />
        <Route
          path="/app/lista-rango-por-monto"
          element={<ListRangoPorMonto />}
        />
        <Route
          path="/app/lista-tamano-empresa"
          element={<ListTamanoEmpresa />}
        />
        <Route
          path="/app/lista-tipo-consolidacion"
          element={<ListTipoConsolidacion />}
        />
        <Route
          path="/app/lista-tipo-contratacion"
          element={<ListTipoContratacion />}
        />
        <Route path="/app/lista-tipo-credito" element={<ListTipoCredito />} />
        <Route path="/app/lista-tipo-garantia" element={<ListTipoGarantia />} />
        <Route path="/app/lista-tipo-poliza" element={<ListTipoPoliza />} />
        <Route
          path="/app/lista-tipo-recuperacion"
          element={<ListTipoRecuperacion />}
        />
        <Route
          path="/app/lista-canal-desembolso"
          element={<ListCanalDesembolso />}
        />
        <Route
          path="/app/lista-canal-originacion"
          element={<ListCanalOriginacion />}
        />
        <Route
          path="/app/lista-periodicidad"
          element={<ListPeriodicidad />}
        />
        <Route
          path="/app/lista-sexo-biologico"
          element={<ListSexoBiologico />}
        />
        <Route path="/app/lista-universalidades" element={<ListUniversalidades />} />
        <Route path="/app/lista-tipo-tasa" element={<ListTipoTasa />} />
        <Route path="/app/lista-usuarios" element={<ListUsers />} />
        <Route path="/app/lista-roles" element={<ListRoles />} />
        <Route path="/app/lista-permisos" element={<ListPermissions />} />
        <Route path="/app/cambiar-contrasena" element={<PasswordChange />} />
        <Route path="/app/carga-archivos" element={<CargaArchivos />} />
        <Route path="/app/plantillas-carga" element={<ListPlantillas />} />
        <Route path="/app/envio-muric" element={<EnviaMURIC />} />
        <Route path="/app/consultas-muric" element={<ConsultasMURIC />} />
        <Route path="/app/reporte-usuarios" element={<ReporteUsuarios />} />
        <Route path="/app/config-seguridad" element={<FormConfigSeguridad />} />
        <Route path="/app/audit-logs" element={<AuditLogPage />} />
        <Route path="/app/forbidden" element={<Forbidden />} />
        <Route path="/config-mapeo-carga" element={<ConfigMapeoCarga />} />
      </Route>

      {/* Catch all - redirect to login */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
