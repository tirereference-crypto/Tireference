import { TIRE_SIZES, inferTireCategory, type TireCategory } from '../data/tire-sizes';
import { getPopularTireModels, type PopularTireModel } from '../data/tire-popular-models';
import { compareTires, getTireSpecs, type TireSpecs } from './tire-math';
import { comparisonPagePath } from './tire-size-url';

export interface UpgradePathSuggestion {
  size: string;
  diameterChangeIn: number;
  diameterChangePercent: number;
  fitmentNote: string;
  comparisonHref: string;
}

export interface SizeComparisonSuggestion {
  targetSize: string;
  label: string;
  diameterChangeIn: number;
  sidewallChangeIn: number;
  speedometerErrorPercent: number;
  comparisonHref: string;
}

export interface ExploreFurtherData {
  upgradePaths: UpgradePathSuggestion[];
  comparisons: SizeComparisonSuggestion[];
  popularTires: PopularTireModel[];
}

interface SizedCandidate {
  size: string;
  specs: TireSpecs;
  diameterDiffIn: number;
  diameterDiffPercent: number;
  sameWheel: boolean;
}

const INDICATED_SPEED = 60;

function normalizeSize(size: string): string {
  return size.trim().toUpperCase();
}

function buildFitmentNote(diameterDiffPercent: number, diameterDiffIn: number): string {
  const absPct = Math.abs(diameterDiffPercent);
  if (absPct <= 2.5) return 'Minimal fitment impact';
  if (absPct <= 5) return 'May require clearance check';
  if (diameterDiffIn >= 1.5 || absPct > 5) return 'Common off-road upgrade';
  return 'Significant fitment planning needed';
}

function formatSignedIn(value: number): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}"`;
}

function formatSignedPercent(value: number): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}%`;
}

function buildCandidates(baseSize: string, baseSpecs: TireSpecs): SizedCandidate[] {
  const baseKey = normalizeSize(baseSize);
  const seen = new Set<string>();

  const fromDataset = TIRE_SIZES.map((entry) => {
    const size = entry.size;
    const key = normalizeSize(size);
    if (key === baseKey || seen.has(key)) return null;
    seen.add(key);

    let specs: TireSpecs;
    try {
      specs = getTireSpecs(size);
    } catch {
      return null;
    }

    const diameterDiffIn = specs.overallDiameterIn - baseSpecs.overallDiameterIn;
    if (diameterDiffIn <= 0.05) return null;

    return {
      size,
      specs,
      diameterDiffIn,
      diameterDiffPercent: (diameterDiffIn / baseSpecs.overallDiameterIn) * 100,
      sameWheel: specs.wheelDiameterIn === baseSpecs.wheelDiameterIn,
    };
  }).filter((item): item is SizedCandidate => item !== null);

  fromDataset.sort((a, b) => {
    if (a.sameWheel !== b.sameWheel) return a.sameWheel ? -1 : 1;
    return a.diameterDiffIn - b.diameterDiffIn;
  });

  return fromDataset;
}

function pickTieredSizes(candidates: SizedCandidate[], count = 3): SizedCandidate[] {
  if (candidates.length === 0) return [];
  if (candidates.length <= count) return candidates;

  const indices =
    count === 1
      ? [0]
      : count === 2
        ? [0, candidates.length - 1]
        : [0, Math.floor(candidates.length / 2), candidates.length - 1];

  return indices.map((index) => candidates[index]);
}

function buildSyntheticFlotationUpgrade(
  baseSpecs: TireSpecs,
  existing: SizedCandidate[],
): SizedCandidate | null {
  if (baseSpecs.overallDiameterIn >= 34) return null;

  const targetDiameter = Math.min(37, Math.round((baseSpecs.overallDiameterIn + 1.8) * 10) / 10);
  const sectionWidth = Math.max(10.5, Math.round(baseSpecs.sectionWidthIn * 10) / 10);
  const wheel =
    baseSpecs.wheelDiameterIn % 1 === 0
      ? String(baseSpecs.wheelDiameterIn)
      : baseSpecs.wheelDiameterIn.toFixed(1);

  const flotation = `${targetDiameter}x${sectionWidth.toFixed(2)}${baseSpecs.construction}${wheel}`;

  try {
    const specs = getTireSpecs(flotation);
    const diameterDiffIn = specs.overallDiameterIn - baseSpecs.overallDiameterIn;
    const lastDiff = existing.at(-1)?.diameterDiffIn ?? 0;
    if (diameterDiffIn <= lastDiff + 0.05) return null;

    const alreadyListed = existing.some(
      (item) => normalizeSize(item.size) === normalizeSize(flotation),
    );
    if (alreadyListed) return null;

    return {
      size: flotation,
      specs,
      diameterDiffIn,
      diameterDiffPercent: (diameterDiffIn / baseSpecs.overallDiameterIn) * 100,
      sameWheel: specs.wheelDiameterIn === baseSpecs.wheelDiameterIn,
    };
  } catch {
    return null;
  }
}

function buildUpgradePaths(
  baseSize: string,
  baseSpecs: TireSpecs,
  candidates: SizedCandidate[],
): UpgradePathSuggestion[] {
  let picks = pickTieredSizes(candidates, 3);

  if (picks.length < 3) {
    const synthetic = buildSyntheticFlotationUpgrade(baseSpecs, picks);
    if (synthetic) picks = [...picks, synthetic];
  }

  return picks.slice(0, 3).map((item) => ({
    size: item.size,
    diameterChangeIn: item.diameterDiffIn,
    diameterChangePercent: item.diameterDiffPercent,
    fitmentNote: buildFitmentNote(item.diameterDiffPercent, item.diameterDiffIn),
    comparisonHref: comparisonPagePath(baseSize, item.size),
  }));
}

function buildComparisons(
  baseSize: string,
  baseSpecs: TireSpecs,
  upgradePaths: UpgradePathSuggestion[],
  allCandidates: SizedCandidate[],
): SizeComparisonSuggestion[] {
  const targets =
    upgradePaths.length >= 3
      ? upgradePaths.map((path) => path.size)
      : pickTieredSizes(allCandidates, 3).map((item) => item.size);

  return targets.slice(0, 3).map((targetSize) => {
    const cmp = compareTires(baseSize, targetSize, INDICATED_SPEED);
    const targetSpecs = getTireSpecs(targetSize);

    return {
      targetSize,
      label: `${baseSize} vs ${targetSize}`,
      diameterChangeIn: targetSpecs.overallDiameterIn - baseSpecs.overallDiameterIn,
      sidewallChangeIn: targetSpecs.sidewallIn - baseSpecs.sidewallIn,
      speedometerErrorPercent: cmp.speedometer.errorPercent,
      comparisonHref: comparisonPagePath(baseSize, targetSize),
    };
  });
}

export function buildExploreFurtherData(
  sizeLabel: string,
  specs: TireSpecs,
): ExploreFurtherData {
  const candidates = buildCandidates(sizeLabel, specs);
  const upgradePaths = buildUpgradePaths(sizeLabel, specs, candidates);
  const comparisons = buildComparisons(sizeLabel, specs, upgradePaths, candidates);
  const category = inferTireCategory(specs.widthMm, specs.aspectRatio, specs.wheelDiameterIn);

  return {
    upgradePaths,
    comparisons,
    popularTires: getPopularTireModels(sizeLabel, category),
  };
}

export function hasExploreFurtherContent(data: ExploreFurtherData): boolean {
  return data.upgradePaths.length > 0;
}

export { formatSignedIn, formatSignedPercent, buildFitmentNote };
