import { useMemo, useState } from "react";
import { MaterialReactTable } from "material-react-table";
import { Alert, Box, Button, Card, IconButton, Snackbar, Tooltip } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import { useEntidades } from "../../../hooks/useEntidades";
import useAuth from "../../auth/hooks/useAuth";
import { getRowKey, toMrtColumns, type ColumnConfig, type Row } from "./columnConfig";
import { baseTableOptions, bodyCellSx, cardSx } from "./tableStyles";
import ListaHeader from "./ListaHeader";
import DialogParamForm, { type ModoFormulario } from "./DialogParamForm";
import DialogConfirmDelete from "./DialogConfirmDelete";
import type { KeyConfig } from "./buildParamSchema";
import type { KeyType } from "../services/ParamCrudService";

export type { ColumnConfig, SelectOption } from "./columnConfig";

interface ListaGeneralCrudProps {
  endpoint: string;
  title: string;
  columns: ColumnConfig[];
  keyField?: string; // por defecto "Codigo"
  keyType?: KeyType; // por defecto "number"
  keyMaxLength?: number; // solo para claves de texto
  allowCreate?: boolean; // por defecto true
  allowEdit?: boolean; // por defecto true
  allowDelete?: boolean; // por defecto true
  filaInactiva?: (row: Row) => boolean; // las filas inactivas se muestran atenuadas
  writePermission?: string; // por defecto "params.write"
}

interface Aviso {
  open: boolean;
  severity: "success" | "error" | "warning";
  message: string;
}

const MENSAJE_EXITO: Record<ModoFormulario, string> = {
  crear: "Registro creado.",
  editar: "Registro actualizado.",
};

// Lista con acciones de escritura, para tablas del dominio de la empresa (hoy: Universalidades).
export default function ListaGeneralCrud({
  endpoint,
  title,
  columns,
  keyField = "Codigo",
  keyType = "number",
  keyMaxLength,
  allowCreate = true,
  allowEdit = true,
  allowDelete = true,
  filaInactiva,
  writePermission = "params.write",
}: ListaGeneralCrudProps) {
  const { entidades, cargando, recargar } = useEntidades<Row>(endpoint);
  const { hasPermission } = useAuth();

  // Sin permiso las acciones no se renderizan: un 403 del API cierra la sesión.
  // Es solo UX; la autorización real la hace el backend con [RequirePermission].
  const canWrite = hasPermission(writePermission);
  const canCreate = allowCreate && canWrite;
  const canEdit = allowEdit && canWrite;
  const canDelete = allowDelete && canWrite;

  const keyConfig = useMemo<KeyConfig>(
    () => ({ keyField, keyType, keyMaxLength }),
    [keyField, keyType, keyMaxLength]
  );
  const tableColumns = useMemo(() => toMrtColumns(columns), [columns]);

  const [dialogo, setDialogo] = useState<{ open: boolean; modo: ModoFormulario; fila: Row | null }>({
    open: false,
    modo: "editar",
    fila: null,
  });
  const [borrando, setBorrando] = useState<Row | null>(null);
  const [aviso, setAviso] = useState<Aviso>({ open: false, severity: "success", message: "" });

  const cerrarDialogo = () => setDialogo((d) => ({ ...d, open: false }));
  const avisar = (severity: Aviso["severity"], message: string) =>
    setAviso({ open: true, severity, message });

  const handleSaved = (modo: ModoFormulario) => {
    cerrarDialogo();
    avisar("success", MENSAJE_EXITO[modo]);
    recargar();
  };

  const handleDeleted = () => {
    setBorrando(null);
    avisar("success", "Registro eliminado.");
    recargar();
  };

  const handleNoExiste = () => {
    cerrarDialogo();
    setBorrando(null);
    avisar("warning", "El registro ya no existe. Se actualizó la lista.");
    recargar();
  };

  return (
    <Card sx={cardSx}>
      <MaterialReactTable
        {...baseTableOptions}
        columns={tableColumns}
        data={entidades ?? []}
        getRowId={(row) => getRowKey(row, keyField)}
        state={{ isLoading: cargando }}
        enableRowActions={canEdit || canDelete}
        positionActionsColumn="last"
        displayColumnDefOptions={{ "mrt-row-actions": { header: "Acciones", size: 90 } }}
        muiTableBodyCellProps={({ row, column }) => ({
          sx: {
            ...bodyCellSx,
            ...(column.id !== "mrt-row-actions" && filaInactiva?.(row.original)
              ? { opacity: 0.55 }
              : {}),
          },
        })}
        renderRowActions={({ row }) => (
          <Box sx={{ display: "flex", gap: 0.5 }}>
            {canEdit && (
              <Tooltip title="Editar">
                <IconButton
                  size="small"
                  color="primary"
                  aria-label={`Editar ${getRowKey(row.original, keyField)}`}
                  onClick={() => setDialogo({ open: true, modo: "editar", fila: row.original })}
                >
                  <EditOutlinedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            {canDelete && (
              <Tooltip title="Eliminar">
                <IconButton
                  size="small"
                  color="error"
                  aria-label={`Eliminar ${getRowKey(row.original, keyField)}`}
                  onClick={() => setBorrando(row.original)}
                >
                  <DeleteOutlineIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        )}
        renderTopToolbarCustomActions={() => (
          <ListaHeader
            title={title}
            count={(entidades ?? []).length}
            slot={
              canCreate && (
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={() => setDialogo({ open: true, modo: "crear", fila: null })}
                >
                  Nuevo
                </Button>
              )
            }
          />
        )}
      />

      <DialogParamForm
        open={dialogo.open}
        modo={dialogo.modo}
        fila={dialogo.fila}
        endpoint={endpoint}
        title={title}
        columns={columns}
        keyConfig={keyConfig}
        onClose={cerrarDialogo}
        onSaved={handleSaved}
        onNoExiste={handleNoExiste}
      />

      <DialogConfirmDelete
        open={borrando != null}
        endpoint={endpoint}
        keyValue={borrando?.[keyField]}
        keyType={keyType}
        descripcion={descripcionDe(borrando, columns, keyField)}
        onClose={() => setBorrando(null)}
        onDeleted={handleDeleted}
        onNoExiste={handleNoExiste}
      />

      <Snackbar
        open={aviso.open}
        autoHideDuration={4000}
        onClose={() => setAviso((a) => ({ ...a, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity={aviso.severity}
          variant="filled"
          onClose={() => setAviso((a) => ({ ...a, open: false }))}
        >
          {aviso.message}
        </Alert>
      </Snackbar>
    </Card>
  );
}

// Primer campo de texto distinto de la clave (normalmente Descripcion), para identificar el registro.
function descripcionDe(fila: Row | null, columns: ColumnConfig[], keyField: string) {
  if (!fila) return undefined;
  const col = columns.find(
    (c) => c.accessorKey !== keyField && typeof fila[c.accessorKey] === "string"
  );
  return col ? String(fila[col.accessorKey]) : undefined;
}
