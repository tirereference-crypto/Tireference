import {
  TIRE_SIZES,
  TIRE_CATEGORY_LABELS,
  type TireCategory,
  type TireSizeEntry,
} from '../data/tire-sizes';
import {
  getVehicleFitment,
  getFitmentIntro,
  type VehicleFitment,
} from '../data/vehicle-fitment';
import {
  compareTires,
  getTireSpecs,
  metricToFlotation,
  type TireSpecs,
} from './tire-math';
import { hubPagePath } from './tire-size-url';
import { comparisonPagePath } from './tire-comparison-paths';
import { isValidComparisonPair } from './tire-comparison-validation';
import { resolveTireRatings, type ResolvedTireRatings } from './tire-ratings';
import type { StatDisplay } from './calculator-types';
import { formatTireSizeResults } from './format-tire-display';
import {
  buildCategoryIntro,
  buildHeroHighlights,
  buildPremiumSpecCards,
  buildSummaryBar,
  buildTypicalUses,
  shortenHubIntro,
  type HeroHighlight,
  type PremiumSpecCard,
  type SummaryBarItem,
} from './tire-size-hub-content';
import { getExpertIntroForTireSize } from './tire-size-expert-intro';
import { buildSearchableFaq } from './tire-size-searchable-faq';
import {
  buildProductDataFaqs,
  getTireSizeDataCoverage,
} from './tire-size-products';
import {
  getEquivalentSizes,
  getPopularDownsizes,
  getPopularUpgrades,
  type SizeSuggestion,
} from './tire-size-suggestions';

export interface SizedEntry {
  entry: TireSizeEntry;
  specs: TireSpecs;
}

export interface EquivalentSize {
  size: string;
  diameterDiffPercent: number;
  diameterIn: number;
  href: string;
}

export interface PlusMinusSize {
  size: string;
  diameterIn: number;
  href: string;
}

export interface QuickComparisonRow {
  size: string;
  diameterIn: number;
  widthMm: number;
  speedoErrorPercent: number;
  href: string;
  comparisonHref: string | null;
}

export interface HubFaqItem {
  question: string;
  answer: string;
}

export type UpgradeTier = 'mild' | 'moderate' | 'aggressive';

export interface UpgradePathOption {
  tier: UpgradeTier;
  direction: 'up' | 'down';
  size: string;
  diameterDiffPercent: number;
  speedoErrorPercent: number;
  groundClearanceChangeIn: number;
  href: string;
  comparisonHref: string | null;
}

export interface RealWorldImpact {
  referenceSize: string;
  explanations: string[];
  speedoErrorPercent: number;
  groundClearanceChangeIn: number;
  sidewallDiffIn: number;
  widthDiffMm: number;
}

export interface RelatedSizeLink {
  size: string;
  diameterIn: number;
  diameterDiffPercent: number;
  href: string;
}

export interface TireSizeHubData {
  entry: TireSizeEntry;
  specs: TireSpecs;
  displaySize: string;
  categoryLabel: string;
  ratings: ResolvedTireRatings | null;
  intro: string;
  heroHighlights: HeroHighlight[];
  summaryBar: SummaryBarItem[];
  premiumSpecCards: PremiumSpecCard[];
  typicalUses: string[];
  imperialStats: StatDisplay[];
  metricStats: StatDisplay[];
  flotation: string;
  equivalents: EquivalentSize[];
  plusOne: PlusMinusSize | null;
  minusOne: PlusMinusSize | null;
  upgradePathsUp: UpgradePathOption[];
  upgradePathsDown: UpgradePathOption[];
  realWorldImpact: RealWorldImpact | null;
  quickComparisons: QuickComparisonRow[];
  sameWidthSizes: RelatedSizeLink[];
  sameWheelSizes: RelatedSizeLink[];
  performanceAlternatives: RelatedSizeLink[];
  offRoadAlternatives: RelatedSizeLink[];
  vehicleFitment: VehicleFitment[];
  fitmentIntro: string;
  faq: HubFaqItem[];
}

const LINK_LIMIT = 8;
const TIER_ORDER: UpgradeTier[] = ['mild', 'moderate', 'aggressive'];

function percentDiameterDiff(base: TireSpecs, other: TireSpecs): number {
  return (
    ((other.overallDiameterIn - base.overallDiameterIn) /
      base.overallDiameterIn) *
    100
  );
}

function buildSizedEntries(): SizedEntry[] {
  return TIRE_SIZES.map((entry) => ({
    entry,
    specs: getTireSpecs(entry.size),
  }));
}

let cachedSizedEntries: SizedEntry[] | null = null;

function getSizedEntries(): SizedEntry[] {
  if (!cachedSizedEntries) {
    cachedSizedEntries = buildSizedEntries().sort(
      (a, b) => a.specs.overallDiameterIn - b.specs.overallDiameterIn,
    );
  }
  return cachedSizedEntries;
}

export function getTireSizeEntry(size: string): TireSizeEntry | undefined {
  return TIRE_SIZES.find(
    (e) => e.size.toUpperCase() === size.toUpperCase(),
  );
}

function formatDisplaySize(size: string): string {
  return size.replace(/^lt/i, 'LT').replace(/^p/i, 'P');
}

function toRelatedLink(
  baseSpecs: TireSpecs,
  entry: TireSizeEntry,
  specs: TireSpecs,
): RelatedSizeLink {
  return {
    size: entry.size,
    diameterIn: specs.overallDiameterIn,
    diameterDiffPercent: percentDiameterDiff(baseSpecs, specs),
    href: hubPagePath(entry.size),
  };
}

/** Map geometry-aware suggestions into upgrade path options for hub consumers. */
function suggestionsToUpgradePaths(
  baseSize: string,
  suggestions: SizeSuggestion[],
  direction: 'up' | 'down',
): UpgradePathOption[] {
  return suggestions.map((s, idx) => {
    const cmp = compareTires(baseSize, s.size, 60);
    const comparisonHref = isValidComparisonPair(baseSize, s.size)
      ? comparisonPagePath(baseSize, s.size)
      : null;
    return {
      tier: TIER_ORDER[Math.min(idx, TIER_ORDER.length - 1)],
      direction,
      size: s.size,
      diameterDiffPercent: s.diameterDiffPercent,
      speedoErrorPercent: cmp.speedometer.errorPercent,
      groundClearanceChangeIn: cmp.groundClearanceChangeIn,
      href: s.href,
      comparisonHref,
    };
  });
}

function buildRealWorldImpact(
  size: string,
  specs: TireSpecs,
  reference: SizedEntry | null,
): RealWorldImpact | null {
  if (!reference) return null;

  const ref = reference.entry.size;
  const refSpecs = reference.specs;
  const cmp = compareTires(ref, size, 60);
  const explanations: string[] = [];

  const gc = cmp.groundClearanceChangeIn;
  if (Math.abs(gc) >= 0.05) {
    explanations.push(
      `${formatDisplaySize(size)} ${gc > 0 ? 'increases' : 'reduces'} ground clearance by approximately ${Math.abs(gc).toFixed(2)} in compared with ${formatDisplaySize(ref)}.`,
    );
  }

  const widthDiff = specs.widthMm - refSpecs.widthMm;
  if (Math.abs(widthDiff) >= 5) {
    explanations.push(
      widthDiff > 0
        ? `This wider tread (${specs.sectionWidthIn.toFixed(2)} in vs ${refSpecs.sectionWidthIn.toFixed(2)} in) may provide additional traction but could increase steering effort.`
        : `A narrower section (${specs.sectionWidthIn.toFixed(2)} in vs ${refSpecs.sectionWidthIn.toFixed(2)} in) may reduce rolling resistance with slightly less dry grip.`,
    );
  }

  const swDiff = specs.sidewallIn - refSpecs.sidewallIn;
  if (Math.abs(swDiff) >= 0.1) {
    explanations.push(
      `Sidewall height changes by ${swDiff >= 0 ? '+' : ''}${swDiff.toFixed(2)} in (${specs.sidewallIn.toFixed(2)} in vs ${refSpecs.sidewallIn.toFixed(2)} in) — ${swDiff > 0 ? 'more compliance, softer ride' : 'firmer response, less flex'}.`,
    );
  }

  if (Math.abs(cmp.speedometer.errorPercent) >= 0.1) {
    explanations.push(
      `At 60 mph indicated on ${formatDisplaySize(ref)}, ${formatDisplaySize(size)} reads true speed of ${cmp.speedometer.trueSpeed.toFixed(1)} mph (${cmp.speedometer.errorPercent >= 0 ? '+' : ''}${cmp.speedometer.errorPercent.toFixed(1)}% error).`,
    );
  }

  if (explanations.length === 0) {
    explanations.push(
      `${formatDisplaySize(size)} and ${formatDisplaySize(ref)} are very close in overall diameter (${percentDiameterDiff(refSpecs, specs).toFixed(1)}% difference).`,
    );
  }

  return {
    referenceSize: ref,
    explanations,
    speedoErrorPercent: cmp.speedometer.errorPercent,
    groundClearanceChangeIn: cmp.groundClearanceChangeIn,
    sidewallDiffIn: swDiff,
    widthDiffMm: widthDiff,
  };
}

export function buildTireSizeHubData(size: string): TireSizeHubData | null {
  const entry = getTireSizeEntry(size);
  if (!entry) return null;

  const specs = getTireSpecs(entry.size);
  const all = getSizedEntries();
  const flotation = metricToFlotation(entry.size);
  const categoryLabel = TIRE_CATEGORY_LABELS[entry.category];
  const vehicleFitment = getVehicleFitment(entry.size);
  const vehicleNames = vehicleFitment.map(
    (v) => `${v.manufacturer} ${v.model}`,
  );

  const equivalentSuggestions = getEquivalentSizes(entry.size, 6);
  const equivalents = equivalentSuggestions.map((e) => ({
    size: e.size,
    diameterDiffPercent: e.diameterDiffPercent,
    diameterIn: e.diameterIn,
    href: e.href,
  }));

  const index = all.findIndex((s) => s.entry.size === entry.size);
  const plusOne =
    index < all.length - 1
      ? {
          size: all[index + 1].entry.size,
          diameterIn: all[index + 1].specs.overallDiameterIn,
          href: hubPagePath(all[index + 1].entry.size),
        }
      : null;
  const minusOne =
    index > 0
      ? {
          size: all[index - 1].entry.size,
          diameterIn: all[index - 1].specs.overallDiameterIn,
          href: hubPagePath(all[index - 1].entry.size),
        }
      : null;

  const upgradePathsUp = suggestionsToUpgradePaths(
    entry.size,
    getPopularUpgrades(entry.size, 6),
    'up',
  );
  const upgradePathsDown = suggestionsToUpgradePaths(
    entry.size,
    getPopularDownsizes(entry.size, 6),
    'down',
  );

  const quickComparisons = all
    .filter((s) => s.entry.size !== entry.size)
    .filter((s) => isValidComparisonPair(entry.size, s.entry.size))
    .map((s) => {
      const cmp = compareTires(entry.size, s.entry.size, 60);
      return {
        size: s.entry.size,
        diameterIn: s.specs.overallDiameterIn,
        widthMm: s.specs.widthMm,
        speedoErrorPercent: cmp.speedometer.errorPercent,
        href: hubPagePath(s.entry.size),
        comparisonHref: comparisonPagePath(entry.size, s.entry.size),
      };
    })
    .sort(
      (a, b) =>
        Math.abs(a.diameterIn - specs.overallDiameterIn) -
          Math.abs(b.diameterIn - specs.overallDiameterIn),
    )
    .slice(0, 4);

  const sameWidthSizes = all
    .filter(
      (s) =>
        s.specs.widthMm === specs.widthMm && s.entry.size !== entry.size,
    )
    .map((s) => toRelatedLink(specs, s.entry, s.specs))
    .slice(0, LINK_LIMIT);

  const sameWheelSizes = all
    .filter(
      (s) =>
        s.specs.wheelDiameterIn === specs.wheelDiameterIn &&
        s.entry.size !== entry.size,
    )
    .map((s) => toRelatedLink(specs, s.entry, s.specs))
    .slice(0, LINK_LIMIT);

  const performanceAlternatives = all
    .filter(
      (s) =>
        s.entry.category === 'performance' && s.entry.size !== entry.size,
    )
    .map((s) => toRelatedLink(specs, s.entry, s.specs))
    .sort(
      (a, b) =>
        Math.abs(a.diameterDiffPercent) - Math.abs(b.diameterDiffPercent),
    )
    .slice(0, LINK_LIMIT);

  const offRoadAlternatives = all
    .filter(
      (s) =>
        (s.entry.category === 'off-road' ||
          s.entry.category === 'light-truck') &&
        s.entry.size !== entry.size,
    )
    .map((s) => toRelatedLink(specs, s.entry, s.specs))
    .sort(
      (a, b) =>
        Math.abs(a.diameterDiffPercent) - Math.abs(b.diameterDiffPercent),
    )
    .slice(0, LINK_LIMIT);

  const referenceEntry =
    minusOne
      ? all.find((s) => s.entry.size === minusOne.size) ?? null
      : plusOne
        ? all.find((s) => s.entry.size === plusOne.size) ?? null
        : equivalents.length > 0
          ? all.find((s) => s.entry.size === equivalents[0].size) ?? null
          : null;


  const hubData: TireSizeHubData = {
    entry,
    specs,
    displaySize: formatDisplaySize(entry.size),
    categoryLabel,
    ratings: resolveTireRatings(entry.ratings),
    intro: (() => {
      const raw = buildCategoryIntro(entry.size, specs, entry.category, flotation);
      const expert = getExpertIntroForTireSize({
        size: entry.size,
        specs,
        category: entry.category,
      });
      return expert ? shortenHubIntro(expert, 5) : shortenHubIntro(raw);
    })(),
    heroHighlights: buildHeroHighlights(specs, flotation),
    summaryBar: buildSummaryBar(
      entry.category,
      categoryLabel,
      specs,
      flotation,
      vehicleNames,
    ),
    premiumSpecCards: buildPremiumSpecCards(specs),
    typicalUses: buildTypicalUses(entry.category),
    imperialStats: formatTireSizeResults(specs, 'imperial'),
    metricStats: formatTireSizeResults(specs, 'metric'),
    flotation,
    equivalents,
    plusOne,
    minusOne,
    upgradePathsUp,
    upgradePathsDown,
    realWorldImpact: buildRealWorldImpact(entry.size, specs, referenceEntry),
    quickComparisons,
    sameWidthSizes,
    sameWheelSizes,
    performanceAlternatives,
    offRoadAlternatives,
    vehicleFitment,
    fitmentIntro: getFitmentIntro(entry.size, entry.category),
    faq: [],
  };

  const baseFaq = buildSearchableFaq(hubData);
  const coverage = getTireSizeDataCoverage(entry.size);
  const productFaqs = buildProductDataFaqs(hubData.displaySize, coverage);
  // Prefer product-data FAQs, then keep concise category/expert answers (max 6).
  const merged: HubFaqItem[] = [];
  const seen = new Set<string>();
  for (const item of [...productFaqs, ...baseFaq]) {
    const key = item.question.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(item);
    if (merged.length >= 6) break;
  }
  hubData.faq = merged;
  return hubData;
}

export function groupSizesByCategory(): Record<
  TireCategory,
  TireSizeEntry[]
> {
  const groups = {} as Record<TireCategory, TireSizeEntry[]>;
  for (const entry of TIRE_SIZES) {
    if (!groups[entry.category]) groups[entry.category] = [];
    groups[entry.category].push(entry);
  }
  for (const cat of Object.keys(groups) as TireCategory[]) {
    groups[cat].sort(
      (a, b) =>
        getTireSpecs(a.size).overallDiameterIn -
        getTireSpecs(b.size).overallDiameterIn,
    );
  }
  return groups;
}
