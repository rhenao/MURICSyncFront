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

interface InsumoCredito {
  id: string;
  identificacionCredito: string;
  tipoIdentificacionDeudor: string;
  nroIdentificacionDeudor: string;
  modalidadProvision: string;
  tipoCodigoProducto: string;
  calidadDeudor: string;
  fechaDesembolso: string;
  fechaVencimiento: string;
  montoDesembolsado: number;
  frecuenciaPagoCapital: string;
  frecuenciaPagoIntereses: string;
  tipoTasa: string;
  tipoGarantia: string;
  moneda: string;
  estadoRegistro: "Activo" | "Inactivo" | "Vencido" | "Cancelado";
}

// Datos de prueba
const insumosCredito: InsumoCredito[] = [
  {
    id: "1",
    identificacionCredito: "CRE-001-2024",
    tipoIdentificacionDeudor: "CC",
    nroIdentificacionDeudor: "12345678",
    modalidadProvision: "Individual",
    tipoCodigoProducto: "CRH",
    calidadDeudor: "A",
    fechaDesembolso: "2024-01-15",
    fechaVencimiento: "2026-01-15",
    montoDesembolsado: 50000000,
    frecuenciaPagoCapital: "Mensual",
    frecuenciaPagoIntereses: "Mensual",
    tipoTasa: "Fija",
    tipoGarantia: "Hipotecaria",
    moneda: "COP",
    estadoRegistro: "Activo",
  },
  {
    id: "2",
    identificacionCredito: "CRE-002-2024",
    tipoIdentificacionDeudor: "NIT",
    nroIdentificacionDeudor: "900123456",
    modalidadProvision: "Grupal",
    tipoCodigoProducto: "CRC",
    calidadDeudor: "B",
    fechaDesembolso: "2024-02-10",
    fechaVencimiento: "2025-02-10",
    montoDesembolsado: 25000000,
    frecuenciaPagoCapital: "Trimestral",
    frecuenciaPagoIntereses: "Mensual",
    tipoTasa: "Variable",
    tipoGarantia: "Personal",
    moneda: "COP",
    estadoRegistro: "Activo",
  },
  {
    id: "3",
    identificacionCredito: "CRE-003-2024",
    tipoIdentificacionDeudor: "CE",
    nroIdentificacionDeudor: "87654321",
    modalidadProvision: "Individual",
    tipoCodigoProducto: "CRM",
    calidadDeudor: "C",
    fechaDesembolso: "2023-12-01",
    fechaVencimiento: "2024-12-01",
    montoDesembolsado: 15000000,
    frecuenciaPagoCapital: "Mensual",
    frecuenciaPagoIntereses: "Mensual",
    tipoTasa: "Fija",
    tipoGarantia: "Prenda",
    moneda: "COP",
    estadoRegistro: "Vencido",
  },
  {
    id: "4",
    identificacionCredito: "CRE-004-2024",
    tipoIdentificacionDeudor: "CC",
    nroIdentificacionDeudor: "11223344",
    modalidadProvision: "Individual",
    tipoCodigoProducto: "CRH",
    calidadDeudor: "A",
    fechaDesembolso: "2024-03-20",
    fechaVencimiento: "2029-03-20",
    montoDesembolsado: 80000000,
    frecuenciaPagoCapital: "Mensual",
    frecuenciaPagoIntereses: "Mensual",
    tipoTasa: "Variable",
    tipoGarantia: "Hipotecaria",
    moneda: "COP",
    estadoRegistro: "Activo",
  },
  {
    id: "5",
    identificacionCredito: "CRE-005-2024",
    tipoIdentificacionDeudor: "TI",
    nroIdentificacionDeudor: "98765432",
    modalidadProvision: "Individual",
    tipoCodigoProducto: "CRC",
    calidadDeudor: "D",
    fechaDesembolso: "2023-06-15",
    fechaVencimiento: "2024-06-15",
    montoDesembolsado: 5000000,
    frecuenciaPagoCapital: "Mensual",
    frecuenciaPagoIntereses: "Mensual",
    tipoTasa: "Fija",
    tipoGarantia: "Sin garantía",
    moneda: "COP",
    estadoRegistro: "Cancelado",
  },
];

export default function TableInsumosCredito() {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");

  // Filtrar datos según término de búsqueda
  const filteredData = insumosCredito.filter(
    (item) =>
      item.identificacionCredito
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      item.nroIdentificacionDeudor.includes(searchTerm) ||
      item.tipoCodigoProducto.toLowerCase().includes(searchTerm.toLowerCase())
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

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case "Activo":
        return "success";
      case "Vencido":
        return "error";
      case "Cancelado":
        return "default";
      case "Inactivo":
        return "warning";
      default:
        return "default";
    }
  };

  const paginatedData = filteredData.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
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
            Insumos de Crédito
          </Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            <TextField
              size="small"
              placeholder="Buscar por ID, documento o producto..."
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

        <Typography variant="body2" color="text.secondary" mb={2}>
          Total de registros: {filteredData.length}
        </Typography>
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
        <Table stickyHeader aria-label="tabla insumos credito">
          <TableHead>
            <TableRow>
              <TableCell>ID Crédito</TableCell>
              <TableCell>Tipo ID</TableCell>
              <TableCell>Nro Identificación</TableCell>
              <TableCell>Modalidad Provisión</TableCell>
              <TableCell>Código Producto</TableCell>
              <TableCell>Calidad Deudor</TableCell>
              <TableCell>Fecha Desembolso</TableCell>
              <TableCell>Fecha Vencimiento</TableCell>
              <TableCell align="right">Monto Desembolsado</TableCell>
              <TableCell>Frec. Pago Capital</TableCell>
              <TableCell>Frec. Pago Intereses</TableCell>
              <TableCell>Tipo Tasa</TableCell>
              <TableCell>Tipo Garantía</TableCell>
              <TableCell>Moneda</TableCell>
              <TableCell>Estado</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedData.map((row) => (
              <TableRow hover key={row.id}>
                <TableCell component="th" scope="row">
                  <Typography variant="body2" fontWeight="medium">
                    {row.identificacionCredito}
                  </Typography>
                </TableCell>
                <TableCell>{row.tipoIdentificacionDeudor}</TableCell>
                <TableCell>{row.nroIdentificacionDeudor}</TableCell>
                <TableCell>{row.modalidadProvision}</TableCell>
                <TableCell>
                  <Chip
                    label={row.tipoCodigoProducto}
                    size="small"
                    variant="outlined"
                    color="primary"
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    label={row.calidadDeudor}
                    size="small"
                    color={
                      row.calidadDeudor === "A"
                        ? "success"
                        : row.calidadDeudor === "B"
                        ? "info"
                        : row.calidadDeudor === "C"
                        ? "warning"
                        : "error"
                    }
                  />
                </TableCell>
                <TableCell>{row.fechaDesembolso}</TableCell>
                <TableCell>{row.fechaVencimiento}</TableCell>
                <TableCell align="right">
                  <Typography variant="body2" fontWeight="medium">
                    {formatCurrency(row.montoDesembolsado)}
                  </Typography>
                </TableCell>
                <TableCell>{row.frecuenciaPagoCapital}</TableCell>
                <TableCell>{row.frecuenciaPagoIntereses}</TableCell>
                <TableCell>{row.tipoTasa}</TableCell>
                <TableCell>{row.tipoGarantia}</TableCell>
                <TableCell>{row.moneda}</TableCell>
                <TableCell>
                  <Chip
                    label={row.estadoRegistro}
                    size="small"
                    color={getEstadoColor(row.estadoRegistro)}
                  />
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
