// Propiedades en PascalCase, tal como las devuelve y recibe el API OData.
export default interface Universalidades {
  Codigo: number;
  Descripcion: string; // MaxLength(100)
  Estado: "A" | "I"; // A-ctivo, I-Inactivo
}
