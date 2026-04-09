import * as React from "react";
import { Tabs, Tab, Box } from "@mui/material";
import TableInsumosCredito from "./TableInsumosCredito";
import TableAtributos from "./TableAtributos";
import TableMovimientosCartera from "./TableMovimientosCartera";
//import TableDataCargue from "./TableDataCargue";
import TableDataArchivo from "./TableDataArchivo";
import type {
  ArchivosCargaDetalle,
  ContenidoArchivo,
} from "../models/UploadModels";

interface Props {
  detalles: ArchivosCargaDetalle[];
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel({ children, value, index }: TabPanelProps) {
  return (
    <div hidden={value !== index} role="tabpanel">
      {value === index && <Box sx={{ p: 2 }}>{children}</Box>}
    </div>
  );
}

export default function ResultadoCargue({ detalles }: Props) {
  const [value, setValue] = React.useState(0);

  const registrosArchivo = React.useMemo<ContenidoArchivo[]>(() => {
    return detalles.map((detalle) => {
      const data = (detalle.data ??
        (detalle as unknown as Record<string, unknown>)?.datos ??
        (detalle as unknown as Record<string, unknown>)?.datosCrudos ??
        {}) as Record<string, unknown>;

      const registro = {
        numeroLinea: detalle.numeroLinea ?? 0,
      } as ContenidoArchivo;

      for (let i = 1; i <= 50; i += 1) {
        const key = `col${String(i).padStart(2, "0")}`;
        const valor = data[key] ?? data[`col${i}`] ?? "";
        (registro as unknown as Record<string, string | number>)[key] =
          typeof valor === "string" ? valor : String(valor ?? "");
      }

      return registro;
    });
  }, [detalles]);

  const handleChange = (_event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  return (
    <Box sx={{ width: "100%", mx: "auto" }}>
      <Tabs value={value} onChange={handleChange} aria-label="result load tabs">
        <Tab label="Información archivo cargado" />
        <Tab label="Información general de los créditos" />
        <Tab label="Atributos de los créditos y deudores" />
        <Tab label="Movimientos de Cartera" />
        {/* <Tab label="Información cargada" /> */}
      </Tabs>
      <TabPanel value={value} index={0}>
        <TableDataArchivo registros={registrosArchivo} />
      </TabPanel>
      <TabPanel value={value} index={1}>
        <TableInsumosCredito />
      </TabPanel>
      <TabPanel value={value} index={2}>
        <TableAtributos />
      </TabPanel>
      <TabPanel value={value} index={3}>
        <TableMovimientosCartera />
      </TabPanel>
      {/* <TabPanel value={value} index={4}>
        <TableDataCargue detalles={detalles} />
      </TabPanel> */}
    </Box>
  );
}
