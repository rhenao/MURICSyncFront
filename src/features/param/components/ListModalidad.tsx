import ListaGeneralConsulta, { type ColumnConfig } from "../shared/ListaGeneralConsulta";

const columns: ColumnConfig[] = [
  { accessorKey: "Codigo", header: "Código", size: 120 },
  { accessorKey: "Descripcion", header: "Descripción", size: 480 },
];

export default function ListModalidad() {
  return (
    <ListaGeneralConsulta
      endpoint="/Modalidad"
      title="Modalidades de Crédito"
      columns={columns}
    />
  );
}
