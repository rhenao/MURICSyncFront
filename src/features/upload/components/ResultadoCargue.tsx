import * as React from "react";
import { Tabs, Tab, Box, Typography } from "@mui/material";
import TableInsumosCredito from "./TableInsumosCredito";
import TableAtributos from "./TableAtributos";
import TableMovimientosCartera from "./TableMovimientosCartera";

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel({ children, value, index }: TabPanelProps) {
  return (
    <div hidden={value !== index}>
      {value === index && (
        <Box sx={{ p: 2 }}>
          <Typography>{children}</Typography>
        </Box>
      )}
    </div>
  );
}

export default function ResultadoCargue() {
  const [value, setValue] = React.useState(0);

  const handleChange = (_event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  return (
    <Box sx={{ width: "100%" }}>
      <Tabs value={value} onChange={handleChange} aria-label="demo tabs">
        <Tab label="Detalle Archivo de cargue" />
        <Tab label="Insumos de crédito" />
        <Tab label="Atributos" />
        <Tab label="Movimientos de Cartera" />
      </Tabs>
      <TabPanel value={value} index={0}>
        <TableInsumosCredito />
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
    </Box>
  );
}
