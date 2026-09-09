import { User } from '@ticketshield/types';
import { LoginFormData, RegisterFormData } from '@ticketshield/validation';
import { MOCK_USERS } from '../mocks/users';
import { delay } from './client';

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
}

export const authApi = {
  login: async (credentials: LoginFormData): Promise<AuthResponse> => {
    await delay();
    const foundUser = MOCK_USERS.find((u) => u.email.toLowerCase() === credentials.email.toLowerCase()) || MOCK_USERS[0];
    return {
      user: foundUser,
      token: 'jwt-mock-access-token-xyz789',
      refreshToken: 'jwt-mock-refresh-token-abc123',
    };
  },

  register: async (data: RegisterFormData): Promise<AuthResponse> => {
    await delay();
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
      token: `jwt-mock-token-${Date.now()}`,
      refreshToken: `jwt-mock-refresh-${Date.now()}`,
    };
  },

  getCurrentUser: async (): Promise<User> => {
    await delay(200);
    return MOCK_USERS[0];
  },

  logout: async (): Promise<void> => {
    await delay(100);
  },
};
