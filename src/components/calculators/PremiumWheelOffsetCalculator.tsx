import { useCallback, useRef } from 'react';
import '../../styles/calculator-offset.css';
import { useStickyAnalyzeButton } from '../../hooks/useStickyAnalyzeButton';
import { useSingleOpenDetails } from '../../hooks/useSingleOpenDetails';
import { CALCULATOR_PATHS } from '../../lib/calculator-links';
import {
  OFFSET_FAQS,
  POPULAR_OFFSET_COMPARISONS,
  POSITION_CHANGE_GUIDE,
  POSITION_CHANGE_GUIDE_NOTE,
} from '../../lib/wheel-offset-insights';
import {
  buildWheelOffsetShareTitle,
  formatBackspacingPrimary,
  formatBackspacingSecondary,
  formatInnerChangePrimary,
  formatInnerChangeSecondary,
  formatOffsetChangePrimary,
  formatOffsetChangeSecondary,
  formatOuterChangePrimary,
  formatOuterChangeSecondary,
  formatTrackWidthPrimary,
  formatTrackWidthSecondary,
} from '../../lib/wheel-offset-display';
import type { WheelSetupFields } from '../../lib/wheel-offset-math';
import type { WheelFieldKey } from '../../lib/wheel-offset-validation';
import { WheelOffsetFitmentVisual, WheelOffsetTypesExplainer } from './WheelOffsetVisual';
import { RelatedCalculatorsSection } from './ComparisonLowerPage';
import { useWheelOffsetCalculator } from './useWheelOffsetCalculator';
import CalculatorLinkActions from './CalculatorLinkActions';
import { StickyAnalyzeButton } from './StickyAnalyzeButton';
import {
  CALCULATOR_NAMES,
  trackCalculatorCompletedOnce,
  useAnalyticsDedupTracker,
  useCalculatorStarted,
} from '../../hooks/useCalculatorAnalytics';

export interface PremiumWheelOffsetCalculatorProps {
  initialCurrent?: WheelSetupFields;
  initialNew?: WheelSetupFields;
}

function GuideIcon({ tone }: { tone: string }) {
  const color =
    tone === 'small' ? '#64748b' : tone === 'moderate' ? '#2563eb' : tone === 'large' ? '#d97706' : '#78716c';
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="10" cy="10" r="8" stroke={color} strokeWidth="1.5" />
      <path
        d="M10 6v5M10 13.5v.5"
        stroke={color}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
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

function WheelInputBlock({
  title,
  badge,
  badgeClass,
  fields,
  fieldErrors,
  onChange,
  onBlurField,
  idPrefix,
}: {
  title: string;
  badge: string;
  badgeClass: string;
  fields: WheelSetupFields;
  fieldErrors: Partial<Record<WheelFieldKey, string | null>>;
  onChange: (key: keyof WheelSetupFields, value: string) => void;
  onBlurField: (key: WheelFieldKey) => void;
  idPrefix: string;
}) {
  const rows: Array<{
    key: WheelFieldKey;
    label: string;
    unit: string;
    step: number;
  }> = [
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
        {rows.map((row) => {
          const errorId = `${idPrefix}-${row.key}-error`;
          const error = fieldErrors[row.key];
          return (
            <div key={row.key} className="wof-field-row">
              <label htmlFor={`${idPrefix}-${row.key}`}>{row.label}</label>
              <div className="wof-field-input">
                <input
                  id={`${idPrefix}-${row.key}`}
                  type="number"
                  inputMode="decimal"
                  step={row.step}
                  value={fields[row.key]}
                  onChange={(e) => onChange(row.key, e.target.value)}
                  onBlur={() => onBlurField(row.key)}
                  aria-invalid={error ? true : undefined}
                  aria-describedby={error ? errorId : undefined}
                />
                <span className="wof-field-input__unit" aria-hidden="true">
                  {row.unit}
                </span>
              </div>
              {error ? (
                <p id={errorId} className="wof-field-row__error" role="alert">
                  {error}
                </p>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MetricCard({
  icon,
  value,
  meaning,
}: {
  icon: string;
  value: string;
  meaning: string;
}) {
  return (
    <div className="wof-metric-card wof-metric-card--neutral">
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
  const faqRef = useRef<HTMLDivElement>(null);

  const {
    currentFields,
    newFields,
    updateCurrentField,
    updateNewField,
    touchCurrentField,
    touchNewField,
    applyOffsetComparison,
    analyze,
    ready,
    inputsValid,
    currentFieldErrors,
    newFieldErrors,
    comparison,
    positionSummary,
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
    if (!inputsValid) return;
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
  }, [analyze, currentFields, newFields, dedupTracker, inputsValid]);

  const stickyVisible = useStickyAnalyzeButton(formRef, resultsRef, { resultsReady: ready });
  useSingleOpenDetails(faqRef);

  const shareTitle =
    comparison && positionSummary ? buildWheelOffsetShareTitle(comparison) : undefined;

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

        <div className="cmp-layout wof-layout-upper">
          <header className="wof-hero wof-layout-upper__hero">
            <div className="wof-hero__top">
              <h1 className="wof-hero__title">Wheel Offset Calculator</h1>
              <span className="wof-hero__badge">POSITION ANALYSIS</span>
            </div>
            <p className="wof-hero__desc">
              Compare current and new wheel width, diameter, and offset to see how the wheel
              moves inward and outward. This tool does not evaluate vehicle-specific clearance.
            </p>
          </header>

          <div className="wof-layout-upper__calc-zone">
            <section
              ref={formRef}
              className="wof-calc-card wof-layout-upper__calc"
              aria-label="Wheel position inputs"
            >
              <div className="calc-copy-link-row wof-calc-card__actions">
                <CalculatorLinkActions shareTitle={shareTitle} />
              </div>
              <div className="wof-calc-card__grid">
              <WheelInputBlock
                title="Current Wheel"
                badge="Original"
                badgeClass="wof-wheel-block__badge--original"
                fields={currentFields}
                fieldErrors={currentFieldErrors}
                onChange={updateCurrentField}
                onBlurField={touchCurrentField}
                idPrefix="current"
              />
              <span className="wof-calc-card__vs" aria-hidden="true">
                VS
              </span>
              <WheelInputBlock
                title="New Wheel"
                badge="New"
                badgeClass="wof-wheel-block__badge--new"
                fields={newFields}
                fieldErrors={newFieldErrors}
                onChange={updateNewField}
                onBlurField={touchNewField}
                idPrefix="new"
              />
            </div>
            <button
              type="button"
              className="wof-analyze-btn"
              onClick={handleAnalyze}
              disabled={!inputsValid}
              aria-disabled={!inputsValid}
            >
              Analyze Wheel Position
            </button>
          </section>
          </div>

          <div
            ref={resultsRef}
            className="cmp-main wof-main wof-layout-upper__results wof-results-anchor"
            aria-live="polite"
            aria-atomic="true"
          >
              {!ready || !comparison || !positionSummary ? (
                <p className="cmp-empty">
                  {inputsValid
                    ? 'Enter current and new wheel specs, then analyze to see relative position changes.'
                    : 'Check the highlighted fields for valid wheel width, diameter, and offset values.'}
                </p>
              ) : (
                <>
                  <section className="wof-metrics" aria-label="Offset and position changes">
                    <div className="wof-metrics__grid">
                      <MetricCard
                        icon="offset"
                        value={formatOffsetChangePrimary(comparison.offsetDifferenceMm)}
                        meaning={formatOffsetChangeSecondary(comparison.offsetDifferenceMm)}
                      />
                      <MetricCard
                        icon="inner"
                        value={formatInnerChangePrimary(comparison.innerClearanceChangeMm)}
                        meaning={formatInnerChangeSecondary(comparison.innerClearanceChangeMm)}
                      />
                      <MetricCard
                        icon="outer"
                        value={formatOuterChangePrimary(comparison.outerPositionChangeMm)}
                        meaning={formatOuterChangeSecondary(comparison.outerPositionChangeMm)}
                      />
                      <MetricCard
                        icon="track"
                        value={formatTrackWidthPrimary(comparison.trackWidthChangeMm)}
                        meaning={formatTrackWidthSecondary(comparison.trackWidthChangeMm)}
                      />
                      <MetricCard
                        icon="backspacing"
                        value={formatBackspacingPrimary(comparison.backspacingDifferenceIn)}
                        meaning={formatBackspacingSecondary(comparison.newBackspacingIn)}
                      />
                    </div>
                  </section>

                  <section
                    className={`wof-verdict wof-verdict--wheel-offset-ps wof-verdict--${
                      positionSummary.magnitude === 'Very Large' || positionSummary.magnitude === 'Large'
                        ? 'caution'
                        : positionSummary.magnitude === 'Moderate'
                          ? 'info'
                          : 'neutral'
                    }`}
                    aria-label="Wheel position summary"
                  >
                    {(() => {
                      const innerPrimary = formatInnerChangePrimary(comparison.innerClearanceChangeMm)
                        .replace(' inner clearance', ' clearance');
                      const outerPrimary = formatOuterChangePrimary(comparison.outerPositionChangeMm);
                      const trackMm = comparison.trackWidthChangeMm;
                      const trackPrimary =
                        Math.abs(trackMm) < 0.05
                          ? 'No track-width change'
                          : formatTrackWidthPrimary(trackMm).replace(' across the axle', '');

                      const outerSupporting =
                        comparison.outerPositionChangeMm > 0
                          ? 'Creates a wider wheel stance'
                          : comparison.outerPositionChangeMm < 0
                            ? 'Creates a more tucked-in stance'
                            : 'No stance change';

                      return (
                        <>
                          <div className="wof-ps-col wof-ps-col--overall wof-verdict__lead">
                            <span className="wof-verdict__icon" aria-hidden="true">
                              i
                            </span>
                            <span className="wof-verdict__eyebrow">POSITION SUMMARY</span>
                            <span className="wof-verdict__label">{positionSummary.heading}</span>
                            <p className="wof-verdict__summary wof-ps-overall-summary">{positionSummary.summary}</p>
                          </div>

                          <div className="wof-ps-col wof-ps-col--tiles">
                            <div className="wof-ps-tiles" aria-label="Calculated position changes">
                              <div className="wof-ps-tile">
                                <div className="wof-ps-tile__label">INNER POSITION</div>
                                <div className="wof-ps-tile__value">{innerPrimary}</div>
                                <div className="wof-ps-tile__sub">Compared with the current wheel</div>
                              </div>

                              <div className="wof-ps-tile">
                                <div className="wof-ps-tile__label">OUTER POSITION</div>
                                <div className="wof-ps-tile__value">{outerPrimary}</div>
                                <div className="wof-ps-tile__sub">{outerSupporting}</div>
                              </div>

                              <div className="wof-ps-tile">
                                <div className="wof-ps-tile__label">ESTIMATED TRACK WIDTH</div>
                                <div className="wof-ps-tile__value">{trackPrimary}</div>
                                <div className="wof-ps-tile__sub">Approximate change across the axle</div>
                              </div>

                              <div className="wof-ps-tile">
                                <div className="wof-ps-tile__label">CHANGE MAGNITUDE</div>
                                <div className="wof-ps-tile__value">{positionSummary.magnitude}</div>
                                <div className="wof-ps-tile__sub">Based on the largest wheel-position change</div>
                              </div>
                            </div>
                          </div>

                          <div className="wof-ps-col wof-ps-col--reminder">
                            <div className="wof-ps-reminder-card" aria-label="Before you buy reminder">
                              <span className="wof-ps-reminder-badge">
                                VEHICLE CLEARANCE NOT EVALUATED
                              </span>
                              <div className="wof-ps-reminder-title">Before You Buy</div>
                              <p className="wof-ps-reminder-text">
                                Confirm these clearances on your specific vehicle before purchasing.
                              </p>
                              <ul className="wof-ps-checklist">
                                <li className="wof-ps-checklist__item">
                                  <span className="wof-ps-checklist__icon" aria-hidden="true">
                                    <svg viewBox="0 0 20 20" width="14" height="14" fill="none" aria-hidden="true">
                                      <path d="M6 10.5l3 3 5-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                  </span>
                                  <span>Suspension and strut clearance</span>
                                </li>
                                <li className="wof-ps-checklist__item">
                                  <span className="wof-ps-checklist__icon" aria-hidden="true">
                                    <svg viewBox="0 0 20 20" width="14" height="14" fill="none" aria-hidden="true">
                                      <path d="M6 10.5l3 3 5-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                  </span>
                                  <span>Brake and caliper clearance</span>
                                </li>
                                <li className="wof-ps-checklist__item">
                                  <span className="wof-ps-checklist__icon" aria-hidden="true">
                                    <svg viewBox="0 0 20 20" width="14" height="14" fill="none" aria-hidden="true">
                                      <path d="M6 10.5l3 3 5-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                  </span>
                                  <span>Tire-to-fender clearance</span>
                                </li>
                                <li className="wof-ps-checklist__item">
                                  <span className="wof-ps-checklist__icon" aria-hidden="true">
                                    <svg viewBox="0 0 20 20" width="14" height="14" fill="none" aria-hidden="true">
                                      <path d="M6 10.5l3 3 5-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                  </span>
                                  <span>Steering clearance at full lock</span>
                                </li>
                              </ul>
                              <p className="wof-ps-reminder-note">
                                Tire size, ride height, camber and bodywork may affect final fitment.
                              </p>
                            </div>
                          </div>
                        </>
                      );
                    })()}
                  </section>
                </>
              )}
            </div>

          <aside
            className="cmp-sidebar-right wof-sidebar-right wof-layout-upper__sidebar"
            aria-label="Position guides"
          >
            <section className="cmp-panel wof-sidebar-panel wof-sidebar-panel--guide">
              <h2 className="cmp-panel__title">Wheel Position Change Guide</h2>
              <ul className="wof-guide-list">
                {POSITION_CHANGE_GUIDE.map((item) => (
                  <li key={item.range} className="wof-guide-list__item">
                    <span className="wof-guide-list__icon">
                      <GuideIcon tone={item.tone} />
                    </span>
                    <span className="wof-guide-list__body">
                      <span className="wof-guide-list__range">{item.range}</span>
                      <span className="wof-guide-list__detail">{item.detail}</span>
                      <span className="wof-guide-list__note">{item.note}</span>
                    </span>
                  </li>
                ))}
              </ul>
              <p className="wof-guide-footnote">{POSITION_CHANGE_GUIDE_NOTE}</p>
            </section>

            <section className="cmp-panel wof-sidebar-panel wof-sidebar-panel--comparisons">
              <h2 className="cmp-panel__title">Popular Offset Comparisons</h2>
              <p className="wof-sidebar-help">
                These examples change offset only. Final wheel position also depends on wheel width.
              </p>
              <ul className="wof-comparison-list">
                {POPULAR_OFFSET_COMPARISONS.map((preset) => (
                  <li key={preset.id}>
                    <button
                      type="button"
                      className="wof-comparison-btn"
                      onClick={() => applyOffsetComparison(preset)}
                    >
                      {preset.label}
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          </aside>
        </div>

        <div className="wof-layout-full">
          {ready && comparison ? (
            <section className="wof-viz-card wof-viz-card--full" aria-label="Wheel position comparison">
              <WheelOffsetFitmentVisual comparison={comparison} />
            </section>
          ) : null}

          <div className="wof-edu-converter-row">
            <section className="wof-edu-section" aria-label="How wheel offset changes position">
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
              <p className="wof-converter-card__note">
                Calculated backspacing uses the wheel’s nominal width. Manufacturer measurements may
                differ slightly because the physical rim flanges extend beyond the stated wheel width.
              </p>
            </section>
          </div>
        </div>

        <section
          className="wof-faq-section wof-faq-section--full"
          aria-label="Frequently asked questions"
        >
          <h2 className="wof-section-title">Frequently Asked Questions</h2>
          <div className="wof-faq-grid" ref={faqRef}>
            {OFFSET_FAQS.map((faq) => {
              const paragraphs = faq.answer
                .split(/\n\n+/)
                .map((part) => part.trim())
                .filter(Boolean);
              return (
                <details key={faq.question} className="wof-faq-item">
                  <summary>{faq.question}</summary>
                  {paragraphs.map((paragraph, index) => (
                    <p key={`${faq.question}-${index}`}>{paragraph}</p>
                  ))}
                </details>
              );
            })}
          </div>
        </section>

        <RelatedCalculatorsSection
          excludeHref={CALCULATOR_PATHS.wheelOffset}
          calculatorName={CALCULATOR_NAMES.wheelOffset}
        />
      </div>

      <StickyAnalyzeButton
        visible={stickyVisible && inputsValid}
        label="Analyze"
        onClick={handleAnalyze}
        ariaLabel="Analyze wheel position"
      />
    </div>
  );
}
