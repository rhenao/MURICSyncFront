import { Button, Card, Typography } from "@mui/material";
import { MaterialReactTable, type MRT_ColumnDef } from "material-react-table";
import { useEntidades } from "../../../hooks/useEntidades";
import type TipoPoliza from "../models/TipoPoliza.model";

export default function ListTipoPoliza() {
  const { entidades, cargando } = useEntidades<TipoPoliza>("/TipoPoliza");

  const columns: MRT_ColumnDef<TipoPoliza>[] = [
    { accessorKey: "Codigo", header: "Código", size: 120 },
    { accessorKey: "Descripcion", header: "Descripción", size: 360 },
    {
      header: "Acciones",
      size: 60,
      Cell: ({ row }) => (
        <Button
          variant="contained"
          sx={{
            fontSize: "0.875rem",
            minWidth: 0,
            px: 1,
            backgroundColor: "primary.main",
          }}
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
        muiTableProps={{ size: "small" }}
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
            Tabla - Tipo Póliza
          </Typography>
        )}
      />
    </Card>
  );
}
