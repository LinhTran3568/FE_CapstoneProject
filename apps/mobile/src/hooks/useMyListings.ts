import { useQuery } from '@tanstack/react-query';
import type { SellerListingDto } from '@ticketshield/types';
import { resaleListingsApi } from '@ticketshield/api-client';
import { useAuthStore } from '../stores/authStore';

/** `userId` nằm trong key để đổi tài khoản không thấy tin của người trước. */
export function useMyListings() {
  const userId = useAuthStore((state) => state.user?.id);

  return useQuery<SellerListingDto[]>({
    queryKey: ['myListings', userId],
    enabled: Boolean(userId),
    queryFn: async () => (await resaleListingsApi.getMyListings()) || [],
  });
}
