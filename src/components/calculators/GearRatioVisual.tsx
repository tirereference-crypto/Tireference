import { useEffect, useState } from 'react';
import type { GearRatioResult } from '../../lib/gear-ratio-math';
import { formatAxleRatio, formatRpm } from '../../lib/gear-ratio-math';
import {
  buildFactualComparisonRows,
  buildTireChangeInterpretation,
  type FactualComparisonRow,
} from '../../lib/gear-ratio-insights';

function useIsNarrow(maxWidthPx = 699): boolean {
  const [narrow, setNarrow] = useState(true);

  useEffect(() => {
    const media = window.matchMedia(`(max-width: ${maxWidthPx}px)`);
    const update = () => setNarrow(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, [maxWidthPx]);

  return narrow;
}

function MetricIcon({ kind }: { kind: 'gear' | 'tach' | 'torque' }) {
  const common = {
    viewBox: '0 0 24 24',
    width: 18,
    height: 18,
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.75,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true as const,
  };

  if (kind === 'tach') {
    return (
      <svg {...common}>
        <path d="M12 19a7 7 0 1 1 6.3-4" />
        <path d="M12 12l4-2.5" />
        <path d="M12 19v-2" />
      </svg>
    );
  }
  if (kind === 'torque') {
    return (
      <svg {...common}>
        <circle cx="8" cy="12" r="3" />
        <circle cx="16" cy="12" r="3" />
        <path d="M11 12h2" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3v2.2M12 18.8V21M4.5 6.5l1.6 1.6M17.9 15.9l1.6 1.6M3 12h2.2M18.8 12H21M4.5 17.5l1.6-1.6M17.9 8.1l1.6-1.6" />
    </svg>
  );
}

function DirectionArrow({ direction }: { direction: 'taller' | 'deeper' | 'unchanged' }) {
  if (direction === 'unchanged') return null;
  return (
    <span className="grc-metric-card__arrow" aria-hidden="true">
      {direction === 'taller' ? '↓' : '↑'}
    </span>
  );
}

/** Compact interpretation of the tire-diameter change — not a second results summary. */
export function WhatChangesWithNewTires({ result }: { result: GearRatioResult }) {
  const copy = buildTireChangeInterpretation(result);
  const tone = copy.direction === 'unchanged' ? 'slate' : copy.direction === 'taller' ? 'amber' : 'violet';

  return (
    <section id="grc-what-changes" className="grc-change" aria-label="What changes with the new tires">
      <h2 className="grc-change__title">{copy.heading}</h2>
      <p className="grc-change__summary">{copy.summary}</p>

      <div className="grc-change__metrics">
        <article className={`grc-metric-card grc-metric-card--${tone === 'slate' ? 'slate' : 'amber'}`}>
          <div className="grc-metric-card__top">
            <span className="grc-metric-card__icon" aria-hidden="true">
              <MetricIcon kind="gear" />
            </span>
            <span className="grc-metric-card__label">Effective gearing</span>
            <DirectionArrow direction={copy.direction} />
          </div>
          <p className="grc-metric-card__value">{copy.effectivePrimary}</p>
          <p className="grc-metric-card__helper">{copy.effectiveHelper}</p>
        </article>

        <article className={`grc-metric-card grc-metric-card--${tone === 'slate' ? 'slate' : 'blue'}`}>
          <div className="grc-metric-card__top">
            <span className="grc-metric-card__icon" aria-hidden="true">
              <MetricIcon kind="tach" />
            </span>
            <span className="grc-metric-card__label">Engine RPM</span>
            <DirectionArrow direction={copy.direction} />
          </div>
          <p className="grc-metric-card__value">{copy.rpmPrimary}</p>
          <p className="grc-metric-card__helper">{copy.rpmHelper}</p>
        </article>

        <article className={`grc-metric-card grc-metric-card--${tone === 'slate' ? 'slate' : 'violet'}`}>
          <div className="grc-metric-card__top">
            <span className="grc-metric-card__icon" aria-hidden="true">
              <MetricIcon kind="torque" />
            </span>
            <span className="grc-metric-card__label">Low-speed multiplication</span>
            <DirectionArrow direction={copy.direction} />
          </div>
          <p className="grc-metric-card__value">{copy.multiplicationPrimary}</p>
          <p className="grc-metric-card__helper">{copy.multiplicationHelper}</p>
        </article>
      </div>

      <div
        className={`grc-relationship grc-relationship--${copy.direction}`}
        aria-label={copy.relationship.join(' → ')}
      >
        {copy.relationship.map((step, index) => (
          <div key={step} className="grc-relationship__item">
            {index > 0 ? (
              <span className="grc-relationship__arrow" aria-hidden="true">
                →
              </span>
            ) : null}
            <span className="grc-relationship__step">
              <span className="grc-relationship__dot" aria-hidden="true" />
              <span>{step}</span>
            </span>
          </div>
        ))}
      </div>

      <p className="grc-change__interpretation">{copy.interpretation}</p>

      <p className="grc-change__notice">
        <span className="grc-change__notice-icon" aria-hidden="true">
          <svg viewBox="0 0 20 20" width="16" height="16" fill="none">
            <circle cx="10" cy="10" r="7.25" stroke="currentColor" strokeWidth="1.5" />
            <path
              d="M10 9v4.5M10 6.75h.01"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
            />
          </svg>
        </span>
        <span>{copy.notice}</span>
      </p>
    </section>
  );
}

/** Dual-formula explanation — collapsed by default. */
export function HowGearRatioCalculationWorks({ result }: { result: GearRatioResult }) {
  const [open, setOpen] = useState(false);
  const stock = formatAxleRatio(result.input.stockGearRatio);
  const current = Number.isInteger(result.currentDiameterIn)
    ? String(result.currentDiameterIn)
    : result.currentDiameterIn.toFixed(1);
  const next = Number.isInteger(result.newDiameterIn)
    ? String(result.newDiameterIn)
    : result.newDiameterIn.toFixed(1);
  const effective = formatAxleRatio(result.effectiveRatio);
  const target = formatAxleRatio(result.stockLikeTarget);
  const bodyId = 'grc-how-it-works-body';

  return (
    <details
      id="grc-how-it-works"
      className="grc-formula-accordion"
      open={open}
      onToggle={(e) => setOpen(e.currentTarget.open)}
    >
      <summary
        className="grc-formula-accordion__summary"
        aria-expanded={open}
        aria-controls={bodyId}
      >
        <span className="grc-formula-accordion__icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.75">
            <rect x="4" y="3" width="16" height="18" rx="2" />
            <path d="M8 7h8M8 11h5M8 15h3" strokeLinecap="round" />
          </svg>
        </span>
        <span className="grc-formula-accordion__text">
          <span className="grc-formula-accordion__title">How the calculation works</span>
          <span className="grc-formula-accordion__hint">
            View the effective-ratio and stock-like-target formulas
          </span>
        </span>
        <span className="grc-accordion-chevron" aria-hidden="true" />
      </summary>
      <div id={bodyId} className="grc-formula-accordion__body">
        <div className="grc-formula__grid">
          <article className="grc-formula__card grc-formula__card--effective">
            <h3 className="grc-formula__heading">Effective ratio with new tires</h3>
            <p className="grc-formula__role">How the current gears behave with the new tires</p>
            <div className="grc-formula__display" aria-hidden="true">
              <span className="grc-formula__live">{stock}</span>
              <span className="grc-formula__op">×</span>
              <span className="grc-formula__live">{current}</span>
              <span className="grc-formula__op">÷</span>
              <span className="grc-formula__live">{next}</span>
              <span className="grc-formula__op">=</span>
              <span className="grc-formula__live grc-formula__live--result">{effective}</span>
            </div>
            <p className="grc-formula__sr">
              {stock} times {current} divided by {next} equals {effective}.
            </p>
            <p className="grc-formula__explain">
              Current axle ratio × current tire diameter ÷ new tire diameter.
            </p>
          </article>

          <article className="grc-formula__card grc-formula__card--target">
            <h3 className="grc-formula__heading">Stock-like target ratio</h3>
            <p className="grc-formula__role">Ratio that restores the original geometric relationship</p>
            <div className="grc-formula__display" aria-hidden="true">
              <span className="grc-formula__live">{stock}</span>
              <span className="grc-formula__op">×</span>
              <span className="grc-formula__live">{next}</span>
              <span className="grc-formula__op">÷</span>
              <span className="grc-formula__live">{current}</span>
              <span className="grc-formula__op">=</span>
              <span className="grc-formula__live grc-formula__live--result">{target}</span>
            </div>
            <p className="grc-formula__sr">
              {stock} times {next} divided by {current} equals {target}.
            </p>
            <p className="grc-formula__explain">
              Current axle ratio × new tire diameter ÷ current tire diameter.
            </p>
          </article>
        </div>

        <p className="grc-formula__note">
          Use actual mounted tire diameters for the most accurate comparison. Calculations use geometric
          tire-diameter and axle-ratio relationships only.
        </p>
      </div>
    </details>
  );
}

function DifferenceBar({
  percent,
  label,
  maxAbs,
  tone,
}: {
  percent: number;
  label: string;
  maxAbs: number;
  tone: FactualComparisonRow['tone'];
}) {
  const scale = Math.max(maxAbs, 5);
  const width = Math.min(50, (Math.abs(percent) / scale) * 50);
  const isZero = Math.abs(percent) < 0.05;
  const taller = percent < -0.05;
  const deeper = percent > 0.05;
  const aria = isZero
    ? 'Zero percent difference from the original setup'
    : `Difference from original: ${label}`;

  return (
    <div className="grc-diff">
      <span className="grc-diff__text">{label}</span>
      <div className="grc-diff__bar" role="img" aria-label={aria}>
        <div className="grc-diff__track">
          <span className="grc-diff__center" aria-hidden="true" />
          {taller ? (
            <span
              className={`grc-diff__fill grc-diff__fill--taller grc-diff__fill--${tone}`}
              style={{ width: `${width}%` }}
              aria-hidden="true"
            />
          ) : null}
          {deeper ? (
            <span
              className={`grc-diff__fill grc-diff__fill--deeper grc-diff__fill--${tone}`}
              style={{ width: `${width}%` }}
              aria-hidden="true"
            />
          ) : null}
          {isZero ? (
            <span
              className={`grc-diff__marker grc-diff__marker--zero${
                tone === 'exact' ? ' grc-diff__marker--exact' : ''
              }`}
              aria-hidden="true"
            />
          ) : null}
        </div>
        <div className="grc-diff__legend" aria-hidden="true">
          <span>Taller</span>
          <span>0%</span>
          <span>Deeper</span>
        </div>
      </div>
    </div>
  );
}

function FactualTableDesktop({
  rows,
  maxAbs,
}: {
  rows: FactualComparisonRow[];
  maxAbs: number;
}) {
  return (
    <div className="grc-factual-table__wrap">
      <table className="grc-factual-table">
        <thead>
          <tr>
            <th scope="col">Setup</th>
            <th scope="col">Axle ratio</th>
            <th scope="col">Effective ratio</th>
            <th scope="col">Difference</th>
            <th scope="col">Interpretation</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.id}
              className={`grc-factual-table__row grc-factual-table__row--${row.tone}${
                row.emphasis === 'primary' ? ' grc-factual-table__row--primary' : ''
              }`}
            >
              <th scope="row">
                <span className="grc-factual-table__setup">
                  {row.setup}
                  {row.emphasis === 'primary' ? (
                    <span className="grc-factual-exact-badge">Exact target</span>
                  ) : null}
                </span>
              </th>
              <td>
                <span className={`grc-ratio-badge grc-ratio-badge--${row.tone}`}>{row.axleRatio}</span>
              </td>
              <td>
                <strong>{row.effectiveRatio}</strong>
              </td>
              <td>
                <DifferenceBar
                  percent={row.differencePercent}
                  label={row.differenceFromOriginal}
                  maxAbs={maxAbs}
                  tone={row.tone}
                />
              </td>
              <td>
                <span className="grc-factual-chip">{row.interpretation}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function FactualTableMobile({
  rows,
  maxAbs,
}: {
  rows: FactualComparisonRow[];
  maxAbs: number;
}) {
  return (
    <ul className="grc-factual-cards">
      {rows.map((row) => (
        <li
          key={row.id}
          className={`grc-factual-card grc-factual-card--${row.tone}${
            row.emphasis === 'primary' ? ' grc-factual-card--primary' : ''
          }`}
        >
          <h3 className="grc-factual-card__title">
            {row.setup}
            {row.emphasis === 'primary' ? (
              <span className="grc-factual-exact-badge">Exact target</span>
            ) : null}
          </h3>
          <dl className="grc-factual-card__grid">
            <div>
              <dt>Axle ratio</dt>
              <dd>
                <span className={`grc-ratio-badge grc-ratio-badge--${row.tone}`}>{row.axleRatio}</span>
              </dd>
            </div>
            <div>
              <dt>Effective ratio</dt>
              <dd>{row.effectiveRatio}</dd>
            </div>
            <div className="grc-factual-card__diff">
              <dt>Difference</dt>
              <dd>
                <DifferenceBar
                  percent={row.differencePercent}
                  label={row.differenceFromOriginal}
                  maxAbs={maxAbs}
                  tone={row.tone}
                />
              </dd>
            </div>
          </dl>
          <p className="grc-factual-card__interpretation">
            <span className="grc-factual-chip">{row.interpretation}</span>
          </p>
        </li>
      ))}
    </ul>
  );
}

export function GearRatioFactualComparisonTable({
  result,
  extraAxleRatios = [],
}: {
  result: GearRatioResult;
  extraAxleRatios?: number[];
}) {
  const rows = buildFactualComparisonRows(result, extraAxleRatios);
  const narrow = useIsNarrow(699);
  const maxAbs = Math.max(...rows.map((row) => Math.abs(row.differencePercent)), 5);

  return (
    <section id="grc-compare-setups" className="grc-factual-compare" aria-label="Setup comparison">
      <h2 className="grc-factual-compare__title">Setup Comparison</h2>
      <p className="grc-factual-compare__intro">
        Geometric comparison of axle and effective ratios. Nearby examples are common reference
        values, not availability claims.
      </p>
      {narrow ? (
        <FactualTableMobile rows={rows} maxAbs={maxAbs} />
      ) : (
        <FactualTableDesktop rows={rows} maxAbs={maxAbs} />
      )}
    </section>
  );
}

export function GearRpmCrawlComparison({ result }: { result: GearRatioResult }) {
  if (!result.rpmReady && !result.crawlReady) return null;

  const speedLabel =
    result.input.speedMph != null
      ? result.input.speedUnit === 'kmh'
        ? `${(result.input.speedMph / 0.621371).toFixed(0)} km/h`
        : `${result.input.speedMph.toFixed(0)} mph`
      : null;

  return (
    <section
      id="grc-advanced-analysis"
      className="grc-advanced-results"
      aria-label="RPM and crawl comparison"
    >
      <h2 className="grc-advanced-results__title">RPM and Crawl Comparison</h2>

      {result.rpmReady && result.estimatedRpm && speedLabel ? (
        <div className="grc-advanced-results__block">
          <h3 className="grc-advanced-results__heading">Estimated engine RPM</h3>
          <p className="grc-advanced-results__note">
            Theoretical values only. Excludes torque-converter slip, tire growth and drivetrain
            losses.
          </p>
          <ul className="grc-advanced-results__list">
            <li>
              Selected cruising speed: <strong>{speedLabel}</strong>
            </li>
            <li>
              Original estimated RPM:{' '}
              <strong>{formatRpm(result.estimatedRpm.originalSetup)}</strong>
            </li>
            <li>
              New tires with current gears:{' '}
              <strong>{formatRpm(result.estimatedRpm.newTiresCurrentGears)}</strong>
            </li>
            <li>
              Exact stock-like target:{' '}
              <strong>{formatRpm(result.estimatedRpm.newTiresStockLike)}</strong>
            </li>
            <li>
              Nearby ratio example:{' '}
              <strong>{formatRpm(result.estimatedRpm.nearbyStockLike)}</strong>
            </li>
            <li>
              Deeper-use target: <strong>{formatRpm(result.estimatedRpm.newTiresDeeper)}</strong>
            </li>
          </ul>
        </div>
      ) : null}

      {result.crawlReady && result.crawlRatios ? (
        <div className="grc-advanced-results__block">
          <h3 className="grc-advanced-results__heading">Theoretical overall crawl ratio</h3>
          <p className="grc-advanced-results__note">
            Crawl ratio is a drivetrain multiplication figure, not a direct performance score.
          </p>
          <ul className="grc-advanced-results__list">
            <li>
              Current crawl ratio: <strong>{formatAxleRatio(result.crawlRatios.currentAxle)}</strong>
            </li>
            <li>
              Stock-like target crawl ratio:{' '}
              <strong>{formatAxleRatio(result.crawlRatios.stockLike)}</strong>
            </li>
            <li>
              Deeper-use target crawl ratio:{' '}
              <strong>{formatAxleRatio(result.crawlRatios.deeper)}</strong>
            </li>
          </ul>
        </div>
      ) : null}
    </section>
  );
}
