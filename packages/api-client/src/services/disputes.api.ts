import { httpClient, axiosClient, API_CONFIG } from './client';
import type { ApiResponse } from './client';

export enum DisputeReasonCode {
  TicketInvalid = 0,
  DuplicateEntry = 1,
  FakeTicket = 2,
}

export interface CreateDisputeRequest {
  escrowId: string;
  reason: string;
  reasonCode?: DisputeReasonCode | number;
}

export interface CreateDisputeResponse {
  disputeId: string;
  disputeCode: string;
  createdAt: string;
}

export interface AddDisputeEvidenceResponse {
  evidenceId: string;
}

export interface DisputeEvidenceDto {
  evidenceId: string;
  fileUrl: string;
  createdAt: string;
}

export interface GateScanDto {
  ticketCode: string;
  scannedAt: string;
  scanResult: string;
  gateName: string;
  scannerDeviceId?: string;
}

export interface DisputeListItemDto {
  disputeId: string;
  disputeCode: string;
  reasonCode: DisputeReasonCode | number;
  description: string;
  status: string;
  resolution?: string;
  refundAmount: number;
  adminNotes?: string;
  recommendation?: string;
  createdAt: string;
  resolvedAt?: string;
  transferredAt?: string;
  harvestedAt?: string;
  escrowId: string;
  totalBuyerPaid: number;
  eventTitle: string;
  ticketCode: string;
  buyerId: string;
  buyerName: string;
  buyerEmail: string;
  sellerId: string;
  sellerName: string;
  sellerEmail: string;
  evidences: DisputeEvidenceDto[];
  scans: GateScanDto[];
}

export interface DisputesOverviewDto {
  items: DisputeListItemDto[];
  totalCount: number;
  openCount: number;
  resolvedCount: number;
  rejectedCount: number;
}

export interface ResolveDisputeRequest {
  decision: 'Approve' | 'Reject' | number;
  reason: string;
}

export interface ResolveDisputeResponse {
  disputeStatus: string;
  escrowStatus: string;
}

export interface DisputeRecommendationResponse {
  recommendation?: string;
  transferredAt?: string;
  harvestedAt?: string;
  scans: GateScanDto[];
}

/** One step of the dispute timeline; `step` is SUBMITTED, GATE_LOG_CHECK or RESOLVED */
export interface DisputeTimelineStepDto {
  step: string;
  /** DONE, CURRENT, PENDING or SKIPPED */
  state: string;
  at?: string | null;
}

export interface DisputeMoneyDto {
  /** REFUND (buyer) or PAYOUT (seller) */
  kind: string;
  amount: number;
  status: string;
  processedAt?: string | null;
}

/**
 * GET /api/v1/disputes/my-disputes/{id} → backend `MyDisputeProgressDto`.
 * Only holds what the buyer or seller may see.
 */
export interface MyDisputeProgressDto {
  disputeId: string;
  disputeCode: string;
  /** BUYER or SELLER */
  viewerRole: string;
  reasonCode: DisputeReasonCode | number;
  /** OPEN, RESOLVED or REJECTED */
  status: string;
  createdAt: string;
  /** Only sent to the buyer */
  description?: string | null;
  timeline: DisputeTimelineStepDto[];
  /** REFUND_BUYER or RELEASE_SELLER once decided */
  outcome?: string | null;
  resolutionMessage?: string | null;
  money?: DisputeMoneyDto | null;
}

export const disputesApi = {
  /**
   * Submit a dispute for an Escrow transaction
   */
  createDispute: async (payload: CreateDisputeRequest): Promise<CreateDisputeResponse> => {
    return await httpClient<CreateDisputeResponse>('/disputes', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  /**
   * Upload an evidence image for a created dispute
   */
  addEvidence: async (disputeId: string, file: File): Promise<AddDisputeEvidenceResponse> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await axiosClient.post<ApiResponse<AddDisputeEvidenceResponse>>(
      `${API_CONFIG.baseURL}/disputes/${disputeId}/evidence`,
      formData
    );

    if (!response.data.success) {
      throw new Error(response.data.message || 'Lỗi khi tải ảnh bằng chứng');
    }
    return response.data.data;
  },

  /**
   * Get list of all dispute dossiers and status statistics for Admin / Moderator console
   */
  getDisputes: async (status?: string, searchKeyword?: string): Promise<DisputesOverviewDto> => {
    const params = new URLSearchParams();
    if (status && status !== 'ALL') params.append('status', status);
    if (searchKeyword) params.append('searchKeyword', searchKeyword);

    const queryStr = params.toString();
    const url = `/disputes${queryStr ? `?${queryStr}` : ''}`;
    return await httpClient<DisputesOverviewDto>(url);
  },

  /**
   * Get system recommendation and automated BTC gate access logs snapshot
   */
  getRecommendation: async (disputeId: string): Promise<DisputeRecommendationResponse> => {
    return await httpClient<DisputeRecommendationResponse>(`/disputes/${disputeId}/recommendation`);
  },

  /**
   * Submit 1-Click dispute verdict decision (Approve / Reject)
   */
  resolveDispute: async (disputeId: string, payload: ResolveDisputeRequest): Promise<ResolveDisputeResponse> => {
    const body: Record<string, unknown> = {
      decision: typeof payload.decision === 'number' ? payload.decision : payload.decision === 'Approve' ? 0 : 1,
      reason: payload.reason,
    };
    return await httpClient<ResolveDisputeResponse>(`/disputes/${disputeId}/resolution`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  /**
   * Progress of one dispute for the buyer or the seller of that sale
   */
  getMyDisputeProgress: async (disputeId: string): Promise<MyDisputeProgressDto> => {
    return await httpClient<MyDisputeProgressDto>(`/disputes/my-disputes/${disputeId}`);
  },

  /**
   * Fetch evidence image as Blob to support authenticated image preview without exposing bearer token in img tag
   */
  getEvidenceBlob: async (disputeId: string, evidenceId: string): Promise<Blob> => {
    const response = await axiosClient.get(`${API_CONFIG.baseURL}/disputes/${disputeId}/evidence/${evidenceId}`, {
      responseType: 'blob',
    });
    return response.data;
  },
};
