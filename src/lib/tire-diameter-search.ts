import {
  TIRE_CATEGORY_LABELS,
  TIRE_SIZES,
  type TireCategory,
} from '../data/tire-sizes';
import { MOST_SEARCHED_COMPARISON_PAIRS } from './tire-comparison-links';
import { getTireSpecs, type TireSpecs } from './tire-math';
import { hubPagePath } from './tire-size-url';
import { compareDiameterMatches } from './tire-diameter-ranking';

export const WHEEL_DIAMETER_OPTIONS = [15, 16, 17, 18, 20, 22] as const;
export type WheelDiameterOption = (typeof WHEEL_DIAMETER_OPTIONS)[number];

export const TOLERANCE_OPTIONS = [0.5, 1, 2, 3] as const;
export type ToleranceOption = (typeof TOLERANCE_OPTIONS)[number];

export type DiameterSearchCategoryBadge =
  | 'Daily Driving'
  | 'All Terrain'
  | 'Performance'
  | 'Off Road'
  | 'Towing';

export interface TireDiameterCatalogEntry {
  size: string;
  category: TireCategory;
  specs: TireSpecs;
  popularity: number;
}

export interface TireDiameterMatch {
  size: string;
  category: TireCategory;
  specs: TireSpecs;
  diameterIn: number;
  diameterDiffIn: number;
  diameterDiffPercent: number;
  wheelDiameterIn: number;
  categoryBadge: DiameterSearchCategoryBadge;
  hubHref: string;
  popularity: number;
}

export interface TireDiameterSearchParams {
  targetDiameterIn: number;
  wheelDiameterIn: number;
  toleranceIn: number;
}

export interface TireDiameterSearchResult {
  matches: TireDiameterMatch[];
  effectiveToleranceIn: number;
  widenedTolerance: boolean;
  suggestion?: string;
}

const MM_PER_INCH = 25.4;

/** Convert a user-entered diameter value into inches. Metric unit = millimetres. */
export function inchesFromUnit(value: number, unit: 'imperial' | 'metric'): number {
  return unit === 'metric' ? value / MM_PER_INCH : value;
}

/** Convert inches into the active display unit (inches or millimetres). */
export function valueFromInches(inches: number, unit: 'imperial' | 'metric'): number {
  return unit === 'metric' ? inches * MM_PER_INCH : inches;
}

/** Format a physical inch value for the active unit input/display. */
export function formatDiameterInputValue(
  inches: number,
  unit: 'imperial' | 'metric',
): string {
  if (!Number.isFinite(inches)) return '';
  if (unit === 'metric') {
    const mm = inches * MM_PER_INCH;
    return String(Math.round(mm * 10) / 10);
  }
  return String(Math.round(inches * 100) / 100);
}

/** Format a tolerance stored in inches for the active unit. */
export function formatToleranceLabel(
  toleranceIn: number,
  unit: 'imperial' | 'metric',
): string {
  if (unit === 'metric') {
    const mm = Math.round(toleranceIn * MM_PER_INCH);
    return `±${mm} mm`;
  }
  return `±${toleranceIn.toFixed(1)}"`;
}

export function unitShortLabel(unit: 'imperial' | 'metric'): string {
  return unit === 'metric' ? 'mm' : 'in';
}

export { MM_PER_INCH };

let catalogCache: TireDiameterCatalogEntry[] | null = null;
let popularityCache: Map<string, number> | null = null;

function buildPopularityMap(): Map<string, number> {
  if (popularityCache) return popularityCache;

  const scores = new Map<string, number>();
  MOST_SEARCHED_COMPARISON_PAIRS.forEach(([sizeA, sizeB], index) => {
    const weight = MOST_SEARCHED_COMPARISON_PAIRS.length - index;
    for (const size of [sizeA, sizeB]) {
      scores.set(size, (scores.get(size) ?? 0) + weight);
    }
  });

  TIRE_SIZES.forEach((entry, index) => {
    scores.set(entry.size, (scores.get(entry.size) ?? 0) + (TIRE_SIZES.length - index) * 0.1);
  });

  popularityCache = scores;
  return scores;
}

/** Memoized catalog — specs computed once per tire size in the dataset. */
export function getTireDiameterCatalog(): TireDiameterCatalogEntry[] {
  if (catalogCache) return catalogCache;

  const popularity = buildPopularityMap();
  catalogCache = TIRE_SIZES.map((entry) => ({
    size: entry.size,
    category: entry.category,
    specs: getTireSpecs(entry.size),
    popularity: popularity.get(entry.size) ?? 0,
  }));

  return catalogCache;
}

export function formatDiameterDiff(diffIn: number, targetIn: number): {
  signed: string;
  percent: string;
} {
  const sign = diffIn > 0 ? '+' : '';
  const pct = targetIn > 0 ? (diffIn / targetIn) * 100 : 0;
  const pctSign = pct > 0 ? '+' : '';
  return {
    signed: `${sign}${diffIn.toFixed(2)}"`,
    percent: `(${pctSign}${pct.toFixed(1)}%)`,
  };
}

export function getDiameterSearchCategoryBadge(
  category: TireCategory,
  specs: TireSpecs,
): DiameterSearchCategoryBadge {
  const { widthMm, aspectRatio, overallDiameterIn } = specs;

  if (category === 'performance' || aspectRatio <= 45) return 'Performance';
  if (category === 'off-road' || (overallDiameterIn >= 33 && aspectRatio >= 65)) {
    return overallDiameterIn >= 35 ? 'Off Road' : 'All Terrain';
  }
  if (category === 'light-truck' || (widthMm >= 265 && aspectRatio >= 60)) return 'Towing';
  if (category === 'SUV' && overallDiameterIn >= 31) return 'All Terrain';
  return 'Daily Driving';
}

function toMatch(
  entry: TireDiameterCatalogEntry,
  targetDiameterIn: number,
): TireDiameterMatch {
  const diameterIn = entry.specs.overallDiameterIn;
  const diameterDiffIn = diameterIn - targetDiameterIn;
  const diameterDiffPercent =
    targetDiameterIn > 0 ? (diameterDiffIn / targetDiameterIn) * 100 : 0;

  return {
    size: entry.size,
    category: entry.category,
    specs: entry.specs,
    diameterIn,
    diameterDiffIn,
    diameterDiffPercent,
    wheelDiameterIn: entry.specs.wheelDiameterIn,
    categoryBadge: getDiameterSearchCategoryBadge(entry.category, entry.specs),
    hubHref: hubPagePath(entry.size),
    popularity: entry.popularity,
  };
}

function filterMatches(
  params: TireDiameterSearchParams,
): TireDiameterMatch[] {
  const { targetDiameterIn, wheelDiameterIn, toleranceIn } = params;
  const catalog = getTireDiameterCatalog();

  return catalog
    .filter((entry) => {
      if (Math.round(entry.specs.wheelDiameterIn) !== wheelDiameterIn) return false;
      const diff = Math.abs(entry.specs.overallDiameterIn - targetDiameterIn);
      return diff <= toleranceIn;
    })
    .map((entry) => toMatch(entry, targetDiameterIn))
    .sort((a, b) => compareDiameterMatches(a, b, wheelDiameterIn));
}

/** Search with automatic tolerance widening — never returns an empty list when the catalog has wheel matches. */
export function searchTiresByDiameter(
  params: TireDiameterSearchParams,
): TireDiameterSearchResult {
  const tolerancesToTry = [
    params.toleranceIn,
    ...TOLERANCE_OPTIONS.filter((t) => t > params.toleranceIn),
  ];

  for (const toleranceIn of tolerancesToTry) {
    const matches = filterMatches({ ...params, toleranceIn });
    if (matches.length > 0) {
      const widenedTolerance = toleranceIn > params.toleranceIn;
      return {
        matches,
        effectiveToleranceIn: toleranceIn,
        widenedTolerance,
        suggestion: widenedTolerance
          ? `No exact matches within ±${params.toleranceIn}". Showing sizes within ±${toleranceIn}".`
          : undefined,
      };
    }
  }

  const catalog = getTireDiameterCatalog();
  const fallback = catalog
    .filter((entry) => Math.round(entry.specs.wheelDiameterIn) === params.wheelDiameterIn)
    .map((entry) => toMatch(entry, params.targetDiameterIn))
    .sort((a, b) => compareDiameterMatches(a, b, params.wheelDiameterIn))
    .slice(0, 8);

  return {
    matches: fallback,
    effectiveToleranceIn: TOLERANCE_OPTIONS[TOLERANCE_OPTIONS.length - 1],
    widenedTolerance: true,
    suggestion: `No exact matches found. Showing the closest ${params.wheelDiameterIn}" wheel sizes in our database.`,
  };
}

export function getCategoryLabel(category: TireCategory): string {
  return TIRE_CATEGORY_LABELS[category];
}
