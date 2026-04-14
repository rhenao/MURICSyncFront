import ListGeneral, { type ColumnConfig } from "../shared/ListGeneral";

const columns: ColumnConfig[] = [
  { accessorKey: "Codigo", header: "Código", size: 120 },
  { accessorKey: "Descripcion", header: "Descripción", size: 320 },
  { accessorKey: "DescripcionDetallada", header: "Descripción Detallada", size: 420, nullFallback: "–" },
];

export default function ListTipoCredito() {
  return (
    <ListGeneral
      endpoint="/TipoCredito"
      title="Tipo Crédito"
      columns={columns}
    />
  );
}
