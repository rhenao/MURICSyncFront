export default interface GrupoEtnico {
  codigo: number;
  descripcion: string; // Máximo 100 caracteres
  descripcionDetallada?: string | null;
}