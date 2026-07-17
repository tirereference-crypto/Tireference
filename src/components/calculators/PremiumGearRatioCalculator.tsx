import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import '../../styles/calculator-gear.css';
import { useSingleOpenDetails } from '../../hooks/useSingleOpenDetails';
import { CALCULATOR_PATHS } from '../../lib/calculator-links';
import {
  type GearRatioFields,
  type GearRatioResult,
  formatAxleRatio,
} from '../../lib/gear-ratio-math';
import {
  buildGearRatioScaleMarkers,
  buildNearbyRatioExamples,
  buildPrimaryAnswerCopy,
  GEAR_EDU_SECTIONS,
  GEAR_FAQS,
  GEAR_RATIO_OPTIONS,
  LOW_SPEED_BIAS_OPTIONS_LABELS,
  REGEAR_COSTS,
} from '../../lib/gear-ratio-insights';
import {
  GearRatioFactualComparisonTable,
  GearRpmCrawlComparison,
  HowGearRatioCalculationWorks,
  WhatChangesWithNewTires,
} from './GearRatioVisual';
import { useGearRatioCalculator } from './useGearRatioCalculator';
import CalculatorLinkActions from './CalculatorLinkActions';
import { RelatedCalculatorsSection } from './ComparisonLowerPage';
import {
  CALCULATOR_NAMES,
  trackCalculatorCompletedOnce,
  useAnalyticsDedupTracker,
  useCalculatorStarted,
} from '../../hooks/useCalculatorAnalytics';

export interface PremiumGearRatioCalculatorProps {
  initialFields?: GearRatioFields;
}

function scrollToId(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
}

function ResultsJumpNav({
  hasAdvancedResults,
  onAdvanced,
}: {
  hasAdvancedResults: boolean;
  onAdvanced: () => void;
}) {
  const items: Array<{ id: string; label: string; icon: string; href?: string; onClick?: () => void }> =
    [
      { id: 'what', label: 'What changes', icon: 'Δ', href: '#grc-what-changes' },
      { id: 'compare', label: 'Compare setups', icon: '⇄', href: '#grc-compare-setups' },
      hasAdvancedResults
        ? { id: 'advanced', label: 'Advanced analysis', icon: '⚙', href: '#grc-advanced-analysis' }
        : { id: 'advanced', label: 'Advanced analysis', icon: '⚙', onClick: onAdvanced },
      { id: 'how', label: 'How it works', icon: 'ƒ', href: '#grc-how-it-works' },
    ];

  return (
    <nav className="grc-page-jump" aria-label="On this page">
      {items.map((item) =>
        item.href ? (
          <a
            key={item.id}
            href={item.href}
            className="grc-page-jump__pill"
            onClick={(e) => {
              e.preventDefault();
              scrollToId(item.href!.slice(1));
            }}
          >
            <span className="grc-page-jump__icon" aria-hidden="true">
              {item.icon}
            </span>
            {item.label}
          </a>
        ) : (
          <button key={item.id} type="button" className="grc-page-jump__pill" onClick={item.onClick}>
            <span className="grc-page-jump__icon" aria-hidden="true">
              {item.icon}
            </span>
            {item.label}
          </button>
        ),
      )}
    </nav>
  );
}

function EduBlockIcon({ icon }: { icon: (typeof GEAR_EDU_SECTIONS)[number]['icon'] }) {
  const common = {
    viewBox: '0 0 24 24',
    width: 20,
    height: 20,
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.75,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true as const,
  };

  switch (icon) {
    case 'taller':
      return (
        <svg {...common}>
          <path d="M12 19V5" />
          <path d="M7 10l5-5 5 5" />
          <path d="M5 19h14" />
        </svg>
      );
    case 'restore':
      return (
        <svg {...common}>
          <path d="M4 12a8 8 0 0 1 14.1-5.1" />
          <path d="M18 4v4h-4" />
          <path d="M20 12a8 8 0 0 1-14.1 5.1" />
          <path d="M6 20v-4h4" />
        </svg>
      );
    case 'deeper':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="7" />
          <path d="M12 9v6" />
          <path d="M9.5 12.5 12 15l2.5-2.5" />
        </svg>
      );
    case 'limits':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="7" />
          <path d="M12 8v5" />
          <path d="M12 16h.01" />
        </svg>
      );
  }
}

function TireIcon() {
  return (
    <svg viewBox="0 0 20 20" width="14" height="14" fill="none" aria-hidden="true">
      <circle cx="10" cy="10" r="6.5" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="10" cy="10" r="2.25" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function GearIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2.5v2.2M12 19.3v2.2M4.2 6.5l1.6 1.6M18.2 15.9l1.6 1.6M2.5 12h2.2M19.3 12h2.2M4.2 17.5l1.6-1.6M18.2 8.1l1.6-1.6" />
    </svg>
  );
}

function DirectionTrendIcon({ taller }: { taller: boolean }) {
  return (
    <svg viewBox="0 0 20 20" width="16" height="16" fill="none" aria-hidden="true">
      {taller ? (
        <>
          <path
            d="M10 4v12"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
          />
          <path
            d="M6.5 14.5 10 18l3.5-3.5"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </>
      ) : (
        <>
          <path
            d="M10 16V4"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
          />
          <path
            d="M6.5 5.5 10 2l3.5 3.5"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </>
      )}
    </svg>
  );
}

/** Tire diameter chip display — drop trailing .0, keep one decimal when needed. */
function formatChipDiameter(value: string): string {
  const n = Number(value);
  if (!Number.isFinite(n)) return value || '—';
  return Number.isInteger(n) ? String(n) : n.toFixed(1).replace(/\.0$/, '');
}

function SetupSummaryChips({
  currentDiameter,
  newDiameter,
  axleRatio,
}: {
  currentDiameter: string;
  newDiameter: string;
  axleRatio: string;
}) {
  return (
    <div className="grc-setup-summary" aria-label="Setup summary">
      <span className="grc-setup-chip grc-setup-chip--current">
        <TireIcon />
        <span>
          <strong>{formatChipDiameter(currentDiameter)} in</strong> Current Tire
        </span>
      </span>
      <span className="grc-setup-summary__arrow" aria-hidden="true">
        →
      </span>
      <span className="grc-setup-chip grc-setup-chip--new">
        <TireIcon />
        <span>
          <strong>{formatChipDiameter(newDiameter)} in</strong> New Tire
        </span>
      </span>
      <span className="grc-setup-chip grc-setup-chip--axle">
        <GearIcon size={14} />
        <span>
          <strong>{formatAxleRatio(axleRatio)}</strong> Current Axle Ratio
        </span>
      </span>
    </div>
  );
}

function StackNumberField({
  id,
  label,
  optional,
  unit,
  value,
  step,
  helper,
  error,
  onChange,
  onBlur,
}: {
  id: string;
  label: string;
  optional?: boolean;
  unit?: string;
  value: string;
  step?: number;
  helper?: string;
  error?: string | null;
  onChange: (value: string) => void;
  onBlur?: () => void;
}) {
  const helperId = helper ? `${id}-helper` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  return (
    <div className={`grc-stack-field${error ? ' grc-stack-field--error' : ''}`}>
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
          onBlur={onBlur}
          aria-invalid={error ? true : undefined}
          aria-describedby={
            [helperId, errorId, unit ? `${id}-unit` : null].filter(Boolean).join(' ') || undefined
          }
        />
        {unit ? (
          <span id={`${id}-unit`} className="grc-stack-field__suffix">
            {unit}
          </span>
        ) : null}
      </div>
      {helper ? (
        <p id={helperId} className="grc-stack-field__helper">
          {helper}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="grc-stack-field__error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function useValueFlash(signature: string): boolean {
  const [flash, setFlash] = useState(false);
  const prevRef = useRef(signature);
  const readyRef = useRef(false);

  useEffect(() => {
    if (!readyRef.current) {
      readyRef.current = true;
      prevRef.current = signature;
      return;
    }
    if (prevRef.current === signature) return;
    prevRef.current = signature;
    setFlash(true);
    const timer = window.setTimeout(() => setFlash(false), 250);
    return () => window.clearTimeout(timer);
  }, [signature]);

  return flash;
}

function nearbyExpandHelper(item: ReturnType<typeof buildNearbyRatioExamples>[number]): string {
  if (item.direction === 'match') {
    return 'This nearby example approximately matches the original geometric relationship.';
  }
  const match = item.comparison.match(/([\d.]+)%/);
  const abs = match?.[1] ?? 'the same';
  if (item.direction === 'taller') {
    return `Engine RPM and low-speed multiplication remain approximately ${abs}% below the original setup.`;
  }
  return `Engine RPM and low-speed multiplication remain approximately ${abs}% above the original setup.`;
}

function GearRatioScale({ result }: { result: GearRatioResult }) {
  const markers = buildGearRatioScaleMarkers(result);
  const [motionReady, setMotionReady] = useState(false);

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return;
    const frame = window.requestAnimationFrame(() => setMotionReady(true));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  return (
    <div
      className={`grc-scale${motionReady ? ' grc-scale--motion' : ''}`}
      aria-label="Compare the gearing options"
      aria-describedby="grc-scale-note"
    >
      <h3 className="grc-scale__title">Compare the gearing options</h3>
      <p id="grc-scale-note" className="grc-scale__note">
        Markers show the relative numerical position of each ratio.
      </p>

      <div className="grc-scale__track" aria-hidden="true">
        <div className="grc-scale__line" />
        {markers.map((marker) => (
          <div
            key={marker.id}
            className={`grc-scale__marker grc-scale__marker--${marker.role}${
              marker.role === 'exact' ? ' grc-scale__marker--dominant' : ''
            }`}
            style={{ left: `${marker.positionPercent}%` }}
            tabIndex={0}
            aria-label={`${marker.label}: ${formatAxleRatio(marker.value)}, ${marker.percentLabel}`}
            title={`${marker.label}: ${formatAxleRatio(marker.value)} — ${marker.percentLabel}`}
          >
            <span className="grc-scale__dot" />
            <span className="grc-scale__value">{formatAxleRatio(marker.value)}</span>
            <span className="grc-scale__label">{marker.label}</span>
            <span className="grc-scale__tip" aria-hidden="true">
              {formatAxleRatio(marker.value)} · {marker.label} · {marker.percentLabel}
            </span>
          </div>
        ))}
      </div>

      <ol className="grc-scale__stack">
        {markers.map((marker) => (
          <li
            key={marker.id}
            className={`grc-scale__stack-item grc-scale__stack-item--${marker.role}`}
          >
            <span className="grc-scale__stack-marker" aria-hidden="true" />
            <span className="grc-scale__stack-copy">
              <span className="grc-scale__stack-label">{marker.label}</span>
              <span className="grc-scale__stack-pct">{marker.percentLabel}</span>
            </span>
            <span className="grc-scale__stack-value">{formatAxleRatio(marker.value)}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

function PrimaryAnswerPanel({
  result,
  stale,
  hasPrimaryErrors,
  onCompareRatio,
}: {
  result: GearRatioResult;
  stale: boolean;
  hasPrimaryErrors: boolean;
  onCompareRatio: (ratio: number) => void;
}) {
  const copy = buildPrimaryAnswerCopy(result);
  const nearby = buildNearbyRatioExamples(result);
  const bias = result.input.lowSpeedBiasPercent;
  const tallerNow = result.effectiveChangePercent < 0;
  const [expandedNearby, setExpandedNearby] = useState<string | null>(null);
  const flashTarget = useValueFlash(formatAxleRatio(result.stockLikeTarget));
  const flashEffective = useValueFlash(formatAxleRatio(result.effectiveRatio));
  const flashDeeper = useValueFlash(formatAxleRatio(result.deeperTarget));

  return (
    <section
      className={`grc-answer${stale ? ' grc-answer--stale' : ''}`}
      aria-label="Stock-like gearing target"
    >
      <div className="grc-answer__hero">
        <div className="grc-answer__hero-eyebrow">
          <GearIcon size={18} />
          <span>Exact stock-like target</span>
        </div>

        {hasPrimaryErrors || stale ? (
          <p className="grc-answer__status" role="status">
            Check the highlighted input. Showing the last valid result.
          </p>
        ) : null}

        <p className={`grc-answer__value${flashTarget ? ' grc-flash' : ''}`}>
          {formatAxleRatio(result.stockLikeTarget)}
        </p>
        <p className="grc-answer__label">{copy.supportLine}</p>
        <p className="grc-answer__explain">{copy.explanation}</p>
      </div>

      <GearRatioScale result={result} />

      {nearby.length > 0 ? (
        <div className="grc-answer__nearby">
          <h3 className="grc-answer__nearby-title">Nearby common ratio examples</h3>
          <div className="grc-answer__chips">
            {nearby.map((item) => {
              const key = `${item.side}-${item.ratio}`;
              const open = expandedNearby === key;
              return (
                <div
                  key={key}
                  className={`grc-answer__chip grc-answer__chip--${item.side}${
                    item.isClosest ? ' grc-answer__chip--closest' : ''
                  }${open ? ' grc-answer__chip--open' : ''}`}
                >
                  <button
                    type="button"
                    className="grc-answer__chip-toggle"
                    aria-expanded={open}
                    onClick={() => setExpandedNearby(open ? null : key)}
                    onFocus={() => setExpandedNearby(key)}
                  >
                    <span className="grc-answer__chip-head">
                      <span className={`grc-answer__chip-ratio${flashTarget ? ' grc-flash' : ''}`}>
                        {formatAxleRatio(item.ratio)}
                      </span>
                      {item.direction !== 'match' ? (
                        <span
                          className={`grc-answer__chip-dir grc-answer__chip-dir--${item.direction}`}
                        >
                          {item.direction === 'taller' ? 'Taller' : 'Deeper'}
                        </span>
                      ) : null}
                    </span>
                    <span className="grc-answer__chip-cmp">{item.comparison}</span>
                    {item.isClosest ? (
                      <span className="grc-answer__chip-tag">Closest mathematically</span>
                    ) : null}
                  </button>
                  {open ? (
                    <div className="grc-answer__chip-expand">
                      <p>{nearbyExpandHelper(item)}</p>
                      <button
                        type="button"
                        className="grc-answer__chip-compare"
                        onClick={() => onCompareRatio(item.ratio)}
                      >
                        Compare {formatAxleRatio(item.ratio)}
                      </button>
                      <p className="grc-answer__chip-compare-note">
                        Adds this ratio to Setup Comparison without changing your current axle input.
                      </p>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
          <p className="grc-answer__note">
            Confirm availability for your specific axle and differential.
          </p>
        </div>
      ) : null}

      <div className="grc-answer__tiles">
        <article className="grc-answer-tile grc-answer-tile--current">
          <div className="grc-answer-tile__head">
            <h3 className="grc-answer-tile__label">Current gears with new tires</h3>
            <span
              className="grc-answer-tile__trend"
              aria-hidden="true"
              title={tallerNow ? 'Taller effective gearing' : 'Deeper effective gearing'}
            >
              <DirectionTrendIcon taller={tallerNow} />
            </span>
          </div>
          <p className={`grc-answer-tile__value${flashEffective ? ' grc-flash' : ''}`}>
            {formatAxleRatio(result.effectiveRatio)}{' '}
            <span className="grc-answer-tile__unit">effective ratio</span>
          </p>
          <p className="grc-answer-tile__secondary">{copy.currentGearsSecondary}</p>
          <p className="grc-answer-tile__helper">{copy.currentGearsHelper}</p>
        </article>
        <article className="grc-answer-tile grc-answer-tile--deeper">
          <div className="grc-answer-tile__head">
            <h3 className="grc-answer-tile__label">Optional deeper target</h3>
            <span
              className="grc-answer-tile__trend"
              aria-hidden="true"
              title="Deeper effective gearing"
            >
              <DirectionTrendIcon taller={false} />
            </span>
          </div>
          <p className={`grc-answer-tile__value${flashDeeper ? ' grc-flash' : ''}`}>
            {formatAxleRatio(result.deeperTarget)}{' '}
            <span className="grc-answer-tile__unit">target</span>
          </p>
          <p className="grc-answer-tile__secondary">
            {bias}% deeper than the stock-like target
          </p>
          <p className="grc-answer-tile__helper">{copy.deeperHelper}</p>
        </article>
      </div>

      <div className="grc-answer__toolbar">
        <CalculatorLinkActions
          shareTitle="Gear Ratio Calculator – Tire Size & Axle Ratio"
          calculatorName={CALCULATOR_NAMES.gearRatio}
        />
      </div>
    </section>
  );
}

export default function PremiumGearRatioCalculator({
  initialFields,
}: PremiumGearRatioCalculatorProps) {
  const faqRef = useRef<HTMLDivElement>(null);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [costOpen, setCostOpen] = useState(false);
  const [accordionSession, setAccordionSession] = useState(0);
  const [resultsLiveMessage, setResultsLiveMessage] = useState('');
  const [compareRatios, setCompareRatios] = useState<number[]>([]);
  const lastAnnouncedRef = useRef('');
  const advancedRef = useRef<HTMLDetailsElement>(null);
  const {
    fields,
    updateField,
    touchField,
    fieldErrors,
    hasPrimaryErrors,
    reset,
    ready,
    result,
    resultsStale,
  } = useGearRatioCalculator({
    initialFields,
  });

  useCalculatorStarted(CALCULATOR_NAMES.gearRatio);
  const dedupTracker = useAnalyticsDedupTracker();
  useSingleOpenDetails(faqRef);

  const closeLongAccordions = useCallback(() => {
    setCostOpen(false);
    setAccordionSession((value) => value + 1);
  }, []);

  useEffect(() => {
    const onPopState = () => closeLongAccordions();
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [closeLongAccordions]);

  useEffect(() => {
    if (!result || resultsStale) return;
    const signature = [
      formatAxleRatio(result.currentDiameterIn),
      formatAxleRatio(result.newDiameterIn),
      formatAxleRatio(result.input.stockGearRatio),
      formatAxleRatio(result.stockLikeTarget),
    ].join('|');
    trackCalculatorCompletedOnce(dedupTracker, signature, {
      calculator_name: CALCULATOR_NAMES.gearRatio,
    });
    const message = `Stock-like gearing target ${formatAxleRatio(result.stockLikeTarget)}.`;
    if (message !== lastAnnouncedRef.current) {
      lastAnnouncedRef.current = message;
      setResultsLiveMessage(message);
    }
  }, [result, resultsStale, dedupTracker]);

  const gearOptions = useMemo(
    () =>
      GEAR_RATIO_OPTIONS.includes(fields.stockGearRatio)
        ? GEAR_RATIO_OPTIONS
        : [fields.stockGearRatio, ...GEAR_RATIO_OPTIONS],
    [fields.stockGearRatio],
  );

  const handleReset = useCallback(() => {
    reset();
    setAdvancedOpen(false);
    if (advancedRef.current) advancedRef.current.open = false;
    setCompareRatios([]);
    closeLongAccordions();
    lastAnnouncedRef.current = '';
    setResultsLiveMessage('Inputs reset to defaults.');
  }, [reset, closeLongAccordions]);

  const handleCompareRatio = useCallback((ratio: number) => {
    setCompareRatios((prev) =>
      prev.some((value) => Math.abs(value - ratio) < 0.005) ? prev : [...prev, ratio],
    );
    scrollToId('grc-compare-setups');
  }, []);

  const hasAdvancedResults = Boolean(result && (result.rpmReady || result.crawlReady));

  const openAdvancedInputs = useCallback(() => {
    const details = advancedRef.current;
    if (details && !details.open) {
      details.open = true;
      setAdvancedOpen(true);
    }
    details?.scrollIntoView({
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
      block: 'start',
    });
  }, []);

  return (
    <div className="cmp-page wof-page grc-page">
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
              Find the axle ratio that restores your original effective gearing after a tire size
              change.
            </p>
            <SetupSummaryChips
              currentDiameter={fields.currentDiameterIn}
              newDiameter={fields.newDiameterIn}
              axleRatio={fields.stockGearRatio}
            />
          </header>

          <section className="grc-workspace" aria-label="Gear ratio calculator">
            <div className="grc-workspace-card grc-workspace-card--split">
              <div className="grc-workspace-grid">
                <div className="grc-input-panel">
                  <div className="grc-input-panel__head">
                    <h2 className="grc-input-panel__title">Enter Your Setup</h2>
                    <button type="button" className="grc-reset-btn" onClick={handleReset}>
                      Reset
                    </button>
                  </div>

                  <div className="grc-input-panel__fields">
                    <div className="grc-setup-group grc-setup-group--current">
                      <span className="grc-setup-badge grc-setup-badge--current">Current</span>
                      <StackNumberField
                        id="cur-diameter"
                        label="Current tire diameter"
                        unit="in"
                        value={fields.currentDiameterIn}
                        step={0.1}
                        error={fieldErrors.currentDiameterIn}
                        onChange={(v) => updateField('currentDiameterIn', v)}
                        onBlur={() => touchField('currentDiameterIn')}
                      />
                      <div className="grc-stack-field">
                        <label htmlFor="cur-gear" className="grc-stack-field__label">
                          <span className="grc-stack-field__label-text">Current axle gear ratio</span>
                        </label>
                        <div className="grc-stack-field__control">
                          <input
                            id="cur-gear"
                            type="number"
                            step={0.01}
                            list="grc-gear-presets"
                            value={fields.stockGearRatio}
                            onChange={(e) => updateField('stockGearRatio', e.target.value)}
                            onBlur={() => touchField('stockGearRatio')}
                            aria-invalid={fieldErrors.stockGearRatio ? true : undefined}
                            aria-describedby="cur-gear-unit cur-gear-presets-hint"
                          />
                          <span id="cur-gear-unit" className="grc-stack-field__suffix">
                            ratio
                          </span>
                        </div>
                        <datalist id="grc-gear-presets">
                          {gearOptions.map((option) => (
                            <option key={option} value={option} />
                          ))}
                        </datalist>
                        <p id="cur-gear-presets-hint" className="grc-stack-field__helper">
                          Enter a custom ratio or pick a common preset such as 3.73 or 4.10.
                        </p>
                        {fieldErrors.stockGearRatio ? (
                          <p className="grc-stack-field__error" role="alert">
                            {fieldErrors.stockGearRatio}
                          </p>
                        ) : null}
                      </div>
                    </div>

                    <div className="grc-setup-connector" aria-hidden="true">
                      <span className="grc-setup-connector__line" />
                      <span className="grc-setup-connector__label">
                        Current setup → New tire setup
                      </span>
                      <span className="grc-setup-connector__arrow">↓</span>
                    </div>

                    <div className="grc-setup-group grc-setup-group--new">
                      <span className="grc-setup-badge grc-setup-badge--new">New</span>
                      <StackNumberField
                        id="new-diameter"
                        label="New tire diameter"
                        unit="in"
                        value={fields.newDiameterIn}
                        step={0.1}
                        error={fieldErrors.newDiameterIn}
                        onChange={(v) => updateField('newDiameterIn', v)}
                        onBlur={() => touchField('newDiameterIn')}
                      />
                    </div>

                    <p className="grc-input-shared-note">
                      Use actual mounted tire diameter when available.
                    </p>
                  </div>


                </div>

                <div className="grc-answer-panel">
                  <div className="sr-only" aria-live="polite" aria-atomic="true">
                    {resultsLiveMessage}
                  </div>
                  {result ? (
                    <PrimaryAnswerPanel
                      result={result}
                      stale={resultsStale}
                      hasPrimaryErrors={hasPrimaryErrors}
                      onCompareRatio={handleCompareRatio}
                    />
                  ) : (
                    <div className="grc-answer grc-answer--empty">
                      <p>Enter valid tire diameters and axle ratio to see the stock-like target.</p>
                    </div>
                  )}
                </div>

                <div className="grc-advanced-slot">
                  <details
                    ref={advancedRef}
                    className="grc-advanced grc-advanced--quiet"
                    onToggle={(e) => setAdvancedOpen(e.currentTarget.open)}
                  >
                    <summary className="grc-advanced__summary" aria-expanded={advancedOpen}>
                      <span className="grc-advanced__summary-icon" aria-hidden="true">
                        <GearIcon size={16} />
                      </span>
                      <span className="grc-advanced__summary-text">
                        <span className="grc-advanced__summary-title">
                          Advanced RPM &amp; Crawl Analysis
                        </span>
                        <span className="grc-advanced__summary-hint">
                          Optional speed, transmission and low-range inputs
                        </span>
                      </span>
                      <span className="grc-accordion-chevron" aria-hidden="true" />
                    </summary>
                    <div className="grc-advanced__body">
                      <div className="grc-advanced__grid">
                        <StackNumberField
                          id="adv-speed"
                          label="Cruising Speed"
                          unit={fields.speedUnit === 'kmh' ? 'km/h' : 'mph'}
                          value={fields.speed}
                          step={1}
                          optional
                          helper="Used to estimate engine RPM at a selected road speed."
                          error={fieldErrors.speed}
                          onChange={(v) => updateField('speed', v)}
                          onBlur={() => touchField('speed')}
                        />
                        <div className="grc-stack-field">
                          <label htmlFor="adv-speed-unit" className="grc-stack-field__label">
                            <span className="grc-stack-field__label-text">Speed Unit</span>
                          </label>
                          <div className="grc-stack-field__control grc-stack-field__control--select">
                            <select
                              id="adv-speed-unit"
                              value={fields.speedUnit}
                              onChange={(e) =>
                                updateField('speedUnit', e.target.value === 'kmh' ? 'kmh' : 'mph')
                              }
                            >
                              <option value="mph">mph</option>
                              <option value="kmh">km/h</option>
                            </select>
                          </div>
                        </div>
                        <StackNumberField
                          id="adv-top"
                          label="Transmission Top Gear"
                          value={fields.transTopGear}
                          step={0.01}
                          optional
                          helper="Enter the transmission ratio used at your selected cruising speed."
                          error={fieldErrors.transTopGear}
                          onChange={(v) => updateField('transTopGear', v)}
                          onBlur={() => touchField('transTopGear')}
                        />
                        <StackNumberField
                          id="adv-first"
                          label="Transmission First Gear"
                          value={fields.firstGearRatio}
                          step={0.01}
                          optional
                          helper="Required to calculate overall crawl ratio."
                          error={fieldErrors.firstGearRatio}
                          onChange={(v) => updateField('firstGearRatio', v)}
                          onBlur={() => touchField('firstGearRatio')}
                        />
                        <StackNumberField
                          id="adv-tcase"
                          label="Transfer Case Low Range"
                          value={fields.transferLowRatio}
                          step={0.01}
                          optional
                          helper="Required for four-wheel-drive low-range crawl-ratio calculations."
                          error={fieldErrors.transferLowRatio}
                          onChange={(v) => updateField('transferLowRatio', v)}
                          onBlur={() => touchField('transferLowRatio')}
                        />
                        <div className="grc-stack-field">
                          <label htmlFor="adv-bias" className="grc-stack-field__label">
                            <span className="grc-stack-field__label-text">
                              Additional Low-Speed Bias
                            </span>
                          </label>
                          <div className="grc-stack-field__control grc-stack-field__control--select">
                            <select
                              id="adv-bias"
                              value={fields.lowSpeedBiasPercent}
                              onChange={(e) => updateField('lowSpeedBiasPercent', e.target.value)}
                            >
                              {LOW_SPEED_BIAS_OPTIONS_LABELS.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          </div>
                          <p className="grc-stack-field__helper">
                            User-selected mathematical target relative to the exact stock-like target —
                            not a vehicle-specific recommendation.
                          </p>
                        </div>
                      </div>
                    </div>
                  </details>
                </div>
              </div>
            </div>
          </section>

          <div className="cmp-main wof-main grc-main grc-layout__main">
            {ready && result ? (
              <>
                <ResultsJumpNav
                  hasAdvancedResults={hasAdvancedResults}
                  onAdvanced={openAdvancedInputs}
                />

                <div className="grc-band grc-band--white">
                  <div className="grc-band__inner">
                    <WhatChangesWithNewTires result={result} />
                  </div>
                </div>

                <div className="grc-band grc-band--indigo">
                  <div className="grc-band__inner grc-results-live">
                    <GearRpmCrawlComparison result={result} />
                    <GearRatioFactualComparisonTable result={result} extraAxleRatios={compareRatios} />
                  </div>
                </div>

                <div className="grc-band grc-band--white">
                  <div className="grc-band__inner grc-results-live">
                    <HowGearRatioCalculationWorks key={accordionSession} result={result} />
                    <details
                      key={`cost-${accordionSession}`}
                      id="grc-cost-accordion"
                      className="grc-cost-accordion"
                      open={costOpen}
                      onToggle={(e) => setCostOpen(e.currentTarget.open)}
                    >
                      <summary
                        className="grc-cost-accordion__summary"
                        aria-expanded={costOpen}
                        aria-controls="grc-cost-accordion-body"
                      >
                        <span className="grc-cost-accordion__icon" aria-hidden="true">
                          <svg
                            viewBox="0 0 24 24"
                            width="18"
                            height="18"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.75"
                          >
                            <path
                              d="M14.7 6.3a4 4 0 0 0-5.4 5.4L4 17v3h3l5.3-5.3a4 4 0 0 0 5.4-5.4l-2.1 2.1-1.9-.5-.5-1.9 2.1-2.1Z"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </span>
                        <span className="grc-cost-accordion__text">
                          <span className="grc-cost-accordion__title">Typical US Regear Cost</span>
                          <span className="grc-cost-accordion__hint">
                            View broad US planning estimates and cost factors
                          </span>
                        </span>
                        <span className="grc-accordion-chevron" aria-hidden="true" />
                      </summary>
                      <div id="grc-cost-accordion-body" className="grc-cost-accordion__body">
                        <p className="grc-cost-accordion__banner">
                          Broad US planning estimates only. Actual cost depends on the axle, vehicle,
                          parts, labour, bearings, lockers and differential condition.
                        </p>
                        <ul className="grc-cost-accordion__list">
                          {REGEAR_COSTS.filter((tier) => tier.key !== 'extras').map((tier) => (
                            <li
                              key={tier.key}
                              className={`grc-cost-accordion__item grc-cost-accordion__item--${tier.key}`}
                            >
                              <div className="grc-cost-accordion__item-head">
                                <span className="grc-cost-accordion__name">{tier.name}</span>
                                <span className="grc-cost-accordion__range">{tier.range}</span>
                              </div>
                              <span className="grc-cost-accordion__unit">{tier.unit}</span>
                              <p className="grc-cost-accordion__detail">{tier.detail}</p>
                            </li>
                          ))}
                        </ul>
                        {REGEAR_COSTS.filter((tier) => tier.key === 'extras').map((tier) => (
                          <p key={tier.key} className="grc-cost-accordion__note">
                            {tier.name}: {tier.detail}
                          </p>
                        ))}
                        <p className="grc-cost-accordion__note">
                          These figures are not quotes and do not apply as-is in the UK, Canada,
                          Australia or New Zealand.
                        </p>
                      </div>
                    </details>
                  </div>
                </div>
              </>
            ) : null}

            <div className="grc-band grc-band--slate">
              <div className="grc-band__inner">
                <section className="grc-edu" aria-label="How tire size changes effective gearing">
                  <h2 className="grc-edu__title">How Tire Size Changes Effective Gearing</h2>
                  <div className="grc-edu__grid">
                    {GEAR_EDU_SECTIONS.map((section) => (
                      <article
                        key={section.id}
                        className={`grc-edu__block grc-edu__block--${section.id}`}
                      >
                        <div className="grc-edu__icon" aria-hidden="true">
                          <EduBlockIcon icon={section.icon} />
                        </div>
                        <div className="grc-edu__body">
                          <h3 className="grc-edu__heading">{section.title}</h3>
                          {section.points.map((point) => (
                            <p key={point} className="grc-edu__copy">
                              {point}
                            </p>
                          ))}
                          <p className="grc-edu__takeaway">{section.takeaway}</p>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              </div>
            </div>

            <div className="grc-band grc-band--white">
              <div className="grc-band__inner">
                <section
                  className="wof-faq-section wof-faq-section--full grc-faq-section"
                  aria-label="Frequently asked questions"
                >
                  <h2 className="wof-section-title grc-faq-section__title">
                    <span className="grc-faq-section__icon" aria-hidden="true">
                      <svg
                        viewBox="0 0 24 24"
                        width="20"
                        height="20"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.75"
                      >
                        <circle cx="12" cy="12" r="8" />
                        <path d="M9.5 9.5a2.5 2.5 0 1 1 3.4 2.3c-.7.4-1.4 1-1.4 2" strokeLinecap="round" />
                        <path d="M12 16.5h.01" strokeLinecap="round" />
                      </svg>
                    </span>
                    Frequently Asked Questions
                  </h2>
                  <div className="wof-faq-grid grc-faq-grid" ref={faqRef}>
                    {GEAR_FAQS.map((faq, index) => (
                      <details
                        key={faq.question}
                        className={`wof-faq-item grc-faq-item${
                          index % 2 === 0 ? ' grc-faq-item--tint-a' : ' grc-faq-item--tint-b'
                        }`}
                      >
                        <summary>{faq.question}</summary>
                        <p>{faq.answer}</p>
                      </details>
                    ))}
                  </div>
                </section>
              </div>
            </div>

            <div className="grc-band grc-band--indigo">
              <div className="grc-band__inner">
                <RelatedCalculatorsSection
                  excludeHref={CALCULATOR_PATHS.gearRatio}
                  calculatorName={CALCULATOR_NAMES.gearRatio}
                  limit={4}
                  orderedHrefs={[
                    CALCULATOR_PATHS.tireSize,
                    CALCULATOR_PATHS.tireComparison,
                    CALCULATOR_PATHS.wheelOffset,
                    CALCULATOR_PATHS.tireDiameter,
                  ]}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
