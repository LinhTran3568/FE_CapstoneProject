import { User } from '@ticketshield/types';
import { LoginFormData, RegisterFormData } from '@ticketshield/validation';
import { httpClient, TOKEN_STORAGE_KEY, REFRESH_TOKEN_STORAGE_KEY } from './client';

export interface BackendAuthResult {
  userId?: string;
  email?: string;
  fullName?: string;
  role?: string;
  token?: string;
  accessToken?: string;
  refreshToken?: string;
  user?: BackendUserProfile;
}

export interface BackendUserProfile {
  userId?: string;
  id?: string;
  email: string;
  fullName: string;
  phoneNumber?: string;
  idCardNumber?: string;
  role: string;
  isActive?: boolean;
  createdAt?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken?: string;
}

const mapBackendUserToFE = (dto: BackendAuthResult | BackendUserProfile): User => {
  const profile = (dto as BackendAuthResult).user || (dto as BackendUserProfile);
  const userId = profile.userId || (dto as BackendAuthResult).userId || '';
  const email = profile.email || (dto as BackendAuthResult).email || '';
  const fullName = profile.fullName || (dto as BackendAuthResult).fullName || '';
  const role = profile.role || (dto as BackendAuthResult).role || 'BUYER';
  const phoneNumber = profile.phoneNumber || '';
  const createdAt = profile.createdAt || new Date().toISOString();

  return {
    id: userId,
    email,
    fullName,
    phoneNumber,
    role: (role as any) || 'BUYER',
    isVerified: true,
    kycStatus: 'VERIFIED',
    createdAt,
  };
};

const storeTokens = (accessToken?: string, refreshToken?: string) => {
  if (typeof window !== 'undefined') {
    if (accessToken) {
      localStorage.setItem(TOKEN_STORAGE_KEY, accessToken);
    }
    if (refreshToken) {
      localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, refreshToken);
    }
  }
};

export const authApi = {
  login: async (credentials: LoginFormData): Promise<AuthResponse> => {
    const result = await httpClient<BackendAuthResult>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: credentials.email,
        password: credentials.password,
      }),
    });

    const accessToken = result.accessToken || result.token || '';
    const refreshToken = result.refreshToken || '';

    storeTokens(accessToken, refreshToken);

    return {
      user: mapBackendUserToFE(result),
      token: accessToken,
      refreshToken,
    };
  },

  register: async (data: RegisterFormData): Promise<AuthResponse> => {
    const result = await httpClient<BackendAuthResult>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: data.email,
        password: data.password,
        fullName: data.fullName,
        phoneNumber: data.phoneNumber,
      }),
    });

    const accessToken = result.accessToken || result.token || '';
    const refreshToken = result.refreshToken || '';

    storeTokens(accessToken, refreshToken);

    return {
      user: mapBackendUserToFE(result),
      token: accessToken,
      refreshToken,
    };
  },

  getCurrentUser: async (): Promise<User> => {
    const result = await httpClient<BackendUserProfile>('/auth/me', {
      method: 'GET',
    });
    return mapBackendUserToFE(result);
  },

  googleLogin: async (idToken: string): Promise<AuthResponse> => {
    const result = await httpClient<BackendAuthResult>('/auth/google', {
      method: 'POST',
      body: JSON.stringify({ idToken }),
    });

    const accessToken = result.accessToken || result.token || '';
    const refreshToken = result.refreshToken || '';

    storeTokens(accessToken, refreshToken);

    return {
      user: mapBackendUserToFE(result),
      token: accessToken,
      refreshToken,
    };
  },

  refreshToken: async (refreshToken: string): Promise<AuthResponse> => {
    const result = await httpClient<BackendAuthResult>('/auth/refresh-token', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });

    const accessToken = result.accessToken || result.token || '';
    const newRefreshToken = result.refreshToken || refreshToken;

    storeTokens(accessToken, newRefreshToken);

    return {
      user: mapBackendUserToFE(result),
      token: accessToken,
      refreshToken: newRefreshToken,
    };
  },

  forgotPassword: async (email: string): Promise<string> => {
    return await httpClient<string>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  resetPassword: async (data: { email: string; otp: string; newPassword: string }): Promise<string> => {
    return await httpClient<string>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({
        email: data.email,
        otp: data.otp,
        newPassword: data.newPassword,
      }),
    });
  },

  updateProfile: async (data: { fullName: string; phoneNumber?: string; idCardNumber?: string }): Promise<User> => {
    const result = await httpClient<BackendUserProfile>('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return mapBackendUserToFE(result);
  },

  logout: async (): Promise<void> => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
    }
  },
};
