export default interface ProductoCredito {
  codigo: number;
  tipo: string; // Máximo 100 caracteres
  descripcion: string; // Máximo 100 caracteres
  descripcionDetallada?: string | null;
}