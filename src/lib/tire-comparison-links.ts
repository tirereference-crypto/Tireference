import { TIRE_SIZES } from '../data/tire-sizes';
import { getTireSpecs } from './tire-math';
import { fieldsToTireSizeString, parseFullSizeToFields } from './tire-size-input';
import { buildTireSizeHubData, getTireSizeEntry } from './tire-size-hub';
import { getPremiumOverride } from './tire-size-premium-overrides';
import { isProductionTireSize, normalizeTireSizeKey } from './tire-size-validation';

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
  ['285/70R17', '285/75R16'],
  ['275/70R18', '285/70R17'],
  ['275/65R18', '285/65R20'],
  ['225/65R17', '235/65R17'],
  ['265/65R18', '275/65R18'],
  ['235/55R18', '245/60R18'],
];

function fmtPct(n: number): string {
  const sign = n > 0 ? '+' : '';
  return `${sign}${n.toFixed(2)}%`;
}

function fmtSigned(n: number, digits = 2, suffix = '') {
  const sign = n > 0 ? '+' : '';
  return `${sign}${n.toFixed(digits)}${suffix}`;
}

function fmtDiffWithPct(signedIn: number, pct: number): string {
  return `${fmtSigned(signedIn, 2, '"')} (${fmtPct(pct)})`;
}

export function sizeToComparisonSlug(size: string): string {
  const normalized = size.trim().toUpperCase();
  const lt = normalized.startsWith('LT');
  const body = lt ? normalized.slice(2) : normalized.startsWith('P') ? normalized.slice(1) : normalized;
  const match = body.match(/^(\d+)\/(\d+)R(\d+(?:\.\d+)?)$/);
  if (!match) {
    return normalized.toLowerCase().replace(/\//g, '-');
  }
  const [, width, aspect, wheel] = match;
  const prefix = lt ? 'lt-' : '';
  return `${prefix}${width}-${aspect}-r${wheel}`.toLowerCase();
}

export function comparisonSlugFromSizes(sizeA: string, sizeB: string): string {
  return `${sizeToComparisonSlug(sizeA)}-vs-${sizeToComparisonSlug(sizeB)}`;
}

export function comparisonSlugPath(sizeA: string, sizeB: string): string {
  return `/compare/${comparisonSlugFromSizes(sizeA, sizeB)}`;
}

function comparisonSlugToSize(slug: string): string | null {
  const normalized = slug.trim().toLowerCase();
  const lt = normalized.startsWith('lt-');
  const body = lt ? normalized.slice(3) : normalized;
  const match = body.match(/^(\d+)-(\d+)-r(\d+(?:\.\d+)?)$/);
  if (!match) return null;

  const [, width, aspect, wheel] = match;
  const candidate = `${lt ? 'LT' : ''}${width}/${aspect}R${wheel}`;
  const entry = getTireSizeEntry(candidate);
  return entry?.size ?? null;
}

export function hasTireSizeHubPage(size: string): boolean {
  return !!getTireSizeEntry(size);
}

/** True when the three-field calculator inputs round-trip to this exact database size. */
export function isFieldBackedTireSize(size: string): boolean {
  if (!isProductionTireSize(size)) return false;

  const fields = parseFullSizeToFields(size);
  if (!fields) return false;

  const rebuilt = fieldsToTireSizeString(fields);
  if (!rebuilt || !isProductionTireSize(rebuilt)) return false;

  return normalizeTireSizeKey(rebuilt) === normalizeTireSizeKey(size);
}

export function isValidComparisonPair(sizeA: string, sizeB: string): boolean {
  const keyA = normalizeTireSizeKey(sizeA);
  const keyB = normalizeTireSizeKey(sizeB);
  if (!keyA || !keyB || keyA === keyB) return false;
  if (!isProductionTireSize(sizeA) || !isProductionTireSize(sizeB)) return false;
  if (!isFieldBackedTireSize(sizeA) || !isFieldBackedTireSize(sizeB)) return false;
  if (!hasTireSizeHubPage(sizeA) || !hasTireSizeHubPage(sizeB)) return false;

  try {
    getTireSpecs(sizeA);
    getTireSpecs(sizeB);
    return true;
  } catch {
    return false;
  }
}

export function buildCuratedPopularComparisons(limit = 6): PopularComparisonLink[] {
  const links: PopularComparisonLink[] = [];

  for (const [sizeA, sizeB] of MOST_SEARCHED_COMPARISON_PAIRS) {
    if (!isValidComparisonPair(sizeA, sizeB)) continue;
    links.push({
      current: sizeA,
      new: sizeB,
      label: `${sizeA} vs ${sizeB}`,
      href: comparisonSlugPath(sizeA, sizeB),
      priority: 1,
    });
    if (links.length >= limit) break;
  }

  return links;
}

export function parseComparisonSlug(slug: string): { current: string; new: string } | null {
  const marker = '-vs-';
  const lower = slug.toLowerCase();
  const vsIndex = lower.indexOf(marker);
  if (vsIndex === -1) return null;

  const current = comparisonSlugToSize(slug.slice(0, vsIndex));
  const newSize = comparisonSlugToSize(slug.slice(vsIndex + marker.length));
  if (!current || !newSize || !isValidComparisonPair(current, newSize)) return null;

  return { current, new: newSize };
}

function fitmentDifficultyLabel(diamPct: number, widthPct: number): UpgradePathDifficulty {
  const risk = diamPct + Math.max(0, widthPct) * 0.25;
  if (risk < 2.5) return 'Easy Fit';
  if (risk < 4.5) return 'Minor Checks Needed';
  return 'Verify Clearance';
}

function addComparisonCandidate(
  candidates: PopularComparisonLink[],
  seen: Set<string>,
  current: string,
  newSize: string,
  priority: number,
): void {
  if (!isValidComparisonPair(current, newSize)) return;

  const key = `${normalizeTireSizeKey(current)}|${normalizeTireSizeKey(newSize)}`;
  if (seen.has(key)) return;
  seen.add(key);

  candidates.push({
    current,
    new: newSize,
    label: `${current} vs ${newSize}`,
    href: comparisonSlugPath(current, newSize),
    priority,
  });
}

export function buildPopularComparisonsForSize(sizeA: string): PopularComparisonLink[] {
  if (!isProductionTireSize(sizeA) || !hasTireSizeHubPage(sizeA)) return [];

  const hub = buildTireSizeHubData(sizeA);
  if (!hub) return [];

  const candidates: PopularComparisonLink[] = [];
  const seen = new Set<string>();
  const baseKey = normalizeTireSizeKey(sizeA);

  for (const [a, b] of MOST_SEARCHED_COMPARISON_PAIRS) {
    if (normalizeTireSizeKey(a) === baseKey) addComparisonCandidate(candidates, seen, a, b, 1);
    if (normalizeTireSizeKey(b) === baseKey) addComparisonCandidate(candidates, seen, b, a, 1);
  }

  const override = getPremiumOverride(sizeA);
  for (const target of override?.popularComparisons ?? []) {
    addComparisonCandidate(candidates, seen, sizeA, target, 1);
  }

  for (const path of hub.upgradePathsUp) {
    addComparisonCandidate(candidates, seen, sizeA, path.size, 2);
  }

  for (const path of hub.upgradePathsDown) {
    addComparisonCandidate(candidates, seen, sizeA, path.size, 3);
  }

  for (const equivalent of hub.equivalents.slice(0, 6)) {
    addComparisonCandidate(candidates, seen, sizeA, equivalent.size, 4);
  }

  for (const row of hub.quickComparisons) {
    addComparisonCandidate(candidates, seen, sizeA, row.size, 5);
  }

  for (const row of hub.performanceAlternatives.slice(0, 4)) {
    addComparisonCandidate(candidates, seen, sizeA, row.size, 5);
  }

  for (const row of hub.offRoadAlternatives.slice(0, 4)) {
    addComparisonCandidate(candidates, seen, sizeA, row.size, 5);
  }

  return candidates
    .sort((a, b) => a.priority - b.priority || a.label.localeCompare(b.label))
    .slice(0, 6);
}

export function buildUpgradePathsFromDatabase(sizeA: string): UpgradePathsData | null {
  if (!isProductionTireSize(sizeA) || !hasTireSizeHubPage(sizeA)) return null;

  const hub = buildTireSizeHubData(sizeA);
  if (!hub) return null;

  const specsA = getTireSpecs(sizeA);
  const upgrades = hub.upgradePathsUp
    .filter((path) => isValidComparisonPair(sizeA, path.size))
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
      const diamDiffIn = specsB.overallDiameterIn - specsA.overallDiameterIn;
      const diamPct = path.diameterDiffPercent;
      const widthPct = ((specsB.widthMm - specsA.widthMm) / specsA.widthMm) * 100;

      return {
        id: tierMeta[index].id,
        size: path.size,
        tierLabel: tierMeta[index].tierLabel,
        diameterDiff: fmtDiffWithPct(diamDiffIn, diamPct),
        fitmentDifficulty: fitmentDifficultyLabel(diamPct, widthPct),
        href: comparisonSlugPath(sizeA, path.size),
      };
    }),
  ];

  return { cards };
}

export function getAllComparisonSlugs(): Array<{ slug: string; current: string; new: string }> {
  const seen = new Set<string>();
  const results: Array<{ slug: string; current: string; new: string }> = [];

  const addPair = (current: string, newSize: string) => {
    if (!isValidComparisonPair(current, newSize)) return;
    const slug = comparisonSlugFromSizes(current, newSize);
    if (seen.has(slug)) return;
    seen.add(slug);
    results.push({ slug, current, new: newSize });
  };

  for (const [a, b] of MOST_SEARCHED_COMPARISON_PAIRS) {
    addPair(a, b);
    addPair(b, a);
  }

  for (const entry of TIRE_SIZES) {
    for (const link of buildPopularComparisonsForSize(entry.size)) {
      addPair(link.current, link.new);
    }

    const paths = buildUpgradePathsFromDatabase(entry.size);
    for (const card of paths?.cards ?? []) {
      if (card.href && card.id !== 'current') {
        addPair(entry.size, card.size);
      }
    }
  }

  return results;
}
