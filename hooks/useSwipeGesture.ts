import { useState, useEffect, useRef, RefObject } from 'react';
import { soundService } from '../services/soundService';

interface SwipeOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  threshold?: number;
}

/**
 * Hook for detecting touch swipes on a ref element.
 */
export function useSwipeGesture(ref: RefObject<HTMLElement>, options: SwipeOptions) {
  const [isSwiping, setIsSwiping] = useState(false);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const { onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, threshold = 50 } = options;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const handleTouchStart = (e: TouchEvent) => {
      touchStart.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };
      setIsSwiping(true);
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!touchStart.current) return;

      const touchEnd = {
        x: e.changedTouches[0].clientX,
        y: e.changedTouches[0].clientY,
      };

      const dx = touchEnd.x - touchStart.current.x;
      const dy = touchEnd.y - touchStart.current.y;
      const adx = Math.abs(dx);
      const ady = Math.abs(dy);

      // Check if swipe is directional enough (1.5x secondary axis)
      if (adx > threshold && adx > ady * 1.5) {
        if (dx > 0) onSwipeRight?.();
        else onSwipeLeft?.();
      } else if (ady > threshold && ady > adx * 1.5) {
        if (dy > 0) onSwipeDown?.();
        else onSwipeUp?.();
      }

      touchStart.current = null;
      setIsSwiping(false);
    };

    el.addEventListener('touchstart', handleTouchStart, { passive: true });
    el.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      el.removeEventListener('touchstart', handleTouchStart);
      el.removeEventListener('touchend', handleTouchEnd);
    };
  }, [ref, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, threshold]);

  return { isSwiping };
}

/**
 * Composed hook for article-specific swipe actions.
 * Right-swipe: bookmark
 * Up-swipe: open reader
 */
export function useArticleSwipe(
  ref: RefObject<HTMLElement>,
  articleId: string,
  onBookmark: (id: string) => void,
  onOpenReader: (id: string) => void
) {
  return useSwipeGesture(ref, {
    onSwipeRight: () => {
      soundService.playPop();
      onBookmark(articleId);
    },
    onSwipeUp: () => {
      soundService.playPop();
      onOpenReader(articleId);
    },
  });
}
