/**
 * Lower-page sections for the Tire Size Comparison Calculator (Prompt 6).
 * Presentation-only — no formula or verdict changes.
 */
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  CALCULATOR_PATHS,
  getRelatedCalculatorLinks,
  type CalculatorIcon,
} from '../../lib/calculator-links';
import { buildAlternativeComparisonPaths } from '../../lib/comparison-alternative-paths';
import { CALCULATION_LOGIC_UPDATED, formatMonthYear, REPORT_ISSUE_PATH } from '../../lib/eeat-metadata';
import { SITE_NAME } from '../../lib/site-brand';
import type { UnitSystem } from '../../lib/calculator-types';
import type { VehicleFitmentDisplay } from '../../lib/tire-comparison-types';
import { trackRelatedCalculatorClick, CALCULATOR_NAMES, type CalculatorName } from '../../lib/analytics';
import { reportIssuePath } from '../../lib/tire-size-calculator-report';

const VEHICLE_DISCLAIMER =
  'Vehicle associations reflect commonly indexed applications and do not confirm fitment for a specific year, trim, wheel width, offset or suspension setup.';

const VEHICLE_DISPLAY_LIMIT = 5;

const ALT_PATHS_SAFETY_NOTE =
  'Alternative sizes are dimensional comparisons only. Verify wheel width, load rating, offset and vehicle clearance.';

function RelatedCalcIcon({ type }: { type: CalculatorIcon }) {
  const props = {
    viewBox: '0 0 24 24',
    width: 28,
    height: 28,
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

function VehicleRowIcon() {
  return (
    <svg
      className="cmp-vehicle-compat__row-icon"
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden="true"
    >
      <path
        d="M4 15.5h16M6 15.5V11l2.2-3.5h7.6L18 11v4.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <circle cx="8" cy="16.25" r="1.35" />
      <circle cx="16" cy="16.25" r="1.35" />
    </svg>
  );
}

function VehicleAssociationColumn({
  variant,
  size,
  vehicles,
}: {
  variant: 'original' | 'new';
  size: string;
  vehicles: VehicleFitmentDisplay[];
}) {
  const [expanded, setExpanded] = useState(false);
  const title = variant === 'original' ? 'Original Tire' : 'New Tire';
  const visible = expanded ? vehicles : vehicles.slice(0, VEHICLE_DISPLAY_LIMIT);
  const remaining = Math.max(0, vehicles.length - VEHICLE_DISPLAY_LIMIT);
  const countLabel =
    vehicles.length === 0
      ? 'No indexed associations'
      : vehicles.length === 1
        ? '1 indexed association'
        : `${vehicles.length} indexed associations`;

  return (
    <div className={`cmp-vehicle-compat__column cmp-vehicle-compat__column--${variant}`}>
      <header className="cmp-vehicle-compat__column-head">
        <p className={`cmp-vehicle-compat__identity cmp-vehicle-compat__identity--${variant}`}>
          <span className="cmp-vehicle-compat__identity-label">{title}</span>
          <span className="cmp-vehicle-compat__identity-size">{size}</span>
        </p>
        <p className="cmp-vehicle-compat__count">{countLabel}</p>
      </header>

      {vehicles.length > 0 ? (
        <>
          <ul className="cmp-vehicle-compat__rows">
            {visible.map((vehicle, index) => (
              <li
                key={`${vehicle.label}-${vehicle.detail}-${index}`}
                className="cmp-vehicle-compat__row"
              >
                <span className="cmp-vehicle-compat__row-icon-wrap" aria-hidden="true">
                  <VehicleRowIcon />
                </span>
                <span className="cmp-vehicle-compat__row-copy">
                  <span className="cmp-vehicle-compat__name">{vehicle.label}</span>
                  {vehicle.detail ? (
                    <span className="cmp-vehicle-compat__detail">{vehicle.detail}</span>
                  ) : null}
                </span>
              </li>
            ))}
          </ul>
          {remaining > 0 ? (
            <button
              type="button"
              className="cmp-vehicle-compat__more"
              onClick={() => setExpanded((value) => !value)}
              aria-expanded={expanded}
            >
              {expanded ? 'Show fewer' : `View more (${remaining})`}
            </button>
          ) : null}
        </>
      ) : (
        <p className="cmp-vehicle-compat__sparse">
          No commonly indexed vehicle associations for this size yet.
        </p>
      )}
    </div>
  );
}

export function ComparisonVehicleAssociations({
  sizeA,
  sizeB,
  vehiclesA,
  vehiclesB,
}: {
  sizeA: string;
  sizeB: string;
  vehiclesA: VehicleFitmentDisplay[];
  vehiclesB: VehicleFitmentDisplay[];
}) {
  if (vehiclesA.length === 0 && vehiclesB.length === 0) return null;

  return (
    <section className="cmp-lower-section cmp-vehicle-compat" aria-label="Common vehicle associations">
      <h2 className="cmp-lower-section__title">Common Vehicle Associations</h2>
      <div className="cmp-vehicle-compat__panel">
        <div className="cmp-vehicle-compat__columns">
          <VehicleAssociationColumn variant="original" size={sizeA} vehicles={vehiclesA} />
          <VehicleAssociationColumn variant="new" size={sizeB} vehicles={vehiclesB} />
        </div>
      </div>
      <p className="cmp-vehicle-compat__note">{VEHICLE_DISCLAIMER}</p>
    </section>
  );
}

function AlternativePathCard({
  card,
  compact = false,
  onSelectSize,
}: {
  card: ReturnType<typeof buildAlternativeComparisonPaths>[number];
  compact?: boolean;
  onSelectSize?: (size: string) => void;
}) {
  const sameWheel = card.wheelBadge === 'Same Wheel';

  return (
    <a
      className={`cmp-alt-paths__card cmp-alt-paths__card--${sameWheel ? 'same' : 'diff'}${compact ? ' cmp-alt-paths__card--compact' : ''}`}
      href={card.compareHref}
      onClick={(event) => {
        if (!onSelectSize) return;
        event.preventDefault();
        onSelectSize(card.size);
      }}
    >
      <p className="cmp-alt-paths__role">{card.roleLabel}</p>
      <p className="cmp-alt-paths__size">{card.size}</p>
      <div className="cmp-alt-paths__diameter">
        <span className="cmp-alt-paths__diameter-label">Diameter difference</span>
        <span className="cmp-alt-paths__diameter-value">{card.diameterDiff}</span>
      </div>
      <div className="cmp-alt-paths__wheel-row">
        <span className="cmp-alt-paths__wheel-diam">{card.wheelDiameter} wheel</span>
        <span
          className={`cmp-alt-paths__badge cmp-alt-paths__badge--${sameWheel ? 'same' : 'diff'}`}
        >
          {card.wheelBadge}
        </span>
      </div>
      {compact ? null : (
        <p className="cmp-alt-paths__width">
          <span className="cmp-alt-paths__width-label">Width difference</span>
          <span className="cmp-alt-paths__width-value">{card.widthDiff}</span>
        </p>
      )}
      <span className="cmp-alt-paths__action">
        Compare <span aria-hidden="true">→</span>
      </span>
    </a>
  );
}

function AlternativePathsCarousel({
  cards,
  compact = false,
  onSelectSize,
}: {
  cards: ReturnType<typeof buildAlternativeComparisonPaths>;
  compact?: boolean;
  onSelectSize?: (size: string) => void;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [overflow, setOverflow] = useState(false);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const gridCount = Math.min(Math.max(cards.length, 1), compact ? 4 : 5);

  const updateOverflow = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const hasOverflow = el.scrollWidth > el.clientWidth + 2;
    setOverflow(hasOverflow);
    setCanPrev(el.scrollLeft > 2);
    setCanNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 2);
  }, []);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    updateOverflow();
    const ro = new ResizeObserver(() => updateOverflow());
    ro.observe(el);
    el.addEventListener('scroll', updateOverflow, { passive: true });
    return () => {
      ro.disconnect();
      el.removeEventListener('scroll', updateOverflow);
    };
  }, [cards, updateOverflow]);

  const scrollByPage = (dir: -1 | 1) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.max(el.clientWidth * 0.75, 200), behavior: 'smooth' });
  };

  return (
    <>
      <div
        className={`cmp-alt-paths__wrap${overflow ? ' cmp-alt-paths__wrap--overflow' : ''}${compact ? ' cmp-alt-paths__wrap--compact' : ''}`}
      >
        {overflow && !compact ? (
          <div className="cmp-alt-paths__controls" aria-hidden={!overflow}>
            <button
              type="button"
              className="cmp-alt-paths__nav"
              onClick={() => scrollByPage(-1)}
              disabled={!canPrev}
              aria-label="Previous alternatives"
            >
              ‹
            </button>
            <button
              type="button"
              className="cmp-alt-paths__nav"
              onClick={() => scrollByPage(1)}
              disabled={!canNext}
              aria-label="Next alternatives"
            >
              ›
            </button>
          </div>
        ) : null}
        <div
          ref={scrollerRef}
          className="cmp-alt-paths__row"
          data-count={gridCount}
          style={{ ['--alt-count' as string]: gridCount }}
        >
          {cards.map((card) => (
            <AlternativePathCard
              key={card.id}
              card={card}
              compact={compact}
              onSelectSize={onSelectSize}
            />
          ))}
        </div>
      </div>
      <p className="cmp-alt-paths__note">{ALT_PATHS_SAFETY_NOTE}</p>
    </>
  );
}

export function ComparisonAlternativePaths({
  baseSize,
  unitSystem,
  variant = 'default',
  limit = 8,
  onSelectSize,
}: {
  baseSize: string;
  unitSystem: UnitSystem;
  variant?: 'default' | 'compact';
  limit?: number;
  /** When set, Compare updates the calculator in place instead of a full navigation. */
  onSelectSize?: (size: string) => void;
}) {
  const paths = useMemo(
    () => buildAlternativeComparisonPaths(baseSize, unitSystem, limit),
    [baseSize, unitSystem, limit],
  );

  if (paths.length === 0) return null;

  const compact = variant === 'compact';
  const sectionClass = compact
    ? 'cmp-card cmp-card-level-secondary cmp-alt-paths cmp-alt-paths--compact'
    : 'cmp-lower-section cmp-alt-paths';
  const titleClass = compact ? 'cmp-card__title' : 'cmp-lower-section__title';

  return (
    <section
      id="cmp-alt-paths"
      className={sectionClass}
      aria-label="Alternative comparison paths"
    >
      <h2 className={titleClass}>Alternative Comparison Paths</h2>
      {compact ? null : (
        <p className="cmp-lower-section__lead">
          Related sizes from the Tire Reference database versus {baseSize}.
        </p>
      )}
      <AlternativePathsCarousel cards={paths} compact={compact} onSelectSize={onSelectSize} />
    </section>
  );
}

/** FAQ answer body: short paragraphs; highlight dynamic measurement callouts. */
function FaqAnswerBody({ answer }: { answer: string }) {
  const paragraphs = answer.split(/\n\n+/).map((p) => p.trim()).filter(Boolean);
  return (
    <>
      {paragraphs.map((para, index) => {
        const isCallout =
          /^At an indicated\b/i.test(para) ||
          /^Applied here:/i.test(para) ||
          /^For this pair,/i.test(para) ||
          /^For this pair, half the overall/i.test(para);
        return (
          <p key={index} className={isCallout ? 'cmp-faq__callout' : undefined}>
            {emphasizeFaqTerms(para)}
          </p>
        );
      })}
    </>
  );
}

const FAQ_EMPHASIS_TERMS = [
  'approved rim-width range',
  'rolling circumference',
  'overall diameter',
  'section width',
  'sidewall height',
  'aspect ratio',
  'bead seat',
  'nominal',
  'published',
] as const;

function emphasizeFaqTerms(text: string): ReactNode {
  const pattern = new RegExp(`\\b(${FAQ_EMPHASIS_TERMS.map(escapeRegExp).join('|')})\\b`, 'gi');
  const nodes: ReactNode[] = [];
  let last = 0;
  let match: RegExpExecArray | null;
  let key = 0;
  while ((match = pattern.exec(text)) !== null) {
    if (match.index > last) nodes.push(text.slice(last, match.index));
    nodes.push(<strong key={key++}>{match[0]}</strong>);
    last = match.index + match[0].length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes.length > 0 ? nodes : text;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <details
      className="cmp-faq__item"
      onToggle={(e) => setOpen((e.currentTarget as HTMLDetailsElement).open)}
    >
      <summary aria-expanded={open}>
        <span className="cmp-faq__question">{question}</span>
        <span className="cmp-faq__chevron" aria-hidden="true" />
      </summary>
      <div className="cmp-faq__answer">
        <FaqAnswerBody answer={answer} />
      </div>
    </details>
  );
}

const FAQ_PRIMARY_COUNT = 8;

function splitBalancedColumns<T>(items: T[]): [T[], T[]] {
  const mid = Math.ceil(items.length / 2);
  return [items.slice(0, mid), items.slice(mid)];
}

export function ComparisonFaqSection({
  faqs,
}: {
  faqs: Array<{ question: string; answer: string }>;
}) {
  const [showAll, setShowAll] = useState(false);

  if (faqs.length === 0) return null;

  const primary = faqs.slice(0, FAQ_PRIMARY_COUNT);
  const extra = faqs.slice(FAQ_PRIMARY_COUNT);
  const [leftPrimary, rightPrimary] = splitBalancedColumns(primary);
  const [leftExtra, rightExtra] = splitBalancedColumns(extra);

  return (
    <section className="cmp-lower-section cmp-seo-block--faq" aria-label="Frequently asked questions">
      <h2 className="cmp-lower-section__title">Frequently Asked Questions</h2>
      <div className="cmp-faq cmp-faq--columns">
        <div className="cmp-faq__col">
          {leftPrimary.map((faq) => (
            <FaqItem key={faq.question} question={faq.question} answer={faq.answer} />
          ))}
        </div>
        <div className="cmp-faq__col">
          {rightPrimary.map((faq) => (
            <FaqItem key={faq.question} question={faq.question} answer={faq.answer} />
          ))}
        </div>
      </div>
      {extra.length > 0 ? (
        <div className="cmp-faq__more">
          <div
            id="cmp-faq-extra"
            className={`cmp-faq cmp-faq--columns cmp-faq--extra${showAll ? ' cmp-faq--extra-visible' : ''}`}
            hidden={!showAll}
          >
            <div className="cmp-faq__col">
              {leftExtra.map((faq) => (
                <FaqItem key={faq.question} question={faq.question} answer={faq.answer} />
              ))}
            </div>
            <div className="cmp-faq__col">
              {rightExtra.map((faq) => (
                <FaqItem key={faq.question} question={faq.question} answer={faq.answer} />
              ))}
            </div>
          </div>
          <button
            type="button"
            className="cmp-faq__toggle"
            aria-expanded={showAll}
            aria-controls="cmp-faq-extra"
            onClick={() => setShowAll((v) => !v)}
          >
            {showAll ? 'Show fewer questions' : `Show more questions (${extra.length})`}
          </button>
        </div>
      ) : null}
    </section>
  );
}

export function ComparisonTrustStrip({
  sizeA,
  sizeB,
}: {
  sizeA?: string | null;
  sizeB?: string | null;
}) {
  const pair = sizeA && sizeB ? `${sizeA} vs ${sizeB}` : undefined;
  const reportHref = reportIssuePath({
    size: pair,
    calculator: 'Tire Size Comparison Calculator',
    category: 'incorrect_calculation',
  });
  const sourceMessage = CALCULATION_LOGIC_UPDATED
    ? `Calculator logic updated: ${formatMonthYear(CALCULATION_LOGIC_UPDATED)}`
    : 'Nominal comparison values are calculated from tire size formulas and published catalog fields when available.';

  return (
    <section className="cmp-trust-strip" aria-label="Trust and calculation source">
      <ul className="cmp-trust-strip__list">
        <li>
          Calculated by <a href="/about/">TireReference</a>
          <span className="sr-only"> ({SITE_NAME})</span>
        </li>
        <li>
          <a href={reportHref.startsWith('/') ? reportHref : REPORT_ISSUE_PATH}>
            Report a calculation issue
          </a>
        </li>
        <li>{sourceMessage}</li>
      </ul>
    </section>
  );
}

export function RelatedCalculatorsSection({
  excludeHref = CALCULATOR_PATHS.tireComparison,
  calculatorName = CALCULATOR_NAMES.tireComparison,
  limit = 6,
  orderedHrefs,
}: {
  excludeHref?: string;
  calculatorName?: CalculatorName;
  limit?: number;
  /** Optional preferred href order (still excludes missing/unpublished routes). */
  orderedHrefs?: string[];
} = {}) {
  const cards = useMemo(() => {
    const all = getRelatedCalculatorLinks(excludeHref, { limit: 12 });
    if (!orderedHrefs?.length) return all.slice(0, limit);
    const byHref = new Map(all.map((card) => [card.href, card]));
    const ordered = orderedHrefs
      .map((href) => byHref.get(href))
      .filter((card): card is NonNullable<typeof card> => Boolean(card));
    const remainder = all.filter((card) => !orderedHrefs.includes(card.href));
    return [...ordered, ...remainder].slice(0, limit);
  }, [excludeHref, limit, orderedHrefs]);

  if (cards.length === 0) return null;

  return (
    <section className="cmp-related-calcs" aria-label="Related calculators">
      <h2 className="cmp-lower-section__title">Related Calculators</h2>
      <div
        className="cmp-related-calcs__grid"
        style={{ ['--related-count' as string]: Math.min(Math.max(cards.length, 1), 6) }}
      >
        {cards.map((card) => (
          <a
            key={card.href}
            href={card.href}
            className="cmp-related-calcs__card cmp-card-level-supporting"
            onClick={() => trackRelatedCalculatorClick(card.href, calculatorName)}
          >
            <span className="cmp-related-calcs__icon" aria-hidden="true">
              <RelatedCalcIcon type={card.icon} />
            </span>
            <span className="cmp-related-calcs__body">
              <span className="cmp-related-calcs__label">{card.label}</span>
              <span className="cmp-related-calcs__desc">{card.description}</span>
              <span className="cmp-related-calcs__action">Open Calculator</span>
            </span>
          </a>
        ))}
      </div>
    </section>
  );
}

export function ComparisonRelatedCalculators() {
  return <RelatedCalculatorsSection />;
}

export function ComparisonPopularPairs({
  links,
  viewAllHref,
}: {
  links: Array<{ href: string; label: string }>;
  viewAllHref?: string | null;
}) {
  if (links.length === 0) return null;

  const display = links.slice(0, 6);

  return (
    <section className="cmp-lower-section cmp-popular-pairs" aria-label="Popular comparison pairs">
      <h2 className="cmp-lower-section__title">Popular Comparison Pairs</h2>
      <p className="cmp-lower-section__lead">
        Common size upgrades from the Tire Reference database.
      </p>
      <div className="cmp-popular-pairs__grid">
        {display.map((link) => (
          <a key={link.href} href={link.href} className="cmp-popular-pairs__link">
            {link.label}
          </a>
        ))}
      </div>
      {viewAllHref ? (
        <p className="cmp-popular-pairs__footer">
          <a href={viewAllHref}>View all tire comparisons</a>
        </p>
      ) : null}
    </section>
  );
}
