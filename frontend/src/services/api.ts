import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

/**
 * Instância Axios principal.
 * - withCredentials: envia cookies httpOnly em cada requisição
 * - O access token fica em memória (sessionStorage como fallback leve),
 *   nunca em localStorage — protege contra XSS persistente.
 */
export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true, // envia cookies httpOnly (refresh token)
});

// Access token em memória — desaparece ao fechar a aba
let inMemoryAccessToken: string | null = sessionStorage.getItem('vext_access_token');

export function setAccessToken(token: string | null) {
  inMemoryAccessToken = token;
  if (token) sessionStorage.setItem('vext_access_token', token);
  else sessionStorage.removeItem('vext_access_token');
}

export function getAccessToken() {
  return inMemoryAccessToken;
}

// Fila de requisições aguardando refresh
let isRefreshing = false;
let failedQueue: Array<{ resolve: (token: string) => void; reject: (error: any) => void }> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((p) => { if (error) p.reject(error); else p.resolve(token!); });
  failedQueue = [];
};

// REQUEST: injeta Bearer token da memória
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getAccessToken();
    if (token && config.headers) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// RESPONSE: auto-refresh em 401
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<{ message?: string }>) => {
    const originalRequest = error.config as any;
    originalRequest._retryCount = originalRequest._retryCount ?? 0;

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      originalRequest._retryCount < 1 &&
      !originalRequest.url?.includes('/auth/login') &&
      !originalRequest.url?.includes('/auth/refresh') &&
      !originalRequest.url?.includes('/auth/logout')
    ) {
      originalRequest._retry = true;
      originalRequest._retryCount += 1;

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: (token) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              resolve(api(originalRequest));
            },
            reject,
          });
        });
      }

      isRefreshing = true;

      try {
        // Refresh token enviado via httpOnly cookie (withCredentials)
        const { data } = await axios.post(
          `${API_BASE_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        );

        const newAccessToken = data.data.accessToken;
        setAccessToken(newAccessToken);
        processQueue(null, newAccessToken);

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        setAccessToken(null);
        sessionStorage.removeItem('vext_user');
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export function extractData<T>(response: { data: { success: boolean; data: T } }): T {
  return response.data.data;
}

export function extractPaginated<T>(response: { data: { success: boolean; data: T[]; pagination: any } }) {
  return { data: response.data.data, pagination: response.data.pagination };
}
