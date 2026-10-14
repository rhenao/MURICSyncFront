import ListaGeneralConsulta, { type ColumnConfig } from "../shared/ListaGeneralConsulta";

const columns: ColumnConfig[] = [
  { accessorKey: "Codigo", header: "Código", size: 120 },
  { accessorKey: "Tipo", header: "Tipo", size: 240 },
  { accessorKey: "Descripcion", header: "Descripción", size: 320 },
];

export default function ListRangoPorMonto() {
  return (
    <ListaGeneralConsulta
      endpoint="/RangoPorMontos"
      title="Rango por Monto"
      columns={columns}
    />
  );
}
