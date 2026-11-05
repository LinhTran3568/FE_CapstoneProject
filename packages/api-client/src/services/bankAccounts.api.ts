import type { CreateUserBankAccountRequest, UserBankAccountDto } from '@ticketshield/types';
import { httpClient } from './client';

export interface BankInfo {
  code: string;
  name: string;
  bin: string;
  shortName: string;
}

export const bankAccountsApi = {
  /** Server-owned directory so FE never duplicates bank codes and NAPAS BINs. */
  getBanks: async (): Promise<BankInfo[]> => {
    return httpClient<BankInfo[]>('/user-bank-accounts/banks', { method: 'GET' });
  },
  /**
   * Get list of seller's linked beneficiary bank accounts.
   * GET /api/v1/user-bank-accounts (JWT required)
   */
  getMyBankAccounts: async (): Promise<UserBankAccountDto[]> => {
    return httpClient<UserBankAccountDto[]>('/user-bank-accounts', {
      method: 'GET',
    });
  },

  /**
   * Add / Link a new seller beneficiary bank account.
   * POST /api/v1/user-bank-accounts (JWT required)
   */
  addBankAccount: async (
    request: CreateUserBankAccountRequest
  ): Promise<UserBankAccountDto> => {
    return httpClient<UserBankAccountDto>('/user-bank-accounts', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  },

  /**
   * Auto-lookup beneficiary account holder name via BE proxy (avoids browser CORS).
   * Calls GET /api/v1/user-bank-accounts/lookup-name?bin={bin}&accountNumber={accountNumber}
   * Returns isVerified:true ONLY when the bank API confirms the name.
   */
  lookupAccountHolderName: async (
    bankBin: string,
    accountNumber: string,
  ): Promise<{ success: boolean; accountName: string; isVerified: boolean }> => {
    const cleanAcc = accountNumber.replace(/\D/g, '');
    if (!cleanAcc || cleanAcc.length < 6 || !bankBin) {
      return { success: false, accountName: '', isVerified: false };
    }

    try {
      const result = await httpClient<{ success: boolean; accountName: string; isVerified: boolean }>(
        `/user-bank-accounts/lookup-name?bin=${encodeURIComponent(bankBin)}&accountNumber=${encodeURIComponent(cleanAcc)}`,
        { method: 'GET' }
      );
      return result;
    } catch {
      // BE proxy thất bại - user cần nhập thủ công
    }

    return { success: false, accountName: '', isVerified: false };
  },
};


