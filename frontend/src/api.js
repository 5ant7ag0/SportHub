import axios from 'axios';

// Usamos el proxy de Vite en desarrollo o directamente la URL relativa para que la IP del origen de la red sea válida (evitando CORS complex setup)
const getBaseURL = () => {
    // Si estamos en localhost (Mac), usamos localhost. De lo contrario (iPhone), usamos la IP local.
    if (typeof window !== 'undefined') {
        const hostname = window.location.hostname;
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            return 'http://localhost:8000/api';
        }
    }
    return 'http://192.168.70.5:8000/api';
};

export const api = axios.create({
    baseURL: getBaseURL()
});

// Interceptor para inyectar automáticamente el token JWT en las peticiones Protegidas
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('access_token');
        // Usamos nuestro Bearer JWT que interactúa nativamente con MongoEngine
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);
