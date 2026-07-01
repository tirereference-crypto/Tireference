import { useEffect, useState, type RefObject } from 'react';

const MOBILE_QUERY = '(max-width: 767px)';

export interface UseStickyAnalyzeButtonOptions {
  /** When false, sticky CTA never shows (e.g. desktop-only calculators). */
  enabled?: boolean;
  /** When true, results section is considered "ready" for hide-on-visible logic. */
  resultsReady?: boolean;
}

/**
 * Shows a sticky bottom Analyze CTA on mobile when the form scrolls out of view
 * and hides it once the results anchor enters the viewport.
 */
export function useStickyAnalyzeButton(
  formRef: RefObject<HTMLElement | null>,
  resultsRef: RefObject<HTMLElement | null>,
  { enabled = true, resultsReady = false }: UseStickyAnalyzeButtonOptions = {},
) {
  const [visible, setVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(MOBILE_QUERY);
    const sync = () => setIsMobile(media.matches);
    sync();
    media.addEventListener('change', sync);
    return () => media.removeEventListener('change', sync);
  }, []);

  useEffect(() => {
    if (!enabled || !isMobile) {
      setVisible(false);
      return;
    }

    const formEl = formRef.current;
    if (!formEl) return;

    const update = () => {
      const formRect = formEl.getBoundingClientRect();
      const formPast = formRect.bottom < 72;

      let resultsInView = false;
      const resultsEl = resultsRef.current;
      if (resultsEl && resultsReady) {
        const resultsRect = resultsEl.getBoundingClientRect();
        resultsInView = resultsRect.top < window.innerHeight * 0.85;
      }

      setVisible(formPast && !resultsInView);
    };

    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update, { passive: true });
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, [enabled, isMobile, formRef, resultsRef, resultsReady]);

  return visible && isMobile;
}
