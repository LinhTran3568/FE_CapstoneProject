import { useState, useEffect, useRef, useCallback } from 'react';

export interface UsePaymentCountdownOptions {
  unlockAt?: string | null;
  durationSeconds?: number;
  onExpire?: () => void;
  enabled?: boolean;
  listingId?: string;
  /** Server timestamp returned with the same payload as unlockAt. */
  serverNow?: string | null;
}

export interface UsePaymentCountdownResult {
  timeLeft: number;
  formattedTime: string;
  progressPercentage: number;
  isExpired: boolean;
  isUrgent: boolean;
  statusColor: 'emerald' | 'amber' | 'red';
  resetTimer: () => void;
}

export const usePaymentCountdown = ({
  unlockAt,
  durationSeconds = 600,
  onExpire,
  enabled = true,
  listingId,
  serverNow,
}: UsePaymentCountdownOptions): UsePaymentCountdownResult => {
  const totalDurationMsRef = useRef(durationSeconds * 1000);
  const targetTimeRef = useRef<number | null>(null);
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  const [timeLeft, setTimeLeft] = useState(durationSeconds);
  const [progressPercentage, setProgressPercentage] = useState(100);
  const [isExpired, setIsExpired] = useState(false);
  const serverClockSampleRef = useRef<string | null>(null);
  const serverClockOffsetRef = useRef(0);
  if (serverNow && serverClockSampleRef.current !== serverNow) {
    const parsed = new Date(serverNow).getTime();
    if (!Number.isNaN(parsed)) {
      // Capture the offset once when this payload arrives. Recomputing it on
      // every render would incorrectly treat elapsed time as clock skew.
      serverClockOffsetRef.current = parsed - Date.now();
      serverClockSampleRef.current = serverNow;
    }
  }
  const nowFromServerClock = useCallback(() => Date.now() + serverClockOffsetRef.current, []);

  // Initialize or re-anchor the target timestamp
  const calculateTargetTime = useCallback(() => {
    totalDurationMsRef.current = (durationSeconds || 600) * 1000;
    
    const explicitTarget = unlockAt ? new Date(unlockAt).getTime() : NaN;

    // The server-issued expiry is authoritative, including when checkout was
    // opened from a different client (mobile/emulator).
    if (!Number.isNaN(explicitTarget) && explicitTarget > 0) {
      if (listingId && typeof window !== 'undefined') {
        sessionStorage.setItem(`ticket_hold_target_${listingId}`, explicitTarget.toString());
      }
      return explicitTarget;
    }

    if (listingId && typeof window !== 'undefined') {
      const saved = Number.parseInt(sessionStorage.getItem(`ticket_hold_target_${listingId}`) || '', 10);
      if (!Number.isNaN(saved) && saved > nowFromServerClock() - 60_000) return saved;
    }

    const target = nowFromServerClock() + totalDurationMsRef.current;
    if (listingId && typeof window !== 'undefined') {
      sessionStorage.setItem(`ticket_hold_target_${listingId}`, target.toString());
    }
    return target;
  }, [unlockAt, durationSeconds, listingId, serverNow, nowFromServerClock]);

  const resetTimer = useCallback(() => {
    targetTimeRef.current = calculateTargetTime();
    const remainingMs = Math.max(0, targetTimeRef.current - nowFromServerClock());
    const remainingSecs = Math.floor(remainingMs / 1000);
    setTimeLeft(remainingSecs);
    setProgressPercentage(Math.min(100, Math.max(0, (remainingMs / totalDurationMsRef.current) * 100)));
    setIsExpired(remainingSecs <= 0);
  }, [calculateTargetTime]);

  useEffect(() => {
    if (!enabled) {
      targetTimeRef.current = null;
      return;
    }

    targetTimeRef.current = calculateTargetTime();

    const updateCountdown = () => {
      if (!targetTimeRef.current) return;

      const now = nowFromServerClock();
      const remainingMs = Math.max(0, targetTimeRef.current - now);
      const remainingSecs = Math.max(0, Math.floor(remainingMs / 1000));

      setTimeLeft(remainingSecs);
      const percent = Math.min(100, Math.max(0, (remainingMs / totalDurationMsRef.current) * 100));
      setProgressPercentage(percent);

      if (remainingMs <= 0) {
        setIsExpired(true);
        if (onExpireRef.current) {
          onExpireRef.current();
        }
      } else {
        setIsExpired(false);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 500);

    // Instant update when user returns to this tab
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        updateCountdown();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleVisibilityChange);
    };
  }, [enabled, calculateTargetTime, nowFromServerClock]);

  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const formattedTime = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

  const isUrgent = timeLeft > 0 && timeLeft <= 120;
  const statusColor: 'emerald' | 'amber' | 'red' = isExpired
    ? 'red'
    : isUrgent
    ? 'amber'
    : 'emerald';

  return {
    timeLeft,
    formattedTime,
    progressPercentage,
    isExpired,
    isUrgent,
    statusColor,
    resetTimer,
  };
};
