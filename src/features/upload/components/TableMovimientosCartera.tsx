import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Chip,
  Box,
  TablePagination,
  TextField,
  Stack,
  IconButton,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import FileDownloadIcon from "@mui/icons-material/FileDownload";

interface MovimientoCartera {
  id: string;
  identificacionCredito: string;
  tipoIdentificacionDeudor: string;
  numeroIdentificacion: string;
  fechaCorte: string;
  calificacionCredito: string;
  estadoCredito:
    | "Vigente"
    | "Vencido"
    | "Cobro Jurídico"
    | "Castigado"
    | "Cancelado";
  periodosGracia: number;
  diasMora: number;
  tasaInteres: number;
  spreadTasaInteres: number;
  capital: number;
  intereses: number;
  otrosConceptos: number;
}

// Datos de prueba
const movimientosCartera: MovimientoCartera[] = [
  {
    id: "1",
    identificacionCredito: "CRE-001-2024",
    tipoIdentificacionDeudor: "CC",
    numeroIdentificacion: "12345678",
    fechaCorte: "2024-08-31",
    calificacionCredito: "A",
    estadoCredito: "Vigente",
    periodosGracia: 0,
    diasMora: 0,
    tasaInteres: 12.5,
    spreadTasaInteres: 2.3,
    capital: 48500000,
    intereses: 525000,
    otrosConceptos: 75000,
  },
  {
    id: "2",
    identificacionCredito: "CRE-002-2024",
    tipoIdentificacionDeudor: "NIT",
    numeroIdentificacion: "900123456",
    fechaCorte: "2024-08-31",
    calificacionCredito: "B",
    estadoCredito: "Vigente",
    periodosGracia: 1,
    diasMora: 15,
    tasaInteres: 14.2,
    spreadTasaInteres: 3.1,
    capital: 23800000,
    intereses: 295000,
    otrosConceptos: 45000,
  },
  {
    id: "3",
    identificacionCredito: "CRE-003-2024",
    tipoIdentificacionDeudor: "CE",
    numeroIdentificacion: "87654321",
    fechaCorte: "2024-08-31",
    calificacionCredito: "C",
    estadoCredito: "Vencido",
    periodosGracia: 0,
    diasMora: 45,
    tasaInteres: 16.8,
    spreadTasaInteres: 4.5,
    capital: 14200000,
    intereses: 185000,
    otrosConceptos: 120000,
  },
  {
    id: "4",
    identificacionCredito: "CRE-004-2024",
    tipoIdentificacionDeudor: "CC",
    numeroIdentificacion: "11223344",
    fechaCorte: "2024-08-31",
    calificacionCredito: "A",
    estadoCredito: "Vigente",
    periodosGracia: 2,
    diasMora: 0,
    tasaInteres: 11.8,
    spreadTasaInteres: 1.9,
    capital: 75600000,
    intereses: 892000,
    otrosConceptos: 156000,
  },
  {
    id: "5",
    identificacionCredito: "CRE-005-2024",
    tipoIdentificacionDeudor: "TI",
    numeroIdentificacion: "98765432",
    fechaCorte: "2024-08-31",
    calificacionCredito: "D",
    estadoCredito: "Cobro Jurídico",
    periodosGracia: 0,
    diasMora: 125,
    tasaInteres: 18.5,
    spreadTasaInteres: 6.2,
    capital: 4850000,
    intereses: 285000,
    otrosConceptos: 450000,
  },
  {
    id: "6",
    identificacionCredito: "CRE-006-2024",
    tipoIdentificacionDeudor: "CC",
    numeroIdentificacion: "55667788",
    fechaCorte: "2024-08-31",
    calificacionCredito: "E",
    estadoCredito: "Castigado",
    periodosGracia: 0,
    diasMora: 365,
    tasaInteres: 0,
    spreadTasaInteres: 0,
    capital: 0,
    intereses: 0,
    otrosConceptos: 0,
  },
];

export default function TableMovimientosCartera() {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");

  // Filtrar datos según término de búsqueda
  const filteredData = movimientosCartera.filter(
    (item) =>
      item.identificacionCredito
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      item.numeroIdentificacion.includes(searchTerm) ||
      item.calificacionCredito
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      item.estadoCredito.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  const getCalificacionColor = (calificacion: string) => {
    switch (calificacion) {
      case "A":
        return "success";
      case "B":
        return "info";
      case "C":
        return "warning";
      case "D":
      case "E":
        return "error";
      default:
        return "default";
    }
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case "Vigente":
        return "success";
      case "Vencido":
        return "warning";
      case "Cobro Jurídico":
        return "error";
      case "Castigado":
        return "default";
      case "Cancelado":
        return "info";
      default:
        return "default";
    }
  };

  const getDiasMoraColor = (dias: number) => {
    if (dias === 0) return "success";
    if (dias <= 30) return "warning";
    return "error";
  };

  const paginatedData = filteredData.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  // Calcular totales
  const totales = filteredData.reduce(
    (acc, item) => ({
      capital: acc.capital + item.capital,
      intereses: acc.intereses + item.intereses,
      otrosConceptos: acc.otrosConceptos + item.otrosConceptos,
    }),
    { capital: 0, intereses: 0, otrosConceptos: 0 }
  );

  return (
    <Paper sx={{ width: "100%", overflow: "hidden" }}>
      <Box sx={{ p: 2 }}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          mb={2}
        >
          <Typography variant="h6" component="div">
            Movimientos de Cartera
          </Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            <TextField
              size="small"
              placeholder="Buscar por ID, documento, calificación..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <SearchIcon sx={{ mr: 1, color: "text.secondary" }} />
                ),
              }}
              sx={{ minWidth: 300 }}
            />
            <IconButton size="small" color="primary">
              <FileDownloadIcon />
            </IconButton>
          </Stack>
        </Stack>

        <Stack direction="row" spacing={3} mb={2}>
          <Typography variant="body2" color="text.secondary">
            Total registros: {filteredData.length}
          </Typography>
          <Typography variant="body2" color="primary" fontWeight="medium">
            Capital: {formatCurrency(totales.capital)}
          </Typography>
          <Typography variant="body2" color="primary" fontWeight="medium">
            Intereses: {formatCurrency(totales.intereses)}
          </Typography>
          <Typography variant="body2" color="primary" fontWeight="medium">
            Otros: {formatCurrency(totales.otrosConceptos)}
          </Typography>
        </Stack>
      </Box>

      <TableContainer
        sx={{
          maxHeight: 600,
          overflow: "auto",
          "&::-webkit-scrollbar": {
            height: "8px",
          },
          "&::-webkit-scrollbar-track": {
            backgroundColor: "#f1f1f1",
          },
          "&::-webkit-scrollbar-thumb": {
            backgroundColor: "#888",
            borderRadius: "4px",
          },
          "&::-webkit-scrollbar-thumb:hover": {
            backgroundColor: "#555",
          },
        }}
      >
        <Table stickyHeader size="small" aria-label="tabla movimientos cartera">
          <TableHead>
            <TableRow>
              <TableCell>ID Crédito</TableCell>
              <TableCell>Tipo ID</TableCell>
              <TableCell>Nro Identificación</TableCell>
              <TableCell>Fecha Corte</TableCell>
              <TableCell>Calificación</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell align="center">Períodos Gracia</TableCell>
              <TableCell align="center">Días Mora</TableCell>
              <TableCell align="right">Tasa Interés</TableCell>
              <TableCell align="right">Spread Tasa</TableCell>
              <TableCell align="right">Capital</TableCell>
              <TableCell align="right">Intereses</TableCell>
              <TableCell align="right">Otros Conceptos</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedData.map((row) => (
              <TableRow hover key={row.id}>
                <TableCell>
                  <Typography variant="body2" fontWeight="medium">
                    {row.identificacionCredito}
                  </Typography>
                </TableCell>
                <TableCell>{row.tipoIdentificacionDeudor}</TableCell>
                <TableCell>{row.numeroIdentificacion}</TableCell>
                <TableCell>{row.fechaCorte}</TableCell>
                <TableCell>
                  <Chip
                    label={row.calificacionCredito}
                    size="small"
                    color={getCalificacionColor(row.calificacionCredito)}
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    label={row.estadoCredito}
                    size="small"
                    variant="outlined"
                    color={getEstadoColor(row.estadoCredito)}
                  />
                </TableCell>
                <TableCell align="center">
                  <Typography variant="body2">{row.periodosGracia}</Typography>
                </TableCell>
                <TableCell align="center">
                  <Chip
                    label={row.diasMora}
                    size="small"
                    color={getDiasMoraColor(row.diasMora)}
                    variant={row.diasMora === 0 ? "outlined" : "filled"}
                  />
                </TableCell>
                <TableCell align="right">
                  <Typography variant="body2" fontWeight="medium">
                    {formatPercentage(row.tasaInteres)}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="body2">
                    {formatPercentage(row.spreadTasaInteres)}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="body2" fontWeight="medium">
                    {formatCurrency(row.capital)}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="body2" fontWeight="medium">
                    {formatCurrency(row.intereses)}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="body2" fontWeight="medium">
                    {formatCurrency(row.otrosConceptos)}
                  </Typography>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        rowsPerPageOptions={[5, 10, 25, 50]}
        component="div"
        count={filteredData.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        labelRowsPerPage="Filas por página:"
        labelDisplayedRows={({ from, to, count }) =>
          `${from}-${to} de ${count !== -1 ? count : `más de ${to}`}`
        }
      />
    </Paper>
  );
}
