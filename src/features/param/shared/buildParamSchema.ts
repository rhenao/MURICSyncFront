import * as yup from "yup";
import type { ColumnConfig, Row } from "./columnConfig";
import type { KeyType } from "../services/ParamCrudService";

export interface KeyConfig {
  keyField: string;
  keyType: KeyType;
  keyMaxLength?: number;
}

// "" (campo vacío o solo espacios en el formulario) se trata como "sin valor".
const vacioANulo = (value: unknown, original: unknown) =>
  value === "" || original === "" || original == null ? null : value;

function keySchema(label: string, { keyType, keyMaxLength }: KeyConfig): yup.Schema {
  if (keyType === "number") {
    return yup
      .number()
      .transform(vacioANulo)
      .nullable()
      .typeError(`El campo ${label} debe ser un número.`)
      .required(`El campo ${label} es requerido.`)
      .integer(`El campo ${label} debe ser un número entero.`)
      .min(1, `El campo ${label} debe ser mayor que cero.`);
  }
  let schema = yup.string().trim().required(`El campo ${label} es requerido.`);
  if (keyMaxLength != null) {
    schema = schema.max(keyMaxLength, `El campo ${label} no puede superar ${keyMaxLength} caracteres.`);
  }
  return schema;
}

function fieldSchema(col: ColumnConfig): yup.Schema {
  const label = col.header;
  const required = col.required ?? true;

  if (col.fieldType === "select" && col.options) {
    const valores = col.options.map((o) => o.value);
    const schema = yup
      .mixed<string | number>()
      .transform(vacioANulo)
      .nullable()
      .oneOf([...valores, null], `El valor de ${label} no es válido.`);
    return required ? schema.required(`El campo ${label} es requerido.`) : schema;
  }

  if (col.fieldType === "number") {
    const schema = yup
      .number()
      .transform(vacioANulo)
      .nullable()
      .typeError(`El campo ${label} debe ser un número.`);
    return required ? schema.required(`El campo ${label} es requerido.`) : schema;
  }

  // "text" y "multiline"
  let schema = yup.string().trim().transform(vacioANulo).nullable();
  if (col.maxLength != null) {
    schema = schema.max(col.maxLength, `El campo ${label} no puede superar ${col.maxLength} caracteres.`);
  }
  return required ? schema.required(`El campo ${label} es requerido.`) : schema;
}

/**
 * Esquema yup del formulario de una tabla de param. La clave siempre se incluye, aunque no
 * esté en `columns`; si está, su configuración de clave (keyType/keyMaxLength) tiene prioridad.
 */
export function buildParamSchema(columns: ColumnConfig[], key: KeyConfig) {
  const keyColumn = columns.find((c) => c.accessorKey === key.keyField);
  const shape: yup.ObjectShape = {
    [key.keyField]: keySchema(keyColumn?.header ?? key.keyField, key),
  };
  for (const col of columns) {
    if (col.accessorKey === key.keyField || col.hideInForm) continue;
    shape[col.accessorKey] = fieldSchema(col);
  }
  return yup.object(shape);
}

export type ResultadoValidacion =
  | { ok: true; valores: Row }
  | { ok: false; errores: Record<string, string> };

/**
 * Valida y convierte los valores del formulario. Si es válido, `valores` es el payload listo
 * para enviar: textos recortados, números como number y campos vacíos opcionales en null.
 * Si no, `errores` trae el primer mensaje de cada campo.
 */
export async function validarFormulario(
  schema: yup.ObjectSchema<yup.AnyObject>,
  valores: Row
): Promise<ResultadoValidacion> {
  try {
    const casted = await schema.validate(valores, { abortEarly: false, stripUnknown: true });
    return { ok: true, valores: casted as Row };
  } catch (err) {
    if (!(err instanceof yup.ValidationError)) throw err;
    const errores: Record<string, string> = {};
    for (const e of err.inner.length ? err.inner : [err]) {
      if (e.path && !errores[e.path]) errores[e.path] = e.message;
    }
    return { ok: false, errores };
  }
}
