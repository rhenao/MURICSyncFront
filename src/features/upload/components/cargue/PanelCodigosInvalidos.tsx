import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import type {
  CatalogoEquivalencia,
  CodigoInvalido,
  Equivalencia,
  EquivalenciaInicial,
} from '../../models/Equivalencia.model';
import EquivalenciaService from '../../services/EquivalenciaService';
import DialogEquivalencia from '../DialogEquivalencia';
import { extractBackendErrors } from '../../../../utils/extractBackendErrors';

interface PanelCodigosInvalidosProps {
  loteId: number;
  // Cambia cada vez que se recarga el lote (subir, validar): vuelve a pedir los códigos.
  version: unknown;
  canWrite: boolean;
  canValidar: boolean;
  isBusy: boolean;
  onValidar: () => void;
}

const clave = (catalogo: string, valorNormalizado: string) => `${catalogo}|${valorNormalizado}`;

/**
 * Valores del lote que no son código de su catálogo (regla CATALOGO-CODIGO-INVALIDO), agrupados por valor,
 * con creación rápida de la equivalencia. Las equivalencias se aplican al validar: no hace falta volver a
 * subir el archivo (plan de equivalencias de carga, fase EQ-D).
 */
export default function PanelCodigosInvalidos({
  loteId,
  version,
  canWrite,
  canValidar,
  isBusy,
  onValidar,
}: PanelCodigosInvalidosProps) {
  const [filas, setFilas] = useState<CodigoInvalido[]>([]);
  const [catalogos, setCatalogos] = useState<CatalogoEquivalencia[]>([]);
  const [cargando, setCargando] = useState(false);
  const [falla, setFalla] = useState<string | null>(null);
  const [inicial, setInicial] = useState<EquivalenciaInicial | null>(null);
  // Creadas en esta sesión del panel; se olvidan al recargar el lote (la validación las aplica).
  const [creadas, setCreadas] = useState<Map<string, Equivalencia>>(new Map());

  useEffect(() => {
    let activo = true;
    setCargando(true);
    setFalla(null);
    setCreadas(new Map());
    EquivalenciaService.codigosInvalidos(loteId)
      .then(r => { if (activo) setFilas(r); })
      .catch(err => {
        if (activo) setFalla(extractBackendErrors(err, 'No se pudieron cargar los códigos no válidos.').join(' '));
      })
      .finally(() => { if (activo) setCargando(false); });
    return () => { activo = false; };
  }, [loteId, version]);

  // El diálogo necesita los catálogos con sus códigos; solo se piden si se puede crear y hay algo que resolver.
  useEffect(() => {
    if (!canWrite || filas.length === 0 || catalogos.length > 0) return;
    EquivalenciaService.catalogos()
      .then(setCatalogos)
      .catch(err => setFalla(extractBackendErrors(err, 'No se pudieron cargar los catálogos.').join(' ')));
  }, [canWrite, filas.length, catalogos.length]);

  if (!cargando && !falla && filas.length === 0) return null;

  const handleGuardada = (eq: Equivalencia) => {
    setCreadas(m => new Map(m).set(clave(eq.catalogo, eq.valorNormalizado), eq));
    setInicial(null);
  };

  const pendientes = filas.filter(f => !creadas.has(clave(f.catalogo, f.valorNormalizado))).length;

  return (
    <Box sx={{ mb: 2 }}>
      <Stack direction="row" spacing={1.5} alignItems="center" mb={1}>
        <Typography variant="subtitle2" fontWeight={600}>
          Códigos no válidos
        </Typography>
        <Chip label={`${filas.length} valor${filas.length !== 1 ? 'es' : ''}`} size="small" variant="outlined" />
      </Stack>
      <Typography variant="body2" color="text.secondary" mb={1}>
        Valores del archivo que no son un código del catálogo SFC. Corríjalos en el archivo o cree una equivalencia:
        una equivalencia resuelve el valor en todas sus filas.
      </Typography>

      {falla && <Alert severity="error" sx={{ mb: 1 }}>{falla}</Alert>}

      {creadas.size > 0 && (
        <Alert
          severity="success"
          sx={{ mb: 1 }}
          action={
            canValidar && (
              <Button color="inherit" size="small" onClick={onValidar} disabled={isBusy}>
                Validar de nuevo
              </Button>
            )
          }
        >
          {creadas.size === 1 ? 'Se creó 1 equivalencia.' : `Se crearon ${creadas.size} equivalencias.`}{' '}
          Valide el lote de nuevo para aplicarlas; no hace falta volver a subir el archivo.
          {pendientes > 0 && ` Quedan ${pendientes} valor${pendientes !== 1 ? 'es' : ''} sin resolver.`}
        </Alert>
      )}

      {cargando ? (
        <CircularProgress size={20} />
      ) : (
        <TableContainer sx={{ maxHeight: 300 }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Catálogo</TableCell>
                <TableCell>Valor</TableCell>
                <TableCell>Campos</TableCell>
                <TableCell align="right">Filas</TableCell>
                {canWrite && <TableCell />}
              </TableRow>
            </TableHead>
            <TableBody>
              {filas.map(f => {
                const creada = creadas.get(clave(f.catalogo, f.valorNormalizado));
                return (
                  <TableRow key={clave(f.catalogo, f.valorNormalizado)}>
                    <TableCell>{f.catalogoNombre}</TableCell>
                    <TableCell sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>{f.valor}</TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary">
                        {f.campos.join(', ')}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">{f.filas.toLocaleString('es-CO')}</TableCell>
                    {canWrite && (
                      <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                        {creada ? (
                          <Chip
                            icon={<CheckCircleOutlineIcon />}
                            label={`→ ${creada.codigo} ${creada.codigoDescripcion ?? ''}`}
                            size="small"
                            color="success"
                            variant="outlined"
                          />
                        ) : (
                          <Button
                            size="small"
                            startIcon={<AddIcon />}
                            onClick={() => setInicial({ catalogo: f.catalogo, valorOriginal: f.valor })}
                            disabled={catalogos.length === 0}
                          >
                            Crear equivalencia
                          </Button>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {canWrite && (
        <DialogEquivalencia
          open={inicial !== null}
          equivalencia={null}
          inicial={inicial}
          catalogos={catalogos}
          onClose={() => setInicial(null)}
          onSaved={handleGuardada}
          onNoExiste={() => setInicial(null)}
        />
      )}
    </Box>
  );
}
