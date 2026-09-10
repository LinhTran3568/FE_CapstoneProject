import { User } from '@ticketshield/types';
import { LoginFormData, RegisterFormData } from '@ticketshield/validation';

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
}

export const authApi = {
  login: async (credentials: LoginFormData): Promise<AuthResponse> => {
    return {
      user: {
        id: 'usr-1',
        email: credentials.email,
        fullName: 'User',
        phoneNumber: '',
        role: 'BUYER',
        isVerified: true,
        kycStatus: 'VERIFIED',
        createdAt: new Date().toISOString(),
      },
      token: 'jwt-access-token',
      refreshToken: 'jwt-refresh-token',
    };
  },

  register: async (data: RegisterFormData): Promise<AuthResponse> => {
    const newUser: User = {
      id: `usr-${Date.now()}`,
      email: data.email,
      fullName: data.fullName,
      phoneNumber: data.phoneNumber,
      role: data.role,
      isVerified: false,
      kycStatus: 'PENDING',
      createdAt: new Date().toISOString(),
    };
    return {
      user: newUser,
      token: `jwt-token-${Date.now()}`,
      refreshToken: `jwt-refresh-${Date.now()}`,
    };
  },

  logout: async (): Promise<void> => {},
};

