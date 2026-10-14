import { Chip, Tooltip } from '@mui/material';
import { useEntidadReportante } from '../hooks/useEntidadReportante';

/**
 * "Entidad reportante: T600 · C3". Informativo: el tipo y el código son los de Titularice,
 * vienen de la configuración del backend y el usuario no los elige.
 */
export default function ChipEntidadReportante() {
  const entidad = useEntidadReportante();
  if (!entidad) return null;

  return (
    <Tooltip title={`Tipo y código de Titularice ante la SFC. Nombre del archivo: ${entidad.nombreArchivoEjemplo}`}>
      <Chip
        size="small"
        variant="outlined"
        label={`Entidad reportante: T${entidad.tipoEntidad} · C${entidad.codigoEntidad}`}
      />
    </Tooltip>
  );
}
