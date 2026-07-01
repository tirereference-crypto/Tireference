import { useMemo } from 'react';
import {
  calculateFuelCostImpact,
  DEFAULT_FUEL_ASSUMPTIONS,
} from '../../lib/fuel-cost-impact';
import type { UnitSystem } from '../../lib/calculator-types';
import {
  chartSpeedPoints,
  rpmAtSpeed as rpmAtSpeedForUnit,
  speedUnitLabel,
} from '../../lib/tire-comparison-units';
import type { PerformanceImpactCard, SpecTableRow } from '../../lib/tire-comparison-insights';
import type { TireSpecs } from '../../lib/tire-math';

function estimateTireSetCost(specs: TireSpecs): number {
  return Math.round(140 + specs.widthMm * 0.38 + specs.wheelDiameterIn * 10);
}

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

export function SemiCircularGauge({
  needlePct,
  tone = 'blue',
  gradient = false,
}: {
  needlePct: number;
  tone?: 'blue' | 'purple' | 'orange';
  gradient?: boolean;
}) {
  const uid = `gauge-${tone}-${gradient ? 'grad' : 'solid'}`;
  const stroke = tone === 'blue' ? '#2563eb' : tone === 'orange' ? '#ea580c' : '#7c3aed';
  const cx = 100;
  const cy = 100;
  const r = 78;
  const startAngle = 225;
  const sweep = 270;
  const arc = (from: number, to: number) => {
    const s = polarToCartesian(cx, cy, r, from);
    const e = polarToCartesian(cx, cy, r, to);
    const large = to - from > 180 ? 1 : 0;
    return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y}`;
  };
  const fillPct = Math.min(100, Math.max(2, needlePct));
  const arcPath = arc(startAngle, startAngle + (fillPct / 100) * sweep);
  const needleAngle = startAngle + (Math.min(100, Math.max(0, needlePct)) / 100) * sweep;
  const needleTip = polarToCartesian(cx, cy, r - 14, needleAngle);

  return (
    <div className="cmp-semi-gauge">
      <svg viewBox="0 0 200 180" className="cmp-semi-gauge__svg" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
        {gradient && (
          <defs>
            <linearGradient id={`${uid}-grad`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#dc2626" />
              <stop offset="100%" stopColor="#ea580c" />
            </linearGradient>
          </defs>
        )}
        <path d={arc(startAngle, startAngle + sweep)} fill="none" stroke="#e2e8f0" strokeWidth="9" strokeLinecap="round" />
        <path
          d={arcPath}
          fill="none"
          stroke={gradient ? `url(#${uid}-grad)` : stroke}
          strokeWidth="9"
          strokeLinecap="round"
        />
        <circle cx={cx} cy={cy} r="4.5" fill="#334155" />
        <line x1={cx} y1={cy} x2={needleTip.x} y2={needleTip.y} stroke="#334155" strokeWidth="2.25" strokeLinecap="round" />
      </svg>
    </div>
  );
}

function PerformanceIcon({ icon }: { icon: string }) {
  switch (icon) {
    case 'speedo':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
          <circle cx="12" cy="13" r="7" />
          <path d="M12 13 L12 8" strokeLinecap="round" />
          <path d="M9 18h6" strokeLinecap="round" />
          <path d="M12 4v1.5" strokeLinecap="round" />
        </svg>
      );
    case 'rpm':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
          <rect x="5" y="8" width="14" height="9" rx="1.5" />
          <path d="M8 11h2M14 11h2M8 14h8" strokeLinecap="round" />
          <path d="M9 8V6M15 8V6" strokeLinecap="round" />
        </svg>
      );
    case 'clearance':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
          <path d="M4 16h16" strokeLinecap="round" />
          <path d="M7 16V11M17 16V11" strokeLinecap="round" />
          <path d="M7 11h10" strokeLinecap="round" />
          <path d="M9 11l1.5-3h3L15 11" strokeLinejoin="round" />
        </svg>
      );
    case 'height':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
          <path d="M5 15h14" strokeLinecap="round" />
          <path d="M7 15l2-4.5h6L17 15" strokeLinejoin="round" />
          <path d="M12 5v3M12 5l-1.5 1.5M12 5l1.5 1.5" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="9" cy="17" r="1" fill="currentColor" stroke="none" />
          <circle cx="15" cy="17" r="1" fill="currentColor" stroke="none" />
        </svg>
      );
    case 'handling':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
          <circle cx="12" cy="12" r="7" />
          <path d="M8.5 14c1.2-2 4.8-2 6 0" strokeLinecap="round" />
          <path d="M9 10.5h6" strokeLinecap="round" />
        </svg>
      );
    case 'gearing':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
          <circle cx="12" cy="12" r="3.25" />
          <path d="M12 4.5v2.2M12 17.3v2.2M4.5 12h2.2M17.3 12h2.2M6.4 6.4l1.6 1.6M16 16l1.6 1.6M6.4 17.6l1.6-1.6M16 8l1.6-1.6" strokeLinecap="round" />
        </svg>
      );
    default:
      return null;
  }
}

function PerformanceGaugeCard({ card }: { card: PerformanceImpactCard }) {
  const isSpeedo = card.id === 'speedo';
  return (
    <div className="cmp-perf-gauge-card">
      <div className="cmp-perf-gauge-card__head">
        <div className={`cmp-perf-gauge-card__icon cmp-perf-gauge-card__icon--${card.icon}`}>
          <PerformanceIcon icon={card.icon} />
        </div>
        <div>
          <p className="cmp-perf-gauge-card__title">{card.title}</p>
          {card.subtitle && <p className="cmp-perf-gauge-card__subtitle">{card.subtitle}</p>}
        </div>
      </div>
      <div className="cmp-perf-gauge-card__gauge-wrap">
        <SemiCircularGauge
          needlePct={card.gaugeNeedle ?? 50}
          tone={isSpeedo ? 'blue' : 'purple'}
          gradient={!isSpeedo}
        />
      </div>
      <p
        className={`cmp-perf-gauge-card__value ${
          isSpeedo ? 'cmp-perf-gauge-card__value--blue' : `cmp-perf-gauge-card__value--${card.tone ?? 'neutral'}`
        }`}
      >
        {card.value}
      </p>
      <p className="cmp-perf-gauge-card__footer">{card.status}</p>
    </div>
  );
}

function PerformanceMetricCard({ card }: { card: PerformanceImpactCard }) {
  return (
    <div className="cmp-perf-metric-card">
      <div className="cmp-perf-metric-card__head">
        <div className={`cmp-perf-metric-card__icon cmp-perf-metric-card__icon--${card.icon}`}>
          <PerformanceIcon icon={card.icon} />
        </div>
        <p className="cmp-perf-metric-card__title">{card.title}</p>
      </div>
      <div className="cmp-perf-metric-card__body">
        <p className={`cmp-perf-metric-card__value cmp-perf-metric-card__value--${card.tone ?? 'neutral'}`}>
          {card.badgeStyle === 'check' && (
            <span className="cmp-perf-metric-card__check" aria-hidden="true">
              <svg viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="7" fill="currentColor" />
                <path d="M5 8l2 2 4-4" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          )}
          {card.badgeStyle === 'diamond' && <span className="cmp-perf-metric-card__diamond" aria-hidden="true" />}
          {card.value}
        </p>
      </div>
      <p className="cmp-perf-metric-card__footer">{card.status}</p>
    </div>
  );
}

function fuelArcPath(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(cx, cy, r, startAngle);
  const end = polarToCartesian(cx, cy, r, endAngle);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`;
}

const FUEL_GAUGE_START = 235;
const FUEL_GAUGE_SWEEP = 250;
const FUEL_GAUGE_TICKS = 32;

function FuelEconomySemiGauge({
  value,
  variant,
}: {
  value: number;
  variant: 'current' | 'new';
}) {
  const uid = `fuel-gauge-${variant}`;
  const cx = 100;
  const cy = 100;
  const r = 78;
  const endAngle = FUEL_GAUGE_START + FUEL_GAUGE_SWEEP;
  const arcPath = fuelArcPath(cx, cy, r, FUEL_GAUGE_START, endAngle);

  const ticks = Array.from({ length: FUEL_GAUGE_TICKS + 1 }, (_, i) => {
    const angle = FUEL_GAUGE_START + (i / FUEL_GAUGE_TICKS) * FUEL_GAUGE_SWEEP;
    const outer = polarToCartesian(cx, cy, r + 5, angle);
    const inner = polarToCartesian(cx, cy, r - 5, angle);
    return { x1: inner.x, y1: inner.y, x2: outer.x, y2: outer.y, key: i };
  });

  return (
    <div className="cmp-fuel-gauge">
      <div className="cmp-fuel-gauge__wrap">
        <svg viewBox="0 0 200 176" className="cmp-fuel-gauge__svg" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
          <defs>
            <linearGradient id={`${uid}-grad`} x1="0%" y1="0%" x2="100%" y2="0%">
              {variant === 'current' ? (
                <>
                  <stop offset="0%" stopColor="#22c55e" />
                  <stop offset="55%" stopColor="#22c55e" />
                  <stop offset="100%" stopColor="#2563eb" />
                </>
              ) : (
                <>
                  <stop offset="0%" stopColor="#94a3b8" />
                  <stop offset="45%" stopColor="#ef4444" />
                  <stop offset="100%" stopColor="#f97316" />
                </>
              )}
            </linearGradient>
          </defs>
          <path
            d={arcPath}
            fill="none"
            stroke={`url(#${uid}-grad)`}
            strokeWidth="9"
            strokeLinecap="round"
          />
          {ticks.map((t) => (
            <line
              key={t.key}
              x1={t.x1}
              y1={t.y1}
              x2={t.x2}
              y2={t.y2}
              stroke="#ffffff"
              strokeWidth="1.4"
              strokeLinecap="round"
            />
          ))}
        </svg>
        <div className="cmp-fuel-gauge__value">
          <span className="cmp-fuel-gauge__number">{value.toFixed(1)}</span>
          <span className="cmp-fuel-gauge__unit">MPG</span>
        </div>
      </div>
      <p className="cmp-fuel-gauge__label">{variant === 'current' ? 'Current' : 'New'}</p>
    </div>
  );
}

export function FuelEconomyGauges({
  specsA,
  specsB,
}: {
  specsA: TireSpecs;
  specsB: TireSpecs;
}) {
  const impact = useMemo(
    () => calculateFuelCostImpact(specsA, specsB, DEFAULT_FUEL_ASSUMPTIONS),
    [specsA, specsB],
  );

  const mpgDiff = impact.mpgNew - impact.mpgCurrent;
  const mpgPct = impact.mpgCurrent !== 0 ? (mpgDiff / impact.mpgCurrent) * 100 : 0;
  const diffTone = mpgDiff < -0.001 ? 'negative' : mpgDiff > 0.001 ? 'positive' : 'neutral';

  return (
    <div className="cmp-fuel-gauges">
      <FuelEconomySemiGauge value={impact.mpgCurrent} variant="current" />
      <div className={`cmp-fuel-gauges__diff cmp-fuel-gauges__diff--${diffTone}`}>
        <svg viewBox="0 0 24 12" className="cmp-fuel-gauges__arrow" aria-hidden="true">
          <path d="M0 6h18M14 2l6 4-6 4" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span className="cmp-fuel-gauges__diff-value">{mpgDiff >= 0 ? '+' : '−'}{Math.abs(mpgDiff).toFixed(1)}</span>
        <span className="cmp-fuel-gauges__diff-unit">MPG</span>
        <span className="cmp-fuel-gauges__diff-pct">({mpgPct >= 0 ? '+' : '−'}{Math.abs(mpgPct).toFixed(2)}%)</span>
      </div>
      <FuelEconomySemiGauge value={impact.mpgNew} variant="new" />
    </div>
  );
}

function niceYTicks(min: number, max: number, count = 3): number[] {
  const range = max - min || 1;
  const step = Math.ceil(range / (count - 1) / 250) * 250;
  const start = Math.floor(min / step) * step;
  const ticks: number[] = [];
  for (let v = start; v <= max + step * 0.01; v += step) {
    ticks.push(v);
    if (ticks.length >= count) break;
  }
  while (ticks.length < count) {
    ticks.push(ticks[ticks.length - 1] + step);
  }
  return ticks.slice(0, count);
}

export function RpmVsSpeedChart({
  specsA,
  specsB,
  sizeA,
  sizeB,
  referenceSpeed = 60,
  unitSystem = 'imperial',
}: {
  specsA: TireSpecs;
  specsB: TireSpecs;
  sizeA: string;
  sizeB: string;
  referenceSpeed?: number;
  unitSystem?: UnitSystem;
}) {
  const speeds = chartSpeedPoints(unitSystem);
  const speedUnit = speedUnitLabel(unitSystem);
  const chart = useMemo(() => {
    const seriesA = speeds.map((s) => rpmAtSpeedForUnit(s, specsA, unitSystem));
    const seriesB = speeds.map((s) => rpmAtSpeedForUnit(s, specsB, unitSystem));
    const all = [...seriesA, ...seriesB];
    const dataMin = Math.min(...all);
    const dataMax = Math.max(...all);
    const yTicks = niceYTicks(dataMin - 50, dataMax + 50, 3);
    const yMin = yTicks[0];
    const yMax = yTicks[yTicks.length - 1];

    const pad = { left: 42, top: 22, right: 50, bottom: 24 };
    const width = 300;
    const height = 146;
    const plotW = width - pad.left - pad.right;
    const plotH = height - pad.top - pad.bottom;
    const speedMin = speeds[0];
    const speedMax = speeds[speeds.length - 1];

    const xScale = (speed: number) => pad.left + ((speed - speedMin) / (speedMax - speedMin)) * plotW;
    const yScale = (rpm: number) => pad.top + plotH - ((rpm - yMin) / (yMax - yMin)) * plotH;

    const toPoints = (series: number[]) =>
      series.map((rpm, i) => `${xScale(speeds[i])},${yScale(rpm)}`).join(' ');

    const lastIdx = speeds.length - 1;
    const calloutH = 16;
    const clampY = (y: number) => Math.min(height - calloutH - 2, Math.max(0, y));
    const rawA = yScale(seriesA[lastIdx]);
    const rawB = yScale(seriesB[lastIdx]);
    const higherIsA = rawA <= rawB;
    const calloutA = {
      x: xScale(speeds[lastIdx]),
      y: clampY(higherIsA ? rawA - calloutH - 1 : rawA + 1),
      value: Math.round(seriesA[lastIdx]),
    };
    const calloutB = {
      x: xScale(speeds[lastIdx]),
      y: clampY(higherIsA ? rawB + 1 : rawB - calloutH - 1),
      value: Math.round(seriesB[lastIdx]),
    };

    return { width, height, pad, plotW, plotH, yTicks, yMin, yMax, xScale, yScale, pointsA: toPoints(seriesA), pointsB: toPoints(seriesB), calloutA, calloutB };
  }, [specsA, specsB, speeds, unitSystem]);

  return (
    <div className="cmp-rpm-chart">
      <h2 className="cmp-rpm-chart__title">RPM vs Speed ({referenceSpeed} {speedUnit})</h2>
      <div className="cmp-rpm-chart__legend">
        <span><i className="cmp-dot cmp-dot--current" /> {sizeA}</span>
        <span><i className="cmp-dot cmp-dot--new" /> {sizeB}</span>
      </div>
      <svg
        viewBox={`0 0 ${chart.width} ${chart.height}`}
        className="cmp-rpm-chart__svg"
        role="img"
        aria-label={`RPM versus speed chart comparing ${sizeA} and ${sizeB}`}
      >
        {chart.yTicks.map((tick) => {
          const y = chart.yScale(tick);
          return (
            <g key={tick}>
              <line x1={chart.pad.left} x2={chart.width - chart.pad.right} y1={y} y2={y} stroke="#e2e8f0" strokeWidth="1" />
              <text x={chart.pad.left - 6} y={y + 3} fontSize="8" fill="#64748b" textAnchor="end">
                {tick.toLocaleString()}
              </text>
            </g>
          );
        })}
        <polyline fill="none" stroke="#2563eb" strokeWidth="2.5" points={chart.pointsA} />
        <polyline fill="none" stroke="#ea580c" strokeWidth="2.5" points={chart.pointsB} />
        {speeds.map((s) => (
          <text
            key={s}
            x={chart.xScale(s)}
            y={chart.height - 6}
            fontSize="8"
            fill="#64748b"
            textAnchor="middle"
          >
            {s} {speedUnit}
          </text>
        ))}
        <g className="cmp-rpm-chart__callout cmp-rpm-chart__callout--a">
          <rect x={chart.calloutA.x + 3} y={chart.calloutA.y} width="34" height="16" rx="4" fill="#2563eb" />
          <text x={chart.calloutA.x + 20} y={chart.calloutA.y + 11} fontSize="8" fill="#fff" textAnchor="middle" fontWeight="700">
            {chart.calloutA.value.toLocaleString()}
          </text>
        </g>
        <g className="cmp-rpm-chart__callout cmp-rpm-chart__callout--b">
          <rect x={chart.calloutB.x + 3} y={chart.calloutB.y} width="34" height="16" rx="4" fill="#ea580c" />
          <text x={chart.calloutB.x + 20} y={chart.calloutB.y + 11} fontSize="8" fill="#fff" textAnchor="middle" fontWeight="700">
            {chart.calloutB.value.toLocaleString()}
          </text>
        </g>
      </svg>
    </div>
  );
}

export function TireSpecsSummaryTable({
  rows,
  variant = 'summary',
}: {
  rows: SpecTableRow[];
  variant?: 'summary' | 'panel';
}) {
  const wrapClass =
    variant === 'panel'
      ? 'cmp-spec-table-wrap cmp-spec-table-wrap--panel'
      : 'cmp-spec-table-wrap cmp-spec-table-wrap--compact';
  const tableClass =
    variant === 'panel'
      ? 'cmp-spec-table cmp-spec-table--panel'
      : 'cmp-spec-table cmp-spec-table--summary';

  return (
    <>
      <div className={`${wrapClass} cmp-spec-table-wrap--desktop`}>
        <table className={tableClass}>
          <thead>
            <tr>
              <th>Specification</th>
              <th>Current</th>
              <th>New</th>
              <th>Difference</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label}>
                <td>{row.label}</td>
                <td>{row.current}</td>
                <td>{row.newTire}</td>
                <td
                  className={[
                    row.differenceVariant === 'info' ? 'cmp-spec-table__diff--info' : `tone-${row.tone}`,
                  ].join(' ')}
                >
                  {row.difference}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="cmp-spec-cards" aria-label="Tire specifications comparison">
        {rows.map((row) => (
          <article key={row.label} className="cmp-spec-card">
            <h3 className="cmp-spec-card__title">{row.label}</h3>
            <div className="cmp-spec-card__row">
              <span className="cmp-spec-card__label">Current</span>
              <span className="cmp-spec-card__value">{row.current}</span>
            </div>
            <div className="cmp-spec-card__row">
              <span className="cmp-spec-card__label">New</span>
              <span className="cmp-spec-card__value">{row.newTire}</span>
            </div>
            <div className="cmp-spec-card__row">
              <span className="cmp-spec-card__label">Difference</span>
              <span
                className={[
                  'cmp-spec-card__value',
                  row.differenceVariant === 'info' ? '' : `tone-${row.tone}`,
                ].join(' ')}
              >
                {row.difference}
              </span>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}

export function PerformanceDrivingCard({ cards }: { cards: PerformanceImpactCard[] }) {
  const speedo = cards.find((c) => c.id === 'speedo');
  const rpm = cards.find((c) => c.id === 'rpm');
  const clearance = cards.find((c) => c.id === 'clearance');
  const height = cards.find((c) => c.id === 'height');
  const handling = cards.find((c) => c.id === 'handling');
  const gearing = cards.find((c) => c.id === 'gearing');

  return (
    <div className="cmp-perf-ref">
      {speedo && <PerformanceGaugeCard card={speedo} />}
      {rpm && <PerformanceGaugeCard card={rpm} />}
      <div className="cmp-perf-ref__stack">
        {clearance && <PerformanceMetricCard card={clearance} />}
        {handling && <PerformanceMetricCard card={handling} />}
      </div>
      <div className="cmp-perf-ref__stack">
        {height && <PerformanceMetricCard card={height} />}
        {gearing && <PerformanceMetricCard card={gearing} />}
      </div>
    </div>
  );
}

export function ComparisonFinancialPanel({
  specsA,
  specsB,
}: {
  specsA: TireSpecs;
  specsB: TireSpecs;
}) {
  const impact = useMemo(
    () => calculateFuelCostImpact(specsA, specsB, DEFAULT_FUEL_ASSUMPTIONS),
    [specsA, specsB],
  );
  const tireCurrent = estimateTireSetCost(specsA);
  const tireNew = estimateTireSetCost(specsB);
  const fiveYearFuel = impact.annualDifference * 5;
  const fiveYearTotal = fiveYearFuel + (tireNew - tireCurrent);
  const costPerMileCurrent = (impact.annualCostCurrent / DEFAULT_FUEL_ASSUMPTIONS.annualMiles) * 100;
  const costPerMileNew = (impact.annualCostNew / DEFAULT_FUEL_ASSUMPTIONS.annualMiles) * 100;

  return (
    <div className="cmp-financial">
      <dl className="cmp-financial__stats">
        <div>
          <dt>Fuel Cost Impact (Annual)</dt>
          <dd className={impact.annualDifference > 0 ? 'cmp-financial__neg' : 'cmp-financial__pos'}>
            {impact.annualDifference >= 0 ? '+' : '−'}${Math.abs(impact.annualDifference).toFixed(0)}/yr
          </dd>
        </div>
        <div>
          <dt>Tire Replacement (Set of 4)</dt>
          <dd>${tireCurrent} → ${tireNew}</dd>
        </div>
        <div>
          <dt>Cost Per Mile</dt>
          <dd>{costPerMileCurrent.toFixed(2)}¢ → {costPerMileNew.toFixed(2)}¢</dd>
        </div>
      </dl>

      <div className={`cmp-financial__summary ${fiveYearTotal > 0 ? 'cmp-financial__summary--neg' : 'cmp-financial__summary--pos'}`}>
        {fiveYearTotal >= 0
          ? `This setup will cost you $${Math.abs(Math.round(fiveYearTotal))} more over 5 years`
          : `This setup may save you $${Math.abs(Math.round(fiveYearTotal))} over 5 years`}
      </div>
    </div>
  );
}

export function StarRating({ rating }: { rating: number }) {
  return (
    <div className="cmp-stars" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, i) => (
        <svg key={i} viewBox="0 0 20 20" className={i + 1 <= Math.floor(rating) ? 'cmp-stars__on' : i + 0.5 <= rating ? 'cmp-stars__half' : 'cmp-stars__off'}>
          <path d="M10 1.5l2.47 5.01 5.53.8-4 3.9.94 5.5L10 14.77l-4.94 2.94.94-5.5-4-3.9 5.53-.8L10 1.5z" />
        </svg>
      ))}
    </div>
  );
}

export function fitmentBadgeLabel(status: 'pass' | 'warning' | 'fail'): string {
  if (status === 'pass') return 'Safe';
  if (status === 'warning') return 'Check';
  return 'Risk';
}
