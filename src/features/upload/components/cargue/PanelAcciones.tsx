import { Button, Paper, Stack, Typography } from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import BlockIcon              from '@mui/icons-material/Block';
import VerifiedIcon           from '@mui/icons-material/Verified';

interface PanelAccionesProps {
  canValidar: boolean;
  canPromover: boolean;
  canAnular: boolean;
  isBusy: boolean;
  onValidar: () => void;
  onPromover: () => void;
  onAnular: () => void;
}

/** Paso 3: validar, promover o anular el lote. */
export default function PanelAcciones({
  canValidar,
  canPromover,
  canAnular,
  isBusy,
  onValidar,
  onPromover,
  onAnular,
}: PanelAccionesProps) {
  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="subtitle1" fontWeight={600} mb={1.5}>
        3. Validación y promoción
      </Typography>
      <Stack direction="row" spacing={1.5} flexWrap="wrap">
        <Button
          variant="outlined"
          startIcon={<VerifiedIcon />}
          onClick={onValidar}
          disabled={!canValidar || isBusy}
        >
          Validar lote
        </Button>
        <Button
          variant="contained"
          color="success"
          startIcon={<CheckCircleOutlineIcon />}
          onClick={onPromover}
          disabled={!canPromover || isBusy}
        >
          Promover a MURIC
        </Button>
        <Button
          variant="outlined"
          color="error"
          startIcon={<BlockIcon />}
          onClick={onAnular}
          disabled={!canAnular || isBusy}
        >
          Anular lote
        </Button>
      </Stack>
    </Paper>
  );
}
