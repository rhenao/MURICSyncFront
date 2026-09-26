import ListaGeneralCrud, { type ColumnConfig } from "../shared/ListaGeneralCrud";

const ESTADOS = [
  { value: "A", label: "Activo" },
  { value: "I", label: "Inactivo" },
];

const columns: ColumnConfig[] = [
  { accessorKey: "Codigo", header: "Código", size: 120, fieldType: "number" },
  { accessorKey: "Descripcion", header: "Descripción", size: 320, maxLength: 100 },
  {
    accessorKey: "Estado",
    header: "Estado",
    size: 120,
    fieldType: "select",
    options: ESTADOS,
    defaultValue: "A",
  },
];

export default function ListUniversalidades() {
  return (
    <ListaGeneralCrud
      endpoint="/Universalidades"
      title="Universalidades"
      columns={columns}
    />
  );
}
