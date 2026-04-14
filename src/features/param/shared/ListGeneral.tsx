import { useEntidades } from "../../../hooks/useEntidades";
import { MaterialReactTable, type MRT_ColumnDef } from "material-react-table";
import { Button, Card, Typography } from "@mui/material";
import useAuth from "../../auth/hooks/useAuth";

export interface ColumnConfig {
  accessorKey: string;
  header: string;
  size: number;
  nullFallback?: string;
}

interface ListGeneralProps {
  endpoint: string;
  title: string;
  columns: ColumnConfig[];
}

type Row = Record<string, unknown>;

export default function ListGeneral({
  endpoint,
  title,
  columns,
}: ListGeneralProps) {
  const { entidades, cargando } = useEntidades<Row>(endpoint);
  const { user } = useAuth();
  const isAdmin = user?.roles?.includes("ADMIN") ?? false;

  const tableColumns: MRT_ColumnDef<Row>[] = [
    ...columns.map<MRT_ColumnDef<Row>>((col) => ({
      accessorKey: col.accessorKey,
      header: col.header,
      size: col.size,
      ...(col.nullFallback != null
        ? { Cell: ({ cell }) => (cell.getValue<string>() ?? col.nullFallback) }
        : {}),
    })),
    ...(isAdmin
      ? [
          {
            header: "Acciones",
            size: 60,
            Cell: ({ row }: { row: { original: Row } }) => (
              <Button
                variant="contained"
                sx={{
                  fontSize: "0.875rem",
                  minWidth: 0,
                  px: 1,
                  backgroundColor: "primary.main",
                }}
                onClick={() =>
                  alert(`Editar ${row.original["Descripcion"] ?? row.original["descripcion"] ?? ""}`)
                }
              >
                Editar
              </Button>
            ),
          } as MRT_ColumnDef<Row>,
        ]
      : []),
  ];

  return (
    <Card
      sx={{
        width: "100%",
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "stretch",
        justifyContent: "flex-start",
        boxSizing: "border-box",
        backgroundColor: "background.default",
        p: 2,
        minWidth: 0,
        maxWidth: "100vw",
      }}
    >
      <MaterialReactTable
        columns={tableColumns}
        data={entidades ?? []}
        getRowId={(row) =>
          row["codigo"] != null ? String(row["codigo"]) : ""
        }
        state={{ isLoading: cargando }}
        enableColumnActions={false}
        enableColumnFilters={false}
        enableSorting
        enablePagination={false}
        muiTableProps={{
          size: "small",
        }}
        muiTableBodyRowProps={{ hover: true }}
        muiTableContainerProps={{
          sx: {
            width: "100%",
            flex: 1,
            minWidth: 0,
            maxWidth: "100vw",
            alignItems: "flex-start",
            backgroundColor: "background.paper",
          },
        }}
        muiTablePaperProps={{
          sx: {
            width: "100%",
            flex: 1,
            minWidth: 0,
            maxWidth: "100vw",
            boxShadow: "none",
            backgroundColor: "background.paper",
          },
        }}
        muiTableHeadCellProps={{ sx: { fontSize: "1.15rem" } }}
        muiTableBodyCellProps={{ sx: { fontSize: "1.1rem" } }}
        renderTopToolbarCustomActions={() => (
          <Typography variant="h6" sx={{ pl: 2 }} color="text.secondary">
            Tabla - {title}
          </Typography>
        )}
      />
    </Card>
  );
}
