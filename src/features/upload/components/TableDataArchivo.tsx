import React, { useMemo, useState } from "react";
import {
  Box,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import type { ContenidoArchivo } from "../models/UploadModels";

interface Props {
  registros: ContenidoArchivo[];
  titulo?: string;
}

const ROWS_PER_PAGE_OPTIONS = [5, 10, 25, 50];

export default function TableDataArchivo({
  registros,
  titulo = "Contenido del archivo",
}: Props) {
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const columnas = useMemo(() => {
    if (!registros.length) return ["numeroLinea"];
    // Garantiza que numeroLinea vaya primero
    const keys = Object.keys(registros[0]);
    return ["numeroLinea", ...keys.filter((k) => k !== "numeroLinea")];
  }, [registros]);

  const filtrados = useMemo(() => {
    if (!searchTerm.trim()) return registros;
    const term = searchTerm.toLowerCase();
    return registros.filter((row) =>
      JSON.stringify(row).toLowerCase().includes(term)
    );
  }, [registros, searchTerm]);

  const paginados = useMemo(
    () => filtrados.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [filtrados, page, rowsPerPage]
  );

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <Paper elevation={1} sx={{ width: "100%", overflow: "hidden" }}>
      <Box sx={{ p: 2 }}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          justifyContent="space-between"
          alignItems={{ xs: "stretch", sm: "center" }}
        >
          <Typography variant="h6" component="div">
            {titulo}
          </Typography>
          <TextField
            size="small"
            label="Buscar"
            placeholder="Número de línea, valor, etc."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ minWidth: { xs: "100%", sm: 240 } }}
          />
        </Stack>
        <Typography variant="body2" color="text.secondary" mt={1}>
          Registros: {filtrados.length}
        </Typography>
      </Box>

      <TableContainer sx={{ maxHeight: 600, overflow: "auto" }}>
        <Table
          stickyHeader
          size="small"
          sx={{ minWidth: 1200, tableLayout: "fixed" }}
          aria-label="tabla contenido archivo"
        >
          <TableHead>
            <TableRow>
              {columnas.map((col) => (
                <TableCell
                  key={col}
                  sx={{
                    fontWeight: 600,
                    whiteSpace: "nowrap",
                    width: col === "numeroLinea" ? 100 : 200,
                  }}
                >
                  {col.toUpperCase()}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {paginados.map((row, idx) => (
              <TableRow hover key={`${row.numeroLinea}-${idx}`}>
                {columnas.map((col) => (
                  <TableCell
                    key={col}
                    sx={{
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      maxWidth: col === "numeroLinea" ? 120 : 440,
                    }}
                    title={String(
                      (row as unknown as Record<string, unknown>)[col] ?? ""
                    )}
                  >
                    {String(
                      (row as unknown as Record<string, unknown>)[col] ?? ""
                    )}
                  </TableCell>
                ))}
              </TableRow>
            ))}
            {!paginados.length && (
              <TableRow>
                <TableCell colSpan={columnas.length} align="center">
                  <Typography variant="body2" color="text.secondary">
                    Sin datos para mostrar.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        component="div"
        count={filtrados.length}
        page={page}
        onPageChange={handleChangePage}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        rowsPerPageOptions={ROWS_PER_PAGE_OPTIONS}
        labelRowsPerPage="Filas por página:"
        sx={{ borderTop: 1, borderColor: "divider" }}
      />
    </Paper>
  );
}
