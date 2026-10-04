import { useQuery } from '@tanstack/react-query';
import { bankAccountsApi } from '@ticketshield/api-client';
import type { UserBankAccountDto } from '@ticketshield/types';
import { useAuthStore } from '../stores/authStore';

export const myBankAccountsQueryKey = ['user-bank-accounts', 'mine'] as const;

export const useMyBankAccounts = () => {
  const { isAuthenticated } = useAuthStore();

  return useQuery<UserBankAccountDto[]>({
    queryKey: myBankAccountsQueryKey,
    queryFn: async () => {
      const accounts = await bankAccountsApi.getMyBankAccounts();
      return accounts ?? [];
    },
    enabled: isAuthenticated,
    staleTime: 30000,
    refetchOnWindowFocus: true,
  });
};
