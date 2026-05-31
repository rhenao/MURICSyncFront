export type InsumoMURIC = '001-001' | '001-002' | '001-003';

export interface CampoInsumo {
  campo: string;
  etiqueta: string;
  obligatorio: boolean;
}

export const INSUMO_LABELS: Record<InsumoMURIC, string> = {
  '001-001': 'MURIC-001-001 — Información general de créditos',
  '001-002': 'MURIC-001-002 — Atributos de créditos y deudores',
  '001-003': 'MURIC-001-003 — Movimientos de cartera',
};

export const INSUMO_LABELS_CORTO: Record<InsumoMURIC, string> = {
  '001-001': '001-001 Créditos',
  '001-002': '001-002 Atributos',
  '001-003': '001-003 Movimientos',
};

export const CAMPOS_POR_INSUMO: Record<InsumoMURIC, CampoInsumo[]> = {
  '001-001': [
    { campo: 'identificacion_credito_entidad', etiqueta: 'Identificación Crédito Entidad', obligatorio: true },
    { campo: 'identificacion_negocio_vehiculo_universalidad', etiqueta: 'Identificación Negocio / Vehículo / Universalidad', obligatorio: false },
    { campo: 'tipo_identificacion', etiqueta: 'Tipo Identificación', obligatorio: true },
    { campo: 'numero_identificacion', etiqueta: 'Número Identificación', obligatorio: true },
    { campo: 'modalidad', etiqueta: 'Modalidad', obligatorio: true },
    { campo: 'codigo_producto', etiqueta: 'Código Producto', obligatorio: true },
    { campo: 'calidad_deudor', etiqueta: 'Calidad Deudor', obligatorio: true },
    { campo: 'fecha_desembolso', etiqueta: 'Fecha Desembolso', obligatorio: true },
    { campo: 'fecha_vencimiento', etiqueta: 'Fecha Vencimiento', obligatorio: false },
    { campo: 'valor_desembolsado', etiqueta: 'Valor Desembolsado', obligatorio: true },
    { campo: 'frecuencia_pago_capital', etiqueta: 'Frecuencia Pago Capital', obligatorio: false },
    { campo: 'frecuencia_pago_intereses', etiqueta: 'Frecuencia Pago Intereses', obligatorio: false },
    { campo: 'tipo_tasa', etiqueta: 'Tipo Tasa', obligatorio: true },
    { campo: 'tipo_garantia', etiqueta: 'Tipo Garantía', obligatorio: true },
    { campo: 'moneda', etiqueta: 'Moneda', obligatorio: true },
    { campo: 'marco_legal', etiqueta: 'Marco Legal', obligatorio: false },
  ],
  '001-002': [
    { campo: 'identificacion_credito_entidad', etiqueta: 'Identificación Crédito Entidad', obligatorio: true },
    { campo: 'tipo_identificacion', etiqueta: 'Tipo Identificación', obligatorio: true },
    { campo: 'numero_identificacion', etiqueta: 'Número Identificación', obligatorio: true },
    { campo: 'clave_atributo', etiqueta: 'Clave Atributo', obligatorio: true },
    { campo: 'valor_atributo', etiqueta: 'Valor Atributo', obligatorio: true },
  ],
  '001-003': [
    { campo: 'identificacion_credito_entidad', etiqueta: 'Identificación Crédito Entidad', obligatorio: true },
    { campo: 'tipo_identificacion', etiqueta: 'Tipo Identificación', obligatorio: true },
    { campo: 'numero_identificacion', etiqueta: 'Número Identificación', obligatorio: true },
    { campo: 'calificacion_credito', etiqueta: 'Calificación Crédito', obligatorio: false },
    { campo: 'estado', etiqueta: 'Estado', obligatorio: true },
    { campo: 'periodo_gracia', etiqueta: 'Período Gracia', obligatorio: true },
    { campo: 'dias_mora', etiqueta: 'Días Mora', obligatorio: true },
    { campo: 'tasa_interes', etiqueta: 'Tasa Interés', obligatorio: true },
    { campo: 'spread_tasa_interes', etiqueta: 'Spread Tasa Interés', obligatorio: true },
    { campo: 'saldo_capital', etiqueta: 'Saldo Capital', obligatorio: true },
    { campo: 'saldo_intereses', etiqueta: 'Saldo Intereses', obligatorio: true },
    { campo: 'saldo_otros', etiqueta: 'Saldo Otros', obligatorio: true },
    { campo: 'modelo_provisiones', etiqueta: 'Modelo Provisiones', obligatorio: true },
    { campo: 'provision_prociclica', etiqueta: 'Provisión Procíclica', obligatorio: true },
    { campo: 'provision_contraciclica', etiqueta: 'Provisión Contracíclica', obligatorio: true },
    { campo: 'provision_adicional_politica_entidad', etiqueta: 'Provisión Adicional Política Entidad', obligatorio: true },
    { campo: 'provision_otros', etiqueta: 'Provisión Otros', obligatorio: true },
    { campo: 'cuota_esperada_capital', etiqueta: 'Cuota Esperada Capital', obligatorio: false },
    { campo: 'cuota_esperada_intereses', etiqueta: 'Cuota Esperada Intereses', obligatorio: false },
    { campo: 'pago_recibido_capital', etiqueta: 'Pago Recibido Capital', obligatorio: false },
    { campo: 'pago_recibido_intereses', etiqueta: 'Pago Recibido Intereses', obligatorio: false },
    { campo: 'valor_garantia', etiqueta: 'Valor Garantía', obligatorio: true },
    { campo: 'fecha_garantia', etiqueta: 'Fecha Garantía', obligatorio: false },
    { campo: 'probabilidad_incumplimiento_credito', etiqueta: 'Probabilidad Incumplimiento Crédito', obligatorio: false },
    { campo: 'perdida_dado_incumplimiento', etiqueta: 'Pérdida Dado Incumplimiento', obligatorio: false },
  ],
};

export interface PlantillaCargaCampo {
  id?: number;
  plantillaId: number;
  nombreColumnaArchivo: string | null;
  campoStaging: string;
  valorPorDefecto: string | null;
  ordenColumna: number;
}

export interface PlantillaCarga {
  id: number;
  nombre: string;
  descripcion: string;
  insumo: InsumoMURIC;
  tipoEntidad: number;
  codigoEntidad: number;
  usuarioCreador: string;
  esActiva: boolean;
  fechaCreacion: string;
  campos: PlantillaCargaCampo[];
}

export type PlantillaInput = Omit<PlantillaCarga, 'id' | 'fechaCreacion'>;
