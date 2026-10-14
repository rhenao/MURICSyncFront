import { useEffect, useMemo, useState } from 'react';
import { AxiosError } from 'axios';
import {
  Alert,
  Autocomplete,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
} from '@mui/material';
import {
  normalizarValor,
  type CatalogoEquivalencia,
  type Equivalencia,
  type EquivalenciaInicial,
  type ValorCatalogo,
} from '../models/Equivalencia.model';
import EquivalenciaService from '../services/EquivalenciaService';
import { extractBackendErrors } from '../../../utils/extractBackendErrors';

interface DialogEquivalenciaProps {
  open: boolean;
  /** En edición, la equivalencia a cambiar; null para crear. */
  equivalencia: Equivalencia | null;
  /** Al crear desde un lote (fase EQ-D): catálogo y valor ya puestos. */
  inicial?: EquivalenciaInicial | null;
  catalogos: CatalogoEquivalencia[];
  onClose: () => void;
  onSaved: (equivalencia: Equivalencia) => void;
  onNoExiste: () => void; // otro usuario la borró mientras se editaba
}

const MAX_VALOR = 200;
const MAX_OBSERVACIONES = 500;

const etiquetaCodigo = (v: ValorCatalogo) => `${v.codigo} – ${v.descripcion}`;

export default function DialogEquivalencia({
  open,
  equivalencia,
  inicial,
  catalogos,
  onClose,
  onSaved,
  onNoExiste,
}: DialogEquivalenciaProps) {
  const editando = equivalencia !== null;

  const [catalogo, setCatalogo] = useState('');
  const [valorOriginal, setValorOriginal] = useState('');
  const [codigo, setCodigo] = useState<string | null>(null);
  const [observaciones, setObservaciones] = useState('');
  // EQ4: el código cuya descripción coincide con el valor se propone, pero el usuario lo confirma al guardar.
  const [sugerido, setSugerido] = useState(false);
  const [codigoTocado, setCodigoTocado] = useState(false);
  const [erroresCampo, setErroresCampo] = useState<Record<string, string>>({});
  const [errores, setErrores] = useState<string[]>([]);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (!open) return;
    setCatalogo(equivalencia?.catalogo ?? inicial?.catalogo ?? '');
    setValorOriginal(equivalencia?.valorOriginal ?? inicial?.valorOriginal ?? '');
    setCodigo(equivalencia?.codigo ?? null);
    setObservaciones(equivalencia?.observaciones ?? '');
    setSugerido(false);
    setCodigoTocado(editando);
    setErroresCampo({});
    setErrores([]);
  }, [open, equivalencia, inicial, editando]);

  const definicion = useMemo(
    () => catalogos.find(c => c.catalogo === catalogo) ?? null,
    [catalogos, catalogo]
  );
  const opciones = definicion?.valores ?? [];
  const normalizado = normalizarValor(valorOriginal);

  // Sugerencia por descripción mientras el usuario no haya elegido un código.
  useEffect(() => {
    if (codigoTocado || !definicion) return;
    const coincide = normalizado
      ? definicion.valores.find(v => normalizarValor(v.descripcion) === normalizado)
      : undefined;
    setCodigo(coincide?.codigo ?? null);
    setSugerido(!!coincide);
  }, [definicion, normalizado, codigoTocado]);

  const limpiarError = (campo: string) => {
    setErroresCampo(errs => {
      const resto = { ...errs };
      delete resto[campo];
      return resto;
    });
    setErrores([]);
  };

  const validar = () => {
    const errs: Record<string, string> = {};
    if (!catalogo) errs.catalogo = 'Seleccione el catálogo.';
    if (!normalizado) errs.valorOriginal = 'El valor original es obligatorio.';
    else if (valorOriginal.trim().length > MAX_VALOR)
      errs.valorOriginal = `Máximo ${MAX_VALOR} caracteres.`;
    if (!codigo) errs.codigo = 'Seleccione el código SFC.';
    if (observaciones.length > MAX_OBSERVACIONES)
      errs.observaciones = `Máximo ${MAX_OBSERVACIONES} caracteres.`;
    setErroresCampo(errs);
    return Object.keys(errs).length === 0;
  };

  const handleGuardar = async () => {
    if (guardando || !validar()) return;
    setGuardando(true);
    setErrores([]);
    const request = {
      catalogo,
      valorOriginal: valorOriginal.trim(),
      codigo: codigo!,
      observaciones: observaciones.trim() || null,
    };
    try {
      const guardada = editando
        ? await EquivalenciaService.actualizar(equivalencia.id, request)
        : await EquivalenciaService.crear(request);
      onSaved(guardada);
    } catch (err) {
      const status = err instanceof AxiosError ? err.response?.status : undefined;
      if (editando && status === 404) {
        onNoExiste();
        return;
      }
      const mensajes = extractBackendErrors(err, 'No se pudo guardar la equivalencia.');
      // 409: el valor ya tiene equivalencia en ese catálogo; el campo a cambiar es el valor.
      if (status === 409) setErroresCampo({ valorOriginal: mensajes[0] });
      else setErrores(mensajes);
    } finally {
      setGuardando(false);
    }
  };

  const handleClose = () => {
    if (!guardando) onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 2 } }}>
      <DialogTitle sx={{ pb: 1 }}>{editando ? 'Editar equivalencia' : 'Nueva equivalencia'}</DialogTitle>
      <DialogContent sx={{ pt: 1 }}>
        {errores.length > 0 && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {errores.map((msg, i) => (
              <div key={i}>{msg}</div>
            ))}
          </Alert>
        )}
        <Stack spacing={2} sx={{ pt: 1 }}>
          <TextField
            select
            label="Catálogo"
            value={catalogo}
            onChange={e => {
              setCatalogo(e.target.value);
              setCodigo(null);
              setCodigoTocado(false);
              limpiarError('catalogo');
            }}
            error={!!erroresCampo.catalogo}
            helperText={
              erroresCampo.catalogo ??
              (definicion?.campos.length ? `Se usa en: ${definicion.campos.join(', ')}` : ' ')
            }
            size="small"
            required
          >
            {catalogos.map(c => (
              <MenuItem key={c.catalogo} value={c.catalogo}>
                {c.nombre}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            label="Valor en el archivo"
            value={valorOriginal}
            onChange={e => {
              setValorOriginal(e.target.value);
              limpiarError('valorOriginal');
            }}
            error={!!erroresCampo.valorOriginal}
            helperText={
              erroresCampo.valorOriginal ??
              (normalizado ? `Se compara como: ${normalizado}` : 'Tal como viene en el archivo del cliente.')
            }
            inputProps={{ maxLength: MAX_VALOR }}
            size="small"
            required
          />

          <Autocomplete
            options={opciones}
            value={opciones.find(v => v.codigo === codigo) ?? null}
            onChange={(_, v) => {
              setCodigo(v?.codigo ?? null);
              setCodigoTocado(true);
              setSugerido(false);
              limpiarError('codigo');
            }}
            getOptionLabel={etiquetaCodigo}
            isOptionEqualToValue={(a, b) => a.codigo === b.codigo}
            disabled={!definicion}
            size="small"
            renderInput={params => (
              <TextField
                {...params}
                label="Código SFC"
                required
                error={!!erroresCampo.codigo}
                helperText={
                  erroresCampo.codigo ??
                  (sugerido ? 'Sugerido por la descripción del catálogo. Confírmelo al guardar.' : ' ')
                }
                color={sugerido ? 'warning' : undefined}
                focused={sugerido || undefined}
              />
            )}
          />

          <TextField
            label="Observaciones"
            value={observaciones}
            onChange={e => {
              setObservaciones(e.target.value);
              limpiarError('observaciones');
            }}
            error={!!erroresCampo.observaciones}
            helperText={erroresCampo.observaciones ?? 'Opcional: de dónde sale la equivalencia.'}
            inputProps={{ maxLength: MAX_OBSERVACIONES }}
            size="small"
            multiline
            minRows={2}
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={handleClose} disabled={guardando} color="inherit">
          Cancelar
        </Button>
        <Button
          onClick={handleGuardar}
          variant="contained"
          disabled={guardando}
          startIcon={guardando ? <CircularProgress size={20} /> : null}
        >
          {guardando ? 'Guardando...' : 'Guardar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
