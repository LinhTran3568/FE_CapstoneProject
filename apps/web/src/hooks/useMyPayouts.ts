import { useQuery } from '@tanstack/react-query';
import { payoutsApi } from '@ticketshield/api-client';

export const myPayoutsQueryKey = ['payouts', 'mine'] as const;

/** Payouts of the signed-in seller. Only mounted while the revenue tab is open. */
export const useMyPayouts = (enabled = true) =>
  useQuery({
    queryKey: myPayoutsQueryKey,
    queryFn: () => payoutsApi.getMyPayouts(),
    refetchInterval: enabled ? 60_000 : false,
    enabled,
  });
