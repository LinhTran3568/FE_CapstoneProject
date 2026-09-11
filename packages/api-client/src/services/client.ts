// API Client Abstraction & Helpers

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors?: string[];
}

const getBaseUrl = (): string => {
  if (typeof window !== 'undefined') {
    const viteUrl = (import.meta as any)?.env?.VITE_API_BASE_URL;
    if (viteUrl) return viteUrl;
  }
  return 'http://localhost:5000/api/v1';
};

export const API_CONFIG = {
  baseURL: getBaseUrl(),
};

export const TOKEN_STORAGE_KEY = 'ticketshield_token';

export async function httpClient<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem(TOKEN_STORAGE_KEY) : null;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = endpoint.startsWith('http') ? endpoint : `${API_CONFIG.baseURL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers,
  });

  let data: ApiResponse<T>;
  try {
    data = await response.json();
  } catch (err) {
    if (!response.ok) {
      throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
    }
    throw new Error('Lỗi phản hồi dữ liệu từ hệ thống (Invalid JSON response)');
  }

  if (!response.ok || !data.success) {
    const errorMsg =
      data.errors && data.errors.length > 0
        ? data.errors.join(', ')
        : data.message || `Request failed with status ${response.status}`;
    throw new Error(errorMsg);
  }

  return data.data;
}
