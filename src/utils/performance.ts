import { useState, useEffect } from 'react';

/**
 * Progressive Viewport Rendering Hook
 * Prioritizes rendering the active visible viewport (initialCount) immediately,
 * and progressively renders off-screen elements in lightweight subsequent animation frames.
 * Prevents main thread stalls and UI lag when loading large subtitle tables.
 */
export function useProgressiveRenderList<T>(
  items: T[],
  initialCount = 15,
  batchSize = 25,
  immediateIndex?: number
): T[] {
  const [renderedCount, setRenderedCount] = useState<number>(() => {
    if (!items || items.length === 0) return 0;
    const minNeeded = immediateIndex !== undefined && immediateIndex >= 0 ? immediateIndex + 1 : initialCount;
    return Math.min(Math.max(minNeeded, initialCount), items.length);
  });

  const itemsLength = items ? items.length : 0;

  useEffect(() => {
    if (!items || items.length === 0) {
      setRenderedCount(0);
      return;
    }

    const minNeeded = immediateIndex !== undefined && immediateIndex >= 0 ? immediateIndex + 1 : initialCount;
    const initial = Math.min(Math.max(minNeeded, initialCount), items.length);
    setRenderedCount(initial);

    if (initial >= items.length) return;

    let rafId: number;
    let current = initial;

    const renderNext = () => {
      current = Math.min(current + batchSize, items.length);
      setRenderedCount(current);
      if (current < items.length) {
        rafId = requestAnimationFrame(renderNext);
      }
    };

    rafId = requestAnimationFrame(renderNext);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [itemsLength, initialCount, batchSize, immediateIndex]);

  return items ? items.slice(0, renderedCount) : [];
}
