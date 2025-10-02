export default interface TipoCredito {
  codigo: number;
  descripcion: string; // Máximo 100 caracteres
  descripcionDetallada?: string | null;
}