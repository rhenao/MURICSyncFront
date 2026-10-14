import ListaGeneralConsulta, { type ColumnConfig } from "../shared/ListaGeneralConsulta";

const columns: ColumnConfig[] = [
  { accessorKey: "Codigo", header: "Código", size: 280 },
  { accessorKey: "Descripcion", header: "Descripción", size: 480 },
];

export default function ListCalidadDeudor() {
  return (
    <ListaGeneralConsulta
      endpoint="/CalidadDeudor"
      title="Calidad de Deudor"
      columns={columns}
    />
  );
}
