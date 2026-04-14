import ListGeneral, { type ColumnConfig } from "../shared/ListGeneral";

const columns: ColumnConfig[] = [
  { accessorKey: "Codigo", header: "Código", size: 120 },
  { accessorKey: "Tipo", header: "Tipo", size: 240 },
  { accessorKey: "Descripcion", header: "Descripción", size: 360 },
];

export default function ListPlazoCredito() {
  return (
    <ListGeneral
      endpoint="/PlazoCredito"
      title="Plazo Crédito"
      columns={columns}
    />
  );
}
