import axios from "axios";
import { getAuditContextHeaders } from './auditHeaders';

const axiosOdataAPIClient = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Función para obtener el token del localStorage
const obtenerToken = (): string | null => {
    return localStorage.getItem('token');
};

// Función para obtener la expiración del token
const obtenerExpiracionToken = (): Date | null => {
    const expiry = localStorage.getItem('tokenExpiry');
    return expiry ? new Date(expiry) : null;
};

// Función para verificar si el token está expirado
const tokenExpirado = (): boolean => {
    const expiry = obtenerExpiracionToken();
    return expiry ? new Date() >= expiry : true;
};

// Función para limpiar datos de autenticación
const limpiarAutenticacion = (): void => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('tokenExpiry');
};

// Interceptor para agregar el token a todas las peticiones
axiosOdataAPIClient.interceptors.request.use(
    (config) => {
        const auditHeaders = getAuditContextHeaders();
        config.headers['X-Timezone'] = auditHeaders['X-Timezone'];
        config.headers['X-Screen-Size'] = auditHeaders['X-Screen-Size'];

        const token = obtenerToken();

        if (token && !tokenExpirado()) {
            config.headers.Authorization = `Bearer ${token}`;
        } else if (token && tokenExpirado()) {
            // Si el token existe pero está expirado, limpiar y redirigir
            limpiarAutenticacion();
            window.location.href = '/login';
            return Promise.reject(new Error('Token expirado'));
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Interceptor para manejar respuestas de error
axiosOdataAPIClient.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        // Manejar errores de autenticación (401, 403)
        if (error.response?.status === 401 || error.response?.status === 403) {
            limpiarAutenticacion();
            window.location.href = '/login';
        }
        
        return Promise.reject(error);
    }
);

export default axiosOdataAPIClient;