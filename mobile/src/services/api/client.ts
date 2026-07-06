import axios from 'axios';
import { ENV } from '../../config/env';
import { useAuthStore } from '../../store/authStore';
import { saveTokens, clearTokens, getRefreshToken } from '../auth/tokenService';
export const apiClient = axios.create({ baseURL: ENV.API_URL, timeout: 15000 });
apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
let refreshPromise: Promise<string> | null = null;
apiClient.interceptors.response.use(null, async (error) => {
  const original = error.config;
  if (error.response?.status === 401 && !original._retry) {
    original._retry = true;
    try {
      if (!refreshPromise) {
        refreshPromise = (async () => {
          const rt = await getRefreshToken();
          if (!rt) throw new Error('no refresh token');
          const { data } = await axios.post(`${ENV.API_URL}/api/auth/refresh`, { refreshToken: rt });
          await saveTokens(data.accessToken, data.refreshToken);
          useAuthStore.getState().setTokens(data.accessToken, data.refreshToken);
          return data.accessToken;
        })().finally(() => { refreshPromise = null; });
      }
      const newToken = await refreshPromise;
      original.headers.Authorization = `Bearer ${newToken}`;
      return apiClient(original);
    } catch {
      await clearTokens();
      useAuthStore.getState().clearAuth();
    }
  }
  return Promise.reject(error);
});
