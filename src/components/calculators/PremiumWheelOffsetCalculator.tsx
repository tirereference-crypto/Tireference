import { useCallback, useRef } from 'react';
import '../../styles/calculator-offset.css';
import { useStickyAnalyzeButton } from '../../hooks/useStickyAnalyzeButton';
import { useSingleOpenDetails } from '../../hooks/useSingleOpenDetails';
import { CALCULATOR_PATHS } from '../../lib/calculator-links';
import {
  FITMENT_IMPACT_TOPICS,
  FITMENT_QUICK_GUIDE,
  formatOffsetValue,
  formatVerdictRowIcon,
  OFFSET_FAQS,
  RELATED_CALCULATOR_LINKS,
  SEO_FITMENT_CONTENT,
  VEHICLE_OFFSET_PRESETS,
} from '../../lib/wheel-offset-insights';
import { formatSignedIn, formatSignedMm } from '../../lib/wheel-offset-math';
import type { WheelSetupFields } from '../../lib/wheel-offset-math';
import { WheelOffsetFitmentVisual, WheelOffsetTypesExplainer } from './WheelOffsetVisual';
import { useWheelOffsetCalculator } from './useWheelOffsetCalculator';
import { StickyAnalyzeButton } from './StickyAnalyzeButton';
import {
  CALCULATOR_NAMES,
  trackCalculatorCompletedOnce,
  useAnalyticsDedupTracker,
  useCalculatorStarted,
} from '../../hooks/useCalculatorAnalytics';
import { trackRelatedCalculatorClick } from '../../lib/analytics';

export interface PremiumWheelOffsetCalculatorProps {
  initialCurrent?: WheelSetupFields;
  initialNew?: WheelSetupFields;
}

function ImpactIcon({ id }: { id: string }) {
  const common = {
    viewBox: '0 0 20 20',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.5,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };
  switch (id) {
    case 'fender':
      return <svg {...common}><path d="M4 14h12M6 14V8l4-3 4 3v6" /></svg>;
    case 'suspension':
      return <svg {...common}><path d="M10 3v14M6 7h8M6 13h8" /></svg>;
    case 'handling':
      return <svg {...common}><circle cx="10" cy="10" r="6.5" /><path d="M10 6v4l2.5 2.5" /></svg>;
    case 'rubbing':
      return <svg {...common}><path d="M4 10h12M7 7l6 6M13 7l-6 6" /></svg>;
    default:
      return <svg {...common}><path d="M3 10h14M14 10l-3-3M14 10l-3 3" /></svg>;
  }
}

function MetricIcon({ name }: { name: string }) {
  const common = {
    viewBox: '0 0 20 20',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.6,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };
  switch (name) {
    case 'offset':
      return (
        <svg {...common}><path d="M10 3v14M5 7l5-4 5 4M5 13l5 4 5-4" /></svg>
      );
    case 'inner':
      return (
        <svg {...common}><path d="M13 4v12M4 10h7M7 7l-3 3 3 3" /></svg>
      );
    case 'outer':
      return (
        <svg {...common}><path d="M7 4v12M16 10H9M13 7l3 3-3 3" /></svg>
      );
    case 'track':
      return (
        <svg {...common}><path d="M3 10h14M6 7l-3 3 3 3M14 7l3 3-3 3" /></svg>
      );
    default:
      return (
        <svg {...common}><rect x="4" y="4" width="12" height="12" rx="2" /><path d="M4 10h12" /></svg>
      );
  }
}

function RelatedIcon({ name }: { name: string }) {
  const common = {
    viewBox: '0 0 20 20',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.5,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };
  switch (name) {
    case 'size':
      return <svg {...common}><circle cx="10" cy="10" r="6.5" /><circle cx="10" cy="10" r="2.5" /></svg>;
    case 'compare':
      return <svg {...common}><path d="M6 4v12M14 4v12M3 7l3-3 3 3M11 13l3 3 3-3" /></svg>;
    case 'diameter':
      return <svg {...common}><circle cx="10" cy="10" r="6.5" /><path d="M3.5 10h13" /></svg>;
    case 'offset':
      return <svg {...common}><circle cx="10" cy="10" r="6.5" /><circle cx="10" cy="10" r="2.5" /></svg>;
    case 'gear':
      return <svg {...common}><circle cx="10" cy="10" r="6.5" /><path d="M10 4v2M10 14v2M4 10h2M14 10h2" /></svg>;
    default:
      return <svg {...common}><circle cx="10" cy="10" r="6.5" /></svg>;
  }
}

function GuideIcon({ tone }: { tone: string }) {
  const color = tone === 'safe' ? '#16a34a' : tone === 'aggressive' ? '#ca8a04' : '#dc2626';
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="10" cy="10" r="8" stroke={color} strokeWidth="1.5" />
      <path
        d={tone === 'safe' ? 'M6.5 10.5l2.2 2.2 4.8-5' : tone === 'aggressive' ? 'M10 6v5M10 13.5v.5' : 'M7 7l6 6M13 7l-6 6'}
        stroke={color}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const RELATED_ICON_BY_HREF: Record<string, string> = {
  [CALCULATOR_PATHS.tireSize]: 'size',
  [CALCULATOR_PATHS.tireComparison]: 'compare',
  [CALCULATOR_PATHS.tireDiameter]: 'diameter',
  [CALCULATOR_PATHS.gearRatio]: 'gear',
};

function WheelInputBlock({
  title,
  badge,
  badgeClass,
  fields,
  onChange,
  idPrefix,
}: {
  title: string;
  badge: string;
  badgeClass: string;
  fields: WheelSetupFields;
  onChange: (key: keyof WheelSetupFields, value: string) => void;
  idPrefix: string;
}) {
  const rows: Array<{ key: keyof WheelSetupFields; label: string; unit: string; step: number }> = [
    { key: 'widthIn', label: 'Wheel Width', unit: 'in', step: 0.5 },
    { key: 'diameterIn', label: 'Wheel Diameter', unit: 'in', step: 1 },
    { key: 'offsetMm', label: 'Offset', unit: 'mm', step: 1 },
  ];

  return (
    <div className="wof-wheel-block">
      <div className="wof-wheel-block__head">
        <span className="wof-wheel-block__title">{title}</span>
        <span className={`wof-wheel-block__badge ${badgeClass}`}>{badge}</span>
      </div>
      <div className="wof-wheel-block__rows">
        {rows.map((row) => (
          <div key={row.key} className="wof-field-row">
            <label htmlFor={`${idPrefix}-${row.key}`}>{row.label}</label>
            <div className="wof-field-input">
              <input
                id={`${idPrefix}-${row.key}`}
                type="number"
                step={row.step}
                value={fields[row.key]}
                onChange={(e) => onChange(row.key, e.target.value)}
              />
              <span className="wof-field-input__unit">{row.unit}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function toneForDelta(value: number, invert = false): 'neutral' | 'positive' | 'warning' | 'danger' {
  const v = invert ? -value : value;
  if (Math.abs(v) <= 5) return 'neutral';
  if (v <= 12) return 'positive';
  if (v <= 25) return 'warning';
  return 'danger';
}

function MetricCard({
  icon,
  value,
  meaning,
  tone,
}: {
  icon: string;
  value: string;
  meaning: string;
  tone: 'neutral' | 'positive' | 'warning' | 'danger';
}) {
  return (
    <div className={`wof-metric-card wof-metric-card--${tone}`}>
      <span className="wof-metric-card__icon">
        <MetricIcon name={icon} />
      </span>
      <p className="wof-metric-card__value">{value}</p>
      <p className="wof-metric-card__meaning">{meaning}</p>
    </div>
  );
}

export default function PremiumWheelOffsetCalculator({
  initialCurrent,
  initialNew,
}: PremiumWheelOffsetCalculatorProps) {
  const formRef = useRef<HTMLElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const faqRef = useRef<HTMLElement>(null);

  const {
    currentFields,
    newFields,
    updateCurrentField,
    updateNewField,
    applyNewPreset,
    analyze,
    ready,
    comparison,
    verdict,
    converterWidth,
    converterValue,
    converterDirection,
    setConverterWidth,
    setConverterValue,
    setConverterDirection,
    converterResult,
  } = useWheelOffsetCalculator({ initialCurrent, initialNew });

  useCalculatorStarted(CALCULATOR_NAMES.wheelOffset);
  const dedupTracker = useAnalyticsDedupTracker();

  const handleAnalyze = useCallback(() => {
    analyze();
    const signature = [
      currentFields.widthIn,
      currentFields.diameterIn,
      currentFields.offsetMm,
      newFields.widthIn,
      newFields.diameterIn,
      newFields.offsetMm,
    ].join('|');
    trackCalculatorCompletedOnce(dedupTracker, signature, {
      calculator_name: CALCULATOR_NAMES.wheelOffset,
    });
    requestAnimationFrame(() => {
      resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }, [analyze, currentFields, newFields, dedupTracker]);

  const stickyVisible = useStickyAnalyzeButton(formRef, resultsRef, { resultsReady: ready });
  useSingleOpenDetails(faqRef);

  return (
    <div className="cmp-page wof-page tl-has-sticky-analyze">
      <div className="cmp-shell">
        <div className="cmp-toolbar">
          <nav className="cmp-breadcrumbs" aria-label="Breadcrumb">
            <a href="/">Home</a>
            <span>/</span>
            <a href={CALCULATOR_PATHS.tireSize}>Calculators</a>
            <span>/</span>
            <span>Wheel Offset Calculator</span>
          </nav>
        </div>

        <div className="cmp-layout">
          <div className="cmp-main wof-main">
            <header className="wof-hero">
              <div className="wof-hero__top">
                <h1 className="wof-hero__title">Wheel Offset Calculator</h1>
                <span className="wof-hero__badge">FITMENT ANALYSIS</span>
              </div>
              <p className="wof-hero__desc">
                Compare your current wheel setup against a new wheel setup to understand offset changes,
                wheel poke, suspension clearance impact, and potential fitment issues.
              </p>
            </header>

            <section ref={formRef} className="wof-calc-card" aria-label="Wheel fitment inputs">
              <div className="wof-calc-card__grid">
                <WheelInputBlock
                  title="Current Wheel"
                  badge="Original"
                  badgeClass="wof-wheel-block__badge--original"
                  fields={currentFields}
                  onChange={updateCurrentField}
                  idPrefix="current"
                />
                <span className="wof-calc-card__vs" aria-hidden="true">VS</span>
                <WheelInputBlock
                  title="New Wheel"
                  badge="New"
                  badgeClass="wof-wheel-block__badge--new"
                  fields={newFields}
                  onChange={updateNewField}
                  idPrefix="new"
                />
              </div>
              <button type="button" className="wof-analyze-btn" onClick={handleAnalyze}>
                Analyze Wheel Fitment
              </button>
            </section>

            <div ref={resultsRef} className="wof-results-anchor">
              {!ready || !comparison || !verdict ? (
                <p className="cmp-empty">
                  Enter current and new wheel specs, then analyze fitment to see clearance and poke results.
                </p>
              ) : (
                <>
                  <section className="wof-metrics" aria-label="Offset and position changes">
                    <div className="wof-metrics__grid">
                      <MetricCard
                        icon="offset"
                        value={formatSignedMm(comparison.offsetDifferenceMm)}
                        meaning={
                          comparison.offsetDifferenceMm < 0
                            ? `New wheel sits ${Math.abs(comparison.offsetDifferenceMm).toFixed(0)} mm more outward`
                            : comparison.offsetDifferenceMm > 0
                              ? `New wheel tucks ${comparison.offsetDifferenceMm.toFixed(0)} mm inward`
                              : 'Same offset spec'
                        }
                        tone={toneForDelta(Math.abs(comparison.offsetDifferenceMm), true)}
                      />
                      <MetricCard
                        icon="inner"
                        value={formatSignedMm(comparison.innerClearanceChangeMm)}
                        meaning={
                          comparison.innerClearanceChangeMm > 0
                            ? `${Math.abs(comparison.innerClearanceChangeMm).toFixed(0)} mm closer to suspension`
                            : comparison.innerClearanceChangeMm < 0
                              ? `${Math.abs(comparison.innerClearanceChangeMm).toFixed(0)} mm more inner room`
                              : 'No inner clearance change'
                        }
                        tone={toneForDelta(comparison.innerClearanceChangeMm)}
                      />
                      <MetricCard
                        icon="outer"
                        value={formatSignedMm(comparison.outerPositionChangeMm)}
                        meaning={
                          comparison.outerPositionChangeMm > 0
                            ? `${comparison.outerPositionChangeMm.toFixed(0)} mm more poke than current setup`
                            : 'Tucks inward at outer lip'
                        }
                        tone={toneForDelta(comparison.outerPositionChangeMm)}
                      />
                      <MetricCard
                        icon="track"
                        value={formatSignedMm(comparison.trackWidthChangeMm)}
                        meaning={`Total track width ${comparison.trackWidthChangeMm >= 0 ? 'increased' : 'decreased'} by ${Math.abs(comparison.trackWidthChangeMm).toFixed(0)} mm`}
                        tone={toneForDelta(comparison.trackWidthChangeMm)}
                      />
                      <MetricCard
                        icon="backspacing"
                        value={formatSignedIn(comparison.backspacingDifferenceIn)}
                        meaning={
                          comparison.backspacingDifferenceIn < 0
                            ? `Backspacing reduced by ${Math.abs(comparison.backspacingDifferenceIn).toFixed(2)}"`
                            : comparison.backspacingDifferenceIn > 0
                              ? `Backspacing increased by ${comparison.backspacingDifferenceIn.toFixed(2)}"`
                              : 'No backspacing change'
                        }
                        tone="neutral"
                      />
                    </div>
                  </section>

                  <section
                    className={`wof-verdict wof-verdict--${verdict.tone}`}
                    aria-label="Fitment verdict"
                  >
                    <div className="wof-verdict__lead">
                      <span className="wof-verdict__icon" aria-hidden="true">
                        {verdict.tone === 'green' ? '✓' : verdict.tone === 'red' ? '!' : '⚠'}
                      </span>
                      <span className="wof-verdict__eyebrow">Fitment Verdict</span>
                      <span className="wof-verdict__label">{verdict.label}</span>
                      <span className="wof-verdict__summary">{verdict.summary}</span>
                    </div>

                    <ul className="wof-verdict__checks">
                      {verdict.rows.map((row) => (
                        <li key={row.id} className={`wof-verdict__check wof-verdict__check--${row.status}`}>
                          <span className="wof-verdict__check-icon" aria-hidden="true">
                            {formatVerdictRowIcon(row.status)}
                          </span>
                          <span className="wof-verdict__check-body">
                            <span className="wof-verdict__check-label">{row.label}</span>
                            <span className="wof-verdict__check-detail">{row.detail}</span>
                          </span>
                        </li>
                      ))}
                    </ul>

                    <div className="wof-verdict__notes">
                      <span className="wof-verdict__notes-title">Notes</span>
                      <p className="wof-verdict__notes-text">
                        {comparison.innerClearanceChangeMm > 5
                          ? `Backspacing increased by ${comparison.backspacingDifferenceIn.toFixed(2)}", moving the inner rim ${comparison.innerClearanceChangeMm.toFixed(0)} mm closer to suspension components. Test at full steering lock before installation.`
                          : comparison.outerPositionChangeMm > 10
                            ? `The new wheel pokes ${comparison.outerPositionChangeMm.toFixed(0)} mm farther outward. Check fender lip clearance at ride height and under compression.`
                            : `Offset changed by ${formatSignedMm(comparison.offsetDifferenceMm)} with ${formatSignedMm(comparison.trackWidthChangeMm)} track width impact. Confirm fitment on your exact vehicle before driving.`}
                      </p>
                      <a className="wof-verdict__notes-btn" href={CALCULATOR_PATHS.tireComparison}>
                        How To Check Fitment
                      </a>
                    </div>
                  </section>

                  <section className="wof-viz-card" aria-label="Wheel position comparison">
                    <WheelOffsetFitmentVisual comparison={comparison} />
                  </section>
                </>
              )}
            </div>

            <div className="wof-edu-converter-row">
              <section className="wof-edu-section" aria-label="What is wheel offset">
                <WheelOffsetTypesExplainer />
              </section>

              <section className="wof-converter-card" aria-label="Offset and backspacing converter">
                <h2 className="wof-section-title">Offset ↔ Backspacing Converter</h2>
                <div className="wof-converter-card__toggle" role="group" aria-label="Conversion direction">
                  <button
                    type="button"
                    className={`wof-converter-card__toggle-btn ${converterDirection === 'offset-to-backspacing' ? 'wof-converter-card__toggle-btn--active' : ''}`}
                    onClick={() => setConverterDirection('offset-to-backspacing')}
                  >
                    From Offset
                  </button>
                  <button
                    type="button"
                    className={`wof-converter-card__toggle-btn ${converterDirection === 'backspacing-to-offset' ? 'wof-converter-card__toggle-btn--active' : ''}`}
                    onClick={() => setConverterDirection('backspacing-to-offset')}
                  >
                    From Backspacing
                  </button>
                </div>
                <div className="wof-converter-card__grid">
                  <div className="wof-field-row">
                    <label htmlFor="conv-width">Wheel Width</label>
                    <div className="wof-field-input">
                      <input
                        id="conv-width"
                        type="number"
                        step={0.5}
                        value={converterWidth}
                        onChange={(e) => setConverterWidth(e.target.value)}
                      />
                      <span className="wof-field-input__unit">in</span>
                    </div>
                  </div>
                  <div className="wof-field-row">
                    <label htmlFor="conv-value">
                      {converterDirection === 'offset-to-backspacing' ? 'Offset' : 'Backspacing'}
                    </label>
                    <div className="wof-field-input">
                      <input
                        id="conv-value"
                        type="number"
                        step={converterDirection === 'offset-to-backspacing' ? 1 : 0.01}
                        value={converterValue}
                        onChange={(e) => setConverterValue(e.target.value)}
                      />
                      <span className="wof-field-input__unit">
                        {converterDirection === 'offset-to-backspacing' ? 'mm' : 'in'}
                      </span>
                    </div>
                  </div>
                  <div className="wof-converter-card__output">
                    <span className="wof-converter-card__output-label">
                      {converterDirection === 'offset-to-backspacing' ? 'Backspacing' : 'Offset'}
                    </span>
                    {converterResult ? (
                      <p className="wof-converter-card__output-value">
                        {converterDirection === 'offset-to-backspacing'
                          ? `${converterResult.backspacingIn.toFixed(2)}`
                          : `${converterResult.offsetMm >= 0 ? '+' : ''}${converterResult.offsetMm.toFixed(1)}`}
                        <span className="wof-converter-card__output-unit">
                          {converterDirection === 'offset-to-backspacing' ? 'in' : 'mm'}
                        </span>
                      </p>
                    ) : (
                      <p className="wof-converter-card__output-value wof-converter-card__output-value--muted">
                        —
                      </p>
                    )}
                  </div>
                </div>
                <p className="wof-converter-card__formula">
                  Formula: Backspacing = (Width / 2) + (Offset ÷ 25.4)
                </p>
              </section>
            </div>

            <section className="wof-impact-card" aria-label="How wheel offset affects fitment">
              <h2 className="wof-section-title">How Wheel Offset Affects Fitment</h2>
              <ul className="wof-impact-list">
                {FITMENT_IMPACT_TOPICS.map((topic) => (
                  <li key={topic.id} className="wof-impact-list__item">
                    <span className="wof-impact-list__icon">
                      <ImpactIcon id={topic.id} />
                    </span>
                    <span className="wof-impact-list__body">
                      <span className="wof-impact-list__title">{topic.title}</span>
                      <span className="wof-impact-list__desc">{topic.description}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </section>

            <article className="cmp-seo-block wof-seo-block">
              <h2>{SEO_FITMENT_CONTENT.heading}</h2>
              {SEO_FITMENT_CONTENT.paragraphs.map((paragraph) => (
                <p key={paragraph.slice(0, 40)}>{paragraph}</p>
              ))}
            </article>

            <section className="wof-faq-section" aria-label="Frequently asked questions">
              <h2 className="wof-section-title">Frequently Asked Questions</h2>
              <div className="wof-faq-grid" ref={faqRef}>
                {OFFSET_FAQS.map((faq) => (
                  <details key={faq.question} className="wof-faq-item">
                    <summary>{faq.question}</summary>
                    <p>{faq.answer}</p>
                  </details>
                ))}
              </div>
            </section>
          </div>

          <aside className="cmp-sidebar-right wof-sidebar-right" aria-label="Fitment guides">
            <section className="cmp-panel wof-sidebar-panel wof-sidebar-panel--guide">
              <h2 className="cmp-panel__title">Fitment Quick Guide</h2>
              <ul className="wof-guide-list">
                {FITMENT_QUICK_GUIDE.map((item) => (
                  <li key={item.range} className="wof-guide-list__item">
                    <span className="wof-guide-list__icon">
                      <GuideIcon tone={item.tone} />
                    </span>
                    <span className="wof-guide-list__body">
                      <span className="wof-guide-list__range">{item.range}</span>
                      <span className="wof-guide-list__detail">{item.detail}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="cmp-panel wof-sidebar-panel wof-sidebar-panel--vehicles">
              <h2 className="cmp-panel__title">Popular Vehicle Offsets</h2>
              <ul className="wof-vehicle-list">
                {VEHICLE_OFFSET_PRESETS.map((group) => (
                  <li key={group.vehicle} className="wof-vehicle-list__item">
                    <div className="wof-vehicle-row wof-vehicle-row--static">
                      <img className="wof-vehicle-row__img" src={group.image} alt="" width={52} height={36} decoding="async" loading="lazy" />
                      <span className="wof-vehicle-row__body">
                        <span className="wof-vehicle-row__name">{group.vehicle}</span>
                      </span>
                    </div>
                    <div className="wof-vehicle-row__presets">
                      {group.options.map((option) => (
                        <button
                          key={option.label}
                          type="button"
                          className="wof-vehicle-preset-btn"
                          onClick={() => applyNewPreset(option.widthIn, option.diameterIn, option.offsetMm)}
                        >
                          <span className="wof-vehicle-preset-btn__label">{option.label}</span>
                          <span className="wof-vehicle-preset-btn__value">{formatOffsetValue(option.offsetMm)}</span>
                        </button>
                      ))}
                    </div>
                  </li>
                ))}
              </ul>
            </section>

            <section className="cmp-panel wof-sidebar-panel wof-sidebar-panel--related">
              <h2 className="cmp-panel__title">Related Calculators</h2>
              <div className="wof-sidebar-calc__list">
                {RELATED_CALCULATOR_LINKS.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    className="wof-sidebar-calc__card"
                    onClick={() => trackRelatedCalculatorClick(link.href, CALCULATOR_NAMES.wheelOffset)}
                  >
                    <span className="wof-sidebar-calc__icon">
                      <RelatedIcon name={RELATED_ICON_BY_HREF[link.href] ?? 'size'} />
                    </span>
                    <span className="wof-sidebar-calc__text">
                      <span className="wof-sidebar-calc__title">{link.label}</span>
                      <span className="wof-sidebar-calc__desc">{link.description}</span>
                    </span>
                  </a>
                ))}
              </div>
            </section>
          </aside>
        </div>
      </div>

      <StickyAnalyzeButton visible={stickyVisible} label="Analyze" onClick={handleAnalyze} ariaLabel="Analyze wheel fitment" />
    </div>
  );
}
