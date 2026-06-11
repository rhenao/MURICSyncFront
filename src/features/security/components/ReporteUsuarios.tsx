import { useState, useEffect, useCallback } from "react";
import { Navigate } from "react-router-dom";
import { MaterialReactTable, type MRT_ColumnDef } from "material-react-table";
import {
  Alert,
  Box,
  Button,
  Card,
  Chip,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import { DownloadOutlined as DownloadIcon } from "@mui/icons-material";
import type { UserReportItemDto, UserReportFilterDto } from "../models/UserReport.model";
import UserReportService from "../services/UserReportService";
import { usePermission } from "../../auth/hooks/usePermission";

interface FilterInputs {
  isActive: "" | "true" | "false";
  role: string;
  search: string;
  lastLoginFrom: string;
  lastLoginTo: string;
}

const EMPTY_FILTERS: FilterInputs = {
  isActive: "",
  role: "",
  search: "",
  lastLoginFrom: "",
  lastLoginTo: "",
};

function toApiFilter(f: FilterInputs): Omit<UserReportFilterDto, "page" | "pageSize"> {
  return {
    isActive: f.isActive === "" ? undefined : f.isActive === "true",
    role: f.role || undefined,
    search: f.search || undefined,
    lastLoginFrom: f.lastLoginFrom || undefined,
    lastLoginTo: f.lastLoginTo || undefined,
  };
}

export default function ReporteUsuarios() {
  const { hasPermission } = usePermission();

  const [filterInputs, setFilterInputs] = useState<FilterInputs>(EMPTY_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState<FilterInputs>(EMPTY_FILTERS);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(50);

  const [rows, setRows] = useState<UserReportItemDto[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const fetchData = useCallback(async (filters: FilterInputs, page: number, size: number) => {
    setLoading(true);
    setError(null);
    try {
      const apiFilter: UserReportFilterDto = {
        ...toApiFilter(filters),
        page: page + 1, // MRT is 0-based, backend expects 1-based
        pageSize: size,
      };
      const result = await UserReportService.getReport(apiFilter);
      setRows(result.items);
      setTotalCount(result.totalCount);
    } catch {
      setError("No se pudo cargar el reporte. Intente nuevamente.");
      setRows([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(appliedFilters, pageIndex, pageSize);
  }, [appliedFilters, pageIndex, pageSize, fetchData]);

  if (!hasPermission("usuarios.read")) {
    return <Navigate to="/app" replace />;
  }

  const handleSearch = () => {
    setAppliedFilters(filterInputs);
    setPageIndex(0);
  };

  const handleClear = () => {
    setFilterInputs(EMPTY_FILTERS);
    setAppliedFilters(EMPTY_FILTERS);
    setPageIndex(0);
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      await UserReportService.exportCsv(toApiFilter(appliedFilters));
    } catch {
      setError("No se pudo exportar el reporte.");
    } finally {
      setExporting(false);
    }
  };

  const set = <K extends keyof FilterInputs>(key: K, value: FilterInputs[K]) =>
    setFilterInputs((prev) => ({ ...prev, [key]: value }));

  const columns: MRT_ColumnDef<UserReportItemDto>[] = [
    { accessorKey: "firstName", header: "Nombre", size: 140 },
    { accessorKey: "lastName", header: "Apellido", size: 150 },
    { accessorKey: "email", header: "Email", size: 240 },
    {
      accessorKey: "isActive",
      header: "Estado",
      size: 100,
      Cell: ({ cell }) => (
        <Chip
          label={cell.getValue<boolean>() ? "Activo" : "Inactivo"}
          size="small"
          color={cell.getValue<boolean>() ? "success" : "error"}
        />
      ),
    },
    {
      accessorKey: "lastLoginAt",
      header: "Último Login",
      size: 175,
      Cell: ({ cell }) => {
        const val = cell.getValue<string | undefined>();
        return (
          <Typography variant="body2" color={val ? "text.primary" : "text.disabled"}>
            {val ? new Date(val).toLocaleString("es-CO") : "Nunca"}
          </Typography>
        );
      },
    },
    {
      accessorKey: "createdAt",
      header: "Creado",
      size: 130,
      Cell: ({ cell }) => (
        <Typography variant="body2">
          {new Date(cell.getValue<string>()).toLocaleDateString("es-CO")}
        </Typography>
      ),
    },
    {
      accessorKey: "roles",
      header: "Roles",
      size: 180,
      Cell: ({ row }) => (
        <Box sx={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
          {row.original.roles.map((role) => (
            <Chip key={role} label={role} size="small" variant="outlined" color="primary" />
          ))}
        </Box>
      ),
    },
  ];

  return (
    <>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Filter panel */}
      <Card sx={{ p: 2, mb: 2, backgroundColor: "background.paper" }}>
        <Typography variant="subtitle1" sx={{ mb: 1.5, fontWeight: 600 }}>
          Filtros
        </Typography>
        <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", alignItems: "flex-end" }}>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Estado</InputLabel>
            <Select
              label="Estado"
              value={filterInputs.isActive}
              onChange={(e) => set("isActive", e.target.value as FilterInputs["isActive"])}
            >
              <MenuItem value="">Todos</MenuItem>
              <MenuItem value="true">Activo</MenuItem>
              <MenuItem value="false">Inactivo</MenuItem>
            </Select>
          </FormControl>

          <TextField
            label="Rol"
            size="small"
            value={filterInputs.role}
            onChange={(e) => set("role", e.target.value)}
            sx={{ minWidth: 140 }}
          />

          <TextField
            label="Búsqueda"
            size="small"
            value={filterInputs.search}
            onChange={(e) => set("search", e.target.value)}
            placeholder="Nombre, apellido o email"
            sx={{ minWidth: 220 }}
          />

          <TextField
            label="Último login desde"
            type="date"
            size="small"
            value={filterInputs.lastLoginFrom}
            onChange={(e) => set("lastLoginFrom", e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ minWidth: 180 }}
          />

          <TextField
            label="Último login hasta"
            type="date"
            size="small"
            value={filterInputs.lastLoginTo}
            onChange={(e) => set("lastLoginTo", e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ minWidth: 180 }}
          />

          <Button variant="contained" onClick={handleSearch} disabled={loading}>
            Buscar
          </Button>
          <Button variant="outlined" onClick={handleClear} disabled={loading} color="inherit">
            Limpiar
          </Button>
        </Box>
      </Card>

      {/* Data table */}
      <Card
        sx={{
          width: "100%",
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "stretch",
          boxSizing: "border-box",
          backgroundColor: "background.default",
          p: 2,
          minWidth: 0,
          maxWidth: "100vw",
        }}
      >
        <MaterialReactTable
          columns={columns}
          data={rows}
          getRowId={(row) => row.id}
          manualPagination
          rowCount={totalCount}
          onPaginationChange={(updater) => {
            const next =
              typeof updater === "function"
                ? updater({ pageIndex, pageSize })
                : updater;
            if (next.pageIndex !== pageIndex) setPageIndex(next.pageIndex);
            if (next.pageSize !== pageSize) {
              setPageSize(next.pageSize);
              setPageIndex(0);
            }
          }}
          state={{ isLoading: loading, pagination: { pageIndex, pageSize } }}
          enableColumnActions={false}
          enableColumnFilters={false}
          enableSorting={false}
          muiTableProps={{ size: "small" }}
          muiTableBodyRowProps={{ hover: true }}
          muiTableContainerProps={{
            sx: {
              width: "100%",
              flex: 1,
              minWidth: 0,
              maxWidth: "100vw",
              backgroundColor: "background.paper",
              maxHeight: "55vh",
              overflowY: "auto",
              overflowX: "auto",
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
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                width: "100%",
                pl: 2,
                pr: 2,
              }}
            >
              <Typography variant="h6" color="text.secondary">
                Reporte de Usuarios
              </Typography>
              <Button
                variant="outlined"
                startIcon={exporting ? <CircularProgress size={18} /> : <DownloadIcon />}
                onClick={handleExport}
                disabled={exporting || loading}
                sx={{ fontSize: "0.875rem" }}
              >
                {exporting ? "Exportando..." : "Exportar CSV"}
              </Button>
            </Box>
          )}
        />
      </Card>
    </>
  );
}
