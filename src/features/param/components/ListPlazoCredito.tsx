import ListaGeneralConsulta, { type ColumnConfig } from "../shared/ListaGeneralConsulta";

const columns: ColumnConfig[] = [
  { accessorKey: "Codigo", header: "Código", size: 120 },
  { accessorKey: "Tipo", header: "Tipo", size: 240 },
  { accessorKey: "Descripcion", header: "Descripción", size: 360 },
];

export default function ListPlazoCredito() {
  return (
    <ListaGeneralConsulta
      endpoint="/PlazoCredito"
      title="Plazo Crédito"
      columns={columns}
    />
  );
}
