/**
 * Geometry- and class-aware tire-size suggestions for hub pages.
 * Used for Equivalent Sizes, Popular Upgrades, and Related Sizes (main + sidebar).
 */

import { TIRE_SIZES, type TireCategory, type TireSizeEntry } from '../data/tire-sizes';
import {
  getTireSpecs,
  parseTireSize,
  type TireSpecs,
} from './tire-math';
import { tireSizePath } from './tire-size-url';
import { getTireSizeDataCoverage } from './tire-size-products';

export type TireSizeClass =
  | 'passenger_touring'
  | 'performance'
  | 'crossover_suv'
  | 'light_truck_suv'
  | 'off_road_truck';

export type TireSizeFamily = 'car' | 'truck';

export interface SizeSuggestion {
  size: string;
  diameterDiffPercent: number;
  diameterIn: number;
  widthMm: number;
  rimIn: number;
  sizeClass: TireSizeClass;
  href: string;
  relevanceScore: number;
}

export interface TireSizeSuggestions {
  equivalents: SizeSuggestion[];
  upgrades: SizeSuggestion[];
  related: SizeSuggestion[];
}

interface CandidateRow {
  entry: TireSizeEntry;
  specs: TireSpecs;
  sizeClass: TireSizeClass;
  diameterDiffPercent: number;
  widthDiffMm: number;
  rimDiffIn: number;
}

const EQUIVALENT_LIMIT = 6;
const UPGRADE_LIMIT = 6;
const RELATED_LIMIT = 5;

function percentDiameterDiff(base: TireSpecs, other: TireSpecs): number {
  return ((other.overallDiameterIn - base.overallDiameterIn) / base.overallDiameterIn) * 100;
}

export function getDiameterDeltaPercent(baseSize: string, candidateSize: string): number {
  return percentDiameterDiff(getTireSpecs(baseSize), getTireSpecs(candidateSize));
}

export function calculateTireMetrics(size: string): TireSpecs {
  return getTireSpecs(size);
}

export function familyForClass(sizeClass: TireSizeClass): TireSizeFamily {
  if (
    sizeClass === 'light_truck_suv' ||
    sizeClass === 'off_road_truck'
  ) {
    return 'truck';
  }
  return 'car';
}

/**
 * Deterministic size-class classifier. Prefer catalog category when present,
 * then fall back to geometry rules.
 */
export function classifyTireSize(
  size: string,
  categoryHint?: TireCategory | null,
): TireSizeClass {
  const specs = getTireSpecs(size);
  const parsed = parseTireSize(size);
  const isLt = /^LT/i.test(size.trim());
  const diameter = specs.overallDiameterIn;
  const { widthMm, aspectRatio, wheelDiameterIn } = parsed;

  const truckByGeometry =
    isLt ||
    diameter >= 31 ||
    (aspectRatio >= 65 && wheelDiameterIn >= 17 && widthMm >= 265);

  if (
    categoryHint === 'off-road' ||
    (truckByGeometry && (aspectRatio >= 70 || diameter >= 32.5 || widthMm >= 285))
  ) {
    return 'off_road_truck';
  }

  if (
    categoryHint === 'light-truck' ||
    truckByGeometry
  ) {
    return 'light_truck_suv';
  }

  if (categoryHint === 'performance' || (aspectRatio <= 45 && widthMm >= 225)) {
    return 'performance';
  }

  if (
    categoryHint === 'SUV' ||
    (diameter >= 28 && aspectRatio >= 55 && widthMm >= 225 && widthMm <= 265)
  ) {
    return 'crossover_suv';
  }

  if (diameter < 29 && widthMm <= 255) {
    if (aspectRatio <= 50) return 'performance';
    return 'passenger_touring';
  }

  if (categoryHint === 'passenger') return 'passenger_touring';
  return 'passenger_touring';
}

/**
 * Same family required. Different class within a family only when still very close.
 */
export function classesCompatible(
  baseClass: TireSizeClass,
  candidateClass: TireSizeClass,
  diameterDiffPercent: number,
  widthDiffMm: number,
): boolean {
  if (baseClass === candidateClass) return true;
  if (familyForClass(baseClass) !== familyForClass(candidateClass)) return false;
  return Math.abs(diameterDiffPercent) <= 2.0 && Math.abs(widthDiffMm) <= 20;
}

function classMismatchPenalty(
  baseClass: TireSizeClass,
  candidateClass: TireSizeClass,
): number {
  if (baseClass === candidateClass) return 0;
  if (familyForClass(baseClass) !== familyForClass(candidateClass)) return 1000;
  return 8;
}

function relevanceScore(
  baseClass: TireSizeClass,
  candidate: CandidateRow,
  hasProductData: boolean,
): number {
  return (
    Math.abs(candidate.diameterDiffPercent) * 3 +
    Math.abs(candidate.widthDiffMm) / 10 +
    Math.abs(candidate.rimDiffIn) * 2 +
    classMismatchPenalty(baseClass, candidate.sizeClass) +
    (hasProductData ? 0 : 1.5)
  );
}

function buildCandidates(baseSize: string): {
  baseEntry: TireSizeEntry;
  baseSpecs: TireSpecs;
  baseClass: TireSizeClass;
  rows: CandidateRow[];
} | null {
  const baseEntry = TIRE_SIZES.find(
    (e) => e.size.toUpperCase() === baseSize.toUpperCase(),
  );
  if (!baseEntry) return null;

  const baseSpecs = getTireSpecs(baseEntry.size);
  const baseClass = classifyTireSize(baseEntry.size, baseEntry.category);

  const rows: CandidateRow[] = [];
  for (const entry of TIRE_SIZES) {
    if (entry.size.toUpperCase() === baseEntry.size.toUpperCase()) continue;
    let specs: TireSpecs;
    try {
      specs = getTireSpecs(entry.size);
    } catch {
      continue;
    }
    const sizeClass = classifyTireSize(entry.size, entry.category);
    const diameterDiffPercent = percentDiameterDiff(baseSpecs, specs);
    const widthDiffMm = specs.widthMm - baseSpecs.widthMm;
    const rimDiffIn = specs.wheelDiameterIn - baseSpecs.wheelDiameterIn;
    rows.push({
      entry,
      specs,
      sizeClass,
      diameterDiffPercent,
      widthDiffMm,
      rimDiffIn,
    });
  }

  return { baseEntry, baseSpecs, baseClass, rows };
}

function toSuggestion(
  baseClass: TireSizeClass,
  row: CandidateRow,
): SizeSuggestion {
  const coverage = getTireSizeDataCoverage(row.entry.size);
  const hasProducts = coverage.productsIndexed > 0;
  return {
    size: row.entry.size,
    diameterDiffPercent: row.diameterDiffPercent,
    diameterIn: row.specs.overallDiameterIn,
    widthMm: row.specs.widthMm,
    rimIn: row.specs.wheelDiameterIn,
    sizeClass: row.sizeClass,
    href: tireSizePath(row.entry.size),
    relevanceScore: relevanceScore(baseClass, row, hasProducts),
  };
}

function isTruckFamily(sizeClass: TireSizeClass): boolean {
  return familyForClass(sizeClass) === 'truck';
}

/** Equivalent sizes: keep overall diameter close. */
export function getEquivalentSizes(
  baseSize: string,
  limit = EQUIVALENT_LIMIT,
): SizeSuggestion[] {
  const built = buildCandidates(baseSize);
  if (!built) return [];
  const { baseClass, rows } = built;

  return rows
    .filter((row) => {
      if (Math.abs(row.diameterDiffPercent) > 3.0) return false;
      if (Math.abs(row.rimDiffIn) > 2) return false;
      if (Math.abs(row.widthDiffMm) > 40) return false;
      return classesCompatible(
        baseClass,
        row.sizeClass,
        row.diameterDiffPercent,
        row.widthDiffMm,
      );
    })
    .sort((a, b) => {
      const d =
        Math.abs(a.diameterDiffPercent) - Math.abs(b.diameterDiffPercent);
      if (d !== 0) return d;
      return Math.abs(a.rimDiffIn) - Math.abs(b.rimDiffIn);
    })
    .slice(0, limit)
    .map((row) => toSuggestion(baseClass, row));
}

/** Popular upgrades: modestly larger, same-class-realistic jumps only. */
export function getPopularUpgrades(
  baseSize: string,
  limit = UPGRADE_LIMIT,
): SizeSuggestion[] {
  const built = buildCandidates(baseSize);
  if (!built) return [];
  const { baseClass, rows } = built;
  const truck = isTruckFamily(baseClass);

  const minDelta = truck ? 1.0 : 0.5;
  const maxDelta = truck ? 8.0 : 4.0;
  const maxWidthUp = truck ? 50 : 40;
  const minRimDiff = truck ? -1 : 0;
  const maxRimDiff = 2;

  return rows
    .filter((row) => {
      if (row.diameterDiffPercent <= 0) return false;
      if (row.diameterDiffPercent < minDelta || row.diameterDiffPercent > maxDelta) {
        return false;
      }
      if (row.widthDiffMm > maxWidthUp) return false;
      // Allow slight width decrease only for plus-sizing (taller rim / lower sidewall)
      if (row.widthDiffMm < -20) return false;
      if (row.rimDiffIn < minRimDiff || row.rimDiffIn > maxRimDiff) return false;
      if (!truck && row.rimDiffIn < 0) return false;
      return classesCompatible(
        baseClass,
        row.sizeClass,
        row.diameterDiffPercent,
        row.widthDiffMm,
      );
    })
    .sort((a, b) => {
      const scoreA = relevanceScore(baseClass, a, false);
      const scoreB = relevanceScore(baseClass, b, false);
      if (scoreA !== scoreB) return scoreA - scoreB;
      return a.diameterDiffPercent - b.diameterDiffPercent;
    })
    .slice(0, limit)
    .map((row) => toSuggestion(baseClass, row));
}

/** Related sizes: nearby / relevant, not necessarily equivalent. */
export function getRelatedSizes(
  baseSize: string,
  limit = RELATED_LIMIT,
): SizeSuggestion[] {
  const built = buildCandidates(baseSize);
  if (!built) return [];
  const { baseClass, rows } = built;

  const suggestions = rows
    .filter((row) => {
      if (Math.abs(row.diameterDiffPercent) > 6.0) return false;
      if (Math.abs(row.rimDiffIn) > 2) return false;
      if (Math.abs(row.widthDiffMm) > 50) return false;
      return classesCompatible(
        baseClass,
        row.sizeClass,
        row.diameterDiffPercent,
        row.widthDiffMm,
      );
    })
    .map((row) => toSuggestion(baseClass, row))
    .sort((a, b) => a.relevanceScore - b.relevanceScore);

  // Prefer variety: skip exact duplicates of the top upgrade/equivalent set order,
  // but keep score order. Exclude near-zero identity clones already filtered.
  return suggestions.slice(0, limit);
}

/** Popular downsizes: modestly smaller, same-class-realistic. */
export function getPopularDownsizes(
  baseSize: string,
  limit = UPGRADE_LIMIT,
): SizeSuggestion[] {
  const built = buildCandidates(baseSize);
  if (!built) return [];
  const { baseClass, rows } = built;
  const truck = isTruckFamily(baseClass);

  const minDelta = truck ? -8.0 : -4.0;
  const maxDelta = truck ? -1.0 : -0.5;
  const maxWidthDown = truck ? 50 : 40;
  const minRimDiff = -2;
  const maxRimDiff = truck ? 1 : 0;

  return rows
    .filter((row) => {
      if (row.diameterDiffPercent >= 0) return false;
      if (row.diameterDiffPercent < minDelta || row.diameterDiffPercent > maxDelta) {
        return false;
      }
      if (row.widthDiffMm < -maxWidthDown) return false;
      if (row.widthDiffMm > 20) return false;
      if (row.rimDiffIn < minRimDiff || row.rimDiffIn > maxRimDiff) return false;
      if (!truck && row.rimDiffIn > 0) return false;
      return classesCompatible(
        baseClass,
        row.sizeClass,
        row.diameterDiffPercent,
        row.widthDiffMm,
      );
    })
    .sort((a, b) => {
      const scoreA = relevanceScore(baseClass, a, false);
      const scoreB = relevanceScore(baseClass, b, false);
      if (scoreA !== scoreB) return scoreA - scoreB;
      return Math.abs(a.diameterDiffPercent) - Math.abs(b.diameterDiffPercent);
    })
    .slice(0, limit)
    .map((row) => toSuggestion(baseClass, row));
}

/** Bundle all suggestion sets for a size page. */
export function getTireSizeSuggestions(baseSize: string): TireSizeSuggestions {
  return {
    equivalents: getEquivalentSizes(baseSize),
    upgrades: getPopularUpgrades(baseSize),
    related: getRelatedSizes(baseSize),
  };
}
