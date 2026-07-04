/**
 * Relevance scoring for internal comparison link suggestions.
 *
 * Prioritizes: similar overall diameter, similar wheel diameter, same category,
 * shared vehicle applications, and documented upgrade paths — after structural
 * validation passes.
 */
import { TIRE_SIZES, type TireCategory } from '../data/tire-sizes';
import { getVehicleFitment } from '../data/vehicle-fitment';
import { getTireSpecs, type TireSpecs } from './tire-math';
import { getTireSizeEntry } from './tire-size-hub';
import { isValidComparison } from './tire-comparison-validation';

export type ComparisonCandidateSource =
  | 'curated'
  | 'override'
  | 'upgrade-up'
  | 'upgrade-down'
  | 'equivalent'
  | 'quick-comparison'
  | 'performance-alt'
  | 'offroad-alt'
  | 'dataset';

export interface ComparisonCandidateInput {
  target: string;
  sources: ComparisonCandidateSource[];
}

export interface ScoredComparisonCandidate {
  target: string;
  score: number;
  sources: ComparisonCandidateSource[];
}

/** Minimum relevance score to surface a comparison link. */
export const MIN_COMPARISON_RELEVANCE_SCORE = 22;

const SOURCE_BONUS: Record<ComparisonCandidateSource, number> = {
  curated: 18,
  override: 14,
  'upgrade-up': 16,
  'upgrade-down': 12,
  equivalent: 10,
  'quick-comparison': 6,
  'performance-alt': 4,
  'offroad-alt': 4,
  dataset: 0,
};

function diameterDiffPct(specsA: TireSpecs, specsB: TireSpecs): number {
  const pctFromA =
    (Math.abs(specsB.overallDiameterIn - specsA.overallDiameterIn) / specsA.overallDiameterIn) *
    100;
  const pctFromB =
    (Math.abs(specsA.overallDiameterIn - specsB.overallDiameterIn) / specsB.overallDiameterIn) *
    100;
  return Math.max(pctFromA, pctFromB);
}

function vehicleFitmentOverlap(sizeA: string, sizeB: string): boolean {
  const keysA = new Set(
    getVehicleFitment(sizeA).map((v) => `${v.manufacturer}|${v.model}`.toLowerCase()),
  );
  if (keysA.size === 0) return false;
  return getVehicleFitment(sizeB).some((v) =>
    keysA.has(`${v.manufacturer}|${v.model}`.toLowerCase()),
  );
}

function scoreDiameterSimilarity(diamPct: number): number {
  if (diamPct <= 1) return 40;
  if (diamPct <= 2) return 34;
  if (diamPct <= 3) return 28;
  if (diamPct <= 4) return 22;
  if (diamPct <= 6) return 14;
  if (diamPct <= 8) return 6;
  return 0;
}

function scoreWheelSimilarity(wheelDiffIn: number): number {
  if (wheelDiffIn === 0) return 25;
  if (wheelDiffIn <= 1) return 16;
  if (wheelDiffIn <= 2) return 8;
  return 0;
}

function scoreWidthSimilarity(widthDiffMm: number): number {
  const abs = Math.abs(widthDiffMm);
  if (abs <= 5) return 8;
  if (abs <= 15) return 5;
  if (abs <= 30) return 2;
  return 0;
}

/** Score how useful sizeB is as a comparison target for sizeA. */
export function scoreComparisonRelevance(
  sizeA: string,
  sizeB: string,
  sources: ComparisonCandidateSource[] = [],
): number {
  if (!isValidComparison(sizeA, sizeB).valid) return Number.NEGATIVE_INFINITY;

  const entryA = getTireSizeEntry(sizeA);
  const entryB = getTireSizeEntry(sizeB);
  if (!entryA || !entryB) return Number.NEGATIVE_INFINITY;

  const specsA = getTireSpecs(sizeA);
  const specsB = getTireSpecs(sizeB);

  let score = 10;

  score += scoreDiameterSimilarity(diameterDiffPct(specsA, specsB));
  score += scoreWheelSimilarity(Math.abs(specsB.wheelDiameterIn - specsA.wheelDiameterIn));
  score += scoreWidthSimilarity(specsB.widthMm - specsA.widthMm);

  if (entryA.category === entryB.category) {
    score += 8;
  }

  if (vehicleFitmentOverlap(sizeA, sizeB)) {
    score += 10;
  }

  for (const source of sources) {
    score += SOURCE_BONUS[source] ?? 0;
  }

  return score;
}

function mergeCandidates(inputs: ComparisonCandidateInput[]): Map<string, ComparisonCandidateSource[]> {
  const merged = new Map<string, Set<ComparisonCandidateSource>>();

  for (const { target, sources } of inputs) {
    if (!merged.has(target)) merged.set(target, new Set());
    for (const source of sources) {
      merged.get(target)!.add(source);
    }
  }

  return new Map(
    [...merged.entries()].map(([target, sourceSet]) => [target, [...sourceSet]]),
  );
}

/** Rank comparison targets for a base size; drops low-scoring and invalid pairs. */
export function rankComparisonCandidates(
  baseSize: string,
  inputs: ComparisonCandidateInput[],
  limit: number,
): ScoredComparisonCandidate[] {
  const merged = mergeCandidates(inputs);

  const ranked = [...merged.entries()]
    .map(([target, sources]) => ({
      target,
      sources,
      score: scoreComparisonRelevance(baseSize, target, sources),
    }))
    .filter((item) => item.score >= MIN_COMPARISON_RELEVANCE_SCORE)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.target.localeCompare(b.target);
    });

  return ranked.slice(0, limit).map(({ target, score, sources }) => ({
    target,
    score,
    sources,
  }));
}

/** Same-category dataset scan — fallback when curated paths do not fill the limit. */
export function buildDatasetComparisonCandidates(
  baseSize: string,
  category: TireCategory,
  exclude: Set<string>,
): ComparisonCandidateInput[] {
  const candidates: ComparisonCandidateInput[] = [];

  for (const entry of TIRE_SIZES) {
    if (entry.size === baseSize || entry.category !== category) continue;
    if (exclude.has(entry.size)) continue;
    if (!isValidComparison(baseSize, entry.size).valid) continue;
    candidates.push({ target: entry.size, sources: ['dataset'] });
  }

  const specsA = getTireSpecs(baseSize);

  return candidates
    .map((candidate) => ({
      candidate,
      score: scoreComparisonRelevance(baseSize, candidate.target, ['dataset']),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 12)
    .map(({ candidate }) => candidate);
}
