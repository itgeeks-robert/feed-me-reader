import React, { useRef } from 'react';

interface SwipeInput {
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
}

const SWIPE_THRESHOLD = 50; // Minimum distance for a swipe

export const useSwipe = ({ onSwipeLeft, onSwipeRight }: SwipeInput) => {
  const touchStart = useRef<number | null>(null);
  const touchEnd = useRef<number | null>(null);
  const isSwiping = useRef(false);
  const startY = useRef<number | null>(null);

  const onTouchStart = (e: React.TouchEvent) => {
    touchEnd.current = null;
    touchStart.current = e.targetTouches[0].clientX;
    startY.current = e.targetTouches[0].clientY;
    isSwiping.current = false;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (!touchStart.current || !startY.current) {
      return;
    }
    
    const currentX = e.targetTouches[0].clientX;
    const currentY = e.targetTouches[0].clientY;
    const diffX = touchStart.current - currentX;
    const diffY = startY.current - currentY;

    // Determine if it's a horizontal swipe
    if (Math.abs(diffX) > Math.abs(diffY)) {
        isSwiping.current = true;
        // This can be used to prevent vertical scroll if needed,
        // though modern browsers often handle this well.
        // For explicit control, you might call e.preventDefault() here,
        // but be cautious as it can block intended vertical scrolling.
        e.preventDefault();
    }
    
    touchEnd.current = currentX;
  };

  const onTouchEnd = () => {
    if (!touchStart.current || !touchEnd.current || !isSwiping.current) {
      return;
    }

    const distance = touchStart.current - touchEnd.current;
    const isLeftSwipe = distance > SWIPE_THRESHOLD;
    const isRightSwipe = distance < -SWIPE_THRESHOLD;

    if (isLeftSwipe) {
      onSwipeLeft();
    } else if (isRightSwipe) {
      onSwipeRight();
    }

    touchStart.current = null;
    touchEnd.current = null;
    startY.current = null;
    isSwiping.current = false;
  };

  return {
    onTouchStart,
    onTouchMove,
    onTouchEnd,
  };
};