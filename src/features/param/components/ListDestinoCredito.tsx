import ListaGeneralConsulta, { type ColumnConfig } from "../shared/ListaGeneralConsulta";

const columns: ColumnConfig[] = [
  { accessorKey: "Codigo", header: "Código", size: 120 },
  { accessorKey: "Descripcion", header: "Descripción", size: 480 },
];

export default function ListDestinoCredito() {
  return (
    <ListaGeneralConsulta
      endpoint="/DestinoCredito"
      title="Destino del Crédito"
      columns={columns}
    />
  );
}
