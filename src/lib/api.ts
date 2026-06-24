import axios from 'axios';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/auth';

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use((config) => {
    // We could get token from localStorage or Zustand state
    const token = useAuthStore.getState().token;
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (!error.response) {
            toast.error("Network Error: Cannot connect to the server.");
            return Promise.reject(error);
        }

        const status = error.response.status;
        const data = error.response.data;

        if (status === 401) {
            // Token expired or invalid
            // toast.error("Sesi Anda telah berakhir. Silakan login kembali."); // Temporarily disabled for UI development
            useAuthStore.getState().logout();
            // Assuming Next.js middleware handles the redirect based on auth state, or we do it here
            if (typeof window !== 'undefined') {
                // window.location.href = '/login'; // Temporarily disabled for UI development
            }
        } else if (status >= 500) {
            toast.error("Server Error: " + (data.error || "Terjadi kesalahan internal."));
        } else if (status >= 400) {
            toast.error("Error: " + (data.error || "Permintaan tidak valid."));
        }

        return Promise.reject(error);
    }
);

export default api;
