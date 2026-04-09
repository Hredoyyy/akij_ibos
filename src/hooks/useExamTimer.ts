'use client';

import { useEffect, useRef, useState } from 'react';

interface UseExamTimerOptions {
  durationMinutes: number;
  startedAt: string | Date;
  onTimeout: () => void;
  enabled?: boolean;
}

export function useExamTimer({
  durationMinutes,
  startedAt,
  onTimeout,
  enabled = true,
}: UseExamTimerOptions) {
  const [remainingSeconds, setRemainingSeconds] = useState<number>(() => {
    const startMs = new Date(startedAt).getTime();
    const durationMs = durationMinutes * 60 * 1000;
    const elapsed = Date.now() - startMs;
    return Math.max(0, Math.floor((durationMs - elapsed) / 1000));
  });

  const timeoutCalledRef = useRef(false);
  const onTimeoutRef = useRef(onTimeout);

  useEffect(() => {
    onTimeoutRef.current = onTimeout;
  }, [onTimeout]);

  useEffect(() => {
    if (!enabled) return;

    const interval = setInterval(() => {
      const startMs = new Date(startedAt).getTime();
      const durationMs = durationMinutes * 60 * 1000;
      const elapsed = Date.now() - startMs;
      const remaining = Math.max(0, Math.floor((durationMs - elapsed) / 1000));

      setRemainingSeconds(remaining);

      if (remaining <= 0 && !timeoutCalledRef.current) {
        timeoutCalledRef.current = true;
        clearInterval(interval);
        onTimeoutRef.current();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [durationMinutes, startedAt, enabled]);

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  const isWarning = remainingSeconds <= 300 && remainingSeconds > 60; // Last 5 min
  const isCritical = remainingSeconds <= 60; // Last minute

  return {
    remainingSeconds,
    formattedTime,
    isWarning,
    isCritical,
    isExpired: remainingSeconds <= 0,
  };
}
