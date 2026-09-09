import { create } from 'zustand';
import { User, UserRole } from '@ticketshield/types';
import { MOCK_USERS } from '@ticketshield/api-client';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
  switchRole: (role: UserRole) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: MOCK_USERS[0], // Default as BUYER for seamless capstone preview
  token: 'mock-jwt-token-capstone-2026',
  isAuthenticated: true,
  login: (user, token) => set({ user, token, isAuthenticated: true }),
  logout: () => set({ user: null, token: null, isAuthenticated: false }),
  switchRole: (role: UserRole) => {
    const targetUser = MOCK_USERS.find((u) => u.role === role) || {
      ...MOCK_USERS[0],
      role,
      fullName: `User (${role})`,
    };
    set({ user: targetUser });
  },
}));
