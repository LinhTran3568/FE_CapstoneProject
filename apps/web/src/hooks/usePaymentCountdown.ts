import { useState, useEffect, useRef, useCallback } from 'react';

export interface UsePaymentCountdownOptions {
  unlockAt?: string | null;
  durationSeconds?: number;
  onExpire?: () => void;
  enabled?: boolean;
  listingId?: string;
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
}: UsePaymentCountdownOptions): UsePaymentCountdownResult => {
  const totalDurationMsRef = useRef(durationSeconds * 1000);
  const targetTimeRef = useRef<number | null>(null);
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  const [timeLeft, setTimeLeft] = useState(durationSeconds);
  const [progressPercentage, setProgressPercentage] = useState(100);
  const [isExpired, setIsExpired] = useState(false);

  // Initialize or re-anchor the target timestamp
  const calculateTargetTime = useCallback(() => {
    totalDurationMsRef.current = (durationSeconds || 600) * 1000;
    
    // 1. Prioritize explicit unlockAt timestamp from backend
    if (unlockAt) {
      const parsed = new Date(unlockAt).getTime();
      if (!Number.isNaN(parsed) && parsed > 0) {
        if (listingId && typeof window !== 'undefined') {
          sessionStorage.setItem(`ticket_hold_target_${listingId}`, parsed.toString());
        }
        return parsed;
      }
    }

    // 2. Fallback to sessionStorage persisted timestamp to prevent reset on page navigation
    if (listingId && typeof window !== 'undefined') {
      const saved = sessionStorage.getItem(`ticket_hold_target_${listingId}`);
      if (saved) {
        const parsedSaved = parseInt(saved, 10);
        if (!Number.isNaN(parsedSaved) && parsedSaved > Date.now() - 60000) {
          return parsedSaved;
        }
      }
    }

    // 3. Generate new target time and persist if listingId is available
    const target = Date.now() + totalDurationMsRef.current;
    if (listingId && typeof window !== 'undefined') {
      sessionStorage.setItem(`ticket_hold_target_${listingId}`, target.toString());
    }
    return target;
  }, [unlockAt, durationSeconds, listingId]);

  const resetTimer = useCallback(() => {
    targetTimeRef.current = calculateTargetTime();
    const remainingMs = Math.max(0, targetTimeRef.current - Date.now());
    const remainingSecs = Math.ceil(remainingMs / 1000);
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

      const now = Date.now();
      const remainingMs = Math.max(0, targetTimeRef.current - now);
      const remainingSecs = Math.max(0, Math.ceil(remainingMs / 1000));

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
  }, [enabled, calculateTargetTime]);

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
