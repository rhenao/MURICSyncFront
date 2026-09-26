import ListaGeneralConsulta, { type ColumnConfig } from "../shared/ListaGeneralConsulta";

const columns: ColumnConfig[] = [
  { accessorKey: "Codigo", header: "Código", size: 120 },
  { accessorKey: "Descripcion", header: "Descripción", size: 320 },
  { accessorKey: "Activo", header: "Activo", size: 120 },
];

export default function ListUniversalidades() {
  return (
    <ListaGeneralConsulta
      endpoint="/Universalidades"
      title="Universalidades"
      columns={columns}
    />
  );
}
