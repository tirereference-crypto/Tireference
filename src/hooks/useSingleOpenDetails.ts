import { useEffect, type DependencyList, type RefObject } from 'react';

/**
 * Ensures only one <details> element stays open inside a container (accordion behavior).
 * Pass `deps` when details are mounted conditionally (e.g. after comparison is ready).
 */
export function useSingleOpenDetails(
  containerRef: RefObject<HTMLElement | null>,
  deps: DependencyList = [],
) {
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

    const syncAria = () => {
      items.forEach((item) => {
        const summary = item.querySelector('summary');
        if (summary) summary.setAttribute('aria-expanded', item.open ? 'true' : 'false');
      });
    };

    const onToggleWithAria = (event: Event) => {
      onToggle(event);
      syncAria();
    };

    syncAria();
    items.forEach((item) => item.addEventListener('toggle', onToggleWithAria));
    return () => items.forEach((item) => item.removeEventListener('toggle', onToggleWithAria));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- caller supplies mount deps
  }, [containerRef, ...deps]);
}
