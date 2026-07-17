import { useMemo, useState } from 'react';
import {
  formatDiameterDiff,
  type TireDiameterMatch,
  type ToleranceOption,
} from '../../../lib/tire-diameter-search';
import { hasTireSizeGuide } from '../../../lib/has-tire-size-guide';
import { comparisonPagePathCurrent, tireSizeCalculatorPath } from '../../../lib/tire-size-url';
import { getExactSizeCoverage } from '../../../lib/exact-size-coverage';
import { formatIn, getAbsDiffPercent, getDiffTone } from './diameter-display';
import { getMatchStatusBadges } from '../../../lib/tire-diameter-ranking';
import { DiameterMatchTable } from './DiameterMatchTable';
import type { WheelSelection } from './diameter-search';

/** Max cards shown before “View all matches” opens the full table. */
const VISIBLE_CARD_CAPACITY = 5;

function visibleColumnClass(count: number): string {
  const n = Math.min(Math.max(count, 1), VISIBLE_CARD_CAPACITY);
  return `dia-match-cards__row--n${n}`;
}

function limitedResultsCopy(input: {
  count: number;
  targetDiameterIn: number;
  toleranceIn: number;
  wheelSelection: WheelSelection;
}): string {
  const { count, targetDiameterIn, toleranceIn, wheelSelection } = input;
  const quantity = count === 1 ? 'Only one' : `Only ${count}`;
  const noun = count === 1 ? 'size' : 'sizes';
  const wheel =
    wheelSelection === 'any'
      ? 'indexed'
      : `indexed ${wheelSelection}-inch`;
  return `${quantity} ${wheel} ${noun} fall within ±${toleranceIn.toFixed(1)} in of the ${targetDiameterIn.toFixed(1)} in target.`;
}

export function DiameterMatchCards({
  matches,
  targetDiameterIn,
  toleranceIn,
  wheelSelection,
  onIncreaseTolerance,
  onSelectAnyWheel,
}: {
  matches: TireDiameterMatch[];
  targetDiameterIn: number;
  toleranceIn: ToleranceOption;
  wheelSelection: WheelSelection;
  onIncreaseTolerance?: () => void;
  onSelectAnyWheel?: () => void;
}) {
  const [showAll, setShowAll] = useState(false);

  const top = useMemo(
    () => matches.slice(0, VISIBLE_CARD_CAPACITY),
    [matches],
  );
  const totalMatches = matches.length;
  const hasHiddenMatches = totalMatches > top.length;
  const nextTolerance =
    toleranceIn < 1 ? 1 : toleranceIn < 2 ? 2 : toleranceIn < 3 ? 3 : null;

  if (matches.length === 0) return null;

  return (
    <section className="dia-match-cards" aria-label="Top matching tire sizes">
      <div className="dia-match-cards__head">
        <h2 className="dia-section-title">Top Matching Tire Sizes</h2>
        {hasHiddenMatches ? (
          <button
            type="button"
            className="dia-match-cards__view-all"
            onClick={() => setShowAll((open) => !open)}
            aria-expanded={showAll}
          >
            {showAll ? 'Hide full results' : 'View all matches'}
          </button>
        ) : null}
      </div>

      {totalMatches <= 2 ? (
        <p className="dia-match-cards__context">
          {limitedResultsCopy({
            count: totalMatches,
            targetDiameterIn,
            toleranceIn,
            wheelSelection,
          })}
        </p>
      ) : null}

      {totalMatches <= 2 ? (
        <div className="dia-match-cards__limited-actions">
          {wheelSelection !== 'any' && onSelectAnyWheel ? (
            <button
              type="button"
              className="dia-btn dia-btn--outline"
              onClick={onSelectAnyWheel}
            >
              Search all wheel diameters
            </button>
          ) : null}
          {nextTolerance != null && onIncreaseTolerance ? (
            <button
              type="button"
              className="dia-btn dia-btn--outline"
              onClick={onIncreaseTolerance}
            >
              Increase maximum difference to ±{nextTolerance.toFixed(1)} in
            </button>
          ) : null}
        </div>
      ) : null}

      <div
        className={`dia-match-cards__row ${visibleColumnClass(top.length)}`}
        role="list"
      >
        {top.map((match, index) => {
          const diff = formatDiameterDiff(match.diameterDiffIn, targetDiameterIn);
          const tone = getDiffTone(getAbsDiffPercent(match, targetDiameterIn));
          const guide = hasTireSizeGuide(match.size);
          const coverage = getExactSizeCoverage(match.size);
          const uniqueModelCount = coverage.uniqueModelCount;
          const badges = getMatchStatusBadges(
            match,
            targetDiameterIn,
            index,
            toleranceIn,
          );
          const sizeHref = guide ? match.hubHref : tireSizeCalculatorPath(match.size);
          const actionLabel =
            guide || uniqueModelCount > 0 ? 'View Tire Models' : 'View Size';

          return (
            <article
              key={match.size}
              className={`dia-match-card${index === 0 ? ' dia-match-card--closest' : ''}`}
              role="listitem"
            >
              <div className="dia-match-card__top">
                <span className="dia-match-card__rank">#{index + 1}</span>
                <div className="dia-match-card__labels">
                  {badges.relationship ? (
                    <span
                      className={`dia-match-card__badge${
                        badges.relationship === 'Closest' ||
                        badges.relationship === 'Exact'
                          ? ' dia-match-card__badge--primary'
                          : ''
                      }`}
                    >
                      {badges.relationship}
                    </span>
                  ) : null}
                  {badges.production ? (
                    <span className="dia-match-card__badge dia-match-card__badge--prod">
                      {badges.production}
                    </span>
                  ) : null}
                </div>
              </div>

              <h3 className="dia-match-card__size">{match.size}</h3>

              <div className="dia-match-card__primary">
                <div>
                  <span className="dia-match-card__primary-label">Nominal diameter</span>
                  <strong className="dia-match-card__primary-value">
                    {formatIn(match.diameterIn)}
                  </strong>
                </div>
                <div>
                  <span className="dia-match-card__primary-label">Difference</span>
                  <strong
                    className={`dia-match-card__primary-value dia-match-card__diff--${tone}`}
                  >
                    {diff.signed} {diff.percent}
                  </strong>
                </div>
              </div>

              <dl className="dia-match-card__stats">
                <div>
                  <dt>Wheel</dt>
                  <dd>{Math.round(match.wheelDiameterIn)} in</dd>
                </div>
                <div>
                  <dt>Width</dt>
                  <dd>{formatIn(match.specs.sectionWidthIn)}</dd>
                </div>
                <div>
                  <dt>Sidewall</dt>
                  <dd>{formatIn(match.specs.sidewallIn)}</dd>
                </div>
                {uniqueModelCount > 0 ? (
                  <div>
                    <dt>Unique tire models</dt>
                    <dd>{uniqueModelCount}</dd>
                  </div>
                ) : null}
              </dl>

              <div className="dia-match-card__footer">
                <a className="dia-match-card__link" href={sizeHref}>
                  {actionLabel}
                </a>
                <a
                  className="dia-match-card__compare"
                  href={comparisonPagePathCurrent(match.size)}
                  aria-label={`Compare ${match.size} with another size`}
                  title={`Compare ${match.size} with another size`}
                >
                  Compare
                </a>
              </div>
            </article>
          );
        })}
      </div>

      {showAll && hasHiddenMatches ? (
        <DiameterMatchTable matches={matches} targetDiameterIn={targetDiameterIn} />
      ) : null}
    </section>
  );
}
