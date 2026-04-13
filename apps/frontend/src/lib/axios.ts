import axios from 'axios';
import { toast } from 'sonner';
import { ENV } from '../config/env';

const api = axios.create({
  baseURL: ENV.API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Request interceptor — attach access token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor — handle token refresh, 409 conflict, and common errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;
    const serverMessage = error.response?.data?.message;

    // Handle 409 Conflict — optimistic locking failure
    if (status === 409) {
      toast.error(
        serverMessage || 'Data ini baru saja diubah oleh pengguna lain. Silakan muat ulang.',
        {
          duration: 5000,
          action: { label: 'Muat Ulang', onClick: () => window.location.reload() },
        },
      );
      return Promise.reject(error);
    }

    // Handle 403 Forbidden — permission denied
    if (status === 403) {
      toast.error('Anda tidak memiliki izin untuk melakukan aksi ini.');
      return Promise.reject(error);
    }

    // If 401 and not already retried, attempt refresh
    if (status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          throw new Error('No refresh token');
        }

        const { data } = await axios.post(`${ENV.API_BASE_URL}/auth/refresh`, {
          refreshToken,
        });

        localStorage.setItem('accessToken', data.data.accessToken);
        localStorage.setItem('refreshToken', data.data.refreshToken);

        originalRequest.headers.Authorization = `Bearer ${data.data.accessToken}`;
        return api(originalRequest);
      } catch {
        // Refresh failed — force logout
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(error);
      }
    }

    // Handle network / timeout errors
    if (!error.response) {
      toast.error('Tidak dapat terhubung ke server. Periksa koneksi internet Anda.');
      return Promise.reject(error);
    }

    return Promise.reject(error);
  },
);

export { api };
