import { useEffect, useState, type RefObject } from 'react';

/** Show sticky compare bar only after result cards leave the viewport. */
export function useStickyCompareBar(
  cardsRef: RefObject<HTMLElement | null>,
  enabled: boolean,
): boolean {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setVisible(false);
      return;
    }

    const cardsEl = cardsRef.current;
    if (!cardsEl) return;

    const footer = document.querySelector('footer');
    const trustEl = document.querySelector('.tsc-trust');

    let cardsInView = true;
    let footerInView = false;
    let trustInView = false;

    const sync = () => {
      setVisible(enabled && !cardsInView && !footerInView && !trustInView);
    };

    const cardsObserver = new IntersectionObserver(
      ([entry]) => {
        cardsInView = entry.isIntersecting;
        sync();
      },
      { threshold: 0 },
    );

    cardsObserver.observe(cardsEl);

    const hideObservers: IntersectionObserver[] = [];

    for (const el of [footer, trustEl]) {
      if (!el) continue;
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (el === footer) footerInView = entry.isIntersecting;
          if (el === trustEl) trustInView = entry.isIntersecting;
          sync();
        },
        { threshold: 0 },
      );
      observer.observe(el);
      hideObservers.push(observer);
    }

    return () => {
      cardsObserver.disconnect();
      for (const observer of hideObservers) {
        observer.disconnect();
      }
    };
  }, [enabled, cardsRef]);

  return visible;
}
