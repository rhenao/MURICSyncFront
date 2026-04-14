import ListGeneral, { type ColumnConfig } from "../shared/ListGeneral";

const columns: ColumnConfig[] = [
  { accessorKey: "Codigo", header: "Código", size: 120 },
  { accessorKey: "Descripcion", header: "Descripción", size: 240 },
  { accessorKey: "descripcionDetallada", header: "Descripción Detallada", size: 480 },
];

export default function ListEstadoCredito() {
  return (
    <ListGeneral
      endpoint="/EstadoCredito"
      title="Estado del Crédito"
      columns={columns}
    />
  );
}
