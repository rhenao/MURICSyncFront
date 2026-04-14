import ListGeneral, { type ColumnConfig } from "../shared/ListGeneral";

const columns: ColumnConfig[] = [
  { accessorKey: "Codigo", header: "Código", size: 120 },
  { accessorKey: "Descripcion", header: "Descripción", size: 320 },
  { accessorKey: "Activo", header: "Activo", size: 120 },
];

export default function ListUniversalidades() {
  return (
    <ListGeneral
      endpoint="/Universalidades"
      title="Universalidades"
      columns={columns}
    />
  );
}
