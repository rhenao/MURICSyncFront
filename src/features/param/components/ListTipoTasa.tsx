import ListaGeneralConsulta, { type ColumnConfig } from "../shared/ListaGeneralConsulta";

const columns: ColumnConfig[] = [
  { accessorKey: "Codigo", header: "Código", size: 280 },
  { accessorKey: "Descripcion", header: "Descripción", size: 480 },
];

export default function ListTipoTasa() {
  return (
    <ListaGeneralConsulta
      endpoint="/TipoTasa"
      title="Tipo de Tasa"
      columns={columns}
    />
  );
}
