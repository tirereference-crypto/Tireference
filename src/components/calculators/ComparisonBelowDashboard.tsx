import type { UnitSystem } from '../../lib/calculator-types';
import {
  buildDashboardImpactCards,
  buildDashboardWhatChangesContent,
  buildPairSpecificChecklistGroups,
} from '../../lib/comparison-dashboard-impact';
import { FITMENT_DIAMETER_PCT } from '../../lib/tire-comparison-fitment';
import type { TireComparison, TireSpecs } from '../../lib/tire-math';
import { useMemo } from 'react';
import { ComparisonAlternativePaths } from './ComparisonLowerPage';

function ImpactIcon({ id }: { id: string }) {
  const props = {
    viewBox: '0 0 24 24',
    width: 22,
    height: 22,
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    'aria-hidden': true as const,
  };

  switch (id) {
    case 'speedometer':
      return (
        <svg {...props}>
          <path d="M12 19a7 7 0 1 0-7-7" strokeLinecap="round" />
          <path d="M12 12l4-3" strokeLinecap="round" />
        </svg>
      );
    case 'clearance':
      return (
        <svg {...props}>
          <path d="M4 16h16M7 16V9l5-4 5 4v7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'sidewall':
      return (
        <svg {...props}>
          <path d="M5 12c2-4 4-6 7-6s5 2 7 6-4 6-7 6-5-2-7-6z" strokeLinejoin="round" />
        </svg>
      );
    case 'gearing':
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="3" />
          <path
            d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4l1.4-1.4M17 7l1.4-1.4"
            strokeLinecap="round"
          />
        </svg>
      );
    case 'wheel':
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="7" />
          <circle cx="12" cy="12" r="2.5" />
        </svg>
      );
    case 'install':
      return (
        <svg {...props}>
          <path d="M9 7h6M9 12h6M9 17h4" strokeLinecap="round" />
          <path d="M5 5h14v14H5z" strokeLinejoin="round" />
        </svg>
      );
    default:
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="7" />
          <circle cx="12" cy="12" r="2.5" />
        </svg>
      );
  }
}

function InsightBlockIcon({ id }: { id: string }) {
  return (
    <span className="cmp-insight-blocks__icon" aria-hidden="true">
      <ImpactIcon
        id={
          id === 'gearing-clearance'
            ? 'gearing'
            : id === 'width'
              ? 'sidewall'
              : id === 'wheel'
                ? 'wheel'
                : id
        }
      />
    </span>
  );
}

function ChecklistGroupIcon({ id }: { id: string }) {
  const props = {
    viewBox: '0 0 24 24',
    width: 20,
    height: 20,
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.85,
    'aria-hidden': true as const,
  };

  if (id === 'wheel-spec') {
    return (
      <svg {...props}>
        <circle cx="12" cy="12" r="7.25" />
        <circle cx="12" cy="12" r="2.5" />
        <path d="M12 4.75v2.1M12 17.15v2.1M4.75 12h2.1M17.15 12h2.1" strokeLinecap="round" />
      </svg>
    );
  }

  if (id === 'clearance') {
    return (
      <svg {...props}>
        <path d="M4 17h16M6.5 17V11l5.5-4 5.5 4v6" strokeLinejoin="round" strokeLinecap="round" />
        <path d="M9.5 17v-3.25h5V17" strokeLinejoin="round" />
      </svg>
    );
  }

  return (
    <svg {...props}>
      <circle cx="12" cy="12" r="8" />
      <path d="M8.25 12.25l2.4 2.4 5.1-5.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ComparisonBelowDashboard({
  sizeA,
  sizeB,
  specsA,
  specsB,
  comparison,
  unitSystem,
  onSelectAlternativeSize,
}: {
  sizeA: string;
  sizeB: string;
  specsA: TireSpecs;
  specsB: TireSpecs;
  comparison: TireComparison;
  unitSystem: UnitSystem;
  onSelectAlternativeSize?: (size: string) => void;
}) {
  const cards = useMemo(
    () => buildDashboardImpactCards({ comparison, specsA, specsB, unitSystem }),
    [comparison, specsA, specsB, unitSystem],
  );

  const whatChanges = useMemo(
    () => buildDashboardWhatChangesContent(sizeA, sizeB, comparison, specsA, specsB),
    [sizeA, sizeB, comparison, specsA, specsB],
  );
  const checklistGroups = useMemo(
    () => buildPairSpecificChecklistGroups(sizeA, sizeB, comparison, specsA, specsB),
    [sizeA, sizeB, comparison, specsA, specsB],
  );

  return (
    <div className="cmp-below-dashboard">
      <section
        className="cmp-card cmp-below-dashboard__impact cmp-card-level-secondary"
        aria-label="Driving and vehicle impact"
      >
        <h2 className="cmp-card__title">Driving &amp; Vehicle Impact</h2>
        <div className="cmp-impact-grid cmp-impact-grid--dashboard">
          {cards.map((card) => (
            <article key={card.id} className="cmp-impact-card cmp-card-level-secondary">
              <div className="cmp-impact-card__head">
                <span className="cmp-impact-card__icon" aria-hidden="true">
                  <ImpactIcon id={card.id} />
                </span>
                <p className="cmp-impact-card__title">{card.title}</p>
              </div>
              <p className="cmp-impact-card__value">{card.value}</p>
              <p className="cmp-impact-card__status">{card.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <div className="cmp-below-dashboard__split">
        <div className="cmp-below-dashboard__left">
          {checklistGroups.length > 0 ? (
            <section
              className="cmp-card cmp-below-dashboard__checklist cmp-card-level-secondary"
              aria-label="Pair-specific checks"
            >
              <h2 className="cmp-card__title">Checks Triggered by This Comparison</h2>
              <div className="cmp-check-mini-grid">
                {checklistGroups.map((group) => (
                  <article key={group.id} className="cmp-check-mini-card">
                    <header className="cmp-check-mini-card__head">
                      <span className={`cmp-check-mini-card__icon cmp-check-mini-card__icon--${group.id}`}>
                        <ChecklistGroupIcon id={group.id} />
                      </span>
                      <h3 className="cmp-check-mini-card__title">{group.title}</h3>
                    </header>
                    <ul className="cmp-check-mini-card__list">
                      {group.items.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </article>
                ))}
              </div>
              <p className="cmp-check-screening-note" role="note">
                The ±{FITMENT_DIAMETER_PCT.pass}% diameter threshold is a comparison screen, not
                confirmed vehicle fitment.
              </p>
            </section>
          ) : null}

          <ComparisonAlternativePaths
            baseSize={sizeA}
            comparedSize={sizeB}
            unitSystem={unitSystem}
            variant="compact"
            limit={4}
            onSelectSize={onSelectAlternativeSize}
          />
        </div>

        <article
          className="cmp-card cmp-below-dashboard__explain cmp-card-level-secondary"
          aria-labelledby="cmp-what-changes-heading"
        >
          <h2 id="cmp-what-changes-heading" className="cmp-card__title">
            {whatChanges.heading}
          </h2>
          <ul className="cmp-insight-blocks">
            {whatChanges.insights.map((block) => (
              <li key={block.id} className="cmp-insight-blocks__item">
                <InsightBlockIcon id={block.id} />
                <div className="cmp-insight-blocks__body">
                  <h3 className="cmp-insight-blocks__title">{block.title}</h3>
                  {block.sentences.map((sentence, index) => (
                    <p key={`${block.id}-${index}`} className="cmp-insight-blocks__text">
                      {sentence}
                    </p>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        </article>
      </div>
    </div>
  );
}
