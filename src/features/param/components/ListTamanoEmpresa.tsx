import ListGeneral, { type ColumnConfig } from "../shared/ListGeneral";

const columns: ColumnConfig[] = [
  { accessorKey: "Codigo", header: "Código", size: 120 },
  { accessorKey: "Descripcion", header: "Descripción", size: 480 },
];

export default function ListTamanoEmpresa() {
  return (
    <ListGeneral
      endpoint="/TamanoEmpresa"
      title="Tamaño Empresa"
      columns={columns}
    />
  );
}
