'use client';

import { useEffect, useRef, useCallback, useState } from 'react';

interface UseBehaviorTrackingOptions {
  onViolation: () => void;
  enabled?: boolean;
}

export function useBehaviorTracking({
  onViolation,
  enabled = true,
}: UseBehaviorTrackingOptions) {
  const onViolationRef = useRef(onViolation);
  const isFullscreenRef = useRef(false);
  const [isFullscreen, setIsFullscreen] = useState(() =>
    typeof document !== 'undefined' ? !!document.fullscreenElement : false
  );

  useEffect(() => {
    onViolationRef.current = onViolation;
  }, [onViolation]);

  // Request fullscreen on mount
  const enterFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        isFullscreenRef.current = true;
      }
    } catch (err) {
      console.warn('Fullscreen request failed:', err);
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;

    // Track tab visibility changes
    const handleVisibilityChange = () => {
      if (document.hidden) {
        console.log('[Behavior] Tab switch detected');
        onViolationRef.current();
      }
    };

    // Track fullscreen exit
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && isFullscreenRef.current) {
        console.log('[Behavior] Fullscreen exit detected');
        onViolationRef.current();
      }
      isFullscreenRef.current = !!document.fullscreenElement;
      setIsFullscreen(isFullscreenRef.current);
    };

    // Track window blur
    const handleWindowBlur = () => {
      console.log('[Behavior] Window blur detected');
      onViolationRef.current();
    };

    // Prevent right-click context menu
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    // Prevent common keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent Ctrl+C, Ctrl+V, Ctrl+A, Ctrl+Tab, Alt+Tab
      if (
        (e.ctrlKey && ['c', 'v', 'a'].includes(e.key.toLowerCase())) ||
        (e.ctrlKey && e.key === 'Tab') ||
        (e.altKey && e.key === 'Tab') ||
        e.key === 'F11' ||
        e.key === 'Escape'
      ) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    window.addEventListener('blur', handleWindowBlur);
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);

    // Request fullscreen
    enterFullscreen();

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      window.removeEventListener('blur', handleWindowBlur);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);

      // Exit fullscreen on cleanup
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    };
  }, [enabled, enterFullscreen]);

  return { enterFullscreen, isFullscreen };
}
