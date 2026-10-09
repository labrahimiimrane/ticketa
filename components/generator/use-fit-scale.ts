import { useEffect, useRef, useState } from "react";

/**
 * Scale (never above 1) that fits `contentWidth` into the observed element's
 * content box. Null until the browser has measured it.
 */
export function useFitScale<T extends HTMLElement>(contentWidth: number) {
  const ref = useRef<T>(null);
  const [scale, setScale] = useState<number | null>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      setScale(Math.min(1, entry.contentRect.width / contentWidth));
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [contentWidth]);

  return [ref, scale] as const;
}
