import { Button, Card, Typography } from "@mui/material";
import { MaterialReactTable, type MRT_ColumnDef } from "material-react-table";
import { useEntidades } from "../../../hooks/useEntidades";
import type ClaseDeDeudor from "../models/ClaseDeDeudor.model";

export default function ListClaseDeDeudor() {
  const { entidades, cargando } = useEntidades<ClaseDeDeudor>("/ClaseDeDeudor");

  const columns: MRT_ColumnDef<ClaseDeDeudor>[] = [
    {
      accessorKey: "Codigo",
      header: "Código",
      size: 120,
    },
    {
      accessorKey: "Descripcion",
      header: "Descripción",
      size: 320,
    },
    {
      accessorKey: "DescripcionDetallada",
      header: "Descripción Detallada",
      size: 420,
      Cell: ({ cell }) => cell.getValue<string>() ?? "–",
    },
    {
      header: "Acciones",
      size: 60,
      Cell: ({ row }) => (
        <Button
          sx={{
            fontSize: "0.875rem",
            minWidth: 0,
            px: 1,
            backgroundColor: "primary.main",
          }}
          variant="contained"
          onClick={() => alert(`Editar ${row.original.descripcion}`)}
        >
          Editar
        </Button>
      ),
    },
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
        columns={columns}
        data={entidades ?? []}
        getRowId={(row) => (row.codigo != null ? row.codigo.toString() : "")}
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
            Tabla - Clase de Deudor
          </Typography>
        )}
      />
    </Card>
  );
}
