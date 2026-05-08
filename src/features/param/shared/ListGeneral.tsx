import { useEntidades } from "../../../hooks/useEntidades";
import { MaterialReactTable, type MRT_ColumnDef } from "material-react-table";
import { Box, Button, Card, Chip, Typography } from "@mui/material";
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
        border: "1px solid",
        borderColor: "divider",
        backgroundColor: "background.paper",
        p: { xs: 1, md: 1.5 },
        minWidth: 0,
        maxWidth: "100vw",
        borderRadius: 3,
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
        enableStickyHeader
        enableGlobalFilter
        enableDensityToggle={false}
        enableFullScreenToggle={false}
        muiTableProps={{
          size: "small",
        }}
        muiTableBodyRowProps={({ row }) => ({
          hover: true,
          sx: {
            backgroundColor:
              row.index % 2 === 0 ? "rgba(37, 64, 146, 0.02)" : "transparent",
          },
        })}
        muiTableContainerProps={{
          sx: {
            width: "100%",
            flex: 1,
            minWidth: 0,
            maxWidth: "100vw",
            alignItems: "flex-start",
            backgroundColor: "background.paper",
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 2,
            maxHeight: "68vh",
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
        muiTableHeadCellProps={{
          sx: {
            fontSize: "0.95rem",
            fontWeight: 700,
            backgroundColor: "rgba(37, 64, 146, 0.08)",
            borderBottom: "1px solid",
            borderColor: "divider",
          },
        }}
        muiTableBodyCellProps={{ sx: { fontSize: "0.9rem" } }}
        renderTopToolbarCustomActions={() => (
          <Box
            sx={{
              px: 1,
              py: 0.5,
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 1,
              flexWrap: "wrap",
            }}
          >
            <Typography variant="h6" color="text.primary" sx={{ fontWeight: 700 }}>
              {title}
            </Typography>
            <Chip
              label={`${(entidades ?? []).length} registros`}
              size="small"
              color="primary"
              variant="outlined"
            />
          </Box>
        )}
      />
    </Card>
  );
}
