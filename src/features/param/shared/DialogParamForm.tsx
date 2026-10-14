import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  TextField,
} from "@mui/material";
import type { ColumnConfig, Row } from "./columnConfig";
import { buildParamSchema, validarFormulario, type KeyConfig } from "./buildParamSchema";
import ParamCrudService, { interpretarErrorParam } from "../services/ParamCrudService";

export type ModoFormulario = "crear" | "editar";

interface DialogParamFormProps {
  open: boolean;
  modo: ModoFormulario;
  fila?: Row | null; // requerida en modo "editar"
  endpoint: string;
  title: string;
  columns: ColumnConfig[];
  keyConfig: KeyConfig;
  onClose: () => void;
  onSaved: (modo: ModoFormulario) => void;
  onNoExiste: () => void; // el registro fue borrado por otro usuario
}

type Valores = Record<string, unknown>;

export default function DialogParamForm({
  open,
  modo,
  fila,
  endpoint,
  title,
  columns,
  keyConfig,
  onClose,
  onSaved,
  onNoExiste,
}: DialogParamFormProps) {
  const isEditing = modo === "editar";
  const { keyField, keyType, keyMaxLength } = keyConfig;

  // La clave siempre va primero en el formulario, aunque no esté en columns.
  const campos = useMemo<ColumnConfig[]>(() => {
    const keyColumn = columns.find((c) => c.accessorKey === keyField);
    const resto = columns.filter((c) => c.accessorKey !== keyField && !c.hideInForm);
    return [keyColumn ?? { accessorKey: keyField, header: "Código", size: 0 }, ...resto];
  }, [columns, keyField]);

  const schema = useMemo(() => buildParamSchema(columns, keyConfig), [columns, keyConfig]);

  const [valores, setValores] = useState<Valores>({});
  const [erroresCampo, setErroresCampo] = useState<Record<string, string>>({});
  const [errores, setErrores] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    const iniciales: Valores = {};
    for (const campo of campos) {
      iniciales[campo.accessorKey] = isEditing
        ? (fila?.[campo.accessorKey] ?? "")
        : (campo.defaultValue ?? "");
    }
    setValores(iniciales);
    setErroresCampo({});
    setErrores([]);
  }, [open, isEditing, fila, campos]);

  const cambiar = (campo: string, valor: unknown) => {
    setValores((v) => ({ ...v, [campo]: valor }));
    setErroresCampo((errs) => {
      const resto = { ...errs };
      delete resto[campo];
      return resto;
    });
    setErrores([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;

    const resultado = await validarFormulario(schema, valores);
    if (!resultado.ok) {
      setErroresCampo(resultado.errores);
      return;
    }

    setSaving(true);
    setErrores([]);
    try {
      if (isEditing) {
        // PUT reemplaza la entidad completa: se conservan los campos ocultos del formulario.
        const ocultos = Object.fromEntries(
          columns.filter((c) => c.hideInForm).map((c) => [c.accessorKey, fila?.[c.accessorKey]])
        );
        const claveOriginal = fila?.[keyField];
        await ParamCrudService.actualizar(endpoint, claveOriginal, keyType, {
          ...ocultos,
          ...resultado.valores,
          [keyField]: claveOriginal,
        });
      } else {
        await ParamCrudService.crear(endpoint, resultado.valores);
      }
      onSaved(modo);
    } catch (err) {
      const error = interpretarErrorParam(err, resultado.valores[keyField]);
      if (error.tipo === "noExiste") {
        onNoExiste();
      } else if (error.tipo === "duplicado") {
        // El error se muestra en el campo código, que es el que el usuario debe cambiar.
        setErroresCampo({ [keyField]: error.mensajes[0] });
      } else {
        setErrores(error.mensajes);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    if (!saving) onClose();
  };

  const renderCampo = (campo: ColumnConfig) => {
    const esClave = campo.accessorKey === keyField;
    const nombre = campo.accessorKey;
    const valor = valores[nombre] ?? "";
    const error = erroresCampo[nombre];
    const maxLength = esClave ? keyMaxLength : campo.maxLength;
    const required = esClave || (campo.required ?? true);
    const esNumero = esClave ? keyType === "number" : campo.fieldType === "number";
    const contador =
      maxLength != null && typeof valor === "string" ? `${valor.length}/${maxLength}` : undefined;

    return (
      <TextField
        key={nombre}
        name={nombre}
        label={campo.header}
        fullWidth
        margin="normal"
        value={valor}
        onChange={(e) => cambiar(nombre, e.target.value)}
        disabled={saving || (esClave && isEditing)}
        required={required}
        error={error != null}
        helperText={error ?? contador}
        select={campo.fieldType === "select" && !esClave}
        multiline={campo.fieldType === "multiline"}
        minRows={campo.fieldType === "multiline" ? 3 : undefined}
        autoFocus={esClave ? !isEditing : false}
        slotProps={{
          htmlInput: {
            maxLength,
            ...(esNumero ? { inputMode: "numeric" } : {}),
          },
        }}
      >
        {campo.fieldType === "select" &&
          !esClave &&
          (campo.options ?? []).map((o) => (
            <MenuItem key={String(o.value)} value={o.value}>
              {o.label}
            </MenuItem>
          ))}
      </TextField>
    );
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: { borderRadius: 2 } }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        {isEditing ? `Editar registro · ${title}` : `Nuevo registro · ${title}`}
      </DialogTitle>

      <Box component="form" onSubmit={handleSubmit} noValidate>
        <DialogContent sx={{ pt: 1 }}>
          {errores.length > 0 && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {errores.map((msg, i) => (
                <div key={i}>{msg}</div>
              ))}
            </Alert>
          )}

          {campos.map(renderCampo)}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={handleClose} disabled={saving} color="inherit">
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={saving}
            startIcon={saving ? <CircularProgress size={20} /> : null}
          >
            {saving ? "Guardando..." : "Guardar"}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
