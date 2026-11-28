import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { adminApi, type AdminTransactionsParams } from '@ticketshield/api-client';

/** Giao dịch ký quỹ cho trang Admin. Không tự làm mới, Admin bấm Refresh. */
export const useAdminTransactions = (params: AdminTransactionsParams) =>
  useQuery({
    queryKey: ['admin', 'transactions', params],
    queryFn: () => adminApi.getTransactions(params),
    // Giữ trang cũ trong lúc tải trang mới để bảng không nháy trắng.
    placeholderData: keepPreviousData,
    refetchOnWindowFocus: false,
  });
