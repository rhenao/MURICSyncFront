import { useEffect, useState } from "react";
import {
  Alert,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@mui/material";
import ParamCrudService, { interpretarErrorParam, type KeyType } from "../services/ParamCrudService";

interface DialogConfirmDeleteProps {
  open: boolean;
  endpoint: string;
  keyValue: unknown;
  keyType: KeyType;
  descripcion?: string; // texto para identificar el registro, además del código
  onClose: () => void;
  onDeleted: () => void;
  onNoExiste: () => void;
}

export default function DialogConfirmDelete({
  open,
  endpoint,
  keyValue,
  keyType,
  descripcion,
  onClose,
  onDeleted,
  onNoExiste,
}: DialogConfirmDeleteProps) {
  const [deleting, setDeleting] = useState(false);
  const [errores, setErrores] = useState<string[]>([]);

  useEffect(() => {
    if (open) setErrores([]);
  }, [open]);

  const handleDelete = async () => {
    if (deleting) return;
    setDeleting(true);
    setErrores([]);
    try {
      await ParamCrudService.eliminar(endpoint, keyValue, keyType);
      onDeleted();
    } catch (err) {
      const error = interpretarErrorParam(
        err,
        keyValue,
        "No se pudo eliminar el registro. Intente nuevamente."
      );
      if (error.tipo === "noExiste") {
        onNoExiste();
      } else {
        setErrores(error.mensajes);
      }
    } finally {
      setDeleting(false);
    }
  };

  const handleClose = () => {
    if (!deleting) onClose();
  };

  const registro = descripcion ? `${String(keyValue)} – ${descripcion}` : String(keyValue);

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{ sx: { borderRadius: 2 } }}
    >
      <DialogTitle sx={{ pb: 1 }}>Eliminar registro</DialogTitle>
      <DialogContent sx={{ pt: 1 }}>
        {errores.length > 0 && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {errores.map((msg, i) => (
              <div key={i}>{msg}</div>
            ))}
          </Alert>
        )}
        <DialogContentText>
          ¿Eliminar el registro <strong>{registro}</strong>? Esta acción no se puede deshacer.
        </DialogContentText>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={handleClose} disabled={deleting} color="inherit" autoFocus>
          Cancelar
        </Button>
        <Button
          onClick={handleDelete}
          variant="contained"
          color="error"
          disabled={deleting}
          startIcon={deleting ? <CircularProgress size={20} /> : null}
        >
          {deleting ? "Eliminando..." : "Eliminar"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
