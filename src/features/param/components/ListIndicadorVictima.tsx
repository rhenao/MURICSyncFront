import ListGeneral, { type ColumnConfig } from "../shared/ListGeneral";

const columns: ColumnConfig[] = [
  { accessorKey: "Codigo", header: "Código", size: 120 },
  { accessorKey: "Descripcion", header: "Descripción", size: 480 },
];

export default function ListIndicadorVictima() {
  return (
    <ListGeneral
      endpoint="/IndicadorVictima"
      title="Indicador Victima"
      columns={columns}
    />
  );
}
