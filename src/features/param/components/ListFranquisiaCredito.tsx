import ListaGeneralConsulta, { type ColumnConfig } from "../shared/ListaGeneralConsulta";

const columns: ColumnConfig[] = [
  { accessorKey: "Codigo", header: "Código", size: 120 },
  { accessorKey: "Descripcion", header: "Descripción", size: 480 },
];

export default function ListFranquisiaCredito() {
  return (
    <ListaGeneralConsulta
      endpoint="/FranquisiaCredito"
      title="Franquisia Crédito"
      columns={columns}
    />
  );
}
