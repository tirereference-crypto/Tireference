import { useId, useMemo, useState } from 'react';
import {
  formatDiameterDiff,
  type TireDiameterMatch,
} from '../../../lib/tire-diameter-search';
import { preferredSizeCompareLink } from '../../../lib/crawlable-links';
import { tireSizeCalculatorPath } from '../../../lib/tire-size-url';
import { hasTireSizeGuide } from '../../../lib/has-tire-size-guide';
import { getDatabaseProductionLabel } from '../../../lib/size-production-status';
import {
  formatTireProductCountsLine,
  getExactSizeCoverage,
} from '../../../lib/exact-size-coverage';
import { CALCULATOR_NAMES, trackTireSizeSelected } from '../../../lib/analytics';
import { formatIn, getAbsDiffPercent, getDiffTone } from './diameter-display';

/**
 * Map true diameters to circle radii so tiny absolute deltas stay perceptible
 * without inventing a false relationship. Labels always show measured values.
 */
function comparisonRadii(targetIn: number, matchIn: number): { targetR: number; matchR: number } {
  const base = 48;
  if (targetIn <= 0 || matchIn <= 0) {
    return { targetR: base, matchR: base };
  }

  const ratio = matchIn / targetIn;
  const absDelta = Math.abs(ratio - 1);

  if (absDelta < 0.0004) {
    return { targetR: base, matchR: base };
  }

  const minVisible = 0.035;
  const maxVisible = 0.14;
  const amplified =
    Math.sign(ratio - 1) *
    Math.min(maxVisible, Math.max(minVisible, absDelta * 10));

  return {
    targetR: base,
    matchR: base * (1 + amplified),
  };
}

function StarIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M8 1.2 9.7 5.6l4.8.4-3.7 3.1 1.1 4.6L8 11.5 4.1 13.7l1.1-4.6L1.5 6l4.8-.4L8 1.2Z" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M8 1.5 13 3.5v4.2c0 3.1-2.1 5.4-5 6.3-2.9-.9-5-3.2-5-6.3V3.5L8 1.5Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path d="M5.8 7.6 7.3 9.1 10.4 5.9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="6.25" fill="currentColor" opacity="0.15" />
      <path
        d="M5 8.1 7.1 10.2 11.2 5.8"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function DiameterCompareVisual({
  targetIn,
  matchIn,
  sizeLabel,
}: {
  targetIn: number;
  matchIn: number;
  sizeLabel: string;
}) {
  const titleId = useId();
  const descId = useId();
  const { targetR, matchR } = comparisonRadii(targetIn, matchIn);
  const delta = matchIn - targetIn;
  const deltaLabel = `${delta >= 0 ? '+' : ''}${delta.toFixed(2)} in`;
  const pct = targetIn > 0 ? (delta / targetIn) * 100 : 0;
  const pctLabel = `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`;
  const largerR = Math.max(targetR, matchR);
  const hubR = Math.max(7, Math.min(targetR, matchR) * 0.18);

  const description = `${sizeLabel} measures ${matchIn.toFixed(2)} inches overall, compared with a ${targetIn.toFixed(1)} inch target. Difference is ${deltaLabel} (${pctLabel}).`;

  return (
    <aside className="dia-closest__visual" aria-label="Diameter comparison">
      <h3 className="dia-closest__visual-title">Diameter Comparison</h3>

      <ul className="dia-closest__legend">
        <li>
          <span className="dia-closest__swatch dia-closest__swatch--target" aria-hidden="true" />
          <span>Target ({targetIn.toFixed(1)} in)</span>
        </li>
        <li>
          <span className="dia-closest__swatch dia-closest__swatch--match" aria-hidden="true" />
          <span>Match ({matchIn.toFixed(2)} in)</span>
        </li>
      </ul>

      <svg
        className="dia-closest__chart"
        viewBox="0 0 160 140"
        role="img"
        aria-labelledby={titleId}
        aria-describedby={descId}
      >
        <title id={titleId}>Target versus indexed match diameters</title>
        <desc id={descId}>{description}</desc>

        <circle cx="80" cy="68" r={largerR + 8} fill="#f8fafc" stroke="#e2e8f0" strokeWidth="1" />
        <circle
          cx="80"
          cy="68"
          r={targetR}
          fill="none"
          stroke="#94a3b8"
          strokeWidth="2"
          strokeDasharray="5 4"
        />
        <circle cx="80" cy="68" r={matchR} fill="none" stroke="#2563eb" strokeWidth="3" />
        <circle cx="80" cy="68" r={hubR} fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="1" />
      </svg>

      <p className="dia-closest__visual-delta">
        <strong className="dia-closest__visual-delta-abs">{deltaLabel}</strong>
        <span>{pctLabel}</span>
      </p>

      <p className="dia-closest__visual-sr-only">{description}</p>
    </aside>
  );
}

export function ClosestDiameterMatch({
  match,
  targetDiameterIn,
  toleranceIn,
  onViewTiresAvailable,
}: {
  match: TireDiameterMatch;
  targetDiameterIn: number;
  toleranceIn: number;
  onViewTiresAvailable?: () => void;
}) {
  const [moreOpen, setMoreOpen] = useState(false);
  const diff = formatDiameterDiff(match.diameterDiffIn, targetDiameterIn);
  const absPct = getAbsDiffPercent(match, targetDiameterIn);
  const tone = getDiffTone(absPct);
  const production = getDatabaseProductionLabel(match.size);
  const guide = hasTireSizeGuide(match.size);
  const coverage = useMemo(() => getExactSizeCoverage(match.size), [match.size]);
  const uniqueModelCount = coverage.uniqueModelCount;

  const withinRange = Math.abs(match.diameterDiffIn) <= toleranceIn + 1e-9;
  const toleranceLabel = `±${toleranceIn.toFixed(1)} in`;
  const useHref = tireSizeCalculatorPath(match.size);
  const compareLink = preferredSizeCompareLink(match.size);

  const modelsLine =
    uniqueModelCount > 0
      ? formatTireProductCountsLine(coverage)
      : 'Indexed production size in the TireReference database';

  return (
    <section className="dia-closest" aria-label="Closest indexed tire size">
      <div className="dia-closest__main">
        <header className="dia-closest__header">
          <p className="dia-closest__eyebrow">
            <span className="dia-closest__eyebrow-icon">
              <StarIcon />
            </span>
            Closest Indexed Tire Size
          </p>
          <h2 className="dia-closest__size">{match.size}</h2>

          <p
            className={`dia-closest__status-pill${
              withinRange ? ' dia-closest__status-pill--ok' : ' dia-closest__status-pill--warn'
            }`}
          >
            <CheckIcon />
            <span>
              {withinRange ? 'Closest match' : 'Closest indexed match'} to{' '}
              {targetDiameterIn.toFixed(1)} in target
              {!withinRange ? ` (outside ${toleranceLabel})` : ''}
            </span>
          </p>

          <p className="dia-closest__models">
            <span className="dia-closest__models-icon">
              <ShieldIcon />
            </span>
            <span>{modelsLine}</span>
          </p>
        </header>

        <dl className="dia-closest__metrics">
          <div>
            <dt>Calculated Diameter</dt>
            <dd>{formatIn(match.diameterIn)}</dd>
          </div>
          <div>
            <dt>Difference From Target</dt>
            <dd className={`dia-closest__diff--${tone}`}>
              {diff.signed} {diff.percent}
            </dd>
          </div>
          <div>
            <dt>Section Width</dt>
            <dd>{formatIn(match.specs.sectionWidthIn)}</dd>
          </div>
          <div>
            <dt>Sidewall Height</dt>
            <dd>{formatIn(match.specs.sidewallIn)}</dd>
          </div>
          <div>
            <dt>Wheel Diameter</dt>
            <dd>{Math.round(match.wheelDiameterIn)} in</dd>
          </div>
          <div>
            <dt>Production Status</dt>
            <dd className={production ? 'dia-closest__prod--yes' : undefined}>
              {production ? (
                <>
                  <span className="dia-closest__prod-check" aria-hidden="true">
                    <CheckIcon />
                  </span>
                  {production}
                </>
              ) : (
                'Indexed catalog size'
              )}
            </dd>
          </div>
        </dl>

        <div className="dia-closest__more">
          <button
            type="button"
            className="dia-closest__more-toggle"
            aria-expanded={moreOpen}
            onClick={() => setMoreOpen((open) => !open)}
          >
            {moreOpen ? 'Hide dimensions' : 'More dimensions'}
          </button>
          {moreOpen ? (
            <dl className="dia-closest__metrics dia-closest__metrics--more">
              <div>
                <dt>Circumference</dt>
                <dd>{formatIn(match.specs.circumferenceIn)}</dd>
              </div>
              <div>
                <dt>Revolutions per Mile</dt>
                <dd>{Math.round(match.specs.revsPerMile).toLocaleString()}</dd>
              </div>
            </dl>
          ) : null}
        </div>

        <div className="dia-closest__actions">
          <a
            className="dia-btn dia-btn--primary"
            href={useHref}
            onClick={() => trackTireSizeSelected(match.size, CALCULATOR_NAMES.tireDiameter)}
          >
            Use {match.size}
          </a>
          <a className="dia-btn dia-btn--outline" href={compareLink.href}>
            {compareLink.label}
          </a>
          {uniqueModelCount > 0 && onViewTiresAvailable ? (
            <button
              type="button"
              className="dia-btn dia-btn--outline"
              onClick={onViewTiresAvailable}
            >
              View Tires Available
            </button>
          ) : null}
              {guide ? (
                <a className="dia-closest__guide-link" href={match.hubHref}>
                  {`Open ${match.size} tire guide`}
                </a>
              ) : null}
        </div>
      </div>

      <DiameterCompareVisual
        targetIn={targetDiameterIn}
        matchIn={match.diameterIn}
        sizeLabel={match.size}
      />
    </section>
  );
}
