import type { MRT_ColumnDef } from "material-react-table";

export interface ColumnConfig {
  accessorKey: string;
  header: string;
  size: number;
  nullFallback?: string;
}

export type Row = Record<string, unknown>;

export function toMrtColumns(columns: ColumnConfig[]): MRT_ColumnDef<Row>[] {
  return columns.map<MRT_ColumnDef<Row>>((col) => ({
    accessorKey: col.accessorKey,
    header: col.header,
    size: col.size,
    ...(col.nullFallback != null
      ? { Cell: ({ cell }) => (cell.getValue<string>() ?? col.nullFallback) }
      : {}),
  }));
}

// El API devuelve las propiedades en PascalCase; se deja "codigo" como respaldo.
export function getRowKey(row: Row, keyField = "Codigo"): string {
  const key = row[keyField] ?? row[keyField.charAt(0).toLowerCase() + keyField.slice(1)];
  return key != null ? String(key) : "";
}
