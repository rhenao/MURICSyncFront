import { getAuditContextHeaders } from './auditHeaders';

// fetch nativo contra la API de Security con el mismo manejo de sesión que axiosSecurityAPIClient.
// Se usa donde axios no conviene: subidas multipart (el navegador pone el boundary) y descargas.

const cerrarSesion = (): never => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('tokenExpiry');
  window.location.href = '/login';
  throw new Error('La sesión expiró. Inicie sesión de nuevo.');
};

/** `path` es relativo a VITE_API_URL_SECURITY, p. ej. `/cargas/5/archivos`. */
export async function fetchConToken(path: string, init: RequestInit = {}): Promise<Response> {
  const token = localStorage.getItem('token');
  const expiry = localStorage.getItem('tokenExpiry');
  if (token && (!expiry || new Date() >= new Date(expiry))) cerrarSesion();

  const headers = new Headers(init.headers);
  const audit = getAuditContextHeaders();
  headers.set('X-Timezone', audit['X-Timezone']);
  headers.set('X-Screen-Size', audit['X-Screen-Size']);
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const res = await fetch(`${import.meta.env.VITE_API_URL_SECURITY}${path}`, { ...init, headers });
  if (res.status === 401 || res.status === 403) cerrarSesion();
  return res;
}
