import { useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';

/** Shared horizontal snap carousel with prev/next controls. */
export function TscSectionCarousel({
  children,
  trackVariant = 'related',
  itemCount,
}: {
  children: ReactNode;
  trackVariant?: 'related' | 'popular';
  /** When provided for related sizes, equal-width fill when items fit the row. */
  itemCount?: number;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);
  const [overflows, setOverflows] = useState(false);

  const syncNav = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    const hasOverflow = maxScroll > 8;
    setOverflows(hasOverflow);
    setCanPrev(el.scrollLeft > 8);
    setCanNext(hasOverflow && maxScroll - el.scrollLeft > 8);
  }, []);

  useEffect(() => {
    syncNav();
    const el = trackRef.current;
    if (!el) return;
    el.addEventListener('scroll', syncNav, { passive: true });
    const ro = new ResizeObserver(syncNav);
    ro.observe(el);
    return () => {
      el.removeEventListener('scroll', syncNav);
      ro.disconnect();
    };
  }, [syncNav, children]);

  const scrollByCards = (direction: -1 | 1) => {
    const el = trackRef.current;
    if (!el) return;
    const selector =
      trackVariant === 'popular' ? '.tsc-popular__card' : '[data-carousel-card]';
    const card = el.querySelector<HTMLElement>(selector);
    const delta = (card?.offsetWidth ?? 160) + 10;
    el.scrollBy({ left: direction * delta, behavior: 'smooth' });
  };

  const fillRelated =
    trackVariant === 'related' && typeof itemCount === 'number' && itemCount > 0 && itemCount <= 6;
  const fillPopular =
    trackVariant === 'popular' && typeof itemCount === 'number' && itemCount > 0 && itemCount <= 4;

  const trackStyle: CSSProperties | undefined =
    fillRelated || fillPopular
      ? ({ '--tsc-fill-count': itemCount } as CSSProperties)
      : undefined;

  return (
    <div
      className={`tsc-section-carousel${overflows ? '' : ' tsc-section-carousel--no-scroll'}`}
    >
      {overflows ? (
        <button
          type="button"
          className="tsc-section-carousel__nav tsc-section-carousel__nav--prev"
          aria-label="Show previous items"
          disabled={!canPrev}
          onClick={() => scrollByCards(-1)}
        >
          ‹
        </button>
      ) : null}
      <div
        ref={trackRef}
        className={`tsc-section-carousel__track tsc-section-carousel__track--${trackVariant}${
          ((fillRelated || fillPopular) && !overflows) ? ' tsc-section-carousel__track--fill' : ''
        }`}
        style={trackStyle}
        {...(trackVariant === 'popular' ? { role: 'list' } : {})}
      >
        {children}
      </div>
      {overflows ? (
        <button
          type="button"
          className="tsc-section-carousel__nav tsc-section-carousel__nav--next"
          aria-label="Show more items"
          disabled={!canNext}
          onClick={() => scrollByCards(1)}
        >
          ›
        </button>
      ) : null}
    </div>
  );
}
