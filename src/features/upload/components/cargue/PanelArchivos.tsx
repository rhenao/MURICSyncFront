import { useRef } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  FormControl,
  InputLabel,
  LinearProgress,
  MenuItem,
  Paper,
  Select,
  Stack,
  Typography,
} from '@mui/material';
import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import PublishIcon            from '@mui/icons-material/Publish';
import {
  INSUMO_LABELS_CORTO,
  type InsumoMURIC,
  type PlantillaResumen,
} from '../../models/Plantilla.model';
import { INSUMOS, type HistorialArchivo, type InsumoEnum } from './tiposCargue';

interface PanelArchivosProps {
  archivos: Record<InsumoEnum, File | null>;
  plantillasMap: Record<InsumoEnum, PlantillaResumen[]>;
  plantillaIds: Record<InsumoEnum, number | ''>;
  historial: HistorialArchivo[];
  subiendoInsumo: InsumoEnum | null;
  canUpload: boolean;
  // Aviso sobre la fila de insumos (p. ej. subir a un lote validado lo devuelve a Parseado).
  aviso?: string;
  isBusy: boolean;
  cargandoPlantillas: boolean;
  onArchivo: (insumo: InsumoEnum, archivo: File | null) => void;
  onPlantilla: (insumo: InsumoEnum, plantillaId: number | '') => void;
  onSubir: (insumo: InsumoEnum) => void;
  // N2: slots con datos que un archivo 001-999 va a reemplazar, pendientes de confirmar.
  confirmarTodos: InsumoMURIC[] | null;
  onCancelarTodos: () => void;
  onConfirmarTodos: () => void;
}

/** Paso 2: una fila por insumo (plantilla, archivo y subir) y la fila 001-999. */
export default function PanelArchivos(props: PanelArchivosProps) {
  const { aviso, confirmarTodos, onCancelarTodos, onConfirmarTodos } = props;
  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="subtitle1" fontWeight={600} mb={1.5}>
        2. Carga de archivos
      </Typography>
      {aviso && <Alert severity="info" sx={{ mb: 2 }}>{aviso}</Alert>}
      <Stack spacing={2}>
        {INSUMOS.map(ins => (
          <FilaInsumo key={ins.enum} insumo={ins} {...props} />
        ))}
      </Stack>

      <Dialog open={confirmarTodos !== null} onClose={onCancelarTodos} maxWidth="xs">
        <DialogTitle>Reemplazar archivos cargados</DialogTitle>
        <DialogContent>
          <DialogContentText>
            El archivo 001-999 va a reemplazar lo que ya está cargado en:{' '}
            <strong>{(confirmarTodos ?? []).map(i => INSUMO_LABELS_CORTO[i]).join(', ')}</strong>.
            Los datos anteriores de esos insumos se borran. ¿Continuar?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={onCancelarTodos}>Cancelar</Button>
          <Button variant="contained" onClick={onConfirmarTodos}>
            Reemplazar
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}

function FilaInsumo({
  insumo: ins,
  archivos,
  plantillasMap,
  plantillaIds,
  historial,
  subiendoInsumo,
  canUpload,
  isBusy,
  cargandoPlantillas,
  onArchivo,
  onPlantilla,
  onSubir,
}: PanelArchivosProps & { insumo: (typeof INSUMOS)[number] }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const insumo   = ins.enum as InsumoEnum;
  const archivo  = archivos[insumo];
  const subiendo = subiendoInsumo === insumo;
  const esTodos  = insumo === 'Todos';
  const yaSubido = !esTodos && historial.some(h => h.insumo === ins.codigo);
  const plantillas = plantillasMap[insumo];
  const sinPlantillaObligatoria = esTodos && plantillaIds.Todos === '';

  return (
    <Box>
      {esTodos && (
        <Divider sx={{ mb: 1.5 }}>
          <Typography variant="caption" color="text.secondary">
            o un solo archivo con los tres insumos
          </Typography>
        </Divider>
      )}
      <input
        ref={inputRef}
        type="file"
        accept=".csv,.txt,.xlsx,.xls"
        style={{ display: 'none' }}
        onChange={e => {
          onArchivo(insumo, e.target.files?.[0] ?? null);
          e.target.value = '';
        }}
      />
      <Stack direction="row" spacing={1.5} alignItems="center" mb={0.5}>
        <Chip
          label={ins.codigo}
          size="small"
          variant="outlined"
          color="primary"
          sx={{ minWidth: 72 }}
        />
        <Typography variant="body2" sx={{ minWidth: 290 }}>{ins.label}</Typography>
        {yaSubido && !subiendo && <CheckCircleOutlineIcon color="success" fontSize="small" />}
      </Stack>
      <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" pl={1}>
        <FormControl size="small" sx={{ minWidth: 220 }} disabled={!canUpload || isBusy || cargandoPlantillas}>
          <InputLabel id={`plantilla-${insumo}-label`}>
            {esTodos ? 'Plantilla (obligatoria)' : 'Plantilla (opcional)'}
          </InputLabel>
          <Select
            labelId={`plantilla-${insumo}-label`}
            label={esTodos ? 'Plantilla (obligatoria)' : 'Plantilla (opcional)'}
            value={plantillaIds[insumo]}
            onChange={e => onPlantilla(insumo, e.target.value as number | '')}
          >
            <MenuItem value=""><em>{esTodos ? 'Elige una plantilla 001-999' : 'Sin plantilla'}</em></MenuItem>
            {plantillas.map(p => (
              <MenuItem key={p.id} value={p.id}>
                {p.nombre}
                <Typography component="span" variant="caption" color="text.secondary" ml={0.5}>
                  ({p.numeroCampos} campos)
                </Typography>
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Button
          size="small"
          variant="outlined"
          startIcon={<CloudUploadOutlinedIcon />}
          onClick={() => inputRef.current?.click()}
          disabled={!canUpload || isBusy}
        >
          Seleccionar archivo
        </Button>
        <Typography variant="caption" color="text.secondary" sx={{ minWidth: 180 }}>
          {archivo ? archivo.name : 'Sin archivo'}
        </Typography>
        <Button
          size="small"
          variant="contained"
          startIcon={<PublishIcon />}
          onClick={() => onSubir(insumo)}
          disabled={!archivo || !canUpload || isBusy || sinPlantillaObligatoria}
        >
          {subiendo ? 'Subiendo…' : 'Subir'}
        </Button>
        {subiendo && <LinearProgress sx={{ width: 80 }} />}
      </Stack>
    </Box>
  );
}
