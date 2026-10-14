import ListaGeneralConsulta, { type ColumnConfig } from "../shared/ListaGeneralConsulta";

const columns: ColumnConfig[] = [
  { accessorKey: "Codigo", header: "Código", size: 120 },
  { accessorKey: "Descripcion", header: "Descripción", size: 240 },
  { accessorKey: "descripcionDetallada", header: "Descripción Detallada", size: 480 },
];

export default function ListEstadoCredito() {
  return (
    <ListaGeneralConsulta
      endpoint="/EstadoCredito"
      title="Estado del Crédito"
      columns={columns}
    />
  );
}
