import ListaGeneralConsulta, { type ColumnConfig } from "../shared/ListaGeneralConsulta";

const columns: ColumnConfig[] = [
  { accessorKey: "Codigo", header: "Código", size: 120 },
  { accessorKey: "Descripcion", header: "Descripción", size: 480 },
];

export default function ListModeloProvisiones() {
  return (
    <ListaGeneralConsulta
      endpoint="/ModeloProvisiones"
      title="Modelo de Provisiones"
      columns={columns}
    />
  );
}
