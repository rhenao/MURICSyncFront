import type { MRT_ColumnDef } from "material-react-table";

export type FieldType = "text" | "multiline" | "number" | "select";

export interface SelectOption {
  value: string | number;
  label: string;
}

export interface ColumnConfig {
  accessorKey: string;
  header: string;
  size: number;
  nullFallback?: string;

  // --- Metadatos de formulario: solo los usa ListaGeneralCrud ---
  fieldType?: FieldType; // por defecto "text"
  required?: boolean; // por defecto true
  maxLength?: number;
  options?: SelectOption[]; // para "select"; la tabla muestra el label
  hideInForm?: boolean;
}

export type Row = Record<string, unknown>;

export function toMrtColumns(columns: ColumnConfig[]): MRT_ColumnDef<Row>[] {
  return columns.map<MRT_ColumnDef<Row>>((col) => ({
    accessorKey: col.accessorKey,
    header: col.header,
    size: col.size,
    ...(col.options != null
      ? {
          Cell: ({ cell }) => {
            const value = cell.getValue<string | number | null>();
            return col.options!.find((o) => o.value === value)?.label ?? value ?? col.nullFallback;
          },
        }
      : col.nullFallback != null
        ? { Cell: ({ cell }) => (cell.getValue<string>() ?? col.nullFallback) }
        : {}),
  }));
}

// El API devuelve las propiedades en PascalCase; se deja "codigo" como respaldo.
export function getRowKey(row: Row, keyField = "Codigo"): string {
  const key = row[keyField] ?? row[keyField.charAt(0).toLowerCase() + keyField.slice(1)];
  return key != null ? String(key) : "";
}
