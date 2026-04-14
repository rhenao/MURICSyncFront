import ListGeneral, { type ColumnConfig } from "../shared/ListGeneral";

const columns: ColumnConfig[] = [
  { accessorKey: "Codigo", header: "Código", size: 280 },
  { accessorKey: "Descripcion", header: "Descripción", size: 480 },
];

export default function ListTipoTasa() {
  return (
    <ListGeneral
      endpoint="/TipoTasa"
      title="Tipo de Tasa"
      columns={columns}
    />
  );
}
