// Propiedades en PascalCase, tal como las devuelve el API OData (/CatalogoAtributos, solo consulta).
export default interface CatalogoAtributos {
  Codigo: number; // 1–40, enum clave_a del esquema AVRO
  Nombre: string;
  Descripcion: string | null; // instrucción de diligenciamiento de la SFC
  Naturaleza: "Obligatorio" | "Sólo si es aplicable";
  Repetible: boolean; // la SFC permite reportarlo varias veces por crédito (18, 29 a 32 y 36)
  CatalogoValor: string | null; // entity set OData con los valores válidos, p. ej. "SexoBiologico"
}

/** Atributos de pólizas: con varias pólizas, el valor se reporta como `P{n}_valor`. */
export const ATRIBUTOS_POLIZA = [29, 30, 31, 32];
