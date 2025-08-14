import { useEntidades } from "../../../hooks/useEntidades";
import type CondicionBien from "../models/CondicionBien.model";
import { MaterialReactTable, type MRT_ColumnDef } from "material-react-table";
import { Button, Card, Typography } from "@mui/material";

export default function ListCondicionBien() {
  const { entidades, cargando } = useEntidades<CondicionBien>("/CondicionBien");

  const columns: MRT_ColumnDef<CondicionBien>[] = [
    {
      accessorKey: "Codigo",
      header: "Código",
      size: 120,
    },
    {
      accessorKey: "Descripcion",
      header: "Descripción",
      size: 480,
    },
    {
      header: "Acciones",
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
      size: 60,
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
        enableSorting={true}
        enablePagination={false}
        muiTableProps={{
          size: "small", // Esta es la prop clave para alta densidad
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
            Tabla - Condición de un Bien
          </Typography>
        )}
      />
    </Card>
  );
}
