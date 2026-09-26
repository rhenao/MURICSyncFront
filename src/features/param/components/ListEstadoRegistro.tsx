import ListaGeneralConsulta, { type ColumnConfig } from "../shared/ListaGeneralConsulta";

const columns: ColumnConfig[] = [
  { accessorKey: "Codigo", header: "Código", size: 120 },
  { accessorKey: "Descripcion", header: "Descripción", size: 480 },
];

export default function ListEstadoRegistro() {
  return (
    <ListaGeneralConsulta
      endpoint="/EstadoRegistro"
      title="Estado Registro"
      columns={columns}
    />
  );
}
