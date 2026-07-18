import { useMemo } from 'react';
import {
  CALCULATOR_PATHS,
  getRelatedCalculatorLinks,
  type CalculatorIcon,
} from '../../../lib/calculator-links';
import { CALCULATOR_NAMES, trackRelatedCalculatorClick } from '../../../lib/analytics';

/** Concise related-tool blurbs (≤ two lines at card width). */
const SHORT_DESCRIPTIONS: Partial<Record<string, string>> = {
  [CALCULATOR_PATHS.tireSize]: 'Convert a size code into diameter, width, and revs/mile.',
  [CALCULATOR_PATHS.tireComparison]: 'Compare two sizes for diameter change and fitment.',
  [CALCULATOR_PATHS.wheelOffset]: 'Check offset, poke, and clearance before buying wheels.',
  [CALCULATOR_PATHS.gearRatio]: 'Estimate gearing change after a diameter swap.',
};

function RelatedCalcIcon({ type }: { type: CalculatorIcon }) {
  const props = {
    viewBox: '0 0 24 24',
    width: 22,
    height: 22,
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.75,
    'aria-hidden': true as const,
  };
  switch (type) {
    case 'diameter':
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="8" />
          <path d="M12 4v16M4 12h16" strokeLinecap="round" />
        </svg>
      );
    case 'offset':
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="7" />
          <path d="M12 5v14M8 12h8" strokeLinecap="round" />
        </svg>
      );
    case 'gear':
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="3" />
          <path
            d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4l1.4-1.4M17 7l1.4-1.4"
            strokeLinecap="round"
          />
        </svg>
      );
    case 'speedometer':
      return (
        <svg {...props}>
          <path d="M4.5 17a8.5 8.5 0 1115 0" strokeLinecap="round" />
          <path d="M12 16.5l4.5-6" strokeLinecap="round" />
          <circle cx="12" cy="16.5" r="1.25" fill="currentColor" stroke="none" />
        </svg>
      );
    case 'compare':
      return (
        <svg {...props}>
          <path d="M5 7h14M5 12h14M5 17h10" strokeLinecap="round" />
        </svg>
      );
    case 'size':
    default:
      return (
        <svg {...props}>
          <circle cx="9" cy="14" r="4.5" />
          <circle cx="16" cy="11" r="3.5" />
        </svg>
      );
  }
}

export function DiameterRelatedCalculators() {
  const cards = useMemo(
    () =>
      getRelatedCalculatorLinks(CALCULATOR_PATHS.tireDiameter, {
        limit: 4,
      })
        .filter((card) => card.href !== CALCULATOR_PATHS.tireDiameter)
        .slice(0, 4)
        .map((card) => ({
          ...card,
          description: SHORT_DESCRIPTIONS[card.href] ?? card.description,
        })),
    [],
  );

  if (cards.length === 0) return null;

  return (
    <section className="dia-related" aria-label="Related calculators">
      <h2 className="dia-section-title">Related Calculators</h2>
      <div
        className="dia-related__grid"
        style={{ ['--related-count' as string]: Math.min(cards.length, 4) }}
      >
        {cards.map((card) => (
          <a
            key={card.href}
            href={card.href}
            className="dia-related__card"
            onClick={() =>
              trackRelatedCalculatorClick(card.href, CALCULATOR_NAMES.tireDiameter)
            }
          >
            <span className="dia-related__icon" aria-hidden="true">
              <RelatedCalcIcon type={card.icon} />
            </span>
            <span className="dia-related__label">{card.label}</span>
            <span className="dia-related__desc">{card.description}</span>
            <span className="dia-related__arrow" aria-hidden="true">
              →
            </span>
          </a>
        ))}
      </div>
    </section>
  );
}
