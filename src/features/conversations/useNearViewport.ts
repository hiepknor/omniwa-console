import { useEffect, useRef, useState, type RefObject } from 'react';

export function shouldLoadConversationMedia(enabled: boolean, hasMediaId: boolean, nearViewport: boolean, priority: boolean): boolean {
  return enabled && hasMediaId && (priority || nearViewport);
}

export function useNearViewport(priority = false): { ref: RefObject<HTMLDivElement>; nearViewport: boolean } {
  const ref = useRef<HTMLDivElement>(null);
  const [nearViewport, setNearViewport] = useState(priority);

  useEffect(() => {
    if (priority) { setNearViewport(true); return; }
    const node = ref.current;
    if (!node) return;
    if (typeof IntersectionObserver === 'undefined') { setNearViewport(true); return; }
    const observer = new IntersectionObserver(([entry]) => setNearViewport(entry.isIntersecting), { rootMargin: '400px 0px' });
    observer.observe(node);
    return () => observer.disconnect();
  }, [priority]);

  return { ref, nearViewport };
}
