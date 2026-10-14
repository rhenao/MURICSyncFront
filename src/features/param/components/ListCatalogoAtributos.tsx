import ListaGeneralConsulta, { type ColumnConfig } from "../shared/ListaGeneralConsulta";

const columns: ColumnConfig[] = [
  { accessorKey: "Codigo", header: "Código", size: 90 },
  { accessorKey: "Nombre", header: "Atributo", size: 280 },
  { accessorKey: "Naturaleza", header: "Naturaleza", size: 170 },
  { accessorKey: "CatalogoValor", header: "Catálogo de valores", size: 190, nullFallback: "—" },
  { accessorKey: "Descripcion", header: "Descripción", size: 520, nullFallback: "—" },
];

export default function ListCatalogoAtributos() {
  return (
    <ListaGeneralConsulta
      endpoint="/CatalogoAtributos"
      title="Catálogo de Atributos"
      columns={columns}
    />
  );
}
