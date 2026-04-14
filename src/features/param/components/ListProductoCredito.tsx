import ListGeneral, { type ColumnConfig } from "../shared/ListGeneral";

const columns: ColumnConfig[] = [
  { accessorKey: "Codigo", header: "Código", size: 120 },
  { accessorKey: "Tipo", header: "Tipo", size: 240 },
  { accessorKey: "Descripcion", header: "Descripción", size: 320 },
  { accessorKey: "DescripcionDetallada", header: "Descripción Detallada", size: 420, nullFallback: "–" },
];

export default function ListProductoCredito() {
  return (
    <ListGeneral
      endpoint="/ProductoCredito"
      title="Producto Crédito"
      columns={columns}
    />
  );
}
