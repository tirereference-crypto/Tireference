import { useCallback, useMemo, useRef } from 'react';
import '../../styles/calculator-gear.css';
import { useStickyAnalyzeButton } from '../../hooks/useStickyAnalyzeButton';
import { useSingleOpenDetails } from '../../hooks/useSingleOpenDetails';
import { CALCULATOR_PATHS } from '../../lib/calculator-links';
import {
  computeGearRatio,
  formatRatio,
  formatRpm,
  parseGearRatioInput,
  type GearRatioFields,
  type GearRatioResult,
} from '../../lib/gear-ratio-math';
import {
  formatVerdictRowIcon,
  GEAR_FAQS,
  GEAR_RATIO_OPTIONS,
  REGEAR_COSTS,
  RELATED_CALCULATOR_LINKS,
  SEO_GEAR_CONTENT,
} from '../../lib/gear-ratio-insights';
import { EffectiveGearRatioExplained, GearCompareInstallRow, GearRatioComparisonTable } from './GearRatioVisual';
import { useGearRatioCalculator } from './useGearRatioCalculator';
import { StickyAnalyzeButton } from './StickyAnalyzeButton';
import {
  CALCULATOR_NAMES,
  trackCalculatorCompletedOnce,
  useAnalyticsDedupTracker,
  useCalculatorStarted,
} from '../../hooks/useCalculatorAnalytics';
import { trackRelatedCalculatorClick } from '../../lib/analytics';

export interface PremiumGearRatioCalculatorProps {
  initialFields?: GearRatioFields;
}

function ImpactIcon({ name }: { name: string }) {
  const common = {
    viewBox: '0 0 20 20',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.5,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };
  switch (name) {
    case 'acceleration':
      return <svg {...common}><path d="M3 13h3l2-7 3 12 2-7h4" /></svg>;
    case 'fuel':
      return <svg {...common}><rect x="4" y="3" width="8" height="14" rx="1.5" /><path d="M12 7h2.5a1.5 1.5 0 011.5 1.5V13a1 1 0 11-2 0" /><path d="M5.5 7.5h5" /></svg>;
    case 'towing':
      return <svg {...common}><circle cx="6.5" cy="14" r="2" /><circle cx="14" cy="14" r="2" /><path d="M8.5 14h3.5M3 7h6l3 5M9 7V5h4l2 4" /></svg>;
    case 'highway':
      return <svg {...common}><path d="M7 17L10 3l3 14M10 7v1M10 11v1" /></svg>;
    case 'offroad':
      return <svg {...common}><circle cx="10" cy="10" r="6.5" /><path d="M10 3.5v13M3.5 10h13M5.5 5.5l9 9M14.5 5.5l-9 9" /></svg>;
    default:
      return <svg {...common}><circle cx="10" cy="10" r="6.5" /></svg>;
  }
}

function CostIcon({ name }: { name: string }) {
  const common = {
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.6,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };
  switch (name) {
    case 'wrench':
      return <svg {...common}><path d="M15 6a3.5 3.5 0 01-4.6 4.6l-5 5a1.7 1.7 0 01-2.4-2.4l5-5A3.5 3.5 0 0115 6z" /></svg>;
    case 'shop':
      return <svg {...common}><path d="M4 9l1-4h14l1 4M4 9h16v9a1 1 0 01-1 1H5a1 1 0 01-1-1V9zM9 19v-5h6v5" /></svg>;
    case 'axles':
      return <svg {...common}><circle cx="6" cy="12" r="3" /><circle cx="18" cy="12" r="3" /><path d="M9 12h6" /></svg>;
    default:
      return <svg {...common}><circle cx="12" cy="12" r="8" /></svg>;
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
    case 'compare':
      return <svg {...common}><path d="M6 4v12M14 4v12M3 7l3-3 3 3M11 13l3 3 3-3" /></svg>;
    case 'size':
      return <svg {...common}><circle cx="10" cy="10" r="6.5" /><circle cx="10" cy="10" r="2.5" /></svg>;
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

const RELATED_ICON_BY_HREF: Record<string, string> = {
  [CALCULATOR_PATHS.tireSize]: 'size',
  [CALCULATOR_PATHS.tireComparison]: 'compare',
  [CALCULATOR_PATHS.tireDiameter]: 'diameter',
  [CALCULATOR_PATHS.wheelOffset]: 'offset',
  [CALCULATOR_PATHS.gearRatio]: 'gear',
};

function SetupCardIcon({ variant }: { variant: 'current' | 'new' }) {
  const common = {
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.75,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };
  if (variant === 'current') {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="3" />
        <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function SetupColHeader({ variant, title }: { variant: 'current' | 'new'; title: string }) {
  return (
    <header className={`grc-setup-col__head grc-setup-col__head--${variant}`}>
      <span className={`grc-setup-col__icon grc-setup-col__icon--${variant}`} aria-hidden="true">
        <SetupCardIcon variant={variant} />
      </span>
      <h2 className="grc-setup-col__title">{title}</h2>
    </header>
  );
}

function StackNumberField({
  id,
  label,
  optional,
  unit,
  value,
  step,
  onChange,
}: {
  id: string;
  label: string;
  optional?: boolean;
  unit?: string;
  value: string;
  step?: number;
  onChange: (value: string) => void;
}) {
  return (
    <div className="grc-stack-field">
      <label htmlFor={id} className="grc-stack-field__label">
        <span className="grc-stack-field__label-text">{label}</span>
        {optional ? <span className="grc-stack-field__optional">(Optional)</span> : null}
      </label>
      <div className="grc-stack-field__control">
        <input
          id={id}
          type="number"
          step={step ?? 1}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        {unit ? <span className="grc-stack-field__suffix">{unit}</span> : null}
      </div>
    </div>
  );
}

function StackSelectField({
  id,
  label,
  value,
  options,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <div className="grc-stack-field">
      <label htmlFor={id} className="grc-stack-field__label">
        <span className="grc-stack-field__label-text">{label}</span>
      </label>
      <div className="grc-stack-field__control grc-stack-field__control--select">
        <select id={id} value={value} onChange={(e) => onChange(e.target.value)}>
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

function Tooltip({ text }: { text: string }) {
  return (
    <span className="grc-tooltip" tabIndex={0} role="note" aria-label={text}>
      <span className="grc-tooltip__icon" aria-hidden="true">
        i
      </span>
      <span className="grc-tooltip__bubble">{text}</span>
    </span>
  );
}

function SummaryFooterIcon({ variant }: { variant: 'recommended' | 'performance' | 'warning' }) {
  const common = {
    viewBox: '0 0 20 20',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.75,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };
  if (variant === 'recommended') {
    return (
      <svg {...common}>
        <path d="M5 10.5l3 3.5 7-8" />
      </svg>
    );
  }
  if (variant === 'performance') {
    return (
      <svg {...common}>
        <path d="M10 3l2.2 4.6 5 .7-3.6 3.5.9 5-4.5-2.4L5.5 16.8l.9-5L2.8 8.3l5-.7z" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <path d="M10 4.5l6.5 11.5H3.5L10 4.5z" />
      <path d="M10 9v3" />
      <circle cx="10" cy="14.5" r="0.75" fill="currentColor" stroke="none" />
    </svg>
  );
}

function SummaryRatioCard({
  variant,
  index,
  title,
  subtitle,
  mainValue,
  secondaryLabel,
  secondaryValue,
  footerLabel,
  footerIcon,
}: {
  variant: 'ideal' | 'performance' | 'current';
  index: number;
  title: string;
  subtitle: string;
  mainValue: string;
  secondaryLabel: string;
  secondaryValue: string;
  footerLabel: string;
  footerIcon: 'recommended' | 'performance' | 'warning';
}) {
  return (
    <article className={`grc-summary-card grc-summary-card--${variant}`}>
      <header className="grc-summary-card__head">
        <div className="grc-summary-card__head-row">
          <span className={`grc-summary-card__index grc-summary-card__index--${variant}`}>{index}</span>
          <h3 className="grc-summary-card__title">{title}</h3>
        </div>
        <p className="grc-summary-card__subtitle">{subtitle}</p>
      </header>
      <div className="grc-summary-card__body">
        <p className="grc-summary-card__value">{mainValue}</p>
        <div className="grc-summary-card__secondary">
          <span className="grc-summary-card__secondary-label">{secondaryLabel}</span>
          <span className={`grc-summary-card__pill grc-summary-card__pill--${variant}`}>
            {secondaryValue}
          </span>
        </div>
      </div>
      <footer className={`grc-summary-card__footer grc-summary-card__footer--${variant}`}>
        <span className="grc-summary-card__footer-icon" aria-hidden="true">
          <SummaryFooterIcon variant={footerIcon} />
        </span>
        <span className="grc-summary-card__footer-label">{footerLabel}</span>
      </footer>
    </article>
  );
}

function keepCurrentFooterLabel(lossPct: number): string {
  if (lossPct < 3) return 'GEARS OK';
  if (lossPct < 7) return 'MILDLY UNDERGEARED';
  return 'UNDERGEARED';
}

function ResultsSummary({
  result,
  squatEnabled,
}: {
  result: GearRatioResult | null;
  squatEnabled: boolean;
}) {
  return (
    <section className="grc-summary" aria-label="Results summary">
      <h2 className="grc-summary__title">Results Summary</h2>
      {!result ? (
        <div className="grc-summary__empty">
          <p>Enter valid tire diameters and gear ratio to see results.</p>
        </div>
      ) : (
        <div className="grc-summary__cards">
          <SummaryRatioCard
            variant="ideal"
            index={1}
            title="Ideal Gear Ratio"
            subtitle="Best balance for daily driving"
            mainValue={formatRatio(result.idealGearRaw)}
            secondaryLabel="Closest available gear ratio"
            secondaryValue={formatRatio(result.idealGear)}
            footerLabel="Recommended"
            footerIcon="recommended"
          />
          <SummaryRatioCard
            variant="performance"
            index={2}
            title="Performance Ratio"
            subtitle="For towing, crawling & heavy loads"
            mainValue={formatRatio(result.performanceGear)}
            secondaryLabel="Closest available gear ratio"
            secondaryValue={formatRatio(result.performanceGear)}
            footerLabel="Best Performance"
            footerIcon="performance"
          />
          <SummaryRatioCard
            variant="current"
            index={3}
            title="Keep Current Ratio"
            subtitle="If you keep stock gears"
            mainValue={formatRatio(result.input.stockGearRatio)}
            secondaryLabel={squatEnabled ? 'Effective Ratio (with squat)' : 'Effective Ratio'}
            secondaryValue={formatRatio(result.effectiveRatio)}
            footerLabel={keepCurrentFooterLabel(result.gearingLossPct)}
            footerIcon="warning"
          />
        </div>
      )}
    </section>
  );
}

export default function PremiumGearRatioCalculator({
  initialFields,
}: PremiumGearRatioCalculatorProps) {
  const formRef = useRef<HTMLElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const resultsAnchorRef = useRef<HTMLDivElement>(null);
  const faqRef = useRef<HTMLElement>(null);
  const { fields, updateField, analyze, ready, result, verdict } = useGearRatioCalculator({
    initialFields,
  });

  useCalculatorStarted(CALCULATOR_NAMES.gearRatio);
  const dedupTracker = useAnalyticsDedupTracker();

  const handleAnalyze = useCallback(() => {
    analyze();
    const signature = [
      fields.currentDiameterIn,
      fields.stockGearRatio,
      fields.transTopGear,
      fields.newDiameterIn,
      fields.speed,
      fields.speedUnit,
      fields.cruiseRpm,
      fields.desiredRpm,
    ].join('|');
    trackCalculatorCompletedOnce(dedupTracker, signature, {
      calculator_name: CALCULATOR_NAMES.gearRatio,
    });
    requestAnimationFrame(() => {
      resultsAnchorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }, [analyze, fields, dedupTracker]);

  const stickyVisible = useStickyAnalyzeButton(formRef, resultsAnchorRef, { resultsReady: ready });
  useSingleOpenDetails(faqRef);

  const effectivePreview = useMemo(() => {
    const parsed = parseGearRatioInput(fields);
    if (!parsed) return null;
    return computeGearRatio(parsed);
  }, [fields]);

  return (
    <div className="cmp-page wof-page grc-page tl-has-sticky-analyze">
      <div className="cmp-shell">
        <div className="cmp-toolbar">
          <nav className="cmp-breadcrumbs" aria-label="Breadcrumb">
            <a href="/">Home</a>
            <span>/</span>
            <a href={CALCULATOR_PATHS.tireSize}>Calculators</a>
            <span>/</span>
            <span>Gear Ratio Calculator</span>
          </nav>
        </div>

        <div className="grc-layout">
          <header className="wof-hero grc-hero">
            <div className="wof-hero__top">
              <h1 className="wof-hero__title">Gear Ratio Calculator</h1>
              <span className="wof-hero__badge">REGEAR ANALYSIS</span>
            </div>
            <p className="wof-hero__desc grc-hero__desc">
              Find the right differential gear ratio after changing tire size.
              <br />
              Compare stock, ideal, and performance gearing to understand acceleration, towing, fuel economy, and whether a regear is worth the cost.
            </p>
          </header>

          <section ref={formRef} className="grc-workspace" aria-label="Gear ratio inputs">
            <div className="grc-workspace-card">
            <div className="grc-calc-grid">
              <div className="grc-setup-col grc-setup-col--current">
                <SetupColHeader variant="current" title="Current Setup" />
                <div className="grc-setup-col__fields">
                  <StackNumberField
                    id="cur-diameter"
                    label="Current Tire Diameter"
                    unit="inches"
                    value={fields.currentDiameterIn}
                    step={0.1}
                    onChange={(v) => updateField('currentDiameterIn', v)}
                  />
                  <StackSelectField
                    id="cur-gear"
                    label="Current Axle Gear Ratio"
                    value={fields.stockGearRatio}
                    options={GEAR_RATIO_OPTIONS}
                    onChange={(v) => updateField('stockGearRatio', v)}
                  />
                  <StackNumberField
                    id="cur-trans"
                    label="Transmission Top Gear"
                    optional
                    value={fields.transTopGear}
                    step={0.01}
                    onChange={(v) => updateField('transTopGear', v)}
                  />
                  <StackNumberField
                    id="cur-tcase"
                    label="Transfer Case Low Range"
                    optional
                    value={fields.transferLowRatio}
                    step={0.01}
                    onChange={(v) => updateField('transferLowRatio', v)}
                  />
                </div>
              </div>

              <div className="grc-setup-col grc-setup-col--new">
                <SetupColHeader variant="new" title="New Setup" />
                <div className="grc-setup-col__fields">
                <StackNumberField
                  id="new-diameter"
                  label="New Tire Diameter"
                  unit="inches"
                  value={fields.newDiameterIn}
                  step={0.1}
                  onChange={(v) => updateField('newDiameterIn', v)}
                />
                <label className="grc-check grc-setup-col__check">
                  <input
                    type="checkbox"
                    checked={fields.squatEnabled}
                    onChange={(e) => updateField('squatEnabled', e.target.checked)}
                  />
                  <span className="grc-check__box" aria-hidden="true" />
                  <span className="grc-check__text">
                    Account for tire squat (~3%)
                    <Tooltip text="Tires flatten slightly under the weight of the vehicle, so the loaded rolling diameter is a bit smaller than advertised." />
                  </span>
                </label>
                {effectivePreview && fields.squatEnabled ? (
                  <div className="grc-setup-col__readout">
                    <span className="grc-setup-col__readout-label">Effective Tire Diameter</span>
                    <span className="grc-setup-col__readout-value">
                      {effectivePreview.effectiveNewDiameterIn.toFixed(2)} inches
                    </span>
                    <span className="grc-setup-col__readout-sub">
                      Reduces effective diameter by {fields.squatPercent}%. Tires compress under vehicle
                      weight, reducing effective rolling diameter by roughly 2–4%.
                    </span>
                  </div>
                ) : null}
                </div>
              </div>

              <div ref={previewRef} className="grc-calc-grid__summary">
                <ResultsSummary
                  result={effectivePreview}
                  squatEnabled={fields.squatEnabled}
                />
              </div>

              <div className="grc-calc-grid__actions">
                <button type="button" className="wof-analyze-btn grc-analyze-btn" onClick={handleAnalyze}>
                  <span className="grc-analyze-btn__icon" aria-hidden="true">
                    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.75">
                      <rect x="3" y="2" width="14" height="16" rx="2" />
                      <path d="M7 6h6M7 10h3M7 14h4" strokeLinecap="round" />
                    </svg>
                  </span>
                  Analyze Gear Ratio
                </button>
              </div>
            </div>
            </div>
          </section>

          <div className="cmp-main wof-main grc-main grc-layout__main">
            {ready && result && verdict ? (
              <>
                  <div ref={resultsAnchorRef} className="grc-results-anchor" aria-hidden="true" />
                  <section
                    className={`wof-verdict grc-verdict wof-verdict--${verdict.tone}`}
                    aria-label="Regear verdict details"
                  >
                    <div className="wof-verdict__lead">
                      <span className="wof-verdict__icon" aria-hidden="true">
                        {verdict.tone === 'green' ? '✓' : verdict.tone === 'red' ? '!' : '⚠'}
                      </span>
                      <span className="wof-verdict__eyebrow">Gearing Verdict</span>
                      <span className="wof-verdict__label">{verdict.label}</span>
                      <span className="wof-verdict__summary">{verdict.summary}</span>
                    </div>

                    <ul className="wof-verdict__checks grc-verdict__checks">
                      {verdict.rows.map((row) => (
                        <li
                          key={row.id}
                          className={`wof-verdict__check grc-verdict__check wof-verdict__check--${row.status}`}
                        >
                          <span className={`grc-verdict__check-icon grc-verdict__check-icon--${row.status}`} aria-hidden="true">
                            <ImpactIcon name={row.icon} />
                          </span>
                          <span className="wof-verdict__check-body">
                            <span className="wof-verdict__check-label">{row.label}</span>
                            <span className="wof-verdict__check-detail">{row.detail}</span>
                          </span>
                        </li>
                      ))}
                    </ul>

                    <div className="wof-verdict__notes">
                      <span className="wof-verdict__notes-title">Recommendation</span>
                      <p className="wof-verdict__notes-text">
                        {verdict.tone === 'green'
                          ? `You lose only ${result.gearingLossPct.toFixed(1)}% effective gearing. Keep your ${formatRatio(result.input.stockGearRatio)} gears and enjoy the new tires.`
                          : `You lose about ${result.gearingLossPct.toFixed(1)}% effective gearing. A regear to ${formatRatio(result.idealGear)} restores daily response, or ${formatRatio(result.performanceGear)} for towing and trails.`}
                      </p>
                      <a className="wof-verdict__notes-btn" href={CALCULATOR_PATHS.tireComparison}>
                        Compare Tire Sizes
                      </a>
                    </div>
                  </section>

                  <GearCompareInstallRow result={result} />

                  <div className="grc-effective-cost-row">
                    <div className="grc-effective-cost-row__col">
                      <EffectiveGearRatioExplained result={result} />
                    </div>
                    <div className="grc-effective-cost-row__col">
                      <section className="grc-cost" aria-label="Expected regear cost">
                        <div className="grc-cost__head">
                          <h2 className="grc-cost__title">Expected Regear Cost</h2>
                          <p className="grc-cost__subtitle">
                            Typical pricing by how you get the work done.
                          </p>
                        </div>
                        <div className="grc-cost__grid">
                          {REGEAR_COSTS.map((tier) => (
                            <article
                              key={tier.key}
                              className={`grc-price ${tier.featured ? 'grc-price--featured' : ''}`}
                            >
                              {tier.featured ? (
                                <span className="grc-price__flag">Most Common</span>
                              ) : null}
                              <span className="grc-price__icon" aria-hidden="true">
                                <CostIcon name={tier.icon} />
                              </span>
                              <span className="grc-price__name">{tier.name}</span>
                              <span className="grc-price__range">{tier.range}</span>
                              <span className="grc-price__unit">{tier.unit}</span>
                              <ul className="grc-price__features">
                                {tier.features.map((feature) => (
                                  <li key={feature}>
                                    <span className="grc-price__feature-check" aria-hidden="true">
                                      ✓
                                    </span>
                                    {feature}
                                  </li>
                                ))}
                              </ul>
                            </article>
                          ))}
                        </div>
                        <p className="grc-cost__disclaimer">
                          Estimates only. Actual cost varies by vehicle, axle type, gear brand, locker
                          installation, and regional labor rates. Always get a local quote before budgeting.
                        </p>
                      </section>
                    </div>
                  </div>

                  <GearRatioComparisonTable result={result} />
                </>
              ) : null}

            <article className="cmp-seo-block wof-seo-block grc-seo-block">
              <h2>{SEO_GEAR_CONTENT.heading}</h2>
              {SEO_GEAR_CONTENT.paragraphs.map((paragraph) => (
                <p key={paragraph.slice(0, 40)}>{paragraph}</p>
              ))}
            </article>

            <div className="grc-faq-related-row grc-faq-related">
              <section className="wof-faq-section grc-faq-section" aria-label="Frequently asked questions">
                <h2 className="wof-section-title grc-faq-section__title">Frequently Asked Questions</h2>
                <div className="wof-faq-grid grc-faq-grid" ref={faqRef}>
                  {GEAR_FAQS.map((faq) => (
                    <details key={faq.question} className="wof-faq-item grc-faq-item">
                      <summary>{faq.question}</summary>
                      <p>{faq.answer}</p>
                    </details>
                  ))}
                </div>
              </section>

              <aside className="grc-bottom-panels" aria-label="Related calculators">
                <section className="cmp-panel wof-sidebar-panel grc-bottom-panels__panel">
                  <h2 className="cmp-panel__title">Related Calculators</h2>
                  <div className="wof-sidebar-calc__list">
                    {RELATED_CALCULATOR_LINKS.map((link) => (
                      <a
                        key={link.href}
                        href={link.href}
                        className="wof-sidebar-calc__card"
                        onClick={() => trackRelatedCalculatorClick(link.href, CALCULATOR_NAMES.gearRatio)}
                      >
                        <span className="wof-sidebar-calc__icon">
                          <RelatedIcon name={RELATED_ICON_BY_HREF[link.href] ?? 'compare'} />
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
        </div>
      </div>

      <StickyAnalyzeButton visible={stickyVisible} label="Analyze" onClick={handleAnalyze} ariaLabel="Analyze gear ratio" />
    </div>
  );
}
