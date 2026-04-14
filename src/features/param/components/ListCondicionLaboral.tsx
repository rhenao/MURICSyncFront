import ListGeneral, { type ColumnConfig } from "../shared/ListGeneral";

const columns: ColumnConfig[] = [
  { accessorKey: "Codigo", header: "Código", size: 120 },
  { accessorKey: "Descripcion", header: "Descripción", size: 480 },
];

export default function ListCondicionLaboral() {
  return (
    <ListGeneral
      endpoint="/TipoEmpleado"
      title="Condición Laboral"
      columns={columns}
    />
  );
}
