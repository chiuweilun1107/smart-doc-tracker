import axios from 'axios';
import { supabase } from '@/lib/supabase';

// Create generic Axios instance
export const apiClient = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor to inject Token
apiClient.interceptors.request.use(async (config) => {
    const { data: { session } } = await supabase.auth.getSession();

    if (session?.access_token) {
        config.headers.Authorization = `Bearer ${session.access_token}`;
    }

    return config;
}, (error) => {
    return Promise.reject(error);
});

// Interceptor to handle 401 responses - redirect to login
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401 && typeof window !== 'undefined') {
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);
