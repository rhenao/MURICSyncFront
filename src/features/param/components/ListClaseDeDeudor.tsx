import ListaGeneralConsulta, { type ColumnConfig } from "../shared/ListaGeneralConsulta";

const columns: ColumnConfig[] = [
  { accessorKey: "Codigo", header: "Código", size: 120 },
  { accessorKey: "Descripcion", header: "Descripción", size: 320 },
  { accessorKey: "DescripcionDetallada", header: "Descripción Detallada", size: 420, nullFallback: "–" },
];

export default function ListClaseDeDeudor() {
  return (
    <ListaGeneralConsulta
      endpoint="/ClaseDeDeudor"
      title="Clase de Deudor"
      columns={columns}
    />
  );
}
