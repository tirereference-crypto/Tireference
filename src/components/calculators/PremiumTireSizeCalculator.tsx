import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import '../../styles/calculator-premium.css';
import '../../styles/tire-size-calculator-page.css';
import { useStickyAnalyzeButton } from '../../hooks/useStickyAnalyzeButton';
import { useSingleOpenDetails } from '../../hooks/useSingleOpenDetails';
import { inferTireCategory, TIRE_CATEGORY_LABELS } from '../../data/tire-sizes';
import { getVehicleFitment } from '../../data/vehicle-fitment';
import { FRONT_TIRE_WIDTH_GEOMETRY } from '../../lib/tire-diagram-geometry';
import { getTireDiagramImages } from '../../lib/tire-diagram-images';
import { buildAtAGlanceProfile } from '../../lib/tire-at-a-glance';
import { buildDynamicQuickFacts } from '../../lib/tire-calculator-insights';
import { buildPerformanceImpactCards, buildPerformanceImpactSummary } from '../../lib/tire-performance-impact';
import { comparisonPagePathCurrent, hubPagePath } from '../../lib/tire-size-url';
import { metricToFlotation } from '../../lib/tire-math';
import type { TireSpecs } from '../../lib/tire-math';
import { CALCULATOR_PATHS, getRelatedCalculatorLinks } from '../../lib/calculator-links';
import { TIRE_SIZE_CALCULATOR_FAQS } from '../../lib/tire-size-calculator-faqs';
import { TireSizeValidationBanner } from './TireSizeValidationBanner';
import { useTireSizeCalculator } from './useTireSizeCalculator';
import { StickyAnalyzeButton } from './StickyAnalyzeButton';
import {
  CALCULATOR_NAMES,
  trackCalculatorCompletedOnce,
  useAnalyticsDedupTracker,
  useCalculatorStarted,
  useUserInteractionFlag,
} from '../../hooks/useCalculatorAnalytics';
import { trackRelatedCalculatorClick, trackTireSizeSelected } from '../../lib/analytics';
import { CalculatorHeroInput } from './tire-size-calculator/CalculatorHeroInput';
import { CalculatorResults } from './tire-size-calculator/CalculatorResults';
import { CalculatorNotice } from './tire-size-calculator/CalculatorNotice';
import { CalculatorActions } from './tire-size-calculator/CalculatorActions';
import { TireSizeSnapshot } from './tire-size-calculator/TireSizeSnapshot';
import { TireCodeExplanation } from './tire-size-calculator/TireCodeExplanation';
import { PopularTiresBySize } from './tire-size-calculator/PopularTiresBySize';
import { RelatedTireSizes } from './tire-size-calculator/RelatedTireSizes';
import { CalculatorFaq } from './tire-size-calculator/CalculatorFaq';
import { CalculatorTrustStrip } from './tire-size-calculator/CalculatorTrustStrip';
import { RelatedCalculators } from './tire-size-calculator/RelatedCalculators';
import { StickyCompareBar } from './tire-size-calculator/StickyCompareBar';
import { useStickyCompareBar } from '../../hooks/useStickyCompareBar';

const TIRE_COMPARE_PAIR_SRC = '/images/tires/tire-compare-pair.png';
type TireLabelArc = {
  path: string;
  fontSize: number;
};

function buildTireLabelArc(viewW: number, viewH: number): TireLabelArc {
  const cx = viewW / 2 + 0.5;
  const cy = viewH / 2 - 0.3;
  const radius = viewW * 0.398;
  const halfSpanDeg = 27;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const startAngle = -90 - halfSpanDeg;
  const endAngle = -90 + halfSpanDeg;
  const x1 = cx + radius * Math.cos(toRad(startAngle));
  const y1 = cy + radius * Math.sin(toRad(startAngle));
  const x2 = cx + radius * Math.cos(toRad(endAngle));
  const y2 = cy + radius * Math.sin(toRad(endAngle));

  return {
    path: `M ${x1.toFixed(1)} ${y1.toFixed(1)} A ${radius.toFixed(1)} ${radius.toFixed(1)} 0 0 1 ${x2.toFixed(1)} ${y2.toFixed(1)}`,
    fontSize: viewW * 0.054,
  };
}

const TIRE_LABEL_VIEWBOX = { width: 1001, height: 998 };
const TIRE_LABEL_ARC = buildTireLabelArc(TIRE_LABEL_VIEWBOX.width, TIRE_LABEL_VIEWBOX.height);

function TireSidewallLabel({
  sizeLabel,
  pathId,
  className,
  animate = false,
}: {
  sizeLabel: string;
  pathId: string;
  className?: string;
  animate?: boolean;
}) {
  return (
    <svg
      className={`calc-tire-sidewall-label${className ? ` ${className}` : ''}${animate ? ' calc-tire-sidewall-label--animate' : ''}`}
      viewBox={`0 0 ${TIRE_LABEL_VIEWBOX.width} ${TIRE_LABEL_VIEWBOX.height}`}
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
    >
      <defs>
        <path id={pathId} d={TIRE_LABEL_ARC.path} />
      </defs>
      <text fontSize={TIRE_LABEL_ARC.fontSize} dominantBaseline="middle">
        <textPath href={`#${pathId}`} startOffset="50%" textAnchor="middle">
          {sizeLabel}
        </textPath>
      </text>
    </svg>
  );
}
const TIRE_FLAT_SIDE_VIEW_SRC = '/images/tires/tire-flat-side-view.png?v=4';
const VEHICLE_ILLUSTRATION_SRC = '/images/vehicles/vehicle-offroad-illustration.png';

const EDUCATION_SIZE_LABEL = '275/70R18';

const DEFAULT_COMPARE = '285/70R17';

const FEATURE_POPULAR_SIZES = [
  '275/70R18',
  '285/70R17',
  '265/70R17',
  '275/65R18',
  '33x12.50R17',
];

const FEATURE_FACTS = [
  'Upsizing your tires by just 1 inch can increase ground clearance by up to 0.8 inches.',
  'Larger tires reduce engine RPM at highway speeds.',
  'A wider tire does not always improve snow traction.',
];

const RELATED_CALCULATORS = getRelatedCalculatorLinks(CALCULATOR_PATHS.tireSize).map(
  ({ label, description, href }) => ({ title: label, description, href }),
);

const DIAMETER_REFERENCE_ROWS = [
  ['31 inch', 'Stock Truck', 'Common factory diameter for many trucks and SUVs.'],
  ['33 inch', 'Popular Upgrade', 'Often adds useful clearance without extreme build changes.'],
  ['35 inch', 'Serious Off-Road', 'Bigger stance and trail capability with more fitment demands.'],
  ['37 inch', 'Extreme Build', 'Usually requires suspension, gearing, and clearance planning.'],
] as const;

const FAQ_ITEMS = TIRE_SIZE_CALCULATOR_FAQS;

const FALLBACK_SPECS: TireSpecs = {
  type: 'metric',
  widthMm: 275,
  aspectRatio: 70,
  wheelDiameterIn: 18,
  construction: 'R',
  overallDiameterIn: 33.16,
  overallDiameterMm: 842.26,
  sectionWidthIn: 10.83,
  sidewallIn: 7.58,
  sidewallMm: 192.5,
  circumferenceIn: 104.17,
  circumferenceMm: 2645.9,
  revsPerMile: 608,
  revsPerKm: 378,
};

const SPEC_ICONS: Record<string, string> = {
  diameter: 'M12 2v20M8 6h8M8 18h8',
  width: 'M4 12h16M6 8h12M6 16h12',
  sidewall: 'M8 4v16M16 4v16M8 12h8',
  circumference: 'M12 3a9 9 0 100 18 9 9 0 000-18zM12 7v5l3 2',
  revs: 'M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1',
  wheel: 'M12 12m-10 0a10 10 0 1020 0a10 10 0 10-20 0M12 12m-3 0a3 3 0 106 0a3 3 0 10-6 0',
};

function formatNumber(value: number, unit: string, digits = 2) {
  return `${value.toFixed(digits)} ${unit}`;
}

function useCountUp(target: number, duration = 420) {
  const [current, setCurrent] = useState(target);
  const fromRef = useRef(target);

  useEffect(() => {
    const from = fromRef.current;
    const to = target;
    if (Math.abs(from - to) < 0.0001) return;

    let start: number | null = null;
    let raf = 0;

    const step = (ts: number) => {
      if (start === null) start = ts;
      const progress = Math.min(1, (ts - start) / duration);
      const eased = 1 - (1 - progress) ** 3;
      setCurrent(from + (to - from) * eased);
      if (progress < 1) {
        raf = requestAnimationFrame(step);
      } else {
        fromRef.current = to;
      }
    };

    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);

  return current;
}

function AnimatedValue({
  value,
  numeric,
  decimals = 2,
  suffix = '',
  className = '',
  duration = 300,
}: {
  value: string;
  numeric?: number;
  decimals?: number;
  suffix?: string;
  className?: string;
  duration?: number;
}) {
  const animated = useCountUp(numeric ?? 0, duration);
  const display =
    numeric !== undefined
      ? decimals === 0
        ? `${Math.round(animated)}${suffix}`
        : `${animated.toFixed(decimals)}${suffix}`
      : value;

  return (
    <span key={value} className={`inline-block transition-opacity duration-300 ${className}`}>
      {display}
    </span>
  );
}

function Icon({ name }: { name: string }) {
  const paths: Record<string, string> = {
    comfort: 'M4 15c3-4 5-6 8-6s5 2 8 6M6 19h12M7 11l2-5h6l2 5',
    handling: 'M12 3a9 9 0 019 9M12 3a9 9 0 00-9 9m9-9v9l5 5',
    fuel: 'M7 3h7a2 2 0 012 2v16H7V3zm9 6h2l2 3v6a2 2 0 01-2 2h-2',
    mountain: 'M3 19l6-10 4 6 3-5 5 9H3z',
    clearance: 'M12 3v18M5 10l7-4 7 4M5 10v8l7 4 7-4v-8',
    towing: 'M4 14h9v5H4v-5zm9 2h4l3 3M6 14V9h6v5',
    snow: 'M12 3v18M5 6l14 12M19 6L5 18M4 12h16',
    info: 'M12 8h.01M11 12h1v5h1M12 22a10 10 0 110-20 10 10 0 010 20z',
    bulb: 'M9 18h6M10 22h4M12 2a7 7 0 00-4 12.7V17h8v-2.3A7 7 0 0012 2z',
    compare: 'M8 7h8M8 12h8M8 17h5M4 4h16',
    vehicle: 'M5 17h2M17 17h2M4 11l2-5h12l2 5M6 17a2 2 0 104 0M14 17a2 2 0 104 0',
    equivalent: 'M7 7h10M7 12h10M7 17h6M4 4h16',
    save: 'M5 20h14a1 1 0 001-1V6.5L15.5 3H5a1 1 0 00-1 1v15a1 1 0 001 1zM9 3v5h6V3',
    check: 'M5 12l4 4L19 6',
    arrow: 'M5 12h14M13 6l6 6-6 6',
  };
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
      <path d={paths[name] ?? paths.info} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SpecIcon({ iconKey }: { iconKey: string }) {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
      <path d={SPEC_ICONS[iconKey] ?? SPEC_ICONS.diameter} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CalculatorPanel({
  calculator,
  sizeLabel,
  onUserInteraction,
  onSelectSuggestion,
  onCalculateClick,
}: {
  calculator: ReturnType<typeof useTireSizeCalculator>;
  sizeLabel: string;
  onUserInteraction?: () => void;
  onSelectSuggestion?: (size: string) => void;
  onCalculateClick?: () => void;
}) {
  const {
    fields,
    fullSizePaste,
    unitSystem,
    validation,
    updateField,
    handleFullSizePaste,
    selectTireSize,
    setUnitSystem,
  } = calculator;

  const handleClear = () => {
    onUserInteraction?.();
    handleFullSizePaste('');
    updateField('width', '');
    updateField('aspectRatio', '');
    updateField('wheelDiameter', '');
  };

  const handleSuggestionSelect = (size: string) => {
    onUserInteraction?.();
    (onSelectSuggestion ?? selectTireSize)(size);
  };

  const dimFields = [
    { key: 'width' as const, label: 'Width', placeholder: '275', unit: 'mm' },
    { key: 'aspectRatio' as const, label: 'Aspect Ratio', placeholder: '70', unit: '%' },
    { key: 'wheelDiameter' as const, label: 'Wheel Diameter', placeholder: '18', unit: 'in' },
  ];

  return (
    <aside className="calc-enter-panel" aria-label="Enter tire size">
      <header className="calc-enter-panel__header">
        <h2 className="calc-enter-panel__title">Enter Tire Size</h2>
        <a href="#" className="calc-enter-panel__help" onClick={(e) => e.preventDefault()}>
          Need help?
        </a>
      </header>

      <div className="calc-enter-panel__group">
        <span className="calc-enter-panel__label" id="input-method-label">
          Input Method
        </span>
        <div className="calc-enter-panel__segment" role="group" aria-labelledby="input-method-label">
          <button
            type="button"
            className={`calc-enter-panel__segment-btn ${unitSystem === 'imperial' ? 'calc-enter-panel__segment-btn--active' : ''}`}
            aria-pressed={unitSystem === 'imperial'}
            onClick={() => {
              onUserInteraction?.();
              setUnitSystem('imperial');
            }}
          >
            Standard
          </button>
          <button
            type="button"
            className={`calc-enter-panel__segment-btn ${unitSystem === 'metric' ? 'calc-enter-panel__segment-btn--active' : ''}`}
            aria-pressed={unitSystem === 'metric'}
            onClick={() => {
              onUserInteraction?.();
              setUnitSystem('metric');
            }}
          >
            Metric
          </button>
        </div>
      </div>

      <div className="calc-enter-panel__group">
        <label htmlFor="premium-size-paste" className="calc-enter-panel__label">
          Tire Size
        </label>
        <div className="calc-enter-panel__size-wrap">
          <input
            id="premium-size-paste"
            className="calc-enter-panel__size-input"
            placeholder="275/70R18"
            inputMode="text"
            autoComplete="off"
            value={fullSizePaste}
            onChange={(e) => {
              onUserInteraction?.();
              handleFullSizePaste(e.target.value);
            }}
          />
          <button
            type="button"
            className="calc-enter-panel__clear-btn"
            aria-label="Clear tire size"
            onClick={handleClear}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <p className="calc-enter-panel__example">Example: 275/70R18</p>
      </div>

      <div className="calc-enter-panel__dims">
        {dimFields.map(({ key, label, placeholder, unit }) => (
          <div key={key}>
            <label htmlFor={`premium-${key}`} className="calc-enter-panel__dim-label">
              {label}
            </label>
            <div className="calc-enter-panel__dim-field">
              <input
                id={`premium-${key}`}
                type="number"
                inputMode="numeric"
                placeholder={placeholder}
                value={fields[key]}
                onChange={(e) => {
                  onUserInteraction?.();
                  updateField(key, e.target.value);
                }}
                className="calc-enter-panel__dim-input"
              />
              <span className="calc-enter-panel__dim-unit">{unit}</span>
            </div>
          </div>
        ))}
      </div>

      <TireSizeValidationBanner
        validation={validation}
        onSelectSuggestion={handleSuggestionSelect}
      />

      <div className="calc-enter-panel__tip">
        <span className="calc-enter-panel__tip-icon" aria-hidden="true">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
            <path d="M9 18h6M10 22h4" />
          </svg>
        </span>
        <p className="calc-enter-panel__tip-text">
          <strong>Pro Tip:</strong> Check the sidewall of your current tire for the most accurate results.
        </p>
      </div>

      <button
        type="button"
        className="calc-enter-panel__cta"
        onClick={() => {
          onUserInteraction?.();
          onCalculateClick?.();
        }}
      >
        Calculate Size
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect width="16" height="20" x="4" y="2" rx="2" />
          <line x1="8" x2="16" y1="6" y2="6" />
          <line x1="8" x2="8" y1="10" y2="10.01" />
          <line x1="12" x2="12" y1="10" y2="10.01" />
          <line x1="16" x2="16" y1="10" y2="10.01" />
          <line x1="8" x2="8" y1="14" y2="14.01" />
          <line x1="12" x2="12" y1="14" y2="14.01" />
          <line x1="16" x2="16" y1="14" y2="14.01" />
          <line x1="8" x2="8" y1="18" y2="18.01" />
          <line x1="12" x2="16" y1="18" y2="18" />
        </svg>
      </button>
    </aside>
  );
}

function useLiveTireInsights(calculator: ReturnType<typeof useTireSizeCalculator>) {
  const { specs, builtSizeLabel, fields, message } = calculator;
  const lastValid = useRef<{
    specs: TireSpecs;
    sizeLabel: string;
    signature: string;
  } | null>(null);

  const current = useMemo(() => {
    if (message.status !== 'ready' || !specs || !builtSizeLabel) {
      return null;
    }

    return {
      specs,
      sizeLabel: builtSizeLabel,
      signature: `${builtSizeLabel}-${fields.width}-${fields.aspectRatio}-${fields.wheelDiameter}`,
    };
  }, [message.status, specs, builtSizeLabel, fields.width, fields.aspectRatio, fields.wheelDiameter]);

  useEffect(() => {
    if (current) {
      lastValid.current = current;
    }
  }, [current]);

  return current ?? lastValid.current;
}

function TireSizePartStrip({
  parts,
  animate,
}: {
  parts: TireSizePart[];
  animate: boolean;
}) {
  return (
    <div
      className={`calc-viz-hero__parts${animate ? ' calc-viz-hero__parts--animate' : ''}`}
      aria-label="Tire size components"
    >
      {parts.map((part) => (
        <span
          key={part.id}
          className={`calc-viz-hero__part calc-viz-hero__part--${part.color}`}
          title={part.title}
        >
          {part.value}
        </span>
      ))}
    </div>
  );
}

function useUpdatePulse(signature: string) {
  const [pulse, setPulse] = useState(false);
  const prev = useRef(signature);

  useEffect(() => {
    if (prev.current !== signature) {
      setPulse(true);
      prev.current = signature;
      const t = window.setTimeout(() => setPulse(false), 550);
      return () => window.clearTimeout(t);
    }
    prev.current = signature;
  }, [signature]);

  return pulse;
}

function VizMeasure({
  value,
  label,
  animate,
}: {
  value: number;
  label: string;
  animate: boolean;
}) {
  return (
    <div className={`calc-viz-measure ${animate ? 'calc-viz-measure--animate' : ''}`}>
      <p className="calc-viz-measure__value">
        <AnimatedValue value="" numeric={value} decimals={2} suffix=" in" duration={300} />
      </p>
      <p className="calc-viz-measure__label">{label}</p>
    </div>
  );
}

function TireVisualization({
  specs,
  sizeLabel,
  parts,
}: {
  specs: TireSpecs;
  sizeLabel: string;
  parts: TireSizePart[];
}) {
  const category = inferTireCategory(specs.widthMm, specs.aspectRatio, specs.wheelDiameterIn);
  const images = getTireDiagramImages(category, sizeLabel, specs);
  const signature = `${sizeLabel}-${specs.overallDiameterIn}-${specs.sectionWidthIn}`;
  const pulse = useUpdatePulse(signature);

  return (
    <section
      className={`calc-viz-hero ${images.styleClass}`}
      aria-label="Tire visualization"
    >
      <div className="calc-viz-hero__inner">
        <div className="calc-viz-hero__toolbar">
          <p className="calc-viz-hero__title">
            Your Tire:{' '}
            <span className="calc-viz-hero__size">{sizeLabel}</span>
          </p>
          <TireSizePartStrip parts={parts} animate={pulse} />
        </div>

        <div className="calc-viz-hero__stage">
          <div className="calc-viz-hero__tire-col calc-viz-hero__tire-col--side">
            <div className="calc-viz-hero__side-stack">
              <div className={`calc-viz-hero__tire-wrap calc-viz-hero__tire-wrap--side ${pulse ? 'calc-viz-hero__tire-wrap--pulse' : ''}`}>
                <div className="calc-viz-hero__tire-frame">
                  <img
                    src={images.side}
                    alt={images.sideAlt}
                    width={TIRE_LABEL_VIEWBOX.width}
                    height={TIRE_LABEL_VIEWBOX.height}
                    className="calc-viz-hero__tire calc-viz-hero__tire--side"
                    decoding="async"
                  />
                  <TireSidewallLabel
                    sizeLabel={sizeLabel}
                    pathId="calc-viz-size-arc"
                    animate={pulse}
                  />
                </div>
              </div>
              <div className={`calc-viz-hero__width-measure calc-viz-hero__width-measure--side ${pulse ? 'calc-viz-hero__width-measure--animate' : ''}`}>
                <span className="calc-viz-hero__line-h">
                  <span className="calc-viz-hero__cap calc-viz-hero__cap--left" />
                  <span className="calc-viz-hero__cap calc-viz-hero__cap--right" />
                </span>
                <VizMeasure value={specs.overallDiameterIn} label="Overall Diameter" animate={pulse} />
              </div>
            </div>
          </div>

          <div className="calc-viz-hero__tire-col calc-viz-hero__tire-col--front">
            <div className={`calc-viz-hero__tire-wrap calc-viz-hero__tire-wrap--front ${pulse ? 'calc-viz-hero__tire-wrap--pulse' : ''}`}>
              <img
                src={images.front}
                alt={images.frontAlt}
                width={307}
                height={842}
                className="calc-viz-hero__tire calc-viz-hero__tire--front"
                decoding="async"
              />
              <div
                className={`calc-viz-hero__width-measure calc-viz-hero__width-measure--front ${pulse ? 'calc-viz-hero__width-measure--animate' : ''}`}
                style={
                  {
                    '--front-tire-width-left': `${FRONT_TIRE_WIDTH_GEOMETRY.leftPct}%`,
                    '--front-tire-width-span': `${FRONT_TIRE_WIDTH_GEOMETRY.rightPct - FRONT_TIRE_WIDTH_GEOMETRY.leftPct}%`,
                  } as CSSProperties
                }
              >
                <span className="calc-viz-hero__line-h">
                  <span className="calc-viz-hero__cap calc-viz-hero__cap--left" />
                  <span className="calc-viz-hero__cap calc-viz-hero__cap--right" />
                </span>
                <VizMeasure value={specs.sectionWidthIn} label="Section Width" animate={pulse} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

const SPEC_EXPLANATIONS: Record<string, string> = {
  diameter: 'Determines ground clearance and gearing.',
  width: 'Affects fender and suspension clearance.',
  sidewall: 'Influences ride comfort and flex.',
  circumference: 'Distance traveled per revolution.',
  revs: 'Affects speedometer and odometer.',
  wheel: 'Rim size the tire mounts onto.',
};

function KeySpecs({
  specs,
  unitSystem,
}: {
  specs: TireSpecs;
  unitSystem: 'imperial' | 'metric';
}) {
  const [flashKey, setFlashKey] = useState('');
  const prevSig = useRef('');

  const cards = unitSystem === 'metric'
    ? [
        { key: 'diameter', label: 'Overall Diameter', numeric: specs.overallDiameterMm, decimals: 0, suffix: ' mm' },
        { key: 'width', label: 'Section Width', numeric: specs.widthMm, decimals: 0, suffix: ' mm' },
        { key: 'sidewall', label: 'Sidewall Height', numeric: specs.sidewallMm, decimals: 0, suffix: ' mm' },
        { key: 'circumference', label: 'Circumference', numeric: specs.circumferenceMm, decimals: 0, suffix: ' mm' },
        { key: 'revs', label: 'Revs per Mile', numeric: specs.revsPerMile, decimals: 0, suffix: '' },
        { key: 'wheel', label: 'Wheel Diameter', numeric: specs.wheelDiameterIn, decimals: 0, suffix: ' in' },
      ]
    : [
        { key: 'diameter', label: 'Overall Diameter', numeric: specs.overallDiameterIn, decimals: 2, suffix: ' in' },
        { key: 'width', label: 'Section Width', numeric: specs.sectionWidthIn, decimals: 2, suffix: ' in' },
        { key: 'sidewall', label: 'Sidewall Height', numeric: specs.sidewallIn, decimals: 2, suffix: ' in' },
        { key: 'circumference', label: 'Circumference', numeric: specs.circumferenceIn, decimals: 2, suffix: ' in' },
        { key: 'revs', label: 'Revs per Mile', numeric: specs.revsPerMile, decimals: 0, suffix: '' },
        { key: 'wheel', label: 'Wheel Diameter', numeric: specs.wheelDiameterIn, decimals: 0, suffix: ' in' },
      ];

  const signature = cards.map((c) => c.numeric).join('|');

  useEffect(() => {
    if (prevSig.current && prevSig.current !== signature) {
      setFlashKey(signature);
      const t = window.setTimeout(() => setFlashKey(''), 550);
      return () => window.clearTimeout(t);
    }
    prevSig.current = signature;
  }, [signature]);

  return (
    <aside className="calc-spec-grid" aria-label="Calculated specifications">
      {cards.map((card) => (
        <div
          key={card.key}
          className={`calc-spec-tile ${flashKey === signature ? 'calc-spec-tile--flash' : ''}`}
        >
          <span className="calc-spec-tile__icon">
            <SpecIcon iconKey={card.key} />
          </span>
          <p className="calc-spec-tile__value">
            <AnimatedValue
              value=""
              numeric={card.numeric}
              decimals={card.decimals}
              suffix={card.suffix}
            />
          </p>
          <p className="calc-spec-tile__label">{card.label}</p>
          <p className="calc-spec-tile__desc">{SPEC_EXPLANATIONS[card.key]}</p>
        </div>
      ))}
    </aside>
  );
}

function StickyResultsBar({
  visible,
  sizeLabel,
  specs,
  compareHref,
}: {
  visible: boolean;
  sizeLabel: string;
  specs: TireSpecs;
  compareHref: string;
}) {
  return (
    <div className={`calc-sticky-bar ${visible ? 'calc-sticky-bar--visible' : ''}`} role="region" aria-label="Calculation summary">
      <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
          <span className="font-mono font-bold text-heading">{sizeLabel}</span>
          <span className="text-body">
            <span className="font-semibold text-heading">{specs.overallDiameterIn.toFixed(2)} in</span> diameter
          </span>
          <span className="text-body">
            <span className="font-semibold text-heading">{specs.sectionWidthIn.toFixed(2)} in</span> width
          </span>
          <span className="text-body">
            <span className="font-semibold text-heading">{Math.round(specs.revsPerMile)}</span> revs/mile
          </span>
        </div>
        <a
          href={compareHref}
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
        >
          Compare This Size →
        </a>
      </div>
    </div>
  );
}

function normalizeChipSize(size: string) {
  return size.replace(/\s/g, '').toUpperCase();
}

function VehiclePhoto() {
  return (
    <img
      src={VEHICLE_ILLUSTRATION_SRC}
      alt=""
      className="calc-feature-card__vehicle-img"
      width={177}
      height={162}
      decoding="async"
      loading="lazy"
      aria-hidden="true"
    />
  );
}

function CalculatorFeatureCards({ sizeLabel }: { sizeLabel: string }) {
  const [factIndex] = useState(() => Math.floor(Math.random() * FEATURE_FACTS.length));
  const activeSize = normalizeChipSize(sizeLabel);

  return (
    <section className="calc-feature-cards" aria-label="Explore more Tire Reference tools">
      <div className="calc-feature-cards__grid">
        <article className="calc-feature-card">
          <h3 className="calc-feature-card__title">⭐ Popular Tire Sizes</h3>
          <p className="calc-feature-card__desc">Quick access to the most searched tire sizes.</p>
          <div className="calc-feature-card__pills">
            {FEATURE_POPULAR_SIZES.map((size) => {
              const isActive = normalizeChipSize(size) === activeSize;
              return (
                <a
                  key={size}
                  href={hubPagePath(size)}
                  className={`calc-feature-card__pill${isActive ? ' calc-feature-card__pill--active' : ''}`}
                >
                  {size}
                </a>
              );
            })}
          </div>
          <a href="/tire-sizes/" className="calc-feature-card__cta">
            View all popular sizes →
          </a>
        </article>

        <article className="calc-feature-card">
          <div className="calc-feature-card__main">
            <div className="calc-feature-card__text">
              <h3 className="calc-feature-card__title">🆚 Compare Any Two Sizes</h3>
              <p className="calc-feature-card__desc">
                See side-by-side visual comparison and performance impact.
              </p>
            </div>
            <div className="calc-feature-card__visual" aria-hidden="true">
              <img
                src={TIRE_COMPARE_PAIR_SRC}
                alt=""
                className="calc-feature-card__compare-img"
                width={125}
                height={132}
                decoding="async"
              />
            </div>
          </div>
          <a href={CALCULATOR_PATHS.tireComparison} className="calc-feature-card__cta">
            Open Comparison Tool →
          </a>
        </article>

        <article className="calc-feature-card">
          <div className="calc-feature-card__main">
            <div className="calc-feature-card__text">
              <h3 className="calc-feature-card__title">🤔 Did You Know?</h3>
              <p className="calc-feature-card__fact">{FEATURE_FACTS[factIndex]}</p>
            </div>
            <VehiclePhoto />
          </div>
        </article>
      </div>
    </section>
  );
}

type TireSizePart = {
  id: 'width' | 'aspect' | 'construction' | 'wheel';
  value: string;
  title: string;
  copy: string;
  color: 'blue' | 'orange' | 'green';
};

function getTireSizeParts(sizeLabel: string, specs: TireSpecs): TireSizePart[] {
  const flotationMatch = sizeLabel.match(/^(\d+(?:\.\d+)?)x(\d+(?:\.\d+)?)([A-Z])(\d+(?:\.\d+)?)$/i);

  if (flotationMatch) {
    const [, diameter, width, construction, wheel] = flotationMatch;
    return [
      {
        id: 'width',
        value: diameter,
        title: 'Overall Diameter',
        copy: 'The tire height in inches from the ground to the top of the tread.',
        color: 'blue',
      },
      {
        id: 'aspect',
        value: width,
        title: 'Section Width',
        copy: 'The tire width in inches from sidewall to sidewall.',
        color: 'orange',
      },
      {
        id: 'construction',
        value: construction.toUpperCase(),
        title: 'Construction',
        copy: 'The tire is built using radial ply construction.',
        color: 'green',
      },
      {
        id: 'wheel',
        value: wheel,
        title: 'Wheel Diameter',
        copy: 'The diameter of the wheel in inches that the tire fits.',
        color: 'blue',
      },
    ];
  }

  return [
    {
      id: 'width',
      value: String(Math.round(specs.widthMm)),
      title: 'Width',
      copy: 'The width of the tire in millimeters from sidewall to sidewall.',
      color: 'blue',
    },
    {
      id: 'aspect',
      value: String(Math.round(specs.aspectRatio)),
      title: 'Aspect Ratio',
      copy: 'The height of the sidewall as a percentage of the width.',
      color: 'orange',
    },
    {
      id: 'construction',
      value: specs.construction,
      title: 'Construction',
      copy: 'The tire is built using radial ply construction.',
      color: 'green',
    },
    {
      id: 'wheel',
      value: String(specs.wheelDiameterIn),
      title: 'Wheel Diameter',
      copy: 'The diameter of the wheel in inches that the tire fits.',
      color: 'blue',
    },
  ];
}

function UnderstandingTireSizes({ specs, sizeLabel }: { specs: TireSpecs; sizeLabel: string }) {
  const category = inferTireCategory(specs.widthMm, specs.aspectRatio, specs.wheelDiameterIn);
  const images = getTireDiagramImages(category, sizeLabel, specs);
  const parts = getTireSizeParts(sizeLabel, specs);
  const pulse = useUpdatePulse(`${sizeLabel}-${parts.map((part) => part.value).join('-')}`);

  return (
    <section className={`calc-understanding${pulse ? ' calc-understanding--animate' : ''}`}>
      <div className="calc-understanding__header">
        <p className="calc-understanding__eyebrow">Tire Size Explained</p>
        <h2 className="calc-understanding__title">Understanding Tire Sizes</h2>
        <p className="calc-understanding__subtitle">
          A tire size like {sizeLabel} contains important information about your tire&apos;s dimensions and construction.
        </p>
      </div>

      <div className="calc-understanding__grid">
        <div className="calc-understanding__visual">
          <div className="calc-understanding__tire-stage">
            <div className="calc-understanding__tire-frame">
              <img
                src={TIRE_FLAT_SIDE_VIEW_SRC}
                alt={images.sideAlt}
                width={TIRE_LABEL_VIEWBOX.width}
                height={TIRE_LABEL_VIEWBOX.height}
                className="calc-understanding__tire"
                decoding="async"
              />
              <TireSidewallLabel
                sizeLabel={sizeLabel}
                pathId="calc-size-arc"
                className="calc-understanding__sidewall-text"
                animate={pulse}
              />
            </div>

            <div className="calc-understanding__shadow" aria-hidden="true" />
          </div>
        </div>

        <div className="calc-understanding__cards">
          {parts.map((part, index) => (
            <article
              key={`${part.id}-${part.value}`}
              className={`calc-understanding__card calc-understanding__card--${part.color}`}
              style={{ animationDelay: `${index * 70}ms` }}
            >
              <span className="calc-understanding__badge">{part.value}</span>
              <div className="calc-understanding__card-body">
                <h3>{part.title}</h3>
                <p>{part.copy}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function RatingDots({ value }: { value: 1 | 2 | 3 | 4 | 5 }) {
  return (
    <span className="calc-insights__dots" aria-label={`${value} out of 5`}>
      {[1, 2, 3, 4, 5].map((dot) => (
        <span
          key={dot}
          className={`calc-insights__dot${dot <= value ? ' calc-insights__dot--filled' : ''}`}
        />
      ))}
    </span>
  );
}

function PerformanceImpactSection({
  specs,
  sizeLabel,
}: {
  specs: TireSpecs;
  sizeLabel: string;
}) {
  const impactCards = useMemo(() => buildPerformanceImpactCards(specs), [specs]);
  const impactSummary = useMemo(
    () => buildPerformanceImpactSummary(impactCards),
    [impactCards],
  );
  const pulse = useUpdatePulse(
    `${sizeLabel}-${impactCards.map((card) => `${card.id}:${card.rating}`).join('|')}`,
  );

  return (
    <section
      className={`calc-performance${pulse ? ' calc-performance--animate' : ''}`}
      aria-label="Performance impact"
    >
      <h2 className="calc-performance__title">
        Performance Impact{' '}
        <span className="calc-performance__size-tag">{sizeLabel}</span>
      </h2>

      <div className="calc-performance__body">
        <ul className="calc-insights__rows">
          {impactCards.map((card) => (
            <li key={card.id} className="calc-insights__row">
              <span className="calc-insights__row-icon" aria-hidden="true">
                <Icon name={card.icon} />
              </span>
              <div className="calc-insights__row-body">
                <div className="calc-insights__row-head">
                  <span className="calc-insights__row-label">{card.title}</span>
                  <RatingDots key={`${card.id}-${card.rating}`} value={card.rating} />
                </div>
                <p className="calc-insights__row-copy">{card.copy}</p>
              </div>
            </li>
          ))}
        </ul>

        <p className="calc-insights__summary">{impactSummary}</p>
      </div>
    </section>
  );
}

function AtAGlanceCard({ specs, sizeLabel }: { specs: TireSpecs; sizeLabel: string }) {
  const category = inferTireCategory(specs.widthMm, specs.aspectRatio, specs.wheelDiameterIn);
  const vehicles = getVehicleFitment(sizeLabel)
    .slice(0, 3)
    .map((vehicle) => `${vehicle.manufacturer} ${vehicle.model}`)
    .join(', ');
  let equivalentFlotation = `${specs.overallDiameterIn.toFixed(1)}x${specs.sectionWidthIn.toFixed(1)}${specs.construction}${specs.wheelDiameterIn}`;
  try {
    equivalentFlotation = metricToFlotation(sizeLabel);
  } catch {
    /* use computed fallback */
  }

  const profile = useMemo(
    () =>
      buildAtAGlanceProfile(specs, {
        sizeLabel,
        categoryLabel: TIRE_CATEGORY_LABELS[category],
        equivalentFlotation,
        popularVehicles: vehicles || 'Varies by trim and model year',
      }),
    [specs, sizeLabel, category, equivalentFlotation, vehicles],
  );

  const quickFactRows = useMemo(
    () =>
      buildDynamicQuickFacts(specs, {
        categoryLabel: profile.quickFacts.category,
        equivalentFlotation: profile.quickFacts.equivalentFlotation,
        typicalBuild: profile.quickFacts.typicalBuild,
        popularVehicles: profile.quickFacts.popularVehicles,
      }),
    [specs, profile.quickFacts],
  );

  const pulse = useUpdatePulse(
    `${sizeLabel}-${profile.useCaseBadges.join('-')}-${profile.tradeoffBullets.join('-')}-${quickFactRows.map((row) => row.value).join('|')}`,
  );

  return (
    <article className={`calc-dashboard__card${pulse ? ' calc-dashboard__card--animate' : ''}`}>
      <h2 className="calc-dashboard__title">
        At a Glance{' '}
        <span className="calc-dashboard__size-tag">{sizeLabel}</span>
      </h2>

      <div className="calc-dashboard__block">
        <h3 className="calc-dashboard__subtitle">Best For</h3>
        <div className="calc-insights__badges">
          {profile.useCaseBadges.map((badge) => (
            <span key={badge} className="calc-insights__badge">
              <Icon name="check" />
              {badge}
            </span>
          ))}
        </div>
      </div>

      <div className="calc-dashboard__block">
        <h3 className="calc-dashboard__subtitle">Quick Facts</h3>
        <dl className="calc-dashboard__facts">
          {quickFactRows.map((row) => (
            <div key={row.label} className="calc-dashboard__fact">
              <dt>{row.label}</dt>
              <dd>
                <LiveFactValue label={row.label} value={row.value} />
              </dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="calc-dashboard__block">
        <h3 className="calc-dashboard__subtitle">Tradeoffs</h3>
        <ul className="calc-dashboard__tradeoffs">
          {profile.tradeoffBullets.map((item) => (
            <li key={item}>
              <Icon name="info" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}

function LiveFactValue({ label, value }: { label: string; value: string }) {
  const numericMatch = value.match(/^([\d.]+)\s*(in|mm)?$/);
  if (!numericMatch) {
    return <span key={value}>{value}</span>;
  }

  const numeric = Number(numericMatch[1]);
  const suffix = numericMatch[2] ? ` ${numericMatch[2]}` : '';
  const decimals = label === 'Revs per Mile' ? 0 : 2;

  return (
    <AnimatedValue
      value={value}
      numeric={numeric}
      decimals={decimals}
      suffix={suffix}
      duration={280}
    />
  );
}

function FitmentDashboardSection({ specs, sizeLabel }: { specs: TireSpecs; sizeLabel: string }) {
  return (
    <section className="calc-dashboard" aria-label="Tire fitment dashboard">
      <div className="calc-dashboard__grid">
        <AtAGlanceCard specs={specs} sizeLabel={sizeLabel} key={sizeLabel} />

        <article className="calc-dashboard__card">
          <p className="calc-dashboard__eyebrow">Tire Size Cheat Sheet</p>
          <h2 className="calc-dashboard__title">Quick Diameter Reference</h2>

          <div className="calc-dashboard__diameter-list">
            {DIAMETER_REFERENCE_ROWS.map(([size, label, copy]) => (
              <div key={size} className="calc-dashboard__diameter-item">
                <p className="calc-dashboard__diameter-size">{size}</p>
                <p className="calc-dashboard__diameter-label">{label}</p>
                <p className="calc-dashboard__diameter-copy">{copy}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="calc-dashboard__card">
          <p className="calc-dashboard__eyebrow">Related Calculators</p>
          <h2 className="calc-dashboard__title">Continue Your Fitment Research</h2>

          <ul className="calc-dashboard__links">
            {RELATED_CALCULATORS.map((calc) => (
              <li key={calc.title}>
                <a
                  href={calc.href}
                  className="calc-dashboard__link"
                  onClick={() => trackRelatedCalculatorClick(calc.href, CALCULATOR_NAMES.tireSize)}
                >
                  <span className="calc-dashboard__link-icon" aria-hidden="true">
                    <Icon name="arrow" />
                  </span>
                  <span className="calc-dashboard__link-body">
                    <span className="calc-dashboard__link-title">{calc.title}</span>
                    <span className="calc-dashboard__link-desc">{calc.description}</span>
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </article>
      </div>
    </section>
  );
}

function Section({
  eyebrow,
  title,
  subtitle,
  variant = 'white',
  id,
  children,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  variant?: 'white' | 'tint';
  id?: string;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      className={`calc-section ${variant === 'tint' ? 'calc-section--tint' : 'calc-section--white'}`}
    >
      <div className="mb-4">
        {eyebrow && <p className="text-xs font-semibold uppercase tracking-wider text-primary">{eyebrow}</p>}
        <h2 className="mt-1 text-xl font-bold tracking-tight text-heading sm:text-2xl">{title}</h2>
        {subtitle && <p className="mt-1.5 max-w-3xl text-sm leading-relaxed text-body">{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}

function Faq() {
  const faqRef = useRef<HTMLDivElement>(null);
  useSingleOpenDetails(faqRef);
  const columnOne = FAQ_ITEMS.slice(0, 3);
  const columnTwo = FAQ_ITEMS.slice(3);

  const renderFaqItem = (item: (typeof FAQ_ITEMS)[number]) => (
    <details key={item.question} className="calc-faq__item">
      <summary className="calc-faq__question">{item.question}</summary>
      <div className="calc-faq__answer">
        <p>{item.answer}</p>
      </div>
    </details>
  );

  return (
    <section className="calc-faq calc-section calc-section--white" aria-label="FAQ">
      <div className="calc-faq__header">
        <p className="calc-faq__eyebrow">FAQ</p>
        <h2 className="calc-faq__title">Tire Size Calculator Questions</h2>
      </div>

      <div className="calc-faq__body">
        <div className="calc-faq__grid" ref={faqRef}>
          <div className="calc-faq__column">{columnOne.map(renderFaqItem)}</div>
          <div className="calc-faq__column">{columnTwo.map(renderFaqItem)}</div>
        </div>
      </div>
    </section>
  );
}

export default function PremiumTireSizeCalculator({
  initialSize = '275/70R18',
}: {
  initialSize?: string;
} = {}) {
  const calculator = useTireSizeCalculator(initialSize);
  const {
    specs,
    displayUnits,
    message,
    builtSizeLabel,
    fields,
    flotationFields,
    selectTireSize,
    queryParseFailed,
  } = calculator;
  const liveInsights = useLiveTireInsights(calculator);
  const formRef = useRef<HTMLDivElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const resultsCardsRef = useRef<HTMLDivElement>(null);

  useCalculatorStarted(CALCULATOR_NAMES.tireSize);
  const { markInteracted, interacted } = useUserInteractionFlag();
  const dedupTracker = useAnalyticsDedupTracker();

  const handleSelectTireSize = useCallback(
    (size: string) => {
      selectTireSize(size);
      trackTireSizeSelected(size, CALCULATOR_NAMES.tireSize);
    },
    [selectTireSize],
  );

  useEffect(() => {
    if (!interacted) return;
    if (message.status !== 'ready' || !builtSizeLabel) return;
    const signature = `${builtSizeLabel}|${fields.width}|${fields.aspectRatio}|${fields.wheelDiameter}|${flotationFields.overallDiameter}`;
    trackCalculatorCompletedOnce(dedupTracker, signature, {
      calculator_name: CALCULATOR_NAMES.tireSize,
      current_tire_size: builtSizeLabel,
    });
  }, [
    interacted,
    message.status,
    builtSizeLabel,
    fields.width,
    fields.aspectRatio,
    fields.wheelDiameter,
    flotationFields.overallDiameter,
    dedupTracker,
  ]);

  const displaySpecs = liveInsights?.specs ?? FALLBACK_SPECS;
  const displayLabel = liveInsights?.sizeLabel ?? EDUCATION_SIZE_LABEL;
  const tireParts = getTireSizeParts(displayLabel, displaySpecs);
  const compareHref = comparisonPagePathCurrent(displayLabel);
  const ready = message.status === 'ready' && specs && liveInsights;

  const scrollToResults = useCallback(() => {
    resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const analyzeStickyVisible = useStickyAnalyzeButton(formRef, resultsRef, {
    resultsReady: message.status === 'ready',
  });

  const stickyCompareVisible = useStickyCompareBar(
    resultsCardsRef,
    message.status === 'ready' && !!specs,
  );

  return (
    <div className="tsc-page calc-page tl-has-sticky-analyze">
      <section className="tsc-hero" aria-label="Tire size calculator">
        <div className="tsc-hero__intro">
          <h1 className="tsc-hero__title">Tire Size Calculator</h1>
          <p className="tsc-hero__desc">
            Calculate diameter, width, sidewall height, circumference and revolutions per mile
            for any tire size.
          </p>
        </div>

        <div className="tsc-hero__grid">
          <div ref={formRef}>
            <CalculatorHeroInput
              calculator={calculator}
              onUserInteraction={markInteracted}
              onSelectSuggestion={handleSelectTireSize}
              onCalculateClick={scrollToResults}
            />
          </div>

          <div className="tsc-viz-card">
            <header className="tsc-viz-card__header">
              <h2 className="tsc-viz-card__title">
                <span className="tsc-viz-card__step" aria-hidden="true">
                  2
                </span>
                Tire Visualization
              </h2>
            </header>
            <div className="tsc-viz-card__body">
              <TireVisualization specs={displaySpecs} sizeLabel={displayLabel} parts={tireParts} />
            </div>
          </div>
        </div>
      </section>

      <div ref={resultsRef} className="tsc-stack">
        <div aria-live="polite" aria-atomic="true" className="tsc-status-region">
          {queryParseFailed || message.status === 'invalid' ? (
            <p className="tsc-invalid" role="alert">
              {message.text ||
                'Enter a valid tire size. Metric example: 275/70R18. Flotation example: 33x12.50R17.'}
            </p>
          ) : null}

          {ready ? null : message.status === 'empty' && !queryParseFailed ? (
            <p className="tsc-empty" role="status">
              Enter a tire size above to calculate dimensions and explore related options. The
              visualization shows an example size until you enter your own.
            </p>
          ) : null}
        </div>

        {ready ? (
          <>
            <CalculatorResults
              ref={resultsCardsRef}
              specs={specs}
              displayUnits={displayUnits}
              shareTitle={`Tire Size Calculator — ${liveInsights.sizeLabel}`}
            />
            <CalculatorNotice />
            <CalculatorActions sizeLabel={liveInsights.sizeLabel} />
            <TireSizeSnapshot specs={specs} sizeLabel={liveInsights.sizeLabel} />
            <TireCodeExplanation specs={specs} sizeLabel={liveInsights.sizeLabel} />
            <PopularTiresBySize sizeLabel={liveInsights.sizeLabel} />
            <RelatedTireSizes sizeLabel={liveInsights.sizeLabel} />
          </>
        ) : null}
      </div>

      <CalculatorFaq />
      <CalculatorTrustStrip
        sizeLabel={ready ? liveInsights.sizeLabel : null}
        hasCalculatedSize={!!ready}
      />
      <RelatedCalculators />

      {ready ? (
        <StickyCompareBar
          visible={stickyCompareVisible}
          sizeLabel={liveInsights.sizeLabel}
          specs={specs}
          compareHref={compareHref}
        />
      ) : null}

      <StickyAnalyzeButton
        visible={analyzeStickyVisible}
        label="Analyze"
        onClick={scrollToResults}
        ariaLabel="View tire size results"
      />
    </div>
  );
}
