export default interface ClaseDeDeudor {
  codigo: number;
  descripcion: string; // Máximo 100 caracteres
  descripcionDetallada?: string | null;
}