import { User } from '@ticketshield/types';
import { LoginFormData, RegisterFormData } from '@ticketshield/validation';
import { httpClient, TOKEN_STORAGE_KEY } from './client';

export interface BackendAuthResult {
  userId: string;
  email: string;
  fullName: string;
  role: string;
  token: string;
}

export interface BackendUserProfile {
  userId: string;
  email: string;
  fullName: string;
  phoneNumber?: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

const mapBackendUserToFE = (dto: BackendAuthResult | BackendUserProfile): User => ({
  id: dto.userId,
  email: dto.email,
  fullName: dto.fullName,
  phoneNumber: (dto as BackendUserProfile).phoneNumber || '',
  role: (dto.role as any) || 'BUYER',
  isVerified: true,
  kycStatus: 'VERIFIED',
  createdAt: (dto as BackendUserProfile).createdAt || new Date().toISOString(),
});

export const authApi = {
  login: async (credentials: LoginFormData): Promise<AuthResponse> => {
    const result = await httpClient<BackendAuthResult>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: credentials.email,
        password: credentials.password,
      }),
    });

    if (typeof window !== 'undefined' && result.token) {
      localStorage.setItem(TOKEN_STORAGE_KEY, result.token);
    }

    return {
      user: mapBackendUserToFE(result),
      token: result.token,
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

    if (typeof window !== 'undefined' && result.token) {
      localStorage.setItem(TOKEN_STORAGE_KEY, result.token);
    }

    return {
      user: mapBackendUserToFE(result),
      token: result.token,
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

    if (typeof window !== 'undefined' && result.token) {
      localStorage.setItem(TOKEN_STORAGE_KEY, result.token);
    }

    return {
      user: mapBackendUserToFE(result),
      token: result.token,
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

  logout: async (): Promise<void> => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  },
};
