import { useEffect, type RefObject } from 'react';

/**
 * Ensures only one <details> element stays open inside a container (accordion behavior).
 */
export function useSingleOpenDetails(containerRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const items = Array.from(container.querySelectorAll<HTMLDetailsElement>('details'));

    const onToggle = (event: Event) => {
      const target = event.target as HTMLDetailsElement;
      if (!target.open) return;
      items.forEach((item) => {
        if (item !== target) item.open = false;
      });
    };

    items.forEach((item) => item.addEventListener('toggle', onToggle));
    return () => items.forEach((item) => item.removeEventListener('toggle', onToggle));
  }, [containerRef]);
}
