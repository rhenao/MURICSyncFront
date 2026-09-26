import { useEntidades } from "../../../hooks/useEntidades";
import { MaterialReactTable } from "material-react-table";
import { Card } from "@mui/material";
import { getRowKey, toMrtColumns, type ColumnConfig, type Row } from "./columnConfig";
import { baseTableOptions, cardSx } from "./tableStyles";
import ListaHeader from "./ListaHeader";

export type { ColumnConfig } from "./columnConfig";

interface ListaGeneralConsultaProps {
  endpoint: string;
  title: string;
  columns: ColumnConfig[];
}

// Lista de solo consulta para las tablas básicas (catálogos de la SFC).
export default function ListaGeneralConsulta({
  endpoint,
  title,
  columns,
}: ListaGeneralConsultaProps) {
  const { entidades, cargando } = useEntidades<Row>(endpoint);

  return (
    <Card sx={cardSx}>
      <MaterialReactTable
        {...baseTableOptions}
        columns={toMrtColumns(columns)}
        data={entidades ?? []}
        getRowId={(row) => getRowKey(row)}
        state={{ isLoading: cargando }}
        renderTopToolbarCustomActions={() => (
          <ListaHeader title={title} count={(entidades ?? []).length} />
        )}
      />
    </Card>
  );
}
