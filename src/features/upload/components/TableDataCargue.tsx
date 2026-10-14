import React, { useState, useMemo } from "react";
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
import {
  //type ArchivosCarga,
  type ArchivosCargaDetalle,
  //type RegistroAuditoria,
} from "../models/UploadModels";

interface Props {
  detalles: ArchivosCargaDetalle[];
}

export default function TableDataCargue({ detalles }: Props) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredData = useMemo(
    () =>
      detalles.filter(
        (item) =>
          item.numeroLinea
            .toString()
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          JSON.stringify(item.data)
            .toLowerCase()
            .includes(searchTerm.toLowerCase())
      ),
    [detalles, searchTerm]
  );

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
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
    <Paper sx={{ maxWidth: "2000px", width: "100%", overflow: "hidden" }}>
      <Box sx={{ p: 2 }}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          mb={2}
        >
          <Typography
            variant="h6"
            component="div"
            sx={{ display: "flex", gap: 1, alignItems: "center" }}
          >
            Información cargada desde archivo
          </Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            <TextField
              size="small"
              placeholder="Buscar por línea, contenido..."
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

      <TableContainer sx={{ maxHeight: 600, overflow: "auto" }}>
        <Table
          stickyHeader
          aria-label="tabla datos cargados"
          sx={{ minWidth: 960, tableLayout: "fixed" }}
        >
          <TableHead>
            <TableRow>
              <TableCell sx={{ width: 180 }}>ID</TableCell>
              <TableCell sx={{ width: 180 }}>Id Archivo</TableCell>
              <TableCell sx={{ width: 120 }}>Nro Línea</TableCell>
              <TableCell>Data</TableCell>
              <TableCell sx={{ width: 140 }}>Estado</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedData.map((row) => (
              <TableRow hover key={row.idDetalle}>
                {/* <TableCell component="th" scope="row">
                  <Typography variant="body2" fontWeight="medium">
                    {row.idDetalle}
                  </Typography>
                </TableCell> */}
                <TableCell>{row.idDetalle}</TableCell>
                <TableCell>{row.idArchivo}</TableCell>
                <TableCell>{row.numeroLinea}</TableCell>
                <TableCell>
                  <Box
                    component="pre"
                    sx={{
                      m: 0,
                      maxHeight: 120,
                      overflow: "hidden",
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                      fontFamily: "inherit",
                    }}
                  >
                    {JSON.stringify(row.data, null, 2)}
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip
                    label={row.estado}
                    size="small"
                    color={getEstadoColor(row.estado)}
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
