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

interface AtributoCredito {
  id: string;
  identificacionCredito: string;
  tipoIdentificacionDeudor: string;
  nroIdentificacionDeudor: string;
  razonSocial?: string;
  nombres?: string;
  apellidos?: string;
  fechaNacimientoConstitucion: string;
  sexoBiologico?: string;
  grupoEtnico: string;
  indicadorVictima: "Si" | "No";
  tamanoEmpresa: string;
  tipoContratacion: string;
  ciiu: string;
  municipioOriginacion: string;
  canalOriginacion: string;
  condicionBien: string;
  tipoEmpleado: string;
  destinoCredito: string;
  creditoRecursosRedescuento: "Si" | "No";
  tipoConsolidacion?: string;
  idCreditoPadre?: string;
  propiedadMujeres: "Si" | "No";
  marcacionCompraOperacion: "Si" | "No";
  idEntidadCompraCartera?: string;
  tipoRecuperacion: string;
  franquiciaTarjetasCredito?: string;
  comisionMipyme?: number;
  creditoVerde: "Si" | "No";
  beneficioTasaCreditosVerde?: number;
  beneficioCapitalCreditosVerde?: number;
  liderazgoMujeres: "Si" | "No";
  numeroPoliza?: string;
  entidadAseguradora?: string;
  costoSeguro?: number;
  ubicacionGarantiaInmobiliaria?: string;
  creditoGrupalAsociativo: "Si" | "No";
  canalDesembolso: string;
}

// Datos de prueba
const atributosCredito: AtributoCredito[] = [
  {
    id: "1",
    identificacionCredito: "CRE-001-2024",
    tipoIdentificacionDeudor: "CC",
    nroIdentificacionDeudor: "12345678",
    nombres: "Juan Carlos",
    apellidos: "Pérez Gómez",
    fechaNacimientoConstitucion: "1985-03-15",
    sexoBiologico: "M",
    grupoEtnico: "Mestizo",
    indicadorVictima: "No",
    tamanoEmpresa: "Empleado",
    tipoContratacion: "Indefinido",
    ciiu: "6419",
    municipioOriginacion: "Bogotá D.C.",
    canalOriginacion: "Oficina",
    condicionBien: "Nuevo",
    tipoEmpleado: "Dependiente",
    destinoCredito: "Vivienda",
    creditoRecursosRedescuento: "No",
    propiedadMujeres: "No",
    marcacionCompraOperacion: "No",
    tipoRecuperacion: "Judicial",
    creditoVerde: "Si",
    beneficioTasaCreditosVerde: 0.5,
    liderazgoMujeres: "No",
    numeroPoliza: "POL-001-2024",
    entidadAseguradora: "Seguros Bolívar",
    costoSeguro: 150000,
    creditoGrupalAsociativo: "No",
    canalDesembolso: "Transferencia",
  },
  {
    id: "2",
    identificacionCredito: "CRE-002-2024",
    tipoIdentificacionDeudor: "NIT",
    nroIdentificacionDeudor: "900123456",
    razonSocial: "Comercializadora ABC S.A.S.",
    fechaNacimientoConstitucion: "2015-08-20",
    grupoEtnico: "N/A",
    indicadorVictima: "No",
    tamanoEmpresa: "Pequeña",
    tipoContratacion: "N/A",
    ciiu: "4711",
    municipioOriginacion: "Medellín",
    canalOriginacion: "Digital",
    condicionBien: "Usado",
    tipoEmpleado: "N/A",
    destinoCredito: "Capital de trabajo",
    creditoRecursosRedescuento: "Si",
    propiedadMujeres: "Si",
    marcacionCompraOperacion: "No",
    tipoRecuperacion: "Extrajudicial",
    comisionMipyme: 250000,
    creditoVerde: "No",
    liderazgoMujeres: "Si",
    creditoGrupalAsociativo: "No",
    canalDesembolso: "Cheque",
  },
  {
    id: "3",
    identificacionCredito: "CRE-003-2024",
    tipoIdentificacionDeudor: "CE",
    nroIdentificacionDeudor: "87654321",
    nombres: "María Elena",
    apellidos: "Rodríguez Silva",
    fechaNacimientoConstitucion: "1990-12-08",
    sexoBiologico: "F",
    grupoEtnico: "Afrocolombiano",
    indicadorVictima: "Si",
    tamanoEmpresa: "Empleado",
    tipoContratacion: "Temporal",
    ciiu: "8541",
    municipioOriginacion: "Cali",
    canalOriginacion: "Corresponsal",
    condicionBien: "Nuevo",
    tipoEmpleado: "Independiente",
    destinoCredito: "Educación",
    creditoRecursosRedescuento: "No",
    propiedadMujeres: "Si",
    marcacionCompraOperacion: "No",
    tipoRecuperacion: "Cobro persuasivo",
    creditoVerde: "Si",
    beneficioTasaCreditosVerde: 0.75,
    beneficioCapitalCreditosVerde: 2.0,
    liderazgoMujeres: "Si",
    numeroPoliza: "POL-003-2024",
    entidadAseguradora: "Mapfre",
    costoSeguro: 89000,
    creditoGrupalAsociativo: "Si",
    canalDesembolso: "Efectivo",
  },
];

export default function TableAtributos() {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");

  // Filtrar datos según término de búsqueda
  const filteredData = atributosCredito.filter(
    (item) =>
      item.identificacionCredito
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      item.nroIdentificacionDeudor.includes(searchTerm) ||
      (item.nombres &&
        item.nombres.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.apellidos &&
        item.apellidos.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.razonSocial &&
        item.razonSocial.toLowerCase().includes(searchTerm.toLowerCase()))
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

  const formatCurrency = (value?: number) => {
    if (!value) return "-";
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(value);
  };

  const getIndicadorColor = (valor: "Si" | "No") => {
    return valor === "Si" ? "success" : "default";
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
            Atributos de Crédito
          </Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            <TextField
              size="small"
              placeholder="Buscar por ID, documento, nombre..."
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
          overflowX: "auto",
          minWidth: "100%",
        }}
      >
        <Table
          stickyHeader
          size="small"
          aria-label="tabla atributos credito"
          sx={{ minWidth: 800 }}
        >
          <TableHead>
            <TableRow>
              <TableCell>ID Crédito</TableCell>
              <TableCell>Tipo ID</TableCell>
              <TableCell>Nro Identificación</TableCell>
              <TableCell>Razón Social</TableCell>
              <TableCell>Nombres</TableCell>
              <TableCell>Apellidos</TableCell>
              <TableCell>Fecha Nac/Const</TableCell>
              <TableCell>Sexo</TableCell>
              <TableCell>Grupo Étnico</TableCell>
              <TableCell>Víctima</TableCell>
              <TableCell>Tamaño Empresa</TableCell>
              <TableCell>Tipo Contratación</TableCell>
              <TableCell>CIIU</TableCell>
              <TableCell>Municipio Orig.</TableCell>
              <TableCell>Canal Orig.</TableCell>
              <TableCell>Condición Bien</TableCell>
              <TableCell>Tipo Empleado</TableCell>
              <TableCell>Destino Crédito</TableCell>
              <TableCell>Rec. Redescuento</TableCell>
              <TableCell>Tipo Consolidación</TableCell>
              <TableCell>ID Crédito Padre</TableCell>
              <TableCell>Prop. Mujeres</TableCell>
              <TableCell>Marca Compra Op.</TableCell>
              <TableCell>ID Entidad Compra</TableCell>
              <TableCell>Tipo Recuperación</TableCell>
              <TableCell>Franquicia Tarjetas</TableCell>
              <TableCell>Comisión Mipyme</TableCell>
              <TableCell>Crédito Verde</TableCell>
              <TableCell>Benef. Tasa Verde</TableCell>
              <TableCell>Benef. Capital Verde</TableCell>
              <TableCell>Liderazgo Mujeres</TableCell>
              <TableCell>Nro Póliza</TableCell>
              <TableCell>Entidad Aseguradora</TableCell>
              <TableCell>Costo Seguro</TableCell>
              <TableCell>Ubicación Garantía</TableCell>
              <TableCell>Crédito Grupal</TableCell>
              <TableCell>Canal Desembolso</TableCell>
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
                <TableCell>{row.nroIdentificacionDeudor}</TableCell>
                <TableCell>{row.razonSocial || "-"}</TableCell>
                <TableCell>{row.nombres || "-"}</TableCell>
                <TableCell>{row.apellidos || "-"}</TableCell>
                <TableCell>{row.fechaNacimientoConstitucion}</TableCell>
                <TableCell>{row.sexoBiologico || "-"}</TableCell>
                <TableCell>{row.grupoEtnico}</TableCell>
                <TableCell>
                  <Chip
                    label={row.indicadorVictima}
                    size="small"
                    color={getIndicadorColor(row.indicadorVictima)}
                  />
                </TableCell>
                <TableCell>{row.tamanoEmpresa}</TableCell>
                <TableCell>{row.tipoContratacion}</TableCell>
                <TableCell>{row.ciiu}</TableCell>
                <TableCell>{row.municipioOriginacion}</TableCell>
                <TableCell>{row.canalOriginacion}</TableCell>
                <TableCell>{row.condicionBien}</TableCell>
                <TableCell>{row.tipoEmpleado}</TableCell>
                <TableCell>{row.destinoCredito}</TableCell>
                <TableCell>
                  <Chip
                    label={row.creditoRecursosRedescuento}
                    size="small"
                    color={getIndicadorColor(row.creditoRecursosRedescuento)}
                  />
                </TableCell>
                <TableCell>{row.tipoConsolidacion || "-"}</TableCell>
                <TableCell>{row.idCreditoPadre || "-"}</TableCell>
                <TableCell>
                  <Chip
                    label={row.propiedadMujeres}
                    size="small"
                    color={getIndicadorColor(row.propiedadMujeres)}
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    label={row.marcacionCompraOperacion}
                    size="small"
                    color={getIndicadorColor(row.marcacionCompraOperacion)}
                  />
                </TableCell>
                <TableCell>{row.idEntidadCompraCartera || "-"}</TableCell>
                <TableCell>{row.tipoRecuperacion}</TableCell>
                <TableCell>{row.franquiciaTarjetasCredito || "-"}</TableCell>
                <TableCell>{formatCurrency(row.comisionMipyme)}</TableCell>
                <TableCell>
                  <Chip
                    label={row.creditoVerde}
                    size="small"
                    color={getIndicadorColor(row.creditoVerde)}
                  />
                </TableCell>
                <TableCell>
                  {row.beneficioTasaCreditosVerde
                    ? `${row.beneficioTasaCreditosVerde}%`
                    : "-"}
                </TableCell>
                <TableCell>
                  {row.beneficioCapitalCreditosVerde
                    ? `${row.beneficioCapitalCreditosVerde}%`
                    : "-"}
                </TableCell>
                <TableCell>
                  <Chip
                    label={row.liderazgoMujeres}
                    size="small"
                    color={getIndicadorColor(row.liderazgoMujeres)}
                  />
                </TableCell>
                <TableCell>{row.numeroPoliza || "-"}</TableCell>
                <TableCell>{row.entidadAseguradora || "-"}</TableCell>
                <TableCell>{formatCurrency(row.costoSeguro)}</TableCell>
                <TableCell>
                  {row.ubicacionGarantiaInmobiliaria || "-"}
                </TableCell>
                <TableCell>
                  <Chip
                    label={row.creditoGrupalAsociativo}
                    size="small"
                    color={getIndicadorColor(row.creditoGrupalAsociativo)}
                  />
                </TableCell>
                <TableCell>{row.canalDesembolso}</TableCell>
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
