import { useMemo } from "react";
import { Tooltip, Typography } from "@mui/material";
import ListaGeneralCrud, { type ColumnConfig, type SelectOption } from "../shared/ListaGeneralCrud";
import { useEntidadReportante } from "../../configuracion/hooks/useEntidadReportante";

const ESTADOS: SelectOption[] = [
  { value: "A", label: "Activo", color: "success" },
  { value: "I", label: "Inactivo", color: "default" },
];

const pad3 = (n: number) => String(n).padStart(3, "0");

export default function ListUniversalidades() {
  // TTTCCC del identificador = tipo y código de la entidad reportante (Titularice), de la configuración del backend.
  const entidad = useEntidadReportante();
  const prefijoEntidad = entidad ? `${pad3(entidad.tipoEntidad)}${pad3(entidad.codigoEntidad)}` : null;

  const columns = useMemo<ColumnConfig[]>(
    () => [
      { accessorKey: "Codigo", header: "Código", size: 120, fieldType: "number" },
      { accessorKey: "Descripcion", header: "Descripción", size: 320, maxLength: 100 },
      {
        accessorKey: "Estado",
        header: "Estado",
        size: 120,
        fieldType: "select",
        options: ESTADOS,
        defaultValue: "A",
      },
      // E9 c: se antepone al id del crédito al cargar, para que dos originadores con el mismo número
      // no choquen. El backend valida el formato y no deja cambiarlo tras la primera transmisión.
      {
        accessorKey: "PrefijoCredito",
        header: "Prefijo de crédito",
        size: 170,
        required: false,
        maxLength: 20,
        nullFallback: "—",
      },
      // CC-E (plan de consistencia de cargues): con los dos, la carga completa o compara
      // identificacion_negocio_vehiculo_universalidad. El backend valida el formato (3 dígitos y 12 letras o
      // números), exige los dos juntos y no deja cambiarlos tras la primera transmisión.
      {
        accessorKey: "TipoVehiculo",
        header: "Tipo de vehículo",
        size: 150,
        required: false,
        maxLength: 3,
        nullFallback: "—",
      },
      {
        accessorKey: "CodigoAnn",
        header: "Código ANN",
        size: 170,
        required: false,
        maxLength: 12,
        nullFallback: "—",
      },
      {
        accessorKey: "IdentificadorUniversalidad",
        header: "Identificador (001-001)",
        size: 240,
        hideInForm: true,
        render: (row) => {
          const tipo = row["TipoVehiculo"];
          const ann = row["CodigoAnn"];
          if (!tipo || !ann || !prefijoEntidad) return "—";
          return (
            <Tooltip title="Se usa en identificacion_negocio_vehiculo_universalidad cuando el archivo no lo trae">
              <Typography variant="body2" sx={{ fontFamily: "monospace" }}>
                {`${prefijoEntidad}${String(tipo)}${String(ann)}`}
              </Typography>
            </Tooltip>
          );
        },
      },
    ],
    [prefijoEntidad]
  );

  return (
    <ListaGeneralCrud
      endpoint="/Universalidades"
      title="Universalidades"
      columns={columns}
      // R1: no se borra físicamente (lotes y créditos la referencian por FK);
      // la baja es lógica con Estado = "I".
      allowDelete={false}
      filaInactiva={(row) => row["Estado"] === "I"}
    />
  );
}
