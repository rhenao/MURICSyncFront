import ListaGeneralConsulta, { type ColumnConfig } from "../shared/ListaGeneralConsulta";

const columns: ColumnConfig[] = [
  { accessorKey: "Codigo", header: "Código", size: 120 },
  { accessorKey: "Descripcion", header: "Descripción", size: 360 },
];

export default function ListTipoPoliza() {
  return (
    <ListaGeneralConsulta
      endpoint="/TipoPoliza"
      title="Tipo Póliza"
      columns={columns}
    />
  );
}
