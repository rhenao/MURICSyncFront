import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import DownloadIcon from '@mui/icons-material/Download';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import PlaylistAddIcon from '@mui/icons-material/PlaylistAdd';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import * as XLSX from 'xlsx';
import { useEntidades } from '../../../hooks/useEntidades';
import { usePermission } from '../../auth/hooks/usePermission';
import type CatalogoAtributos from '../../param/models/CatalogoAtributos.model';
import { ATRIBUTOS_POLIZA } from '../../param/models/CatalogoAtributos.model';
import {
  CAMPOS_POR_INSUMO,
  INSUMO_LABELS,
  INSUMO_LABELS_CORTO,
  insumosGeneradosTodos,
  type CampoInsumo,
  type InsumoMURIC,
  type PlantillaCampo,
  type PlantillaCampoRequest,
  type PlantillaDetalle,
} from '../models/Plantilla.model';
import { extractBackendErrors } from '../../../utils/extractBackendErrors';

// ─── Tipos internos ───────────────────────────────────────────────────────────

interface FilaMapeo {
  _tempId: string;
  nombreColumnaArchivo: string;
  campoStaging: string;
  valorPorDefecto: string;
  _sugerida: boolean;
  // Columna de atributo (001-002 por columnas): campoStaging es siempre 'valor_atributo'.
  esAtributo: boolean;
  claveAtributo: number | null;
  ordinalPoliza: string;
}

const CLAVE_ATRIBUTO = 'clave_atributo';
const VALOR_ATRIBUTO = 'valor_atributo';
const CAMPOS_EAV = [CLAVE_ATRIBUTO, VALOR_ATRIBUTO];

// ─── Helpers de conversión ────────────────────────────────────────────────────

function campoToFila(c: PlantillaCampo): FilaMapeo {
  return {
    _tempId: String(c.id ?? Math.random()),
    nombreColumnaArchivo: c.nombreColumnaArchivo ?? '',
    campoStaging: c.campoStaging,
    valorPorDefecto: c.valorPorDefecto ?? '',
    _sugerida: false,
    esAtributo: c.claveAtributo != null,
    claveAtributo: c.claveAtributo ?? null,
    ordinalPoliza: c.ordinalPoliza != null ? String(c.ordinalPoliza) : '',
  };
}

function filasToCampos(filas: FilaMapeo[]): PlantillaCampoRequest[] {
  return filas.map((f, i) => {
    const esPoliza = f.esAtributo && f.claveAtributo != null && ATRIBUTOS_POLIZA.includes(f.claveAtributo);
    return {
      nombreColumnaArchivo: f.nombreColumnaArchivo.trim() || null,
      campoStaging: f.campoStaging,
      valorPorDefecto: f.valorPorDefecto.trim() || null,
      ordenColumna: i + 1,
      claveAtributo: f.esAtributo ? f.claveAtributo : null,
      ordinalPoliza: esPoliza && f.ordinalPoliza.trim() ? Number(f.ordinalPoliza) : null,
    };
  });
}

function nuevaFila(): FilaMapeo {
  return {
    _tempId: String(Math.random()),
    nombreColumnaArchivo: '',
    campoStaging: '',
    valorPorDefecto: '',
    _sugerida: false,
    esAtributo: false,
    claveAtributo: null,
    ordinalPoliza: '',
  };
}

function nuevaFilaAtributo(claveAtributo: number | null = null): FilaMapeo {
  return { ...nuevaFila(), campoStaging: VALOR_ATRIBUTO, esAtributo: true, claveAtributo };
}

// ─── Parseo de encabezados desde archivo ─────────────────────────────────────

/** Límite de `nombreColumnaArchivo` en el backend (`CampoPlantillaDto`). */
const MAX_COLUMNA = 200;

/** El backend solo separa por `;`, tabulador o `,` (`ParserBase.DetectarDelimitador`). */
const SEPARADORES = [',', ';', '\t'];

class SeparadorNoSoportadoError extends Error {}

/** Nombre de archivo sin caracteres que los navegadores o el sistema operativo rechazan. */
function nombreArchivoSeguro(s: string): string {
  return s.trim().replace(/[\\/:*?"<>|]+/g, '_').replace(/\s+/g, '_').slice(0, 100) || 'sin_nombre';
}

async function parseHeadersFromFile(file: File): Promise<string[]> {
  const ext = file.name.split('.').pop()?.toLowerCase();

  if (ext === 'xlsx' || ext === 'xls') {
    const data = await file.arrayBuffer();
    const wb = XLSX.read(data, { type: 'array' });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, {
      header: 1,
      blankrows: false,
      defval: '',
    });
    const headerRow = (rows[0] ?? []) as unknown[];
    return headerRow
      .map(c => String(c ?? '').trim())
      .filter(c => c.length > 0);
  }

  // CSV / TXT: detectar separador automáticamente
  const text = await file.text();
  const firstLine = text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .find(l => l.trim());
  if (!firstLine) return [];

  const separador = SEPARADORES.reduce((best, sep) =>
    firstLine.split(sep).length > firstLine.split(best).length ? sep : best
  );
  if (firstLine.split(separador).length === 1 && firstLine.includes('|')) {
    throw new SeparadorNoSoportadoError(
      'El archivo parece estar separado por "|". El sistema solo acepta archivos separados por ";", "," o tabulador.'
    );
  }

  return firstLine
    .split(separador)
    .map(c => c.trim().replace(/^["']|["']$/g, ''))
    .filter(Boolean);
}

// ─── Algoritmo de sugerencia de mapeo ─────────────────────────────────────────

function normalizar(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // sin tildes: "Originación" = "originacion"
    .toLowerCase()
    .trim()
    .replace(/[\s\-./]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

interface Coincidencia<K> {
  clave: K;
  score: number;
}

/** Mejor candidato para un encabezado; null si ninguno supera el umbral o hay empate. */
function mejorCoincidencia<K>(
  encabezado: string,
  candidatos: { clave: K; texto: string }[]
): Coincidencia<K> | null {
  const norm = normalizar(encabezado);
  if (!norm || candidatos.length === 0) return null;

  const scores = candidatos.map(c => {
    const normCampo = normalizar(c.texto);
    if (norm === normCampo) return { clave: c.clave, score: 100 };

    let score = 0;
    // Contención completa
    if (normCampo.includes(norm) || norm.includes(normCampo)) score = 50;

    // Palabras en común (ignorar palabras de 1-2 chars: "de", "la", etc.)
    const palabrasEnc = norm.split('_').filter(p => p.length > 2);
    const palabrasCampo = normCampo.split('_').filter(p => p.length > 2);
    const comunes = palabrasEnc.filter(p => palabrasCampo.includes(p));
    return { clave: c.clave, score: Math.max(score, comunes.length * 20) };
  });

  const maxScore = Math.max(...scores.map(s => s.score));
  if (maxScore < 20) return null; // ningún campo supera el umbral mínimo

  const mejores = scores.filter(s => s.score === maxScore);
  if (mejores.length > 1) return null; // empate = ambigüedad, el usuario elige

  return mejores[0];
}

/** Fila sugerida para un encabezado: campo de staging o, en 001-002, un atributo del catálogo. */
function sugerirFila(encabezado: string, campos: CampoInsumo[], atributos: CatalogoAtributos[]): FilaMapeo {
  const base: FilaMapeo = { ...nuevaFila(), nombreColumnaArchivo: encabezado };
  const campo = mejorCoincidencia(encabezado, campos.map(c => ({ clave: c.campo, texto: c.campo })));
  const atributo = mejorCoincidencia(
    encabezado,
    atributos.map(a => ({ clave: a.Codigo, texto: a.Nombre }))
  );

  if (atributo && (!campo || atributo.score > campo.score)) {
    return { ...nuevaFilaAtributo(atributo.clave), nombreColumnaArchivo: encabezado, _sugerida: true };
  }
  if (campo) return { ...base, campoStaging: campo.clave, _sugerida: true };
  return base;
}

// ─── Valor por defecto desde un catálogo ──────────────────────────────────────

interface ValorCatalogo {
  Codigo: number | string;
  Descripcion: string;
}

/** Select con los valores del catálogo SFC del atributo (p. ej. /SexoBiologico). */
function ValorCatalogoSelect({
  endpoint,
  value,
  onChange,
}: {
  endpoint: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const { entidades, cargando } = useEntidades<ValorCatalogo>(`/${endpoint}`);
  const opciones = entidades ?? [];
  const existe = value === '' || opciones.some(o => String(o.Codigo) === value);

  return (
    <FormControl size="small" fullWidth>
      <Select
        displayEmpty
        value={value}
        onChange={e => onChange(e.target.value)}
        renderValue={v => {
          if (!v) return <em style={{ color: '#aaa' }}>{cargando ? 'Cargando...' : 'Opcional: si la celda viene vacía'}</em>;
          const o = opciones.find(x => String(x.Codigo) === v);
          return o ? `${o.Codigo} · ${o.Descripcion}` : v;
        }}
      >
        <MenuItem value=""><em>Sin valor por defecto</em></MenuItem>
        {!existe && <MenuItem value={value}>{value}</MenuItem>}
        {opciones.map(o => (
          <MenuItem key={String(o.Codigo)} value={String(o.Codigo)}>
            {o.Codigo} · {o.Descripcion}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}

// ─── Selector de atributo (columna de atributo) ──────────────────────────────

function SelectorAtributo({
  fila,
  catalogo,
  atributoPorClave,
  clavesYaUsadas,
  cargando,
  onAtributoChange,
  onOrdinalChange,
}: {
  fila: FilaMapeo;
  catalogo: CatalogoAtributos[];
  atributoPorClave: Map<number, CatalogoAtributos>;
  clavesYaUsadas: Set<number | null>;
  cargando: boolean;
  onAtributoChange: (clave: number | null) => void;
  onOrdinalChange: (v: string) => void;
}) {
  const clave = fila.claveAtributo;
  // Sin catálogo (p. ej. sin params.read) el atributo guardado se muestra solo con su código.
  const actual: CatalogoAtributos | null =
    clave == null
      ? null
      : atributoPorClave.get(clave) ?? {
          Codigo: clave,
          Nombre: `Atributo ${clave}`,
          Descripcion: null,
          Naturaleza: 'Sólo si es aplicable',
          Repetible: false,
          CatalogoValor: null,
        };
  const opciones = catalogo.filter(a => a.Codigo === clave || a.Repetible || !clavesYaUsadas.has(a.Codigo));
  if (actual && !opciones.some(a => a.Codigo === actual.Codigo)) opciones.unshift(actual);
  const esPoliza = clave != null && ATRIBUTOS_POLIZA.includes(clave);

  return (
    <Stack direction="row" spacing={1} alignItems="center">
      <Autocomplete
        size="small"
        fullWidth
        options={opciones}
        value={actual}
        loading={cargando}
        onChange={(_, v) => onAtributoChange(v?.Codigo ?? null)}
        getOptionLabel={a => `${a.Codigo} · ${a.Nombre}`}
        isOptionEqualToValue={(a, b) => a.Codigo === b.Codigo}
        renderOption={(props, a) => {
          const { key, ...rest } = props;
          return (
            <Tooltip key={key} title={a.Descripcion ?? ''} placement="right" enterDelay={600}>
              <Box component="li" {...rest} sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <span>{a.Codigo} · {a.Nombre}</span>
                {a.Naturaleza === 'Obligatorio' && (
                  <Chip label="Obligatorio" size="small" color="warning" variant="outlined" />
                )}
                {a.Repetible && <Chip label="Repetible" size="small" variant="outlined" />}
              </Box>
            </Tooltip>
          );
        }}
        renderInput={params => (
          <TextField
            {...params}
            placeholder="Busca el atributo"
            error={clave == null}
            InputProps={{
              ...params.InputProps,
              startAdornment: fila._sugerida ? (
                <AutoFixHighIcon color="info" sx={{ fontSize: '1rem', mr: 0.5 }} titleAccess="Sugerida" />
              ) : (
                params.InputProps.startAdornment
              ),
            }}
          />
        )}
      />
      {esPoliza && (
        <Tooltip title='Número de la póliza: el valor se reporta como "P{n}_valor". Déjalo vacío si el archivo ya trae el prefijo.'>
          <TextField
            size="small"
            label="Póliza n.º"
            value={fila.ordinalPoliza}
            onChange={e => onOrdinalChange(e.target.value.replace(/\D/g, '').slice(0, 2))}
            sx={{ width: 110, flexShrink: 0 }}
            inputProps={{ inputMode: 'numeric' }}
          />
        </Tooltip>
      )}
    </Stack>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

/** Datos que produce el formulario; ListPlantillas decide si crea o actualiza. */
export interface PlantillaFormData {
  nombre: string;
  descripcion: string | null;
  insumo: InsumoMURIC;
  campos: PlantillaCampoRequest[];
}

interface Props {
  open: boolean;
  plantilla: PlantillaDetalle | null; // detalle completo (GET /plantillas/{id}) al editar
  onClose: () => void;
  onSave: (data: PlantillaFormData) => Promise<void>; // si falla, el error se muestra en el diálogo
}

export default function FormPlantilla({ open, plantilla, onClose, onSave }: Props) {
  const esEdicion = plantilla !== null;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [insumo, setInsumo] = useState<InsumoMURIC | ''>('');
  const [filas, setFilas] = useState<FilaMapeo[]>([]);
  const [error, setError] = useState('');
  const [erroresGuardar, setErroresGuardar] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [errorImport, setErrorImport] = useState('');

  // Encabezados pendientes de confirmar antes de reemplazar filas existentes
  const [pendingHeaders, setPendingHeaders] = useState<string[] | null>(null);

  useEffect(() => {
    if (!open) return;
    if (plantilla) {
      setNombre(plantilla.nombre);
      setDescripcion(plantilla.descripcion ?? '');
      setInsumo(plantilla.insumo);
      const campos = plantilla.campos ?? [];
      setFilas(campos.length > 0 ? campos.map(campoToFila) : [nuevaFila()]);
    } else {
      setNombre('');
      setDescripcion('');
      setInsumo('');
      setFilas([nuevaFila()]);
    }
    setError('');
    setErroresGuardar([]);
    setErrorImport('');
    setPendingHeaders(null);
  }, [open, plantilla]);

  // Catálogo de atributos (solo 001-002). Sin params.read no se consulta: un 403 del cliente OData cierra la sesión.
  const { hasPermission } = usePermission();
  const puedeLeerCatalogo = hasPermission('params.read');
  // 001-002 y 001-999 (Todos) admiten columnas de atributo.
  const esAtributos = insumo === '001-002' || insumo === '001-999';
  const { entidades: catalogoRaw, cargando: cargandoCatalogo } = useEntidades<CatalogoAtributos>(
    '/CatalogoAtributos',
    { enabled: open && esAtributos && puedeLeerCatalogo }
  );
  const catalogo = useMemo(
    () => [...(catalogoRaw ?? [])].sort((a, b) => a.Codigo - b.Codigo),
    [catalogoRaw]
  );
  const atributoPorClave = useMemo(() => new Map(catalogo.map(a => [a.Codigo, a])), [catalogo]);

  // Una plantilla 001-002 es EAV (clave_atributo/valor_atributo) o por columnas de atributo, no las dos.
  const hayColumnasAtributo = filas.some(f => f.esAtributo);
  const hayCamposEav = filas.some(f => !f.esAtributo && CAMPOS_EAV.includes(f.campoStaging));

  const camposDisponibles: CampoInsumo[] = insumo
    ? CAMPOS_POR_INSUMO[insumo].filter(c => !(hayColumnasAtributo && CAMPOS_EAV.includes(c.campo)))
    : [];
  const camposYaUsados = new Set(filas.filter(f => !f.esAtributo).map(f => f.campoStaging).filter(Boolean));
  const clavesYaUsadas = new Set(filas.filter(f => f.esAtributo && f.claveAtributo != null).map(f => f.claveAtributo));

  // 001-999: un insumo se genera si hay al menos un campo propio de él mapeado (N1; los identificadores no cuentan).
  const esTodos = insumo === '001-999';
  const insumosGenerados: InsumoMURIC[] = esTodos
    ? insumosGeneradosTodos(
        filas.map(f => ({ campoStaging: f.campoStaging, claveAtributo: f.esAtributo ? f.claveAtributo ?? 0 : null }))
      )
    : [];

  // ── Handlers del formulario ──────────────────────────────────────────────────

  const handleInsumoChange = (v: InsumoMURIC) => {
    setInsumo(v);
    setFilas([nuevaFila()]);
  };

  const handleFilaChange = <K extends keyof FilaMapeo>(
    tempId: string,
    key: K,
    value: FilaMapeo[K]
  ) => {
    setFilas(prev =>
      prev.map(f =>
        f._tempId === tempId
          ? {
              ...f,
              [key]: value,
              _sugerida: key === 'campoStaging' || key === 'claveAtributo' ? false : f._sugerida,
            }
          : f
      )
    );
  };

  const handleAgregarFila = () => setFilas(prev => [...prev, nuevaFila()]);

  const handleAgregarAtributo = () => setFilas(prev => [...prev, nuevaFilaAtributo()]);

  // El valor por defecto depende del catálogo del atributo: al cambiar el atributo se limpia.
  const handleAtributoChange = (tempId: string, clave: number | null) =>
    setFilas(prev =>
      prev.map(f =>
        f._tempId === tempId
          ? { ...f, claveAtributo: clave, valorPorDefecto: '', ordinalPoliza: '', _sugerida: false }
          : f
      )
    );

  // Pasa una fila de campo a atributo o al revés, conservando la columna del archivo.
  const handleCambiarTipo = (tempId: string) =>
    setFilas(prev =>
      prev.map(f =>
        f._tempId === tempId
          ? f.esAtributo
            ? { ...nuevaFila(), _tempId: f._tempId, nombreColumnaArchivo: f.nombreColumnaArchivo }
            : { ...nuevaFilaAtributo(), _tempId: f._tempId, nombreColumnaArchivo: f.nombreColumnaArchivo }
          : f
      )
    );

  const handleEliminarFila = (tempId: string) =>
    setFilas(prev => prev.filter(f => f._tempId !== tempId));

  // ── Importar desde archivo ───────────────────────────────────────────────────

  const tieneFilasConContenido = filas.some(
    f => f.nombreColumnaArchivo.trim() || f.campoStaging || f.valorPorDefecto.trim()
  );

  const aplicarImportacion = (headers: string[]) => {
    const campos = insumo ? CAMPOS_POR_INSUMO[insumo] : [];
    const nuevasFilas = headers.map(h => sugerirFila(h, campos, esAtributos ? catalogo : []));
    // Si el archivo trae clave_atributo/valor_atributo es EAV: no se sugieren columnas de atributo.
    const esEav = nuevasFilas.some(f => !f.esAtributo && CAMPOS_EAV.includes(f.campoStaging));
    setFilas(
      esEav
        ? nuevasFilas.map(f =>
            f.esAtributo ? { ...nuevaFila(), nombreColumnaArchivo: f.nombreColumnaArchivo } : f
          )
        : nuevasFilas
    );
    setPendingHeaders(null);
    setErrorImport('');
  };

  const handleImportarArchivo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!fileInputRef.current) return;
    fileInputRef.current.value = ''; // resetear para permitir re-selección del mismo archivo
    if (!file) return;

    setErrorImport('');
    try {
      const headers = await parseHeadersFromFile(file);
      if (headers.length === 0) {
        setErrorImport('No se encontraron encabezados en la primera fila del archivo.');
        return;
      }
      if (tieneFilasConContenido) {
        setPendingHeaders(headers); // mostrar confirmación
      } else {
        aplicarImportacion(headers);
      }
    } catch (err) {
      setErrorImport(
        err instanceof SeparadorNoSoportadoError
          ? err.message
          : 'No se pudo leer el archivo. Verifica que sea un Excel o CSV válido.'
      );
    }
  };

  // ── Descarga de plantilla vacía ──────────────────────────────────────────────

  const handleDescargarPlantilla = () => {
    if (!insumo) return;
    const encabezados = filas
      .filter(f => f.campoStaging && f.nombreColumnaArchivo.trim())
      .map(f => f.nombreColumnaArchivo.trim());
    if (encabezados.length === 0) return;
    const ws = XLSX.utils.aoa_to_sheet([encabezados]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `MURIC-${insumo}`);
    XLSX.writeFile(wb, `plantilla_${insumo}_${nombreArchivoSeguro(nombre)}.xlsx`);
  };

  // ── Guardar ──────────────────────────────────────────────────────────────────

  const handleGuardar = async () => {
    if (saving) return;
    setError('');
    setErroresGuardar([]);
    if (!nombre.trim()) { setError('El nombre es obligatorio.'); return; }
    if (!insumo) { setError('Selecciona el insumo MURIC.'); return; }

    const filasValidas = filas.filter(f => f.campoStaging);
    if (filasValidas.length === 0) {
      setError('Agrega al menos un campo mapeado.');
      return;
    }
    const errorAtributos = validarAtributos(filasValidas);
    if (errorAtributos) {
      setError(errorAtributos);
      return;
    }
    if (esTodos && insumosGenerados.length === 0) {
      setError('La plantilla 001-999 debe mapear al menos un campo propio de algún insumo; los identificadores no cuentan.');
      return;
    }
    const sinCobertura = filasValidas.filter(
      f => !f.nombreColumnaArchivo.trim() && !f.valorPorDefecto.trim()
    );
    if (sinCobertura.length > 0) {
      setError('Cada fila debe tener al menos una "Columna en el archivo" o un "Valor por defecto".');
      return;
    }
    if (filasValidas.some(f => f.nombreColumnaArchivo.trim().length > MAX_COLUMNA)) {
      setError(`La "Columna en el archivo" admite máximo ${MAX_COLUMNA} caracteres.`);
      return;
    }
    const camposDuplicados = filasValidas
      .filter(f => !f.esAtributo)
      .map(f => f.campoStaging)
      .filter((c, i, arr) => arr.indexOf(c) !== i);
    if (camposDuplicados.length > 0) {
      setError('Un mismo campo destino aparece más de una vez en el mapeo.');
      return;
    }

    setSaving(true);
    try {
      await onSave({
        nombre: nombre.trim(),
        descripcion: descripcion.trim() || null,
        insumo,
        campos: filasToCampos(filasValidas),
      });
    } catch (err) {
      setErroresGuardar(extractBackendErrors(err, 'No se pudo guardar la plantilla. Intente nuevamente.'));
    } finally {
      setSaving(false);
    }
  };

  // Reglas de las columnas de atributo; el backend repite estas validaciones.
  const validarAtributos = (filasValidas: FilaMapeo[]): string | null => {
    const atributos = filasValidas.filter(f => f.esAtributo);
    if (atributos.length === 0) return null;
    if (hayCamposEav) {
      return 'La plantilla mezcla columnas de atributo con "Clave Atributo"/"Valor Atributo". Usa una sola forma.';
    }
    if (atributos.some(f => f.claveAtributo == null)) return 'Elige el atributo de cada columna de atributo.';

    for (const f of atributos) {
      if (!f.ordinalPoliza.trim()) continue;
      const n = Number(f.ordinalPoliza);
      if (!Number.isInteger(n) || n < 1 || n > 99) {
        return `Atributo ${f.claveAtributo}: el número de póliza debe ser un entero entre 1 y 99.`;
      }
    }

    const porClave = new Map<number, FilaMapeo[]>();
    for (const f of atributos) porClave.set(f.claveAtributo!, [...(porClave.get(f.claveAtributo!) ?? []), f]);
    for (const [clave, grupo] of porClave) {
      if (grupo.length < 2) continue;
      const atributo = atributoPorClave.get(clave);
      const nombreAtributo = atributo ? `${clave} (${atributo.Nombre})` : String(clave);
      if (atributo && !atributo.Repetible) return `El atributo ${nombreAtributo} no es repetible y aparece ${grupo.length} veces.`;
      if (ATRIBUTOS_POLIZA.includes(clave)) {
        const ordinales = grupo.map(f => f.ordinalPoliza.trim());
        if (new Set(ordinales).size < ordinales.length) {
          return `El atributo ${nombreAtributo} se repite: indica un número de póliza distinto en cada columna.`;
        }
      }
    }
    return null;
  };

  const handleClose = () => {
    if (!saving) onClose();
  };

  // ── Datos derivados para la UI ───────────────────────────────────────────────

  // 001-999: solo se exigen los obligatorios de los insumos que la plantilla genera (N1).
  const obligatoriosFaltantes = (esTodos
    ? camposDisponibles.filter(c => c.obligatorio && (c.insumo ? insumosGenerados.includes(c.insumo) : insumosGenerados.length > 0))
    : camposDisponibles.filter(c => c.obligatorio))
    .filter(c => !new Set(filas.map(f => f.campoStaging)).has(c.campo));

  // Advertencia, no bloquea: varios dependen del tipo de persona (1 solo jurídica; 2 y 3 solo natural).
  const atributosObligatoriosFaltantes = hayColumnasAtributo
    ? catalogo.filter(a => a.Naturaleza === 'Obligatorio' && !clavesYaUsadas.has(a.Codigo))
    : [];

  const sugeridosCount = filas.filter(f => f._sugerida).length;

  // Una columna del archivo puede alimentar varios campos; se avisa por si es un error.
  const conteoColumnas = new Map<string, { nombre: string; veces: number }>();
  for (const f of filas) {
    const nombreCol = f.nombreColumnaArchivo.trim();
    if (!nombreCol || !f.campoStaging) continue;
    const clave = nombreCol.toLowerCase();
    const previo = conteoColumnas.get(clave);
    conteoColumnas.set(clave, { nombre: previo?.nombre ?? nombreCol, veces: (previo?.veces ?? 0) + 1 });
  }
  const columnasRepetidas = [...conteoColumnas.values()].filter(c => c.veces > 1).map(c => c.nombre);

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <>
      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="lg" scroll="paper">
        <DialogTitle sx={{ pb: 1 }}>
          {esEdicion ? `Editar plantilla: ${plantilla.nombre}` : 'Nueva plantilla de carga'}
        </DialogTitle>

        <DialogContent dividers>
          <Stack spacing={2.5}>
            {error && <Alert severity="error" onClose={() => setError('')}>{error}</Alert>}
            {erroresGuardar.length > 0 && (
              <Alert severity="error" onClose={() => setErroresGuardar([])}>
                {erroresGuardar.map((msg, i) => <div key={i}>{msg}</div>)}
              </Alert>
            )}
            {errorImport && (
              <Alert severity="warning" onClose={() => setErrorImport('')}>{errorImport}</Alert>
            )}

            {/* ── Encabezado ── */}
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label="Nombre"
                value={nombre}
                onChange={e => setNombre(e.target.value)}
                fullWidth
                required
                inputProps={{ maxLength: 200 }}
              />
              <FormControl fullWidth required disabled={esEdicion}>
                <InputLabel>Insumo MURIC</InputLabel>
                <Select
                  value={insumo}
                  label="Insumo MURIC"
                  onChange={e => handleInsumoChange(e.target.value as InsumoMURIC)}
                >
                  {(Object.keys(INSUMO_LABELS) as InsumoMURIC[]).map(k => (
                    <MenuItem key={k} value={k}>{INSUMO_LABELS[k]}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>

            <TextField
              label="Descripción"
              value={descripcion}
              onChange={e => setDescripcion(e.target.value)}
              fullWidth
              multiline
              rows={2}
              placeholder="Describe cuándo usar esta plantilla y qué sistema genera el archivo"
            />

            <Divider />

            {/* ── Barra de acciones de la tabla ── */}
            <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="subtitle1" fontWeight={600}>
                  Mapeo de columnas
                </Typography>
                {sugeridosCount > 0 && (
                  <Chip
                    icon={<AutoFixHighIcon sx={{ fontSize: '0.85rem !important' }} />}
                    label={`${sugeridosCount} mapeo${sugeridosCount > 1 ? 's' : ''} sugerido${sugeridosCount > 1 ? 's' : ''}`}
                    size="small"
                    color="info"
                    variant="outlined"
                  />
                )}
              </Stack>

              <Stack direction="row" spacing={1} flexWrap="wrap">
                {/* Botón importar desde archivo */}
                <Tooltip title="Lee la primera fila del archivo y genera las filas de mapeo automáticamente">
                  <span>
                    <Button
                      size="small"
                      variant="outlined"
                      color="secondary"
                      startIcon={<UploadFileIcon />}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Importar columnas desde archivo
                    </Button>
                  </span>
                </Tooltip>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv,.txt"
                  style={{ display: 'none' }}
                  onChange={handleImportarArchivo}
                />

                {insumo && filas.some(f => f.nombreColumnaArchivo.trim()) && (
                  <Tooltip title="Descarga un Excel con las columnas definidas como encabezados">
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<DownloadIcon />}
                      onClick={handleDescargarPlantilla}
                    >
                      Descargar plantilla vacía
                    </Button>
                  </Tooltip>
                )}

                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<AddCircleOutlineIcon />}
                  onClick={handleAgregarFila}
                  disabled={!insumo}
                >
                  Agregar fila
                </Button>

                {esAtributos && (
                  <Tooltip
                    title={
                      !puedeLeerCatalogo
                        ? 'Requiere permiso de consulta de tablas básicas (params.read).'
                        : hayCamposEav
                          ? 'La plantilla ya mapea "Clave Atributo"/"Valor Atributo" (formato EAV). Quítalos para usar columnas de atributo.'
                          : 'Una columna del archivo por atributo: cada celda con valor genera una fila de atributo.'
                    }
                  >
                    <span>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<PlaylistAddIcon />}
                        onClick={handleAgregarAtributo}
                        disabled={!puedeLeerCatalogo || hayCamposEav || cargandoCatalogo}
                      >
                        Agregar atributo
                      </Button>
                    </span>
                  </Tooltip>
                )}
              </Stack>
            </Stack>

            {!insumo && (
              <Typography variant="body2" color="text.secondary">
                Selecciona el insumo MURIC para comenzar a mapear columnas, o importa un archivo directamente (las sugerencias de mapeo requieren tener el insumo seleccionado).
              </Typography>
            )}

            {esTodos && (
              <Alert severity={insumosGenerados.length > 0 ? 'info' : 'warning'} sx={{ py: 0.5 }}>
                {insumosGenerados.length > 0 ? (
                  <>
                    Un archivo con esta plantilla llenará:{' '}
                    {insumosGenerados.map(i => (
                      <Chip key={i} label={INSUMO_LABELS_CORTO[i]} size="small" sx={{ mr: 0.5 }} />
                    ))}
                    Solo se exigen los obligatorios de esos insumos.
                  </>
                ) : (
                  'Mapea al menos un campo propio de algún insumo (los identificadores no cuentan) o una columna de atributo.'
                )}
              </Alert>
            )}

            {/* ── Alerta de obligatorios faltantes ── */}
            {insumo && obligatoriosFaltantes.length > 0 && (
              <Alert severity="warning" sx={{ py: 0.5 }}>
                Campos obligatorios sin mapear:{' '}
                {obligatoriosFaltantes.map(c => (
                  <Chip key={c.campo} label={c.etiqueta} size="small" sx={{ mr: 0.5 }} />
                ))}
              </Alert>
            )}

            {atributosObligatoriosFaltantes.length > 0 && (
              <Alert severity="info" sx={{ py: 0.5 }}>
                Atributos obligatorios para la SFC sin columna:{' '}
                {atributosObligatoriosFaltantes.map(a => (
                  <Chip key={a.Codigo} label={`${a.Codigo} · ${a.Nombre}`} size="small" sx={{ mr: 0.5, mb: 0.25 }} />
                ))}
                Algunos dependen del tipo de persona (1 solo para jurídica; 2 y 3 solo para natural).
              </Alert>
            )}

            {columnasRepetidas.length > 0 && (
              <Alert severity="info" sx={{ py: 0.5 }}>
                Estas columnas del archivo alimentan más de un campo:{' '}
                {columnasRepetidas.map(c => (
                  <Chip key={c} label={c} size="small" sx={{ mr: 0.5 }} />
                ))}
                Verifica que sea intencional.
              </Alert>
            )}

            {/* ── Tabla de mapeo ── */}
            {(insumo || filas.some(f => f.nombreColumnaArchivo)) && (
              <>
                <TableContainer sx={{ maxHeight: 420 }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700, width: 240 }}>
                          Columna en el archivo
                        </TableCell>
                        <TableCell sx={{ fontWeight: 700, width: 320 }}>
                          Campo destino (staging)
                        </TableCell>
                        <TableCell sx={{ fontWeight: 700, width: 200 }}>
                          Valor por defecto
                        </TableCell>
                        <TableCell sx={{ width: esAtributos ? 88 : 48 }} />
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filas.map(fila => {
                        const opcionesDestino = camposDisponibles.filter(
                          c => c.campo === fila.campoStaging || !camposYaUsados.has(c.campo)
                        );
                        const catalogoValor =
                          fila.claveAtributo != null
                            ? atributoPorClave.get(fila.claveAtributo)?.CatalogoValor ?? null
                            : null;
                        // Pasar a atributo sigue las reglas de "Agregar atributo"; el EAV de esta misma fila no cuenta.
                        const otraFilaEav = filas.some(
                          o => o._tempId !== fila._tempId && !o.esAtributo && CAMPOS_EAV.includes(o.campoStaging)
                        );
                        const bloqueoAtributo = fila.esAtributo
                          ? ''
                          : !puedeLeerCatalogo
                            ? 'Requiere permiso de consulta de tablas básicas (params.read).'
                            : otraFilaEav
                              ? 'La plantilla mapea "Clave Atributo"/"Valor Atributo" (formato EAV). Quítalos para usar columnas de atributo.'
                              : cargandoCatalogo
                                ? 'Cargando el catálogo de atributos...'
                                : '';
                        return (
                          <TableRow
                            key={fila._tempId}
                            sx={fila._sugerida ? { backgroundColor: 'rgba(2, 136, 209, 0.04)' } : {}}
                          >
                            <TableCell>
                              <TextField
                                size="small"
                                fullWidth
                                value={fila.nombreColumnaArchivo}
                                onChange={e =>
                                  handleFilaChange(fila._tempId, 'nombreColumnaArchivo', e.target.value)
                                }
                                placeholder="ej. nro_credito"
                                inputProps={{ maxLength: MAX_COLUMNA }}
                              />
                            </TableCell>

                            <TableCell>
                              {fila.esAtributo ? (
                                <SelectorAtributo
                                  fila={fila}
                                  catalogo={catalogo}
                                  atributoPorClave={atributoPorClave}
                                  clavesYaUsadas={clavesYaUsadas}
                                  cargando={cargandoCatalogo}
                                  onAtributoChange={clave => handleAtributoChange(fila._tempId, clave)}
                                  onOrdinalChange={v => handleFilaChange(fila._tempId, 'ordinalPoliza', v)}
                                />
                              ) : (
                                <FormControl size="small" fullWidth>
                                  <Select
                                    displayEmpty
                                    value={fila.campoStaging}
                                    onChange={e =>
                                      handleFilaChange(fila._tempId, 'campoStaging', e.target.value)
                                    }
                                    renderValue={v =>
                                      v ? (
                                        <Stack direction="row" spacing={0.75} alignItems="center">
                                          <span>
                                            {camposDisponibles.find(c => c.campo === v)?.etiqueta ?? v}
                                          </span>
                                          {fila._sugerida && (
                                            <Chip
                                              icon={<AutoFixHighIcon sx={{ fontSize: '0.75rem !important' }} />}
                                              label="Sugerida"
                                              size="small"
                                              color="info"
                                              variant="outlined"
                                              sx={{ height: 18, fontSize: '0.68rem' }}
                                            />
                                          )}
                                        </Stack>
                                      ) : (
                                        <em style={{ color: '#aaa' }}>Selecciona campo</em>
                                      )
                                    }
                                  >
                                    {opcionesDestino.map(c => (
                                      <MenuItem key={c.campo} value={c.campo}>
                                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                          {c.etiqueta}
                                          {c.insumo && (
                                            <Chip label={INSUMO_LABELS_CORTO[c.insumo]} size="small" variant="outlined" />
                                          )}
                                          {c.obligatorio && (
                                            <Chip label="Obligatorio" size="small" color="warning" variant="outlined" />
                                          )}
                                        </Box>
                                      </MenuItem>
                                    ))}
                                  </Select>
                                </FormControl>
                              )}
                            </TableCell>

                            <TableCell>
                              {fila.esAtributo && catalogoValor ? (
                                <ValorCatalogoSelect
                                  endpoint={catalogoValor}
                                  value={fila.valorPorDefecto}
                                  onChange={v => handleFilaChange(fila._tempId, 'valorPorDefecto', v)}
                                />
                              ) : (
                                <TextField
                                  size="small"
                                  fullWidth
                                  value={fila.valorPorDefecto}
                                  onChange={e =>
                                    handleFilaChange(fila._tempId, 'valorPorDefecto', e.target.value)
                                  }
                                  placeholder={
                                    !fila.nombreColumnaArchivo.trim()
                                      ? 'Requerido si no hay columna'
                                      : 'Opcional: si la celda viene vacía'
                                  }
                                  error={
                                    !fila.nombreColumnaArchivo.trim() &&
                                    !fila.valorPorDefecto.trim() &&
                                    !!fila.campoStaging
                                  }
                                />
                              )}
                            </TableCell>

                            <TableCell sx={{ whiteSpace: 'nowrap' }}>
                              {esAtributos && (
                                <Tooltip
                                  title={
                                    bloqueoAtributo ||
                                    (fila.esAtributo ? 'Cambiar a campo destino' : 'Cambiar a atributo')
                                  }
                                >
                                  <span>
                                    <IconButton
                                      size="small"
                                      onClick={() => handleCambiarTipo(fila._tempId)}
                                      disabled={!!bloqueoAtributo}
                                    >
                                      <SwapHorizIcon fontSize="small" />
                                    </IconButton>
                                  </span>
                                </Tooltip>
                              )}
                              <IconButton
                                size="small"
                                onClick={() => handleEliminarFila(fila._tempId)}
                                disabled={filas.length === 1}
                              >
                                <DeleteOutlineIcon fontSize="small" />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>

                <Typography variant="caption" color="text.secondary">
                  Deja vacía la "Columna en el archivo" si el campo siempre usa el valor por defecto (no viene en el archivo). Si hay columna, el valor por defecto se usa cuando la celda viene vacía o la columna no existe en el archivo. El campo destino solo puede aparecer una vez. Los mapeos marcados como "Sugerida" son propuestas automáticas — revísalos antes de guardar.
                  {esAtributos &&
                    ' En columnas de atributo, cada celda con valor genera una fila de atributo y las celdas vacías sin valor por defecto se omiten. En pólizas (29 a 32), el número de póliza antepone "P{n}_" al valor.'}
                </Typography>
              </>
            )}
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={handleClose} color="inherit" disabled={saving}>Cancelar</Button>
          <Button
            onClick={handleGuardar}
            variant="contained"
            disabled={saving}
            startIcon={saving ? <CircularProgress size={20} /> : null}
          >
            {saving ? 'Guardando...' : esEdicion ? 'Guardar cambios' : 'Crear plantilla'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Diálogo de confirmación de reemplazo ── */}
      <Dialog open={pendingHeaders !== null} onClose={() => setPendingHeaders(null)} maxWidth="xs">
        <DialogTitle>Reemplazar filas existentes</DialogTitle>
        <DialogContent>
          <DialogContentText>
            El formulario ya tiene {filas.filter(f => f.nombreColumnaArchivo.trim() || f.campoStaging).length} fila{filas.length !== 1 ? 's' : ''} definida{filas.length !== 1 ? 's' : ''}.
            El archivo seleccionado tiene <strong>{pendingHeaders?.length ?? 0} columna{(pendingHeaders?.length ?? 0) !== 1 ? 's' : ''}</strong>.
            ¿Reemplazar todo el mapeo actual con las columnas del archivo?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPendingHeaders(null)}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={() => pendingHeaders && aplicarImportacion(pendingHeaders)}
          >
            Reemplazar
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
