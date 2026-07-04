import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import '../../styles/calculator-diameter.css';
import { useStickyAnalyzeButton } from '../../hooks/useStickyAnalyzeButton';
import { useSingleOpenDetails } from '../../hooks/useSingleOpenDetails';
import { CALCULATOR_PATHS } from '../../lib/calculator-links';
import {
  ABOUT_DIAMETER_AFFECTS,
  buildPopularComparisonsForDiameterSearch,
  buildPopularSizesNearDiameter,
  buildDiameterSeoContent,
  buildDiameterVsWheelExample,
  buildEqualToDiameterContent,
  buildWhatIsTireDiameterLead,
  diameterLandingHref,
  DIAMETER_FAQS,
  DIAMETER_IMPACT_CARDS,
  DIAMETER_PRESETS,
  EDUCATIONAL_CONTENT,
  POPULAR_DIAMETER_SEARCHES,
  POPULAR_TIRE_DIAMETERS,
  RELATED_CALCULATOR_LINKS,
} from '../../lib/tire-diameter-insights';
import {
  formatDiameterDiff,
  inchesFromUnit,
  searchTiresByDiameter,
  TOLERANCE_OPTIONS,
  WHEEL_DIAMETER_OPTIONS,
  type DiameterSearchCategoryBadge,
  type TireDiameterMatch,
  type ToleranceOption,
  type WheelDiameterOption,
} from '../../lib/tire-diameter-search';
import { comparisonPagePathCurrent, tireSizeCalculatorPath } from '../../lib/tire-size-url';
import { DiameterVsWheelVisual } from './DiameterVsWheelVisual';
import { MeasureDiameterVisual } from './MeasureDiameterVisual';
import { StickyAnalyzeButton } from './StickyAnalyzeButton';
import {
  CALCULATOR_NAMES,
  trackCalculatorCompletedOnce,
  useAnalyticsDedupTracker,
  useCalculatorStarted,
  useUserInteractionFlag,
} from '../../hooks/useCalculatorAnalytics';
import { trackRelatedCalculatorClick } from '../../lib/analytics';

export interface PremiumTireDiameterCalculatorProps {
  initialDiameter?: number;
  initialWheel?: WheelDiameterOption;
}

function displayCategory(badge: DiameterSearchCategoryBadge): string {
  switch (badge) {
    case 'All Terrain':
      return 'All-Terrain';
    case 'Daily Driving':
      return 'Highway';
    case 'Off Road':
      return 'Off-Road';
    default:
      return badge;
  }
}

function badgeClass(badge: DiameterSearchCategoryBadge): string {
  switch (badge) {
    case 'Daily Driving':
      return 'dia-badge--daily';
    case 'All Terrain':
      return 'dia-badge--terrain';
    case 'Performance':
      return 'dia-badge--performance';
    case 'Off Road':
      return 'dia-badge--offroad';
    case 'Towing':
      return 'dia-badge--towing';
    default:
      return 'dia-badge--daily';
  }
}

function getAbsDiffPercent(match: TireDiameterMatch, targetIn: number): number {
  if (targetIn <= 0) return Math.abs(match.diameterDiffPercent);
  return Math.abs((match.diameterDiffIn / targetIn) * 100);
}

function getDiffColor(pct: number): 'green' | 'amber' | 'red' {
  if (pct <= 1) return 'green';
  if (pct <= 3) return 'amber';
  return 'red';
}

type QualityBadgeType = 'perfect' | 'very-close' | 'popular' | 'upgrade';

function getResultQualityBadges(
  match: TireDiameterMatch,
  targetIn: number,
  closestRank: number,
): Array<{ label: string; type: QualityBadgeType }> {
  const badges: Array<{ label: string; type: QualityBadgeType }> = [];
  const pct = getAbsDiffPercent(match, targetIn);

  if (pct <= 0.5) badges.push({ label: 'Perfect Match', type: 'perfect' });
  else if (pct <= 1) badges.push({ label: 'Very Close', type: 'very-close' });

  if (match.popularity >= 8) badges.push({ label: 'Popular Choice', type: 'popular' });
  if (closestRank > 1 && closestRank <= 4) badges.push({ label: 'Common Upgrade', type: 'upgrade' });

  return badges;
}

function ResultQualityBadges({
  badges,
}: {
  badges: Array<{ label: string; type: QualityBadgeType }>;
}) {
  if (badges.length === 0) return null;

  return (
    <div className="dia-quality-badges">
      {badges.map((badge) => (
        <span key={badge.label} className={`dia-quality-badge dia-quality-badge--${badge.type}`}>
          <span aria-hidden="true">✓</span> {badge.label}
        </span>
      ))}
    </div>
  );
}

type SortKey = 'closest' | 'smallest-diff' | 'largest-diameter' | 'smallest-diameter';
type ViewMode = 'table' | 'card';

function sortMatches(matches: TireDiameterMatch[], sortKey: SortKey): TireDiameterMatch[] {
  const sorted = [...matches];
  switch (sortKey) {
    case 'largest-diameter':
      return sorted.sort((a, b) => b.diameterIn - a.diameterIn);
    case 'smallest-diameter':
      return sorted.sort((a, b) => a.diameterIn - b.diameterIn);
    case 'smallest-diff':
    case 'closest':
    default:
      return sorted.sort((a, b) => {
        const diffA = Math.abs(a.diameterDiffIn);
        const diffB = Math.abs(b.diameterDiffIn);
        if (diffA !== diffB) return diffA - diffB;
        return b.popularity - a.popularity;
      });
  }
}

function IconGuide() {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M3 2.5h7.5L13 5v8.5a1 1 0 01-1 1H3a1 1 0 01-1-1V3.5a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.25" />
      <path d="M6 2.5V5h4.5" stroke="currentColor" strokeWidth="1.25" />
    </svg>
  );
}

function IconUse() {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function RowActions({ match }: { match: TireDiameterMatch }) {
  return (
    <div className="dia-row-actions">
      <a
        className="dia-compare-cta"
        href={comparisonPagePathCurrent(match.size)}
      >
        Compare This Size
      </a>
      <a className="dia-icon-btn" href={match.hubHref} title="View Guide" aria-label={`View guide for ${match.size}`}>
        <IconGuide />
        <span className="dia-icon-btn__label">Guide</span>
      </a>
      <a
        className="dia-icon-btn dia-icon-btn--accent"
        href={tireSizeCalculatorPath(match.size)}
        title="Use This Size"
        aria-label={`Use ${match.size} in tire size calculator`}
      >
        <IconUse />
        <span className="dia-icon-btn__label">Use</span>
      </a>
    </div>
  );
}

function PopularSizesNearSection({
  targetIn,
  sizes,
}: {
  targetIn: number;
  sizes: Array<{ size: string; diameterIn: number; hubHref: string }>;
}) {
  const rounded = Math.round(targetIn);

  return (
    <section className="dia-near-sizes" aria-label={`Popular tire sizes near ${rounded} inches`}>
      <h2 className="dia-near-sizes__title">Popular Tire Sizes Near {rounded}&quot;</h2>
      <div className="dia-near-sizes__grid">
        {sizes.map((item) => (
          <a key={item.size} className="dia-near-size-card" href={item.hubHref}>
            <span className="dia-near-size-card__size">{item.size}</span>
            <span className="dia-near-size-card__diameter">{item.diameterIn.toFixed(2)}&quot;</span>
          </a>
        ))}
      </div>
    </section>
  );
}

function BestMatchStrip({
  match,
  targetIn,
}: {
  match: TireDiameterMatch;
  targetIn: number;
}) {
  const diff = formatDiameterDiff(match.diameterDiffIn, targetIn);
  const pct = getAbsDiffPercent(match, targetIn);
  const color = getDiffColor(pct);

  return (
    <article className="dia-best-strip" aria-label="Best matching tire size">
      <div className="dia-best-strip__main">
        <p className="dia-best-strip__heading">
          <span className="dia-best-strip__check" aria-hidden="true">✓</span>
          Best Match Found
        </p>
        <div className="dia-best-strip__grid">
          <div className="dia-best-strip__size-col">
            <p className="dia-best-strip__size">{match.size}</p>
            <p className="dia-best-strip__diameter">{match.diameterIn.toFixed(2)}&quot; Diameter</p>
          </div>
          <div className={`dia-best-strip__diff dia-best-strip__diff--${color}`}>
            <span>{diff.signed}</span>
            <span className="dia-best-strip__pct">{diff.percent}</span>
          </div>
          <div className="dia-best-strip__meta">
            <span>{match.wheelDiameterIn}&quot; Wheel</span>
            <span className={`dia-badge ${badgeClass(match.categoryBadge)}`}>
              {displayCategory(match.categoryBadge)}
            </span>
          </div>
          <div className="dia-best-strip__actions">
            <a className="dia-compact-btn" href={match.hubHref}>View Tire Size Guide</a>
            <a
              className="dia-compact-btn dia-compact-btn--outline"
              href={comparisonPagePathCurrent(match.size)}
            >
              Compare Sizes
            </a>
          </div>
        </div>
      </div>
    </article>
  );
}

function MatchTableRow({
  match,
  rank,
  targetIn,
  isBest,
  closestRank,
}: {
  match: TireDiameterMatch;
  rank: number;
  targetIn: number;
  isBest: boolean;
  closestRank: number;
}) {
  const diff = formatDiameterDiff(match.diameterDiffIn, targetIn);
  const pct = getAbsDiffPercent(match, targetIn);
  const color = getDiffColor(pct);
  const qualityBadges = getResultQualityBadges(match, targetIn, closestRank);

  return (
    <tr className={`dia-results-row ${isBest ? 'dia-results-row--best' : ''}`}>
      <td className="dia-results-row__rank">#{rank}</td>
      <td className="dia-results-row__size">
        <a href={match.hubHref}>{match.size}</a>
        <ResultQualityBadges badges={qualityBadges} />
      </td>
      <td className="dia-results-row__diameter">{match.diameterIn.toFixed(2)}&quot;</td>
      <td className={`dia-results-row__diff dia-results-row__diff--${color}`}>
        <span>{diff.signed}</span>
        <span className="dia-results-row__pct">{diff.percent}</span>
      </td>
      <td className="dia-results-row__wheel">{match.wheelDiameterIn}&quot;</td>
      <td className="dia-results-row__cat">
        <span className={`dia-badge ${badgeClass(match.categoryBadge)}`}>
          {displayCategory(match.categoryBadge)}
        </span>
      </td>
      <td className="dia-results-row__actions">
        <RowActions match={match} />
      </td>
    </tr>
  );
}

function MatchCompactCard({
  match,
  rank,
  targetIn,
  isBest,
  closestRank,
}: {
  match: TireDiameterMatch;
  rank: number;
  targetIn: number;
  isBest: boolean;
  closestRank: number;
}) {
  const diff = formatDiameterDiff(match.diameterDiffIn, targetIn);
  const pct = getAbsDiffPercent(match, targetIn);
  const color = getDiffColor(pct);
  const qualityBadges = getResultQualityBadges(match, targetIn, closestRank);

  return (
    <article className={`dia-compact-card ${isBest ? 'dia-compact-card--best' : ''}`}>
      <div className="dia-compact-card__head">
        <span className="dia-compact-card__rank">#{rank}</span>
        <a className="dia-compact-card__size" href={match.hubHref}>{match.size}</a>
        <span className={`dia-badge ${badgeClass(match.categoryBadge)}`}>
          {displayCategory(match.categoryBadge)}
        </span>
      </div>
      <ResultQualityBadges badges={qualityBadges} />
      <div className="dia-compact-card__body">
        <span>{match.diameterIn.toFixed(2)}&quot;</span>
        <span className={`dia-compact-card__diff dia-compact-card__diff--${color}`}>
          {diff.signed} {diff.percent}
        </span>
        <span>{match.wheelDiameterIn}&quot;</span>
      </div>
      <RowActions match={match} />
    </article>
  );
}

function MatchingResults({
  matches,
  bestMatchSize,
  targetIn,
  effectiveTolerance,
  wheelIn,
  displayDiameter,
  suggestion,
}: {
  matches: TireDiameterMatch[];
  bestMatchSize: string;
  targetIn: number;
  effectiveTolerance: number;
  wheelIn: number;
  displayDiameter: number;
  suggestion?: string;
}) {
  const [sortKey, setSortKey] = useState<SortKey>('closest');
  const [viewMode, setViewMode] = useState<ViewMode>(() =>
    typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches ? 'card' : 'table',
  );

  const sorted = useMemo(() => sortMatches(matches, sortKey), [matches, sortKey]);
  const rankBySize = useMemo(() => {
    const map = new Map<string, number>();
    sorted.forEach((m, i) => map.set(m.size, i + 1));
    return map;
  }, [sorted]);
  const closestRankBySize = useMemo(() => {
    const closest = sortMatches(matches, 'closest');
    const map = new Map<string, number>();
    closest.forEach((m, i) => map.set(m.size, i + 1));
    return map;
  }, [matches]);

  return (
    <section className="dia-results-zone" aria-label="Matching tire sizes">
      <div className="dia-results-toolbar">
        <div className="dia-results-toolbar__left">
          <h2 className="dia-results-card__title">Matching Tire Sizes ({matches.length})</h2>
          <span className="dia-verified-pill">
            <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M3.5 8.25l2.75 2.75 6-6.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Verified
          </span>
        </div>
        <div className="dia-results-toolbar__controls">
          <label className="dia-results-control">
            <span>Sort By</span>
            <select value={sortKey} onChange={(e) => setSortKey(e.target.value as SortKey)}>
              <option value="closest">Closest Match</option>
              <option value="smallest-diff">Smallest Difference</option>
              <option value="largest-diameter">Largest Diameter</option>
              <option value="smallest-diameter">Smallest Diameter</option>
            </select>
          </label>
          <div className="dia-view-toggle" role="group" aria-label="View mode">
            <button
              type="button"
              className={`dia-view-toggle__btn ${viewMode === 'table' ? 'dia-view-toggle__btn--active' : ''}`}
              onClick={() => setViewMode('table')}
            >
              Table
            </button>
            <button
              type="button"
              className={`dia-view-toggle__btn ${viewMode === 'card' ? 'dia-view-toggle__btn--active' : ''}`}
              onClick={() => setViewMode('card')}
            >
              Cards
            </button>
          </div>
        </div>
      </div>

      {viewMode === 'table' ? (
        <>
          <div className="dia-results-table-wrap">
            <table className="dia-results-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Tire Size</th>
                  <th>Diameter</th>
                  <th>Difference</th>
                  <th>Wheel</th>
                  <th>Category</th>
                  <th aria-label="Actions"> </th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((match) => (
                  <MatchTableRow
                    key={match.size}
                    match={match}
                    rank={rankBySize.get(match.size) ?? 0}
                    targetIn={targetIn}
                    isBest={match.size === bestMatchSize}
                    closestRank={closestRankBySize.get(match.size) ?? 0}
                  />
                ))}
              </tbody>
            </table>
          </div>
          <div className="dia-compact-card-list dia-compact-card-list--mobile">
            {sorted.map((match) => (
              <MatchCompactCard
                key={`m-${match.size}`}
                match={match}
                rank={rankBySize.get(match.size) ?? 0}
                targetIn={targetIn}
                isBest={match.size === bestMatchSize}
                closestRank={closestRankBySize.get(match.size) ?? 0}
              />
            ))}
          </div>
        </>
      ) : (
        <div className="dia-compact-card-list">
          {sorted.map((match) => (
            <MatchCompactCard
              key={match.size}
              match={match}
              rank={rankBySize.get(match.size) ?? 0}
              targetIn={targetIn}
              isBest={match.size === bestMatchSize}
              closestRank={closestRankBySize.get(match.size) ?? 0}
            />
          ))}
        </div>
      )}

      <p className="dia-results-disclaimer">
        Showing tire sizes within ±{effectiveTolerance.toFixed(2)}&quot; of {displayDiameter.toFixed(2)}&quot; for {wheelIn}&quot; wheels.
        Actual diameter may vary by manufacturer and inflation pressure.
        {suggestion ? ` ${suggestion}` : ''}
      </p>
    </section>
  );
}

export default function PremiumTireDiameterCalculator({
  initialDiameter = 33,
  initialWheel = 18,
}: PremiumTireDiameterCalculatorProps) {
  const [diameterInput, setDiameterInput] = useState(String(initialDiameter));
  const [diameterUnit, setDiameterUnit] = useState<'imperial' | 'metric'>('imperial');
  const [wheelDiameter, setWheelDiameter] = useState<WheelDiameterOption>(initialWheel);
  const [tolerance, setTolerance] = useState<ToleranceOption>(1);
  const [hasSearched, setHasSearched] = useState(true);
  const formRef = useRef<HTMLElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const faqRef = useRef<HTMLElement>(null);

  useCalculatorStarted(CALCULATOR_NAMES.tireDiameter);
  const { markInteracted, interacted } = useUserInteractionFlag();
  const dedupTracker = useAnalyticsDedupTracker();

  const targetDiameterIn = useMemo(() => {
    const parsed = Number(diameterInput);
    if (!Number.isFinite(parsed) || parsed <= 0) return null;
    return inchesFromUnit(parsed, diameterUnit);
  }, [diameterInput, diameterUnit]);

  const searchResult = useMemo(() => {
    if (!targetDiameterIn || !hasSearched) return null;
    return searchTiresByDiameter({
      targetDiameterIn,
      wheelDiameterIn: wheelDiameter,
      toleranceIn: tolerance,
    });
  }, [targetDiameterIn, wheelDiameter, tolerance, hasSearched]);

  const bestMatch = searchResult?.matches[0] ?? null;

  const nearDiameterSizes = useMemo(() => {
    if (!targetDiameterIn) return [];
    return buildPopularSizesNearDiameter(
      targetDiameterIn,
      4,
      searchResult?.matches.map((match) => match.size) ?? [],
    );
  }, [targetDiameterIn, searchResult?.matches]);

  const equalToContent = useMemo(() => {
    if (!targetDiameterIn || !searchResult) return null;
    return buildEqualToDiameterContent(targetDiameterIn, wheelDiameter, searchResult.matches);
  }, [targetDiameterIn, wheelDiameter, searchResult]);

  const seo = useMemo(() => {
    if (!targetDiameterIn || !searchResult) return null;
    return buildDiameterSeoContent(targetDiameterIn, wheelDiameter, searchResult.matches);
  }, [targetDiameterIn, wheelDiameter, searchResult]);

  const visualExample = useMemo(
    () =>
      buildDiameterVsWheelExample(wheelDiameter, {
        targetDiameterIn,
        preferredSize: searchResult?.matches[0]?.size,
      }),
    [wheelDiameter, targetDiameterIn, searchResult?.matches],
  );

  const whatIsTireDiameterLead = useMemo(
    () => buildWhatIsTireDiameterLead(visualExample),
    [visualExample],
  );

  const popularComparisons = useMemo(() => {
    if (!targetDiameterIn) return [];
    return buildPopularComparisonsForDiameterSearch({
      targetDiameterIn,
      wheelDiameterIn: wheelDiameter,
      toleranceIn: tolerance,
    });
  }, [targetDiameterIn, wheelDiameter, tolerance]);

  const displayDiameter =
    diameterUnit === 'imperial'
      ? Math.round((targetDiameterIn ?? Number(diameterInput)) * 10) / 10
      : Number(diameterInput);

  const activePreset =
    targetDiameterIn && diameterUnit === 'imperial'
      ? DIAMETER_PRESETS.find((p) => Math.abs(p.diameterIn - targetDiameterIn) < 0.6)?.diameterIn
      : undefined;

  useEffect(() => {
    if (!seo) return;
    document.title = seo.title;
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute('content', seo.metaDescription);
  }, [seo]);

  const scrollToResults = useCallback(() => {
    requestAnimationFrame(() => {
      resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }, []);

  const runSearch = useCallback(() => {
    markInteracted();
    setHasSearched(true);
    scrollToResults();
  }, [markInteracted, scrollToResults]);

  useEffect(() => {
    if (!interacted || !targetDiameterIn || !hasSearched) return;
    const signature = `${targetDiameterIn}|${wheelDiameter}|${tolerance}`;
    trackCalculatorCompletedOnce(dedupTracker, signature, {
      calculator_name: CALCULATOR_NAMES.tireDiameter,
    });
  }, [interacted, targetDiameterIn, wheelDiameter, tolerance, hasSearched, dedupTracker]);

  useEffect(() => {
    if (!targetDiameterIn) return;
    setHasSearched(true);
  }, [targetDiameterIn, wheelDiameter, tolerance]);

  const applyPreset = useCallback(
    (diameterIn: number) => {
      markInteracted();
      setDiameterInput(String(diameterIn));
      setDiameterUnit('imperial');
      setHasSearched(true);
      scrollToResults();
    },
    [markInteracted, scrollToResults],
  );

  const hasResults = Boolean(searchResult && searchResult.matches.length > 0);
  const stickyVisible = useStickyAnalyzeButton(formRef, resultsRef, { resultsReady: hasResults });
  useSingleOpenDetails(faqRef);

  return (
    <div className="cmp-page dia-page tl-has-sticky-analyze">
      <div className="cmp-shell">
        <div className="cmp-toolbar">
          <nav className="cmp-breadcrumbs" aria-label="Breadcrumb">
            <a href="/">Home</a>
            <span>/</span>
            <a href={CALCULATOR_PATHS.tireSize}>Calculators</a>
            <span>/</span>
            <span>Tire Diameter Calculator</span>
          </nav>
        </div>

        <div className="cmp-layout">
          <aside className="cmp-sidebar-left dia-sidebar-left" aria-label="Popular searches">
            <section className="cmp-panel dia-sidebar-panel dia-sidebar-panel--popular-searches">
              <h2 className="cmp-panel__title">Popular Diameter Searches</h2>
              <ul className="dia-popular-diameter-list">
                {POPULAR_DIAMETER_SEARCHES.map((search) => (
                  <li key={search.diameterIn}>
                    <button
                      type="button"
                      className="dia-popular-diameter-row dia-popular-diameter-row--button"
                      onClick={() => applyPreset(search.diameterIn)}
                    >
                      <span className="dia-popular-diameter-row__body">
                        <span className="dia-popular-diameter-row__title">{search.label}</span>
                        <span className="dia-popular-diameter-row__desc">{search.description}</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>

            <section className="cmp-panel dia-sidebar-panel">
              <h2 className="cmp-panel__title">Popular Comparisons</h2>
              {popularComparisons.length > 0 ? (
                <ul className="cmp-link-list">
                  {popularComparisons.map((item) => (
                    <li key={item.href}>
                      <a href={item.href}>{item.label}</a>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="dia-sidebar-empty">
                  No comparisons match {displayDiameter}&quot; on {wheelDiameter}&quot; wheels within ±{tolerance}&quot;.
                </p>
              )}
            </section>
          </aside>

          <div className="cmp-main dia-main">
            <section ref={formRef} className="dia-search-card" aria-label="Find tire sizes by diameter">
              <div className="dia-search-card__head">
                <h1 className="dia-search-card__title">Tire Diameter Calculator</h1>
                <p className="dia-search-card__subtitle">
                  Enter a target overall diameter and wheel size to find matching tire codes from our
                  verified database.
                </p>
              </div>

              <div className="dia-steps">
                <div className="dia-step">
                  <label className="dia-step__label" htmlFor="dia-target">
                    <span className="dia-step__num">1</span> Target diameter ({diameterUnit === 'imperial' ? 'inches' : 'cm'})
                  </label>
                  <div className="dia-step__row">
                    <input
                      id="dia-target"
                      className="dia-step__input dia-step__input--hero"
                      type="number"
                      min={1}
                      step={0.1}
                      value={diameterInput}
                      onChange={(e) => {
                        markInteracted();
                        setDiameterInput(e.target.value);
                      }}
                      placeholder="33"
                    />
                    <div className="dia-unit-toggle" role="group" aria-label="Diameter unit">
                      <button
                        type="button"
                        className={`dia-unit-toggle__btn ${diameterUnit === 'imperial' ? 'dia-unit-toggle__btn--active' : ''}`}
                        onClick={() => {
                          markInteracted();
                          setDiameterUnit('imperial');
                        }}
                      >
                        in
                      </button>
                      <button
                        type="button"
                        className={`dia-unit-toggle__btn ${diameterUnit === 'metric' ? 'dia-unit-toggle__btn--active' : ''}`}
                        onClick={() => {
                          markInteracted();
                          setDiameterUnit('metric');
                        }}
                      >
                        cm
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 mt-6 sm:grid-cols-2 sm:gap-6">
                  <div className="flex h-full flex-col rounded-2xl border border-border bg-white p-5 shadow-sm">
                    <label className="text-sm font-semibold text-heading" htmlFor="dia-wheel">
                      Wheel Diameter
                    </label>
                    <p className="mt-1 text-xs text-muted">Filter matching sizes by rim diameter</p>
                    <div className="mt-3 flex flex-1 flex-col justify-end">
                      <select
                        id="dia-wheel"
                        className="h-14 w-full rounded-xl border border-border bg-white px-4 text-base font-semibold text-heading transition-all duration-200 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10"
                        value={wheelDiameter}
                        onChange={(e) => {
                          markInteracted();
                          setWheelDiameter(Number(e.target.value) as WheelDiameterOption);
                        }}
                      >
                        {WHEEL_DIAMETER_OPTIONS.map((wheel) => (
                          <option key={wheel} value={wheel}>
                            {wheel}&quot;
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex h-full flex-col rounded-2xl border border-border bg-white p-5 shadow-sm">
                    <span className="text-sm font-semibold text-heading">Tolerance Range</span>
                    <p className="mt-1 text-xs text-muted">How close results must be to target diameter</p>
                    <div
                      className="dia-tolerance-group mt-3 flex flex-1 flex-row items-end gap-3"
                      role="group"
                      aria-label="Diameter tolerance"
                    >
                      {TOLERANCE_OPTIONS.map((option) => (
                        <button
                          key={option}
                          type="button"
                          className={`dia-tolerance-btn flex-1 h-14 min-w-0 rounded-xl border text-sm font-semibold transition-all duration-200 ${
                            tolerance === option
                              ? 'border-transparent bg-gradient-to-br from-primary to-primary-hover text-white shadow-[0_4px_14px_rgb(91_79_230/0.35)]'
                              : 'border-border bg-white text-body hover:border-primary hover:bg-primary-light'
                          }`}
                          onClick={() => {
                            markInteracted();
                            setTolerance(option);
                          }}
                        >
                          ±{option}&quot;
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {targetDiameterIn && (
                  <p className="mt-4 text-center text-sm text-muted">
                    Searching for tires around:{' '}
                    <span className="text-body">
                      {displayDiameter}&quot; diameter • {wheelDiameter}&quot; wheel • ±{tolerance}&quot;
                      tolerance
                    </span>
                  </p>
                )}
              </div>

              <button type="button" className="dia-search-btn" onClick={runSearch}>
                Find Matching Tire Sizes
              </button>
            </section>

            <section className="dia-presets dia-presets--main" aria-label="Quick diameter presets">
              <h2 className="dia-presets__title">Quick Diameter Presets</h2>
              <div className="dia-presets__grid">
                {DIAMETER_PRESETS.map((preset) => (
                  <button
                    key={preset.diameterIn}
                    type="button"
                    className={`dia-preset-card ${activePreset === preset.diameterIn ? 'dia-preset-card--active' : ''}`}
                    onClick={() => applyPreset(preset.diameterIn)}
                  >
                    <span className="dia-preset-card__size">{preset.label}</span>
                    <span className="dia-preset-card__label">{preset.description}</span>
                  </button>
                ))}
              </div>
            </section>

            <div className="dia-discovery" ref={resultsRef}>
              {bestMatch && targetDiameterIn && (
                <BestMatchStrip match={bestMatch} targetIn={targetDiameterIn} />
              )}

              {!targetDiameterIn ? (
                <p className="cmp-empty">Enter a target diameter to search our verified tire database.</p>
              ) : searchResult && searchResult.matches.length > 0 ? (
                <>
                  <MatchingResults
                    matches={searchResult.matches}
                    bestMatchSize={bestMatch!.size}
                    targetIn={targetDiameterIn}
                    effectiveTolerance={searchResult.effectiveToleranceIn}
                    wheelIn={wheelDiameter}
                    displayDiameter={displayDiameter}
                    suggestion={searchResult.suggestion}
                  />
                  {nearDiameterSizes.length > 0 && (
                    <PopularSizesNearSection targetIn={targetDiameterIn} sizes={nearDiameterSizes} />
                  )}
                </>
              ) : (
                <p className="cmp-empty">No matches found. Try widening your tolerance range.</p>
              )}

              {equalToContent && (
                <article className="cmp-seo-block dia-equal-block">
                  <h2>{equalToContent.heading}</h2>
                  <p>{equalToContent.body}</p>
                </article>
              )}
            </div>

            <article className="cmp-seo-block dia-edu-block">
              <h2>How to Measure Your Tire&apos;s Actual Diameter</h2>
              <div className="dia-measure-row">
                <ol className="dia-measure-steps">
                  {EDUCATIONAL_CONTENT.howToMeasureSteps.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ol>
                <MeasureDiameterVisual />
              </div>
            </article>

            <article className="cmp-seo-block dia-edu-block dia-edu-block--vs-wheel">
              <h2>Tire Diameter vs Wheel Diameter</h2>
              <p>
                An {wheelDiameter}&quot; wheel is not an {wheelDiameter}&quot; tire — overall diameter
                includes both sidewalls and tread. Example: {visualExample.exampleSize} has an {wheelDiameter}&quot;
                rim but measures {visualExample.overallDiameterIn.toFixed(2)}&quot; tall overall.
              </p>
              <div className="dia-visual-compare" aria-label="Wheel versus overall tire diameter">
                <DiameterVsWheelVisual
                  wheelDiameterIn={wheelDiameter}
                  overallDiameterIn={visualExample.overallDiameterIn}
                  exampleSize={visualExample.exampleSize}
                />
              </div>
            </article>

            <article className="cmp-seo-block dia-edu-block">
              <h2>What Does Tire Diameter Affect?</h2>
              <div className="dia-impact-grid">
                {DIAMETER_IMPACT_CARDS.map((card) => (
                  <div key={card.id} className="dia-impact-card">
                    <span className="dia-impact-card__icon" aria-hidden="true">{card.icon}</span>
                    <p className="dia-impact-card__title">{card.title}</p>
                    <p className="dia-impact-card__desc">{card.description}</p>
                  </div>
                ))}
              </div>
            </article>

            <article className="cmp-seo-block">
              <h2>What Is Tire Diameter?</h2>
              <p>{whatIsTireDiameterLead}</p>
              <p>{EDUCATIONAL_CONTENT.whatIsTireDiameterBody}</p>
            </article>

            {seo && (
              <>
                <article className="cmp-seo-block">
                  <h2>{seo.vehiclesHeading}</h2>
                  <p>{seo.vehiclesBody}</p>
                </article>
                <article className="cmp-seo-block">
                  <h2>{seo.wheelComboHeading}</h2>
                  <p>{seo.wheelComboBody}</p>
                </article>
              </>
            )}

            <section className="cmp-panel dia-faq-section">
              <h2 className="cmp-panel__title">FAQs</h2>
              <div className="dia-faq" ref={faqRef}>
                {DIAMETER_FAQS.map((faq) => (
                  <details key={faq.question}>
                    <summary>{faq.question}</summary>
                    <p>{faq.answer}</p>
                  </details>
                ))}
              </div>
            </section>
          </div>

          <aside className="cmp-sidebar-right dia-sidebar-right" aria-label="Tire diameter guides">
            <section className="cmp-panel dia-sidebar-calc">
              <h2 className="cmp-panel__title">Related Calculators</h2>
              <div className="dia-sidebar-calc__list">
                {RELATED_CALCULATOR_LINKS.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    className="dia-sidebar-calc__card"
                    onClick={() => trackRelatedCalculatorClick(link.href, CALCULATOR_NAMES.tireDiameter)}
                  >
                    <p className="dia-sidebar-calc__title">{link.label}</p>
                    <p className="dia-sidebar-calc__desc">{link.description}</p>
                  </a>
                ))}
              </div>
            </section>

            <section className="cmp-panel dia-sidebar-panel--about">
              <h2 className="cmp-panel__title">About Tire Diameter</h2>
              <p className="dia-sidebar-text">
                Overall tire diameter is the full height of a mounted tire from ground to tread top.
                It affects how far your vehicle travels per revolution and is critical for fitment,
                speedometer accuracy, and gearing decisions.
              </p>
              <ul className="dia-checklist">
                {ABOUT_DIAMETER_AFFECTS.map((item) => (
                  <li key={item}>
                    <span aria-hidden="true">✓</span> {item}
                  </li>
                ))}
              </ul>
            </section>

            <section className="cmp-panel dia-sidebar-panel--popular-diameters">
              <h2 className="cmp-panel__title">Popular Tire Diameters</h2>
              <ul className="dia-popular-diameter-list">
                {POPULAR_TIRE_DIAMETERS.map((item) => (
                  <li key={item.diameterIn}>
                    <a
                      href={diameterLandingHref(item.diameterIn, wheelDiameter)}
                      className="dia-popular-diameter-row"
                    >
                      <span className="dia-popular-diameter-row__body">
                        <span className="dia-popular-diameter-row__title">{item.label}</span>
                        <span className="dia-popular-diameter-row__desc">{item.description}</span>
                      </span>
                      <span className="dia-popular-diameter-row__action" aria-hidden="true">
                        → Explore
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </section>

            <section className="cmp-panel dia-formula-panel">
              <h2 className="cmp-panel__title">Tire Diameter Formula</h2>
              <p className="dia-formula">D = ((W × A) / (100 × 25.4)) × 2 + R</p>
              <ul className="dia-formula-legend">
                <li><strong>W</strong> = Section width (mm)</li>
                <li><strong>A</strong> = Aspect ratio (%)</li>
                <li><strong>R</strong> = Wheel diameter (in)</li>
              </ul>
            </section>
          </aside>
        </div>
      </div>

      <StickyAnalyzeButton visible={stickyVisible} label="Find Matching Tire Sizes" onClick={runSearch} />
    </div>
  );
}
