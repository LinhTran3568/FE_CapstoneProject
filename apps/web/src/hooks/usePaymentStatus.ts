import { useQuery } from '@tanstack/react-query';
import { resaleListingsApi, PaymentStatusDto } from '@ticketshield/api-client';

export const paymentStatusQueryKey = (listingId: string) =>
  ['resale-listings', 'payment-status', listingId] as const;

export const usePaymentStatus = (listingId: string | undefined, enabled: boolean) =>
  useQuery<PaymentStatusDto>({
    queryKey: paymentStatusQueryKey(listingId || ''),
    queryFn: () => resaleListingsApi.getPaymentStatus(listingId!),
    enabled: Boolean(listingId) && enabled,
    refetchInterval: 3_000,
    staleTime: 0,
  });
