export default interface AntiguedadEmpresa {
  codigo: number;
  descripcion: string; // Máximo 100 caracteres
  descripcionDetallada?: string | null;
}