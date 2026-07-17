import { forwardRef, type ReactNode } from 'react';
import type { DisplayUnits } from '../../../lib/calculator-types';
import type { TireSpecs } from '../../../lib/tire-math';
import CalculatorLinkActions from '../CalculatorLinkActions';
import { buildCalculatorResultCards, type ResultCardKey } from './resultCards';

/** Consistent tire-measurement icon family (viewBox 24×24). */
const ICONS: Record<ResultCardKey, ReactNode> = {
  diameter: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 3.5v17" />
      <path d="M9.5 3.5h5M9.5 20.5h5" />
    </>
  ),
  width: (
    <>
      <path d="M4 8v8M20 8v8" />
      <path d="M4 12h16" />
      <path d="M7 9.5h10v5H7z" opacity="0.35" />
    </>
  ),
  sidewall: (
    <>
      <path d="M7 4v16M17 4v16" />
      <path d="M7 12h10" />
      <path d="M5.5 4h3M5.5 20h3M15.5 4h3M15.5 20h3" />
    </>
  ),
  circumference: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 12l5.5-5.5" />
      <circle cx="12" cy="12" r="1.25" fill="currentColor" stroke="none" />
    </>
  ),
  revs: (
    <>
      <circle cx="12" cy="12" r="3.5" />
      <path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3" />
      <path d="M5.2 5.2l2.1 2.1M16.7 16.7l2.1 2.1M5.2 18.8l2.1-2.1M16.7 7.3l2.1-2.1" />
    </>
  ),
  wheel: (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="3.25" />
      <path d="M12 3v3.5M12 17.5V21M3 12h3.5M17.5 12H21" />
    </>
  ),
};

function SpecIcon({ iconKey }: { iconKey: ResultCardKey }) {
  return (
    <svg
      className="tsc-result-card__svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {ICONS[iconKey]}
    </svg>
  );
}

export const CalculatorResults = forwardRef<
  HTMLDivElement,
  {
    specs: TireSpecs;
    displayUnits: DisplayUnits;
    shareTitle: string;
  }
>(function CalculatorResults({ specs, displayUnits, shareTitle }, ref) {
  const cards = buildCalculatorResultCards(specs, displayUnits);

  return (
    <section className="tsc-results" aria-label="Calculated specifications">
      <div className="tsc-results__header">
        <h2 className="tsc-results__title">Calculated Dimensions</h2>
        <div className="tsc-results__toolbar">
          <CalculatorLinkActions shareTitle={shareTitle} />
        </div>
      </div>
      <div ref={ref} className="tsc-results__grid">
        {cards.map((card) => (
          <article
            key={card.key}
            className="tsc-result-card"
            title={card.tooltip}
          >
            <span className="tsc-result-card__icon">
              <SpecIcon iconKey={card.key} />
            </span>
            <p className="tsc-result-card__label">{card.label}</p>
            <p className="tsc-result-card__primary">{card.primary}</p>
            {card.secondary ? (
              <p className="tsc-result-card__secondary">{card.secondary}</p>
            ) : null}
            {card.tooltip ? (
              <span className="sr-only">{card.tooltip}</span>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
});
