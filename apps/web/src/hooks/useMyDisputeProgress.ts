import { useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { disputesApi } from '@ticketshield/api-client';
import type { MyDisputeProgressDto } from '@ticketshield/api-client';
import { myListingsQueryKey } from './useMyListings';
import { myPurchasedTicketsQueryKey } from './useMyTickets';

/** How often an open dispute is reloaded while its progress drawer is open. */
export const DISPUTE_PROGRESS_POLL_MS = 4000;

export const disputeProgressQueryKey = (disputeId: string) =>
  ['disputes', 'my-progress', disputeId] as const;

/** A seller payout that has been requested but has no final result yet. */
const payoutIsInProgress = (progress: MyDisputeProgressDto | undefined) =>
  progress?.money?.kind === 'PAYOUT' &&
  (progress.money.status === 'PENDING' || progress.money.status === 'PROCESSING');

/** True while the dispute is open or its payout is still moving, i.e. the screen keeps reloading. */
export const isProgressStillChanging = (progress: MyDisputeProgressDto | undefined) =>
  progress?.status === 'OPEN' || payoutIsInProgress(progress);

/**
 * Progress of one dispute for the signed-in buyer or seller.
 * Reloads every few seconds while the dispute is OPEN, and after it is decided for as long as
 * the seller's payout is still pending or processing. Anything else (a refund, a finished or
 * failed payout) is final, so the reload stops.
 * `enabled` follows the drawer: a closed drawer makes no request.
 * When the dispute turns decided, both ticket lists are refreshed so their rows match the drawer.
 */
export const useMyDisputeProgress = (disputeId: string | null, enabled: boolean) => {
  const queryClient = useQueryClient();
  const lastStatus = useRef<string | undefined>(undefined);

  const query = useQuery<MyDisputeProgressDto>({
    queryKey: disputeProgressQueryKey(disputeId ?? ''),
    queryFn: () => disputesApi.getMyDisputeProgress(disputeId as string),
    enabled: enabled && Boolean(disputeId),
    refetchInterval: (q) => (isProgressStillChanging(q.state.data) ? DISPUTE_PROGRESS_POLL_MS : false),
    retry: 1,
  });

  const status = query.data?.status;
  useEffect(() => {
    if (lastStatus.current === 'OPEN' && status !== undefined && status !== 'OPEN') {
      void queryClient.invalidateQueries({ queryKey: myPurchasedTicketsQueryKey });
      void queryClient.invalidateQueries({ queryKey: myListingsQueryKey });
    }
    lastStatus.current = status;
  }, [status, queryClient]);

  return query;
};
