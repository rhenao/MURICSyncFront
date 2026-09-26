import ListaGeneralConsulta, { type ColumnConfig } from "../shared/ListaGeneralConsulta";

const columns: ColumnConfig[] = [
  { accessorKey: "Codigo", header: "Código", size: 120 },
  { accessorKey: "Descripcion", header: "Descripción", size: 480 },
];

export default function ListTamanoEmpresa() {
  return (
    <ListaGeneralConsulta
      endpoint="/TamanoEmpresa"
      title="Tamaño Empresa"
      columns={columns}
    />
  );
}
