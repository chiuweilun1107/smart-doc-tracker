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

    console.log('🔐 API Request Interceptor:', {
        url: config.url,
        hasSession: !!session,
        hasToken: !!session?.access_token,
        tokenPreview: session?.access_token ? session.access_token.substring(0, 20) + '...' : 'No token'
    });

    if (session?.access_token) {
        config.headers.Authorization = `Bearer ${session.access_token}`;
    } else {
        console.warn('⚠️ No session token available!');
    }

    return config;
}, (error) => {
    return Promise.reject(error);
});

// Interceptor to handle 401 responses - Let middleware handle redirects
// Removed automatic redirect to prevent infinite loops with middleware
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            console.error('🔒 Authentication failed:', {
                url: error.config?.url,
                status: error.response?.status,
                message: error.response?.data?.detail || 'Unauthorized'
            });
            // Let the middleware handle redirects instead of doing it here
        }
        return Promise.reject(error);
    }
);
