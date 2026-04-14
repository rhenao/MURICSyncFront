import ListGeneral, { type ColumnConfig } from "../shared/ListGeneral";

const columns: ColumnConfig[] = [
  { accessorKey: "Codigo", header: "Código", size: 120 },
  { accessorKey: "Tipo", header: "Tipo", size: 240 },
  { accessorKey: "Descripcion", header: "Descripción", size: 320 },
];

export default function ListRangoPorMonto() {
  return (
    <ListGeneral
      endpoint="/RangoPorMontos"
      title="Rango por Monto"
      columns={columns}
    />
  );
}
