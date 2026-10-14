import ListaGeneralConsulta, { type ColumnConfig } from "../shared/ListaGeneralConsulta";

const columns: ColumnConfig[] = [
  { accessorKey: "Codigo", header: "Código", size: 120 },
  { accessorKey: "Descripcion", header: "Descripción", size: 480 },
];

export default function ListCondicionLaboral() {
  return (
    <ListaGeneralConsulta
      endpoint="/TipoEmpleado"
      title="Condición Laboral"
      columns={columns}
    />
  );
}
