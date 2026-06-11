import axiosSecurityAPIClient from '../../../api/axiosSecurityAPIClient';
import { AxiosError } from 'axios';
import type AuthResponseDto from '../models/AuthResponseDto';
import type { UserInfoDto } from '../models/UserInfoDto';

export interface LoginRequest {
  username: string;
  password: string;
  rememberMe?: boolean;
}

class AuthService {
  private decodeTokenPermissions(token: string): string[] {
    try {
      const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
      const raw = payload['permission'];
      if (!raw) return [];
      return Array.isArray(raw) ? raw : [raw];
    } catch {
      return [];
    }
  }

  async login(credentials: LoginRequest): Promise<AuthResponseDto> {
    console.log("🔌 Iniciando petición de login con axiosSecurityAPIClient...");
    console.log("🔌 URL:", `${import.meta.env.VITE_API_URL_SECURITY}/auth/login`);
    
    try {
      const response = await axiosSecurityAPIClient.post<AuthResponseDto>(
        '/auth/login',
        {
          email: credentials.username,
          password: credentials.password,
          rememberMe: credentials.rememberMe
        }
      );
      
      console.log("📥 Respuesta exitosa del servidor:", response.data);
      
      if (response.data.success && response.data.token) {
        console.log("💾 Guardando datos en localStorage...");
        const permissions = this.decodeTokenPermissions(response.data.token);
        const user = response.data.user ? { ...response.data.user, permissions } : response.data.user;
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('tokenExpiry', response.data.expiresAt || '');
        response.data.user = user;
      }
      
      return response.data;
    } catch (error: unknown) {
      console.error("❌ Error en AuthService.login:", error);
      
      if (error instanceof AxiosError) {
        console.error("❌ AxiosError details:");
        console.error("   Status:", error.response?.status);
        console.error("   Data:", error.response?.data);
        console.error("   URL:", error.config?.url);
        
        if (error.response?.data) {
          console.log("🔄 Retornando error del servidor:", error.response.data);
          return error.response.data as AuthResponseDto;
        }
      }
      
      console.log("🔄 Retornando error genérico");
      return {
        success: false,
        errors: ['Error de conexión. Verifique su conexión a internet.']
      };
    }
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('tokenExpiry');
  }

  isAuthenticated(): boolean {
    const token = localStorage.getItem('token');
    const expiry = localStorage.getItem('tokenExpiry');
    
    if (!token || !expiry) return false;
    
    return new Date() < new Date(expiry);
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  getUser(): UserInfoDto | null {
    const user = localStorage.getItem('user');
    if (!user) return null;
    
    try {
      return JSON.parse(user) as UserInfoDto;
    } catch (error) {
      console.error('Error parsing user data from localStorage:', error);
      return null;
    }
  }
}

export default new AuthService();