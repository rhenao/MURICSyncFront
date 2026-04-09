import axios from "axios";

const axiosSecurityAPIClient = axios.create({
    baseURL: import.meta.env.VITE_API_URL_SECURITY,
    headers: {
        'Content-Type': 'application/json'
    }
});

console.log("🔧 axiosSecurityAPIClient configurado con baseURL:", import.meta.env.VITE_API_URL_SECURITY);

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

// Interceptor para agregar el token a todas las peticiones (EXCEPTO login)
axiosSecurityAPIClient.interceptors.request.use(
    (config) => {
        // NO agregar token si es una petición de login
        if (config.url?.includes('/auth/login')) {
            console.log("🔓 Petición de login, NO agregando token");
            return config;
        }
        
        const token = obtenerToken();
        
        if (token && !tokenExpirado()) {
            console.log("🔑 Agregando token a petición");
            config.headers.Authorization = `Bearer ${token}`;
        } else if (token && tokenExpirado()) {
            console.log("🔑 Token expirado, limpiando y redirigiendo");
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
axiosSecurityAPIClient.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        console.log("📥 Security Response interceptor - URL:", error.config?.url);
        console.log("📥 Security Response interceptor - Status:", error.response?.status);
        
        // NO redirigir automáticamente si es un error de login
        if (error.config?.url?.includes('/auth/login')) {
            console.log("🚫 Error en login, permitiendo manejo manual del error");
            return Promise.reject(error);
        }
        
        // Solo manejar errores de autenticación para otras rutas protegidas
        if (error.response?.status === 401 || error.response?.status === 403) {
            console.log("🔒 Error de autenticación en ruta protegida, limpiando y redirigiendo");
            limpiarAutenticacion();
            window.location.href = '/login';
        }
        
        return Promise.reject(error);
    }
);

export default axiosSecurityAPIClient;