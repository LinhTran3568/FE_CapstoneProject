import type { MockTicketDto, MockTicketsListResponse } from '@ticketshield/types';
import { getMockOrganizerBaseUrl } from './organizerStore.api';

const ORGANIZER_DOWN_MESSAGE =
  'MockOrganizer service is unreachable. Unable to load purchased tickets.';

/**
 * Mock tickets are exposed by MockOrganizer's REST API, not by the AntiBot
 * organizer endpoint. Reuse the shared resolver so Web, Mobile, and the
 * organizer store honor VITE/EXPO_PUBLIC_MOCK_ORGANIZER_API_BASE_URL alike.
 */
const getMockTicketsApiBase = (): string => {
  const base = getMockOrganizerBaseUrl().replace(/\/$/, '');
  return base.endsWith('/api/v1') ? base : `${base}/api/v1`;
};

const isValidEntryPass = (ticket: MockTicketDto) =>
  (ticket.status || '').trim().toUpperCase() === 'VALID';

export const mockTicketsApi = {
  /**
   * Resolves the live gate status for issued pass codes. The Organizer owns
   * admission state, whereas the Core API owns the escrow lifecycle.
   */
  getTicketStatuses: async (ticketCodes: string[]): Promise<Map<string, string>> => {
    const uniqueCodes = [...new Set(ticketCodes.map((code) => code.trim()).filter(Boolean))];
    const results = await Promise.all(
      uniqueCodes.map(async (ticketCode) => {
        try {
          const response = await fetch(
            `${getMockTicketsApiBase()}/mock-tickets/${encodeURIComponent(ticketCode)}`
          );
          if (!response.ok) return null;
          const body = (await response.json()) as { data?: MockTicketDto };
          const status = body.data?.status?.trim().toUpperCase();
          return status ? [ticketCode, status] as const : null;
        } catch {
          // Keep the Core response when the Organizer cannot be reached.
          return null;
        }
      })
    );

    return new Map(results.filter((result): result is readonly [string, string] => result !== null));
  },

  /**
   * Buyer tickets issued by MockOrganizer.
   * GET /api/v1/mock-tickets/my-tickets?email=&status=VALID
   * Hits :5001 directly — Gateway does not proxy MockOrganizer.
   */
  getMyTickets: async (email: string): Promise<MockTicketDto[]> => {
    const trimmed = email.trim();
    if (!trimmed) {
      throw new Error('Email is required to load tickets.');
    }

    const params = new URLSearchParams({
      email: trimmed,
      status: 'VALID',
    });
    const url = `${getMockTicketsApiBase()}/mock-tickets/my-tickets?${params.toString()}`;

    let response: Response;
    try {
      response = await fetch(url);
    } catch {
      throw new Error(ORGANIZER_DOWN_MESSAGE);
    }

    if (!response.ok) {
      throw new Error(ORGANIZER_DOWN_MESSAGE);
    }

    const body = (await response.json()) as MockTicketsListResponse;
    return (body.data ?? []).filter(isValidEntryPass);
  },
};
