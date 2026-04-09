'use client';

import { useEffect, useRef, useCallback, useState } from 'react';

interface PendingAnswer {
  questionId: string;
  selectedOptionIds: string[];
  textAnswer: string | null;
  timestamp: number;
}

interface UseOfflineSyncOptions {
  attemptId: string;
  enabled?: boolean;
}

const STORAGE_KEY_PREFIX = 'exam_offline_';

export function useOfflineSync({ attemptId, enabled = true }: UseOfflineSyncOptions) {
  const storageKey = `${STORAGE_KEY_PREFIX}${attemptId}`;
  const [isOnline, setIsOnline] = useState(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [pendingCount, setPendingCount] = useState(() => {
    if (typeof window === 'undefined') {
      return 0;
    }

    try {
      const raw = localStorage.getItem(storageKey);
      const parsed = raw ? (JSON.parse(raw) as PendingAnswer[]) : [];
      return parsed.length;
    } catch {
      return 0;
    }
  });
  const syncingRef = useRef(false);

  // Get pending answers from localStorage
  const getPendingAnswers = useCallback((): PendingAnswer[] => {
    try {
      const data = localStorage.getItem(storageKey);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }, [storageKey]);

  // Save an answer to localStorage queue
  const queueAnswer = useCallback(
    (answer: Omit<PendingAnswer, 'timestamp'>) => {
      const pending = getPendingAnswers();
      const existingIndex = pending.findIndex((a) => a.questionId === answer.questionId);

      const newAnswer: PendingAnswer = { ...answer, timestamp: Date.now() };

      if (existingIndex >= 0) {
        pending[existingIndex] = newAnswer;
      } else {
        pending.push(newAnswer);
      }

      localStorage.setItem(storageKey, JSON.stringify(pending));
      setPendingCount(pending.length);
    },
    [getPendingAnswers, storageKey]
  );

  // Sync all pending answers to the server
  const syncPendingAnswers = useCallback(async () => {
    if (syncingRef.current) return;
    syncingRef.current = true;

    const pending = getPendingAnswers();
    if (pending.length === 0) {
      syncingRef.current = false;
      return;
    }

    const synced: string[] = [];

    for (const answer of pending) {
      try {
        const res = await fetch(`/api/attempts/${attemptId}/answers`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            questionId: answer.questionId,
            selectedOptionIds: answer.selectedOptionIds,
            textAnswer: answer.textAnswer,
          }),
        });

        if (res.ok) {
          synced.push(answer.questionId);
        }
      } catch {
        // Will retry on next sync
        break;
      }
    }

    // Remove synced answers
    if (synced.length > 0) {
      const remaining = getPendingAnswers().filter(
        (a) => !synced.includes(a.questionId)
      );
      localStorage.setItem(storageKey, JSON.stringify(remaining));
      setPendingCount(remaining.length);
    }

    syncingRef.current = false;
  }, [attemptId, getPendingAnswers, storageKey]);

  // Clear all pending answers
  const clearPending = useCallback(() => {
    localStorage.removeItem(storageKey);
    setPendingCount(0);
  }, [storageKey]);

  // Online/offline listeners
  useEffect(() => {
    if (!enabled) return;

    const handleOnline = () => {
      setIsOnline(true);
      syncPendingAnswers();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [enabled, syncPendingAnswers, getPendingAnswers]);

  return {
    isOnline,
    pendingCount,
    queueAnswer,
    syncPendingAnswers,
    clearPending,
  };
}
