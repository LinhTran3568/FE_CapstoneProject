import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { ordersApi, type MyOrdersParams } from '@ticketshield/api-client';
import { useAuthStore } from '../stores/authStore';

/**
 * Đơn mua vé của người đang đăng nhập (SCRUM-342), một trang kèm ô tổng.
 * Đổi trang hay bộ lọc thì danh sách cũ ở lại trong lúc tải. Không tự làm mới theo chu kỳ.
 */
export const useMyOrders = (params: MyOrdersParams) => {
  const { isAuthenticated } = useAuthStore();
  return useQuery({
    queryKey: ['orders', 'my-orders', params],
    queryFn: () => ordersApi.getMyOrders(params),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
    retry: 1,
    enabled: isAuthenticated,
  });
};
