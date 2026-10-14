import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material';

interface DialogConfirmarAccionProps {
  open: boolean;
  titulo: string;
  mensaje: string;
  textoConfirmar: string;
  color: 'success' | 'error';
  onCancelar: () => void;
  onConfirmar: () => void;
}

/** Confirmación de una acción del lote que no se puede deshacer (promover, anular). */
export default function DialogConfirmarAccion({
  open,
  titulo,
  mensaje,
  textoConfirmar,
  color,
  onCancelar,
  onConfirmar,
}: DialogConfirmarAccionProps) {
  return (
    <Dialog open={open} onClose={onCancelar} maxWidth="xs">
      <DialogTitle>{titulo}</DialogTitle>
      <DialogContent>
        <DialogContentText>{mensaje}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancelar}>Cancelar</Button>
        <Button variant="contained" color={color} onClick={onConfirmar}>
          {textoConfirmar}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
