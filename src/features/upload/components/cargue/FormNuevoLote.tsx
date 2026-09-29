import { useMemo, useState } from 'react';
import {
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { useEntidades } from '../../../../hooks/useEntidades';

interface UniversalidadOData {
  Codigo?: string | number;
  Descripcion?: string;
  Estado?: string;
}

const MAX_OBSERVACIONES = 500;

const getLastDayOfPreviousMonth = (): string => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 0).toISOString().slice(0, 10);
};

interface FormNuevoLoteProps {
  loading: boolean;
  onCrear: (fechaCorte: string, universalidadCodigo: number, observaciones: string | null) => void;
}

/** Paso 1: fecha de corte y universalidad del lote nuevo. */
export default function FormNuevoLote({ loading, onCrear }: FormNuevoLoteProps) {
  const [fechaCorte, setFechaCorte] = useState(getLastDayOfPreviousMonth);
  // Tipo y código de la entidad reportante no los elige el usuario: son los de Titularice (backend).
  const [universalidadCodigo, setUniversalidadCodigo] = useState('');
  const [observaciones, setObservaciones] = useState('');

  const { entidades: uRaw, cargando: cargandoUniv } = useEntidades<UniversalidadOData>('/Universalidades');
  const universalidades = useMemo(() =>
    (uRaw ?? [])
      .filter(u => String(u.Estado ?? '').toUpperCase() === 'A')
      .map(u => ({ codigo: String(u.Codigo ?? ''), descripcion: String(u.Descripcion ?? '') }))
      .sort((a, b) => a.codigo.localeCompare(b.codigo)),
    [uRaw]
  );

  return (
    <>
      <Typography variant="subtitle1" fontWeight={600} mb={2}>
        1. Configuración del lote
      </Typography>
      <Grid container spacing={2} alignItems="flex-end">
        <Grid size={2}>
          <TextField
            label="Fecha de corte"
            type="date"
            fullWidth
            value={fechaCorte}
            onChange={e => setFechaCorte(e.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
          />
        </Grid>
        <Grid size={4}>
          <FormControl fullWidth disabled={cargandoUniv || loading}>
            <InputLabel>Universalidad</InputLabel>
            <Select
              value={universalidadCodigo}
              label="Universalidad"
              onChange={e => setUniversalidadCodigo(e.target.value)}
            >
              {universalidades.map(u => (
                <MenuItem key={u.codigo} value={u.codigo}>
                  {u.codigo} — {u.descripcion}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid size={4}>
          <TextField
            label="Observaciones (opcional)"
            fullWidth
            value={observaciones}
            onChange={e => setObservaciones(e.target.value)}
            slotProps={{ htmlInput: { maxLength: MAX_OBSERVACIONES } }}
          />
        </Grid>
        <Grid size={2}>
          <Button
            variant="contained"
            size="large"
            onClick={() => onCrear(fechaCorte, parseInt(universalidadCodigo), observaciones.trim() || null)}
            disabled={!fechaCorte || !universalidadCodigo || loading}
          >
            Crear lote
          </Button>
        </Grid>
      </Grid>
    </>
  );
}
