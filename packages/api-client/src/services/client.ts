// API Client Abstraction & Axios Interceptors
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors?: string[];
}

let customBaseUrl: string | null = null;

export const setApiBaseUrl = (url: string): void => {
  customBaseUrl = url;
  axiosClient.defaults.baseURL = url;
};

export const getApiBaseUrl = (): string => {
  if (customBaseUrl) return customBaseUrl;
  try {
    const globalObj = typeof globalThis !== 'undefined' ? (globalThis as any) : {};
    const win = typeof window !== 'undefined' ? (window as any) : {};
    const env = globalObj?.process?.env || win?.__ENV__ || {};
    const envUrl = env.VITE_API_BASE_URL || env.VITE_API_URL || env.EXPO_PUBLIC_API_BASE_URL;
    if (envUrl) return envUrl;
  } catch {
    // Ignore env error
  }

  return 'http://localhost:5000/api/v1';
};

export const API_CONFIG = {
  get baseURL(): string {
    return getApiBaseUrl();
  },
  set baseURL(url: string) {
    setApiBaseUrl(url);
  },
};

export const TOKEN_STORAGE_KEY = 'ticketshield_token';
export const REFRESH_TOKEN_STORAGE_KEY = 'ticketshield_refresh_token';
export const UNAUTHORIZED_EVENT = 'ticketshield:unauthorized';

export interface TokenStorageAdapter {
  getToken: () => Promise<string | null> | string | null;
  getRefreshToken: () => Promise<string | null> | string | null;
  setTokens: (accessToken?: string, refreshToken?: string) => Promise<void> | void;
  clearTokens: () => Promise<void> | void;
}

export const defaultWebTokenAdapter: TokenStorageAdapter = {
  getToken: () => {
    try {
      return typeof window !== 'undefined' && window.localStorage
        ? localStorage.getItem(TOKEN_STORAGE_KEY)
        : null;
    } catch {
      return null;
    }
  },
  getRefreshToken: () => {
    try {
      return typeof window !== 'undefined' && window.localStorage
        ? localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY)
        : null;
    } catch {
      return null;
    }
  },
  setTokens: (accessToken, refreshToken) => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        if (accessToken) localStorage.setItem(TOKEN_STORAGE_KEY, accessToken);
        if (refreshToken) localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, refreshToken);
      }
    } catch {
      // Ignore storage error
    }
  },
  clearTokens: () => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.removeItem(TOKEN_STORAGE_KEY);
        localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
      }
    } catch {
      // Ignore storage error
    }
  },
};

let currentTokenAdapter: TokenStorageAdapter = defaultWebTokenAdapter;

export const setTokenAdapter = (adapter: TokenStorageAdapter): void => {
  currentTokenAdapter = adapter;
};

export const getTokenAdapter = (): TokenStorageAdapter => {
  return currentTokenAdapter;
};

type UnauthorizedListener = () => void;
const unauthorizedListeners = new Set<UnauthorizedListener>();

export const onUnauthorized = (listener: UnauthorizedListener): (() => void) => {
  unauthorizedListeners.add(listener);
  return () => {
    unauthorizedListeners.delete(listener);
  };
};

export const notifyUnauthorized = (): void => {
  unauthorizedListeners.forEach((listener) => {
    try {
      listener();
    } catch (err) {
      console.error('Error in onUnauthorized listener:', err);
    }
  });

  if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
    try {
      window.dispatchEvent(new CustomEvent(UNAUTHORIZED_EVENT));
    } catch {
      // Ignore
    }
  }
};

// Create central Axios client
export const axiosClient = axios.create({
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Inject Bearer Token
axiosClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    if (!config.baseURL) {
      config.baseURL = API_CONFIG.baseURL;
    }
    const token = await currentTokenAdapter.getToken();
    if (token && (!config.headers.Authorization || config.headers.Authorization === 'Bearer null')) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Silent Refresh Token handling on 401
interface FailedQueueItem {
  resolve: (token: string) => void;
  reject: (error: any) => void;
}

let isRefreshingToken = false;
let failedQueue: FailedQueueItem[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else if (token) {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

axiosClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiResponse<any>>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (!originalRequest) {
      return Promise.reject(error);
    }

    const status = error.response?.status;
    const url = originalRequest.url || '';

    // Bypass silent refresh if error originates from refresh-token, login, or register
    const isAuthEndpoint =
      url.includes('/auth/refresh-token') ||
      url.includes('/auth/login') ||
      url.includes('/auth/register');

    if (status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      if (isRefreshingToken) {
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return axiosClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshingToken = true;

      const refreshToken = await currentTokenAdapter.getRefreshToken();

      if (!refreshToken) {
        isRefreshingToken = false;
        await currentTokenAdapter.clearTokens();
        notifyUnauthorized();
        return Promise.reject(error);
      }

      try {
        const refreshUrl = `${API_CONFIG.baseURL}/auth/refresh-token`;
        const response = await axios.post<ApiResponse<{ accessToken?: string; token?: string; refreshToken?: string }>>(
          refreshUrl,
          { refreshToken },
          { headers: { 'Content-Type': 'application/json' } }
        );

        const resData = response.data;
        if (resData && resData.success && resData.data) {
          const newAccessToken = resData.data.accessToken || resData.data.token;
          const newRefreshToken = resData.data.refreshToken;

          await currentTokenAdapter.setTokens(newAccessToken, newRefreshToken);

          if (newAccessToken) {
            axiosClient.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            processQueue(null, newAccessToken);
            isRefreshingToken = false;
            return axiosClient(originalRequest);
          }
        }

        throw new Error('Mã refresh-token không hợp lệ hoặc đã hết hạn');
      } catch (refreshError) {
        processQueue(refreshError, null);
        isRefreshingToken = false;
        await currentTokenAdapter.clearTokens();
        notifyUnauthorized();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

const parseApiResponseErrorMessage = (data: ApiResponse<any>, defaultMessage?: string): string => {
  const rawData = data as any;
  const errors = data?.errors || rawData?.Errors;
  const message = data?.message || rawData?.Message;

  if (errors) {
    if (Array.isArray(errors) && errors.length > 0) {
      return errors.join(', ');
    }
    if (typeof errors === 'object' && errors !== null) {
      const messages = Object.values(errors).flat().filter(Boolean);
      if (messages.length > 0) return messages.join(', ');
    }
  }
  return message || defaultMessage || 'Đã xảy ra lỗi không xác định.';
};

export async function httpClient<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = endpoint.startsWith('http') ? endpoint : `${API_CONFIG.baseURL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  try {
    let requestData: any = undefined;
    if (options.body) {
      if (typeof options.body === 'string') {
        try {
          requestData = JSON.parse(options.body);
        } catch {
          requestData = options.body;
        }
      } else {
        requestData = options.body;
      }
    }

    const response = await axiosClient.request<ApiResponse<T>>({
      url,
      method: (options.method || 'GET') as any,
      data: requestData,
      headers,
    });

    const data = response.data;
    if (!data.success) {
      throw new Error(parseApiResponseErrorMessage(data, `Request failed with status ${response.status}`));
    }

    return data.data;
  } catch (err: any) {
    if (axios.isAxiosError(err) && err.response?.data) {
      const resData = err.response.data as ApiResponse<T>;
      const error = new Error(parseApiResponseErrorMessage(resData, err.message || `Request failed with status ${err.response.status}`));
      (error as any).response = err.response;
      (error as any).status = err.response.status;
      throw error;
    }
    throw err;
  }
}
