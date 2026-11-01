import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { PurchasedTicketDto } from '@ticketshield/types';
import { resaleListingsApi } from '@ticketshield/api-client';
import { useAuthStore } from '../stores/authStore';
import { loadTickets, saveTickets, type SavedTickets } from '../services/ticketCacheService';

interface SavedState {
  userId: string;
  value: SavedTickets | null;
}

/**
 * Nguồn vé dùng chung cho ví, chi tiết vé và đơn hàng.
 * Hiện vé đã lưu ngay, gọi máy chủ song song, tải được thì ghi đè bản lưu.
 */
export function useMyTickets() {
  const userId = useAuthStore((state) => state.user?.id);
  const [saved, setSaved] = useState<SavedState | null>(null);

  useEffect(() => {
    if (!userId) return;
    let active = true;
    loadTickets(userId).then((value) => {
      if (active) setSaved({ userId, value });
    });
    return () => {
      active = false;
    };
  }, [userId]);

  const query = useQuery<PurchasedTicketDto[]>({
    queryKey: ['myTickets', userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      const tickets = (await resaleListingsApi.getMyPurchasedTickets()) || [];
      if (userId) await saveTickets(userId, tickets);
      return tickets;
    },
  });

  const savedValue = saved?.userId === userId ? saved?.value ?? null : null;
  const savedChecked = saved?.userId === userId;
  const hasData = query.data !== undefined || savedValue !== null;

  return {
    tickets: query.data ?? savedValue?.tickets ?? [],
    isLoading: !hasData && (query.isPending || !savedChecked),
    isOffline: query.isError && hasData,
    lastUpdatedAt: query.dataUpdatedAt ? new Date(query.dataUpdatedAt).toISOString() : savedValue?.savedAt ?? null,
    error: query.error,
    refetch: query.refetch,
  };
}
