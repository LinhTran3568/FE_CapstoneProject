import type {
  CopilotChatRequest,
  CopilotChatResponse,
} from '@ticketshield/types';
import { httpClient, API_CONFIG } from './client';

export const copilotApi = {
  /**
   * Synchronous chat completion with Copilot (US-13.4).
   * POST /copilot/chat
   */
  chat: async (request: CopilotChatRequest): Promise<CopilotChatResponse> => {
    return httpClient<CopilotChatResponse>('/copilot/chat', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  },

  /**
   * Real-time Server-Sent Events (SSE) streaming chat with Copilot.
   * POST /copilot/chat/stream
   */
  streamChat: async function* (
    request: CopilotChatRequest,
    signal?: AbortSignal
  ): AsyncGenerator<string, void, unknown> {
    const url = `${API_CONFIG.baseURL}/copilot/chat/stream`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
      signal,
    });

    if (!response.ok || !response.body) {
      throw new Error(`SSE streaming failed with status ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith(':')) continue;

        if (trimmed.startsWith('data:')) {
          const rawData = trimmed.slice(5).trim();
          if (rawData === '[DONE]') return;
          try {
            const parsed = JSON.parse(rawData);
            if (parsed.done === true && !parsed.token && !parsed.chunk) return;
            const content = parsed.token ?? parsed.chunk ?? (typeof parsed === 'string' ? parsed : '');
            if (content) {
              yield content;
            }
          } catch {
            yield rawData;
          }
        }
      }
    }
  },
};
