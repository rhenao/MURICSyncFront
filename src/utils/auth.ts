export function isAuthenticated(usuario: string): boolean {
  // Aquí deberías validar el token o estado real de autenticación
  // Por ahora, retorna false para pruebas
  return (!!usuario);
  //return !!localStorage.getItem('token');
}
