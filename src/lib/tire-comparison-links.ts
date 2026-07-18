import { TIRE_SIZES } from '../data/tire-sizes';
import {
  canonicalComparisonPath,
  comparisonSlugFromSizes,
  getCanonicalComparisonPair,
  orderComparisonSizes,
  parseComparisonSlug as parseSharedComparisonSlug,
  tireSizeComparisonSlug,
} from './comparison-url';
import { fmtDiffWithPct, fmtPct, fmtSigned } from './tire-comparison-format';
import { getTireSpecs, compareTires } from './tire-math';
import { buildComparisonMeasurements } from './tire-comparison-engineering-analysis';
import { fieldsToTireSizeString, parseFullSizeToFields } from './tire-size-input';
import { buildTireSizeHubData, getTireSizeEntry } from './tire-size-hub';
import { getPremiumOverride } from './tire-size-premium-overrides';
import { isProductionTireSize } from './tire-size-validation';
import { isComparisonPublishable } from './tire-comparison-insights-core';
import {
  isValidComparison,
  isValidComparisonPair,
  type ComparisonLinkOptions,
  type ComparisonValidationOptions,
} from './tire-comparison-validation';
import {
  buildDatasetComparisonCandidates,
  rankComparisonCandidates,
  type ComparisonCandidateInput,
  type ComparisonCandidateSource,
} from './tire-comparison-relevance';
import { normalizeTireSize } from './tire-size-primitives';

export const POPULAR_COMPARISON_LIMIT = 6;

export interface PopularComparisonLink {
  current: string;
  new: string;
  label: string;
  href: string;
  priority: number;
}

export type UpgradePathDifficulty = 'Easy Fit' | 'Minor Checks Needed' | 'Verify Clearance';

export interface UpgradePathCard {
  id: 'current' | 'conservative' | 'moderate' | 'aggressive';
  size: string;
  tierLabel: string;
  diameterDiff: string;
  fitmentDifficulty: UpgradePathDifficulty | null;
  href: string | null;
}

export interface UpgradePathsData {
  cards: UpgradePathCard[];
}

/** Curated high-volume comparison pairs (Priority 1) — all sizes must exist in TIRE_SIZES. */
export const MOST_SEARCHED_COMPARISON_PAIRS: Array<[string, string]> = [
  ['225/45R17', '235/40R18'],
  ['275/70R18', '305/70R18'],
  ['265/70R17', '285/70R17'],
  ['205/55R16', '215/55R17'],
  ['285/70R17', '315/70R17'],
  ['275/70R18', '285/70R17'],
  ['275/65R18', '285/55R20'],
  ['225/65R17', '235/65R17'],
  ['265/65R18', '275/65R18'],
  ['235/55R18', '245/60R18'],
];

export {
  canonicalComparisonPath,
  comparisonSlugFromSizes,
  getCanonicalComparisonPair,
  orderComparisonSizes,
  tireSizeComparisonSlug as sizeToComparisonSlug,
};

export function comparisonSlugPath(
  sizeA: string,
  sizeB: string,
  options?: ComparisonValidationOptions,
): string | null {
  if (!isValidComparisonPair(sizeA, sizeB, options)) return null;
  return canonicalComparisonPath(sizeA, sizeB);
}

function isSameComparisonPair(
  sizeA: string,
  sizeB: string,
  pageCurrent: string,
  pageNew: string,
): boolean {
  return comparisonSlugFromSizes(sizeA, sizeB) ===
    comparisonSlugFromSizes(pageCurrent, pageNew);
}

function shouldEmitComparisonLink(
  sizeA: string,
  sizeB: string,
  options?: ComparisonLinkOptions,
): boolean {
  if (options?.excludePagePair) {
    const { current, new: pageNew } = options.excludePagePair;
    if (isSameComparisonPair(sizeA, sizeB, current, pageNew)) return false;
  }

  if (options?.requirePublished === false) return true;
  return isComparisonPublishable(sizeA, sizeB);
}

/** Structural + publishability gate for internal /compare/ links. */
export function publishedComparisonSlugPath(
  sizeA: string,
  sizeB: string,
  options?: ComparisonLinkOptions,
): string | null {
  if (!isValidComparisonPair(sizeA, sizeB, options)) return null;
  if (!shouldEmitComparisonLink(sizeA, sizeB, options)) return null;
  return canonicalComparisonPath(sizeA, sizeB);
}

function dedupePopularLinks(links: PopularComparisonLink[]): PopularComparisonLink[] {
  const seen = new Set<string>();
  return links.filter((link) => {
    if (seen.has(link.href)) return false;
    seen.add(link.href);
    return true;
  });
}

export function hasTireSizeHubPage(size: string): boolean {
  return !!getTireSizeEntry(size);
}

/** True when the three-field calculator inputs round-trip to this exact database size. */
export function isFieldBackedTireSize(size: string): boolean {
  const normalized = normalizeTireSize(size);
  if (!normalized || !isProductionTireSize(normalized)) return false;

  const fields = parseFullSizeToFields(normalized);
  if (!fields) return false;

  const rebuilt = fieldsToTireSizeString(fields);
  if (!rebuilt || !isProductionTireSize(rebuilt)) return false;

  return normalizeTireSize(rebuilt) === normalized;
}

export { isValidComparison, isValidComparisonPair } from './tire-comparison-validation';
export type { ComparisonLinkOptions, ComparisonValidationOptions } from './tire-comparison-validation';

/** Drop comparison links whose size pair fails structural validation. */
export function filterValidPopularComparisons(
  links: PopularComparisonLink[],
): PopularComparisonLink[] {
  return links.filter((link) => isValidComparisonPair(link.current, link.new));
}

/** Drop labeled comparison items (label: "A vs B") that fail structural validation. */
export function filterValidComparisonLabels<T extends { label: string }>(items: T[]): T[] {
  return items.filter((item) => {
    const [current, newSize] = item.label.split(' vs ');
    return Boolean(current && newSize && isValidComparisonPair(current, newSize));
  });
}

export function buildCuratedPopularComparisons(
  limit = 6,
  options?: ComparisonLinkOptions,
): PopularComparisonLink[] {
  const links: PopularComparisonLink[] = [];

  for (const [sizeA, sizeB] of MOST_SEARCHED_COMPARISON_PAIRS) {
    if (!isValidComparisonPair(sizeA, sizeB, options)) continue;
    const href = publishedComparisonSlugPath(sizeA, sizeB, options);
    if (!href) continue;
    const ordered = orderComparisonSizes(sizeA, sizeB);
    links.push({
      current: ordered.current,
      new: ordered.new,
      label: `${ordered.current} vs ${ordered.new}`,
      href,
      priority: 1,
    });
    if (links.length >= limit) break;
  }

  return filterValidPopularComparisons(links);
}

export function parseComparisonSlug(slug: string): { current: string; new: string } | null {
  const parsed = parseSharedComparisonSlug(slug);
  if (!parsed) return null;
  const { current, new: newSize } = parsed.canonical;
  if (!getTireSizeEntry(current) || !getTireSizeEntry(newSize)) return null;
  if (!isValidComparisonPair(current, newSize)) return null;
  return { current, new: newSize };
}

function fitmentDifficultyLabel(diamPct: number, widthPct: number): UpgradePathDifficulty {
  const risk = diamPct + Math.max(0, widthPct) * 0.25;
  if (risk < 2.5) return 'Easy Fit';
  if (risk < 4.5) return 'Minor Checks Needed';
  return 'Verify Clearance';
}

function addComparisonCandidateInput(
  inputs: ComparisonCandidateInput[],
  seen: Set<string>,
  current: string,
  newSize: string,
  source: ComparisonCandidateSource,
  options?: ComparisonValidationOptions,
): void {
  if (!isValidComparisonPair(current, newSize, options)) return;

  const key = `${normalizeTireSize(current)}|${normalizeTireSize(newSize)}`;
  if (seen.has(key)) return;
  seen.add(key);

  inputs.push({ target: newSize, sources: [source] });
}

function collectComparisonCandidateInputs(
  sizeA: string,
  options?: ComparisonValidationOptions,
): ComparisonCandidateInput[] {
  if (!isProductionTireSize(sizeA) || !hasTireSizeHubPage(sizeA)) return [];

  const hub = buildTireSizeHubData(sizeA);
  if (!hub) return [];

  const inputs: ComparisonCandidateInput[] = [];
  const seen = new Set<string>();
  const baseKey = normalizeTireSize(sizeA);

  for (const [a, b] of MOST_SEARCHED_COMPARISON_PAIRS) {
    if (normalizeTireSize(a) === baseKey) addComparisonCandidateInput(inputs, seen, a, b, 'curated', options);
    if (normalizeTireSize(b) === baseKey) addComparisonCandidateInput(inputs, seen, b, a, 'curated', options);
  }

  const override = getPremiumOverride(sizeA);
  for (const target of override?.popularComparisons ?? []) {
    addComparisonCandidateInput(inputs, seen, sizeA, target, 'override', options);
  }

  for (const path of hub.upgradePathsUp) {
    addComparisonCandidateInput(inputs, seen, sizeA, path.size, 'upgrade-up', options);
  }

  for (const path of hub.upgradePathsDown) {
    addComparisonCandidateInput(inputs, seen, sizeA, path.size, 'upgrade-down', options);
  }

  for (const equivalent of hub.equivalents.slice(0, 6)) {
    addComparisonCandidateInput(inputs, seen, sizeA, equivalent.size, 'equivalent', options);
  }

  for (const row of hub.quickComparisons) {
    addComparisonCandidateInput(inputs, seen, sizeA, row.size, 'quick-comparison', options);
  }

  for (const row of hub.performanceAlternatives.slice(0, 4)) {
    addComparisonCandidateInput(inputs, seen, sizeA, row.size, 'performance-alt', options);
  }

  for (const row of hub.offRoadAlternatives.slice(0, 4)) {
    addComparisonCandidateInput(inputs, seen, sizeA, row.size, 'offroad-alt', options);
  }

  const exclude = new Set(inputs.map((item) => item.target));
  inputs.push(...buildDatasetComparisonCandidates(sizeA, hub.entry.category, exclude));

  return inputs;
}

export function buildPopularComparisonsForSize(
  sizeA: string,
  limit = POPULAR_COMPARISON_LIMIT,
  options?: ComparisonLinkOptions,
): PopularComparisonLink[] {
  const inputs = collectComparisonCandidateInputs(sizeA, options);
  if (inputs.length === 0) return [];

  const ranked = rankComparisonCandidates(sizeA, inputs, limit * 2);

  return dedupePopularLinks(
    filterValidPopularComparisons(
      ranked
        .map((item, index) => {
          const href = publishedComparisonSlugPath(sizeA, item.target, options);
          if (!href) return null;
          const ordered = orderComparisonSizes(sizeA, item.target);
          return {
            current: ordered.current,
            new: ordered.new,
            label: `${ordered.current} vs ${ordered.new}`,
            href,
            priority: index + 1,
          };
        })
        .filter((link): link is PopularComparisonLink => link !== null),
    ).slice(0, limit),
  );
}

export function buildUpgradePathsFromDatabase(
  sizeA: string,
  options?: ComparisonLinkOptions,
): UpgradePathsData | null {
  if (!isProductionTireSize(sizeA) || !hasTireSizeHubPage(sizeA)) return null;

  const hub = buildTireSizeHubData(sizeA);
  if (!hub) return null;

  const specsA = getTireSpecs(sizeA);
  const upgrades = hub.upgradePathsUp
    .filter((path) => isValidComparisonPair(sizeA, path.size, options))
    .slice(0, 3);

  if (upgrades.length < 3) return null;

  const tierMeta = [
    { id: 'conservative' as const, tierLabel: 'Conservative Upgrade' },
    { id: 'moderate' as const, tierLabel: 'Moderate Upgrade' },
    { id: 'aggressive' as const, tierLabel: 'Aggressive Upgrade' },
  ];

  const cards: UpgradePathCard[] = [
    {
      id: 'current',
      size: sizeA,
      tierLabel: 'Current Size',
      diameterDiff: 'Baseline',
      fitmentDifficulty: null,
      href: null,
    },
    ...upgrades.map((path, index) => {
      const specsB = getTireSpecs(path.size);
      const comparison = compareTires(sizeA, path.size, 60);
      const measurements = buildComparisonMeasurements(sizeA, path.size, comparison, specsA, specsB);

      return {
        id: tierMeta[index].id,
        size: path.size,
        tierLabel: tierMeta[index].tierLabel,
        diameterDiff: fmtDiffWithPct(measurements.diamDiffIn, comparison.diameterDiffPercent),
        fitmentDifficulty: fitmentDifficultyLabel(
          comparison.diameterDiffPercent,
          measurements.widthPct,
        ),
        href: publishedComparisonSlugPath(sizeA, path.size, options),
      };
    }),
  ];

  return { cards };
}

export function getAllComparisonSlugs(
  options?: ComparisonLinkOptions,
): Array<{ slug: string; current: string; new: string }> {
  const requirePublished = options?.requirePublished !== false;
  const seen = new Set<string>();
  const results: Array<{ slug: string; current: string; new: string }> = [];

  for (let firstIndex = 0; firstIndex < TIRE_SIZES.length; firstIndex++) {
    for (let secondIndex = firstIndex + 1; secondIndex < TIRE_SIZES.length; secondIndex++) {
      const entryA = TIRE_SIZES[firstIndex];
      const entryB = TIRE_SIZES[secondIndex];

      const href = requirePublished
        ? publishedComparisonSlugPath(entryA.size, entryB.size, {
            ...options,
            excludePagePair: undefined,
          })
        : comparisonSlugPath(entryA.size, entryB.size, options);
      if (!href) continue;

      const ordered = orderComparisonSizes(entryA.size, entryB.size);
      const slug = comparisonSlugFromSizes(ordered.current, ordered.new);
      if (seen.has(slug)) continue;
      seen.add(slug);
      results.push({ slug, current: ordered.current, new: ordered.new });
    }
  }

  return results;
}

/** Pair counts for legacy-only vs full validation (used in tests and build reports). */
export function getComparisonPairCounts(): { legacy: number; full: number } {
  const legacy = getAllComparisonSlugs({ skipDimensional: true, requirePublished: false }).length;
  const full = getAllComparisonSlugs({ requirePublished: false }).length;
  return { legacy, full };
}
