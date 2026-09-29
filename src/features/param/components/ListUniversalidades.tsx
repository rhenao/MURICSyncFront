import ListaGeneralCrud, { type ColumnConfig, type SelectOption } from "../shared/ListaGeneralCrud";

const ESTADOS: SelectOption[] = [
  { value: "A", label: "Activo", color: "success" },
  { value: "I", label: "Inactivo", color: "default" },
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
  // E9 c: se antepone al id del crédito al cargar, para que dos originadores con el mismo número
  // no choquen. El backend valida el formato y no deja cambiarlo tras la primera transmisión.
  {
    accessorKey: "PrefijoCredito",
    header: "Prefijo de crédito",
    size: 170,
    required: false,
    maxLength: 20,
    nullFallback: "—",
  },
];

export default function ListUniversalidades() {
  return (
    <ListaGeneralCrud
      endpoint="/Universalidades"
      title="Universalidades"
      columns={columns}
      // R1: no se borra físicamente (lotes y créditos la referencian por FK);
      // la baja es lógica con Estado = "I".
      allowDelete={false}
      filaInactiva={(row) => row["Estado"] === "I"}
    />
  );
}
