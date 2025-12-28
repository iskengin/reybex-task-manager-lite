// API Configuration
const API_BASE_URL = 'https://core-backend.reybex.com/api';

// Create Axios instance
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 10000,
});

// Request interceptor - Add token to requests with Basic authentication
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            // Basic authentication: use token directly without encoding
            config.headers.Authorization = `Basic ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor - Handle 401 errors
api.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        if (error.response && error.response.status === 401) {
            // Token expired or invalid
            if (typeof authService !== 'undefined' && authService.logout) {
                authService.logout();
            }
        }
        return Promise.reject(error);
    }
);

