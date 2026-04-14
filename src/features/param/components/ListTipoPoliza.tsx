import ListGeneral, { type ColumnConfig } from "../shared/ListGeneral";

const columns: ColumnConfig[] = [
  { accessorKey: "Codigo", header: "Código", size: 120 },
  { accessorKey: "Descripcion", header: "Descripción", size: 360 },
];

export default function ListTipoPoliza() {
  return (
    <ListGeneral
      endpoint="/TipoPoliza"
      title="Tipo Póliza"
      columns={columns}
    />
  );
}
