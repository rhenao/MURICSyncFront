import ListaGeneralConsulta, { type ColumnConfig } from "../shared/ListaGeneralConsulta";

const columns: ColumnConfig[] = [
  { accessorKey: "Codigo", header: "Código", size: 280 },
  { accessorKey: "Descripcion", header: "Descripción", size: 480 },
];

export default function ListSexoBiologico() {
  return (
    <ListaGeneralConsulta
      endpoint="/SexoBiologico"
      title="Sexo Biológico"
      columns={columns}
    />
  );
}
