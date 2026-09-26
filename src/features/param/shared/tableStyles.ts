import type { MRT_TableOptions } from "material-react-table";
import type { SxProps, Theme } from "@mui/material";
import type { Row } from "./columnConfig";

export const cardSx: SxProps<Theme> = {
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
};

export const bodyCellSx = { fontSize: "0.9rem" };

// Opciones comunes de MaterialReactTable para las listas de parámetros.
export const baseTableOptions: Partial<MRT_TableOptions<Row>> = {
  enableColumnActions: false,
  enableColumnFilters: false,
  enableSorting: true,
  enablePagination: false,
  enableStickyHeader: true,
  enableGlobalFilter: true,
  enableDensityToggle: false,
  enableFullScreenToggle: false,
  muiTableProps: {
    size: "small",
  },
  muiTableBodyRowProps: ({ row }) => ({
    hover: true,
    sx: {
      backgroundColor:
        row.index % 2 === 0 ? "rgba(37, 64, 146, 0.02)" : "transparent",
    },
  }),
  muiTableContainerProps: {
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
  },
  muiTablePaperProps: {
    sx: {
      width: "100%",
      flex: 1,
      minWidth: 0,
      maxWidth: "100vw",
      boxShadow: "none",
      backgroundColor: "background.paper",
    },
  },
  muiTableHeadCellProps: {
    sx: {
      fontSize: "0.95rem",
      fontWeight: 700,
      backgroundColor: "rgba(37, 64, 146, 0.08)",
      borderBottom: "1px solid",
      borderColor: "divider",
    },
  },
  muiTableBodyCellProps: { sx: bodyCellSx },
};
