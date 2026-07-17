/**
 * Deterministic reverse-search ranking for Tire Diameter Calculator matches.
 *
 * Ranking uses nominal size-to-size formula diameters from getTireSpecs /
 * the structured tire-size catalog — not product-model measured diameters.
 *
 * Tie-break order (ascending rank is better):
 * 1. Absolute nominal diameter difference from target (|Δ| small → first)
 * 2. Selected wheel-diameter match when a specific wheel is set
 *    (exact match → first; skipped when preferredWheel is "any"/unset)
 * 3. Production-size status from the product index
 *    (common production → limited production → indexed catalog only)
 * 4. Valid supported tire dimensions
 *    (positive width, sidewall, overall diameter, wheel → before invalid)
 * 5. Verified real tire-model count from the product index (higher → first)
 * 6. Lexical size string ascending (stable final tie-break)
 *
 * Vague popularity scores are intentionally not used.
 */
import {
  getDatabaseProductionLabel,
} from './size-production-status';
import { getExactSizeCoverage } from './exact-size-coverage';
import type { TireDiameterMatch } from './tire-diameter-search';

const EPSILON = 1e-9;

/** Preferred wheel for rank #2, or `any` / null when wheel is not constrained. */
export type PreferredWheel = number | 'any' | null;

export function isValidNominalDimensions(match: TireDiameterMatch): boolean {
  const { specs } = match;
  return (
    Number.isFinite(specs.overallDiameterIn) &&
    specs.overallDiameterIn > 0 &&
    Number.isFinite(specs.sectionWidthIn) &&
    specs.sectionWidthIn > 0 &&
    Number.isFinite(specs.sidewallIn) &&
    specs.sidewallIn > 0 &&
    Number.isFinite(specs.wheelDiameterIn) &&
    specs.wheelDiameterIn > 0
  );
}

function productionRank(size: string): number {
  const label = getDatabaseProductionLabel(size);
  if (label === 'Common production size') return 0;
  if (label === 'Limited production size') return 1;
  return 2;
}

function modelCount(size: string): number {
  return getExactSizeCoverage(size).uniqueModelCount;
}

export function compareDiameterMatches(
  a: TireDiameterMatch,
  b: TireDiameterMatch,
  preferredWheel?: PreferredWheel,
): number {
  const diffA = Math.abs(a.diameterDiffIn);
  const diffB = Math.abs(b.diameterDiffIn);
  if (Math.abs(diffA - diffB) > EPSILON) return diffA - diffB;

  if (preferredWheel != null && preferredWheel !== 'any') {
    const wheelA = Math.round(a.wheelDiameterIn) === preferredWheel ? 0 : 1;
    const wheelB = Math.round(b.wheelDiameterIn) === preferredWheel ? 0 : 1;
    if (wheelA !== wheelB) return wheelA - wheelB;
  }

  const prodA = productionRank(a.size);
  const prodB = productionRank(b.size);
  if (prodA !== prodB) return prodA - prodB;

  const validA = isValidNominalDimensions(a) ? 0 : 1;
  const validB = isValidNominalDimensions(b) ? 0 : 1;
  if (validA !== validB) return validA - validB;

  const modelsA = modelCount(a.size);
  const modelsB = modelCount(b.size);
  if (modelsA !== modelsB) return modelsB - modelsA;

  return a.size.localeCompare(b.size);
}

/** Rank matches for display. Does not invent sizes or alter formula diameters. */
export function rankDiameterMatches(
  matches: TireDiameterMatch[],
  preferredWheel?: PreferredWheel,
): TireDiameterMatch[] {
  return [...matches].sort((a, b) => compareDiameterMatches(a, b, preferredWheel));
}

/** Keep only matches within the user-selected maximum diameter difference. */
export function filterMatchesWithinTolerance(
  matches: TireDiameterMatch[],
  toleranceIn: number,
): TireDiameterMatch[] {
  return matches.filter((m) => Math.abs(m.diameterDiffIn) <= toleranceIn + EPSILON);
}

export type MatchStatusLabel =
  | 'Closest'
  | 'Exact'
  | 'Common production size';

export interface MatchStatusBadgeSet {
  /** At most one relationship badge (Exact or Closest). */
  relationship: Exclude<MatchStatusLabel, 'Common production size'> | null;
  /** Optional production badge. */
  production: 'Common production size' | null;
}

/**
 * Simplified match-card chips: Exact / Closest only for relationship,
 * plus optional production. Nearness phrases are omitted — rank + diff cover that.
 */
export function getMatchStatusBadges(
  match: TireDiameterMatch,
  _targetDiameterIn: number,
  rankIndex: number,
  _toleranceIn?: number,
): MatchStatusBadgeSet {
  const absDiff = Math.abs(match.diameterDiffIn);

  let relationship: MatchStatusBadgeSet['relationship'] = null;
  if (absDiff <= EPSILON) {
    relationship = 'Exact';
  } else if (rankIndex === 0) {
    relationship = 'Closest';
  }

  const production =
    getDatabaseProductionLabel(match.size) === 'Common production size'
      ? ('Common production size' as const)
      : null;

  return { relationship, production };
}

/** @deprecated Prefer getMatchStatusBadges — kept for callers that need a flat list. */
export function getMatchStatusLabels(
  match: TireDiameterMatch,
  targetDiameterIn: number,
  rankIndex: number,
  toleranceIn?: number,
): MatchStatusLabel[] {
  const badges = getMatchStatusBadges(match, targetDiameterIn, rankIndex, toleranceIn);
  const labels: MatchStatusLabel[] = [];
  if (badges.relationship) labels.push(badges.relationship);
  if (badges.production) labels.push(badges.production);
  return labels;
}
