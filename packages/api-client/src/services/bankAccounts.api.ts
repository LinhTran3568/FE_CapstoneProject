import type { CreateUserBankAccountRequest, UserBankAccountDto } from '@ticketshield/types';
import { httpClient } from './client';

export interface BankInfo {
  code: string;
  name: string;
  bin: string;
  shortName: string;
}

// Compatibility export for the existing web account forms. Mobile reads the
// server directory through getBanks(); the web forms will be migrated to it
// without breaking the running web bundle in the meantime.
export const VIETNAM_BANKS: BankInfo[] = [
  { code: 'MB', name: 'MBBank - Ngân hàng Quân Đội', bin: '970422', shortName: 'MBBank' },
  { code: 'VCB', name: 'Vietcombank - Ngân hàng Ngoại Thương', bin: '970436', shortName: 'Vietcombank' },
  { code: 'TCB', name: 'Techcombank - Ngân hàng Kỹ Thương', bin: '970407', shortName: 'Techcombank' },
  { code: 'CTG', name: 'VietinBank - Ngân hàng Công Thương', bin: '970415', shortName: 'VietinBank' },
  { code: 'BIDV', name: 'BIDV - Ngân hàng ĐT & PT Việt Nam', bin: '970418', shortName: 'BIDV' },
  { code: 'VPB', name: 'VPBank - Ngân hàng Việt Nam Thịnh Vượng', bin: '970432', shortName: 'VPBank' },
  { code: 'ACB', name: 'ACB - Ngân hàng Á Châu', bin: '970416', shortName: 'ACB' },
  { code: 'TPB', name: 'TPBank - Ngân hàng Tiên Phong', bin: '970423', shortName: 'TPBank' },
  { code: 'STB', name: 'Sacombank - Ngân hàng Sài Gòn Thương Tín', bin: '970403', shortName: 'Sacombank' },
  { code: 'HDB', name: 'HDBank - Ngân hàng Phát triển TP.HCM', bin: '970437', shortName: 'HDBank' },
  { code: 'VBA', name: 'Agribank - Ngân hàng Nông nghiệp & PTNT', bin: '970405', shortName: 'Agribank' },
];

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


