import ListGeneral, { type ColumnConfig } from "../shared/ListGeneral";

const columns: ColumnConfig[] = [
  { accessorKey: "Codigo", header: "Código", size: 120 },
  { accessorKey: "Descripcion", header: "Descripción", size: 480 },
];

export default function ListModeloProvisiones() {
  return (
    <ListGeneral
      endpoint="/ModeloProvisiones"
      title="Modelo de Provisiones"
      columns={columns}
    />
  );
}
