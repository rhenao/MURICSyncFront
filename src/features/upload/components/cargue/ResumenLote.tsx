import { Typography } from '@mui/material';
import Grid from '@mui/material/Grid';
import type { LoteResumen } from '../../models/Lote.model';

/** Datos del lote abierto: corte, universalidad, creador, filas y errores. */
export default function ResumenLote({ lote }: { lote: LoteResumen }) {
  return (
    <>
      <Typography variant="subtitle1" fontWeight={600} mb={1.5}>
        Información del lote
      </Typography>
      <Grid container spacing={2}>
        <Grid size={2}>
          <Typography variant="caption" color="text.secondary">Fecha de corte</Typography>
          <Typography variant="body2">{lote.fechaCorte}</Typography>
        </Grid>
        <Grid size={3}>
          <Typography variant="caption" color="text.secondary">Universalidad</Typography>
          <Typography variant="body2">
            {lote.universalidadCodigo} — {lote.universalidadDescripcion ?? ''}
          </Typography>
        </Grid>
        <Grid size={2}>
          <Typography variant="caption" color="text.secondary">Creado por</Typography>
          <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>{lote.usuarioCreador}</Typography>
        </Grid>
        <Grid size={3}>
          <Typography variant="caption" color="text.secondary">Filas parseadas (001 / 002 / 003)</Typography>
          <Typography variant="body2">
            {lote.conteos?.creditos ?? 0} / {lote.conteos?.atributos ?? 0} / {lote.conteos?.movimientos ?? 0}
          </Typography>
        </Grid>
        {(lote.resumenErrores?.total ?? 0) > 0 && (
          <Grid size={2}>
            <Typography variant="caption" color="text.secondary">Errores / Advertencias</Typography>
            <Typography variant="body2" color="error.main">
              {lote.resumenErrores?.errores} / {lote.resumenErrores?.advertencias}
            </Typography>
          </Grid>
        )}
      </Grid>
    </>
  );
}
