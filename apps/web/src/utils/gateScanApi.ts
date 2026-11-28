import type { GateAccessLogDto, GateScanRequest, GateScanResponse } from './gateScan';

const SCAN_TIMEOUT_MS = 5000;
const LOG_LIMIT = 20;

export type GateScanOutcome =
  | { kind: 'result'; response: GateScanResponse }
  | { kind: 'invalid' }
  | { kind: 'unverified' };

interface ScanOptions {
  fetchFn?: typeof fetch;
  timeoutMs?: number;
}

// Từ chối vé là HTTP 200. Lỗi mạng hay 5xx không được coi là từ chối.
export async function scanGateTicket(
  apiBase: string,
  request: GateScanRequest,
  { fetchFn = globalThis.fetch?.bind(globalThis), timeoutMs = SCAN_TIMEOUT_MS }: ScanOptions = {}
): Promise<GateScanOutcome> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetchFn(`${apiBase}/gate/scan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
      signal: controller.signal,
    });

    if (res.status === 400) return { kind: 'invalid' };
    if (!res.ok) return { kind: 'unverified' };

    return { kind: 'result', response: (await res.json()) as GateScanResponse };
  } catch {
    return { kind: 'unverified' };
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchGateLogs(apiBase: string): Promise<GateAccessLogDto[]> {
  const res = await fetch(`${apiBase}/logs?limit=${LOG_LIMIT}`);
  if (!res.ok) throw new Error(`Gate logs returned ${res.status}`);
  return (await res.json()) as GateAccessLogDto[];
}
