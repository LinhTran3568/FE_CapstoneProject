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
};
