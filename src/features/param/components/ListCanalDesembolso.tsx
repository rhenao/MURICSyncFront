import ListaGeneralConsulta, { type ColumnConfig } from "../shared/ListaGeneralConsulta";

const columns: ColumnConfig[] = [
  { accessorKey: "Codigo", header: "Código", size: 280 },
  { accessorKey: "Descripcion", header: "Descripción", size: 480 },
];

export default function ListCanalDesembolso() {
  return (
    <ListaGeneralConsulta
      endpoint="/CanalDesembolso"
      title="Canal de Desembolso"
      columns={columns}
    />
  );
}
