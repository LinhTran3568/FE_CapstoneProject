/**
 * Dynamic Rotating Anti-Scalping Token Generator (TOTP 30s)
 * Changes every 30 seconds for live gate check-in scanning.
 */
export function generateRotatingToken(ticketCode: string): {
  token: string;
  secondsRemaining: number;
} {
  const cycleMs = 30000;
  const now = Date.now();
  const cycleIndex = Math.floor(now / cycleMs);
  const msIntoCycle = now % cycleMs;
  const secondsRemaining = Math.max(1, Math.ceil((cycleMs - msIntoCycle) / 1000));

  // Dynamic token combining pass code, 30s epoch interval, and checksum
  const token = `TS-TOTP:${ticketCode}:${cycleIndex.toString(36).toUpperCase()}:${Math.sin(cycleIndex).toString(36).slice(2, 6).toUpperCase()}`;

  return { token, secondsRemaining };
}

