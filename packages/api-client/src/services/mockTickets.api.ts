import type { MockTicketDto, MockTicketsListResponse } from '@ticketshield/types';

const ORGANIZER_DOWN_MESSAGE =
  'MockOrganizer chưa chạy (:5001). Không tải được vé đã mua.';

const getOrganizerBaseUrl = (): string => {
  if (typeof window !== 'undefined') {
    const envUrl =
      import.meta.env.VITE_ORGANIZER_API_BASE_URL ||
      (window as { __ENV__?: { VITE_ORGANIZER_API_BASE_URL?: string } }).__ENV__
        ?.VITE_ORGANIZER_API_BASE_URL;
    if (envUrl) return String(envUrl).replace(/\/$/, '');
  }
  return 'http://localhost:5001/api/v1';
};

const isValidEntryPass = (ticket: MockTicketDto) =>
  (ticket.status || '').trim().toUpperCase() === 'VALID';

export const mockTicketsApi = {
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
    const url = `${getOrganizerBaseUrl()}/mock-tickets/my-tickets?${params.toString()}`;

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
