import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { adminApi, type AdminListingsParams } from '@ticketshield/api-client';

/** Tin đăng cho trang Admin. Không tự làm mới, Admin bấm Refresh. */
export const useAdminListings = (params: AdminListingsParams, enabled = true) =>
  useQuery({
    queryKey: ['admin', 'listings', params],
    queryFn: () => adminApi.getListings(params),
    placeholderData: keepPreviousData,
    refetchOnWindowFocus: false,
    enabled,
  });

/** Đủ vé của một combo, kể cả vé nằm ở trang khác của bảng. Combo tối đa 4 vé. */
export const useAdminComboTickets = (bundleId: string | null) =>
  useQuery({
    queryKey: ['admin', 'listings', 'combo', bundleId],
    queryFn: () => adminApi.getListings({ bundleId: bundleId ?? undefined, size: 10 }),
    enabled: !!bundleId,
    refetchOnWindowFocus: false,
  });
