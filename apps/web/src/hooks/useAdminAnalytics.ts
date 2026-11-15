import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { adminApi } from '@ticketshield/api-client';
import { rangeToDates, type DashboardRange } from '../utils/adminOps';

/**
 * Thống kê sàn cho Dashboard. Khoảng ngày chỉ áp cho doanh thu và bảng sự kiện.
 * Mốc ngày tính một lần theo `range` để key không đổi mỗi lần render.
 */
export const useAdminAnalytics = (range: DashboardRange, rangeStartedAt: Date) =>
  useQuery({
    queryKey: ['admin', 'analytics', range, rangeStartedAt.toDateString()],
    queryFn: () => adminApi.getPlatformAnalytics(rangeToDates(range, rangeStartedAt)),
    placeholderData: keepPreviousData,
    refetchOnWindowFocus: false,
  });
