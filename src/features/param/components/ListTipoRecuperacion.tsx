import ListaGeneralConsulta, { type ColumnConfig } from "../shared/ListaGeneralConsulta";

const columns: ColumnConfig[] = [
  { accessorKey: "Codigo", header: "Código", size: 120 },
  { accessorKey: "Descripcion", header: "Descripción", size: 480 },
];

export default function ListTipoRecuperacion() {
  return (
    <ListaGeneralConsulta
      endpoint="/TipoRecuperacion"
      title="Tipo de Recuperación"
      columns={columns}
    />
  );
}
