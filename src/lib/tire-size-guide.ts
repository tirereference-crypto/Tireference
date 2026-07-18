/**
 * Shared tire-size guide page data builder.
 * Used by every /tire-size/[size]/ page via TireSizeGuide.astro.
 */

import type { TireCategory } from '../data/tire-sizes';
import { getVehicleFitment } from '../data/vehicle-fitment';
import {
  buildTireSizeHubData,
  type HubFaqItem,
  type TireSizeHubData,
} from './tire-size-hub';
import type { TireSpecs } from './tire-math';
import { tireSizeCalculatorPath } from './tire-size-url';
import {
  dedupeProducts,
  getProductsForTireSize,
  getTireSizeDataCoverage,
  groupProductsByUseCase,
  isFullSpecs,
  type TireProduct,
  type TireSizeDataCoverage,
  type UseCaseBucket,
} from './tire-size-products';
import {
  formatBrandCountLabel,
  formatServiceVariantCountLabel,
  formatUniqueModelCountLabel,
  getExactSizeCoverage,
} from './exact-size-coverage';
import { buildExpertFaqsForTireSize } from './tire-size-expert-faq';
import { getTireSizeSuggestions } from './tire-size-suggestions';
import { buildPopularComparisonsForSize } from './tire-comparison-links';
import { preferredSizeCompareLink } from './crawlable-links';

export const GUIDE_275_SIZE = '275/70R18';

const KNOWN_BRAND_ORDER = [
  'BFGoodrich',
  'Toyo',
  'Falken',
  'Goodyear',
  'Michelin',
] as const;

const ALLOWED_BRANDS = new Set(
  KNOWN_BRAND_ORDER.map((b) => b.toLowerCase()),
);

export interface GlanceRow {
  label: string;
  value: string;
  /** Where the value comes from for disclosure labels. */
  provenance: 'calculated' | 'manufacturer' | 'standard';
}

export interface OverviewBullet {
  text: string;
  tone: 'good' | 'warn' | 'info';
}

export interface GuideVehicle {
  manufacturer: string;
  model: string;
  trim?: string;
  yearRange?: string;
}

export interface SizeChip {
  size: string;
  diameterDiffPercent: number;
  href: string;
}

export interface GuideUseCaseBucket extends UseCaseBucket {
  description: string;
}

export interface PopularComparisonLink {
  size: string;
  href: string;
}

export interface TireSizeGuideData {
  size: string;
  displaySize: string;
  coverage: TireSizeDataCoverage;
  glance: GlanceRow[];
  bestFor: OverviewBullet[];
  considerIf: OverviewBullet[];
  realWorldImpact: OverviewBullet[];
  vehicles: GuideVehicle[];
  products: TireProduct[];
  productTotal: number;
  useCases: GuideUseCaseBucket[];
  equivalents: SizeChip[];
  upgrades: SizeChip[];
  related: SizeChip[];
  popularComparisons: PopularComparisonLink[];
  brands: string[];
  faq: HubFaqItem[];
  compareHref: string;
  compareLabel: string;
  calculatorHref: string;
  loadRanges: string[];
  speedRatings: string[];
  fullSpecProducts: TireProduct[];
  nearbyCompareExamples: string[];
}

function brandRank(brand: string): number {
  const i = KNOWN_BRAND_ORDER.findIndex(
    (b) => b.toLowerCase() === brand.trim().toLowerCase(),
  );
  return i === -1 ? KNOWN_BRAND_ORDER.length + 1 : i;
}

function isAllowedMasterBrand(brand: string): boolean {
  return ALLOWED_BRANDS.has(brand.trim().toLowerCase());
}

function categoryRankForSize(
  category: string,
  sizeCategory: TireCategory,
): number {
  const c = (category || '').toLowerCase();
  if (sizeCategory === 'performance') {
    if (c.includes('performance') || c.includes('ultra_high')) return 0;
    if (c.includes('touring') || c.includes('summer')) return 1;
    if (c.includes('all_season')) return 2;
    return 5;
  }
  if (sizeCategory === 'passenger' || sizeCategory === 'SUV') {
    if (c.includes('touring') || c.includes('highway')) return 0;
    if (c.includes('all_terrain') || c.includes('all-terrain')) return 1;
    if (c.includes('suv') || c.includes('crossover')) return 2;
    if (c.includes('winter')) return 3;
    if (c.includes('performance')) return 4;
    return 5;
  }
  // off-road / light-truck
  if (c.includes('all_terrain') || c.includes('all-terrain')) return 0;
  if (c.includes('rugged')) return 1;
  if (c.includes('mud')) return 2;
  if (c.includes('highway')) return 3;
  if (c.includes('truck') || c.includes('suv') || c.includes('commercial')) return 4;
  if (c.includes('winter')) return 5;
  return 6;
}

function normalizeModelKey(model: string): string {
  return model
    .trim()
    .toLowerCase()
    .replace(/^bfgoodrich\s+/i, '')
    .replace(/[®™]/g, '');
}

/** Compact strip selector — master brands only, full-specs first, category-aware. */
export function selectTopGuideProducts(
  products: TireProduct[],
  limit = 6,
  sizeCategory: TireCategory = 'off-road',
): TireProduct[] {
  const filtered = products.filter((p) => isAllowedMasterBrand(p.brand));
  const sorted = [...filtered].sort((a, b) => {
    const full = Number(isFullSpecs(b)) - Number(isFullSpecs(a));
    if (full) return full;
    const cat =
      categoryRankForSize(a.product_category, sizeCategory) -
      categoryRankForSize(b.product_category, sizeCategory);
    if (cat) return cat;
    const brand = brandRank(a.brand) - brandRank(b.brand);
    if (brand) return brand;
    return a.model.localeCompare(b.model);
  });

  const out: TireProduct[] = [];
  const seenVariant = new Set<string>();
  const brandCounts = new Map<string, number>();

  for (const p of sorted) {
    if (out.length >= limit) break;
    const brandKey = p.brand.trim().toLowerCase();
    const modelKey = normalizeModelKey(p.model);
    const loadKey = [
      (p.load_range || '').trim().toLowerCase(),
      (p.service_description || '').trim().toLowerCase(),
    ].join('|');
    const variantKey = `${brandKey}|${modelKey}|${loadKey}`;
    if (seenVariant.has(variantKey)) continue;
    if (
      out.some(
        (x) =>
          x.brand.trim().toLowerCase() === brandKey &&
          normalizeModelKey(x.model) === modelKey,
      )
    ) {
      continue;
    }
    const count = brandCounts.get(brandKey) ?? 0;
    if (count >= 2) continue;
    seenVariant.add(variantKey);
    brandCounts.set(brandKey, count + 1);
    out.push(p);
  }

  for (const p of sorted) {
    if (out.length >= limit) break;
    if (out.includes(p)) continue;
    const brandKey = p.brand.trim().toLowerCase();
    const modelKey = normalizeModelKey(p.model);
    if (
      out.some(
        (x) =>
          x.brand.trim().toLowerCase() === brandKey &&
          normalizeModelKey(x.model) === modelKey,
      )
    ) {
      continue;
    }
    out.push(p);
  }

  return out.slice(0, limit);
}

/**
 * Products for a size page: exact match first; enrich with LT variants only for
 * truck/off-road sizes (or the 275 guide), never blind-merge unrelated codes.
 */
export function getGuideProductsForSize(
  size: string,
  category: TireCategory,
): TireProduct[] {
  const exact = getProductsForTireSize(size);
  const upper = size.toUpperCase();
  const shouldEnrichLt =
    upper === GUIDE_275_SIZE ||
    category === 'off-road' ||
    category === 'light-truck' ||
    (!upper.startsWith('LT') && (upper.includes('70R') || upper.includes('75R')));

  if (!shouldEnrichLt || upper.startsWith('LT')) {
    return dedupeProducts(exact).filter((p) => isAllowedMasterBrand(p.brand));
  }

  const base = upper.replace(/^P/, '');
  const lt = getProductsForTireSize(`LT${base}`);
  const ltE = getProductsForTireSize(`LT${base}/E`);
  return dedupeProducts([...exact, ...lt, ...ltE]).filter((p) =>
    isAllowedMasterBrand(p.brand),
  );
}

function uniqueSorted(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))].sort();
}

function formatGlanceLoadRanges(ranges: string[]): string {
  const ordered = ['C', 'D', 'E', 'F', 'SL', 'XL'].filter((r) => ranges.includes(r));
  const extras = ranges.filter((r) => !ordered.includes(r));
  let list = [...ordered, ...extras];
  const hasCDE = ['C', 'D', 'E'].some((r) => list.includes(r));
  if (hasCDE) list = list.filter((r) => r !== 'SL');
  return list.length ? list.join(', ') : '—';
}

function formatGlanceSpeedRatings(products: TireProduct[]): string {
  const counts = new Map<string, number>();
  for (const p of products) {
    const r = (p.speed_rating || '').trim().toUpperCase();
    if (!r || r.length > 2) continue;
    counts.set(r, (counts.get(r) ?? 0) + 1);
  }
  const ranked = [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([r]) => r);
  if (ranked.length === 0) return '—';
  return ranked.slice(0, 3).sort().join(', ');
}

/** Human-readable tire model casing for cards. */
export function formatTireModelDisplayName(model: string): string {
  const cleaned = model.replace(/^BFGOODRICH\s+/i, '').trim();
  if (!cleaned) return cleaned;

  return cleaned
    .split(/(\s+)/)
    .map((token) => {
      if (/^\s+$/.test(token)) return token;
      return token
        .split('-')
        .map((part) => formatModelToken(part))
        .join('-');
    })
    .join('');
}

/** Alias required by rollout brief. */
export const formatTireModelName = formatTireModelDisplayName;

function formatModelToken(part: string): string {
  if (!part) return part;
  const lower = part.toLowerCase();
  const slash = part.match(/^([A-Za-z])\/([A-Za-z])(.*)$/);
  if (slash) {
    return `${slash[1].toUpperCase()}/${slash[2].toUpperCase()}${slash[3].toUpperCase()}`;
  }
  if (/^(i|ii|iii|iv|v)$/i.test(part)) return part.toUpperCase();
  if (lower === 'hd' || lower === 'lt' || lower === 'xl' || lower === 'sl') {
    return part.toUpperCase();
  }
  if (/^[A-Za-z]{1,4}\d+[A-Za-z0-9]*$/i.test(part)) return part.toUpperCase();
  if (['kt', 'ta', 'at', 'mt', 'st', 'rt'].includes(lower)) return part.toUpperCase();
  return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
}

function overviewForCategory(category: TireCategory, size: string): {
  bestFor: OverviewBullet[];
  considerIf: OverviewBullet[];
  realWorldImpact: OverviewBullet[];
} {
  if (category === 'performance') {
    return {
      bestFor: [
        { text: 'Sporty handling and a wider contact patch on performance-oriented cars', tone: 'good' },
        { text: 'Drivers who want sharper steering response than taller touring sizes', tone: 'good' },
        { text: 'Warm-weather road use where grip matters more than max sidewall cushion', tone: 'good' },
      ],
      considerIf: [
        { text: 'Ride comfort on rough city streets is your top priority', tone: 'warn' },
        { text: 'You need dedicated winter traction without a separate tire set', tone: 'warn' },
        { text: 'You want lower replacement cost and longer tread life over peak grip', tone: 'warn' },
      ],
      realWorldImpact: [
        { text: 'Sharper turn-in and more direct steering feedback', tone: 'good' },
        { text: 'Lower sidewall means more pothole and curb sensitivity', tone: 'warn' },
        { text: 'Usually firmer ride and more road noise than touring sizes', tone: 'warn' },
      ],
    };
  }

  if (category === 'passenger') {
    return {
      bestFor: [
        { text: 'Daily driving, commuting, and common sedan or hatchback replacements', tone: 'good' },
        { text: 'Predictable wet-weather manners and quiet highway miles', tone: 'good' },
        { text: `Straightforward ${size} replacements matched to the door placard`, tone: 'good' },
      ],
      considerIf: [
        { text: 'You need more ground clearance or a taller truck/SUV stance', tone: 'warn' },
        { text: 'You want a wider performance contact patch for sporty driving', tone: 'warn' },
        { text: 'You are building for trails, towing, or heavy payload', tone: 'warn' },
      ],
      realWorldImpact: [
        { text: 'Comfort-biased ride and broad replacement availability', tone: 'good' },
        { text: 'Usually better fuel economy than oversized truck tires', tone: 'good' },
        { text: 'Limited clearance and load capacity vs light-truck sizes', tone: 'warn' },
      ],
    };
  }

  if (category === 'SUV') {
    return {
      bestFor: [
        { text: 'Crossovers and SUVs that mix pavement with light gravel or snow', tone: 'good' },
        { text: 'Family hauling with enough sidewall for driveway and washboard comfort', tone: 'good' },
        { text: 'Owners who want versatile all-season or touring coverage in this size', tone: 'good' },
      ],
      considerIf: [
        { text: 'You want a dedicated off-road tire package or taller flotation size', tone: 'warn' },
        { text: 'Maximum fuel economy and the quietest highway commute matter most', tone: 'warn' },
        { text: 'You need sharp low-profile performance handling', tone: 'warn' },
      ],
      realWorldImpact: [
        { text: 'Balanced ride height and everyday versatility', tone: 'good' },
        { text: 'Modest clearance gain vs smaller passenger sizes', tone: 'good' },
        { text: 'Heavier than compact-car tires; watch load range for towing', tone: 'warn' },
      ],
    };
  }

  // off-road / light-truck default
  return {
    bestFor: [
      { text: 'Trucks, SUVs, and builds that need clearance, load capacity, or trail capability', tone: 'good' },
      { text: 'Towing, payload, gravel, trails, or overland use with stronger LT options', tone: 'good' },
      { text: 'Daily-driven trucks that still see mixed on/off-road miles', tone: 'good' },
    ],
    considerIf: [
      { text: 'Fuel economy, light steering, and factory-like ride comfort matter more than clearance', tone: 'warn' },
      { text: 'You prefer a smaller, more stock look or quieter highway manners', tone: 'warn' },
      { text: 'You need a dedicated extreme off-road size beyond mixed daily use', tone: 'warn' },
    ],
    realWorldImpact: [
      { text: 'More ground clearance and a taller off-road footprint', tone: 'good' },
      { text: 'Stronger load-carrying options for towing and payload', tone: 'good' },
      { text: 'Heavier steering feel and a bit more rotational mass', tone: 'warn' },
      { text: 'Usually a small hit to fuel economy vs smaller highway sizes', tone: 'warn' },
    ],
  };
}

const USE_CASE_COPY: Record<string, { label: string; description: string }> = {
  all_terrain: {
    label: 'All-Terrain',
    description:
      'Best first stop for mixed daily driving, gravel, trails, and overland use.',
  },
  highway_touring: {
    label: 'Highway / Touring',
    description: 'Better for road noise, towing stability, and long highway mileage.',
  },
  performance: {
    label: 'Performance',
    description:
      'For sharper steering response, higher-speed ratings, and sportier road feel.',
  },
  winter: {
    label: 'Winter',
    description:
      'Use dedicated winter tires when snow and ice grip matter more than tread toughness.',
  },
};

export function buildTireSizeGuideData(hub: TireSizeHubData): TireSizeGuideData {
  const size = hub.entry.size;
  const displaySize = hub.displaySize;
  const specs = hub.specs;
  const category = hub.entry.category;

  const products = getGuideProductsForSize(size, category);
  const coverageBase = getTireSizeDataCoverage(size);
  const brands = uniqueSorted(products.map((p) => p.brand.trim())).sort(
    (a, b) => brandRank(a) - brandRank(b) || a.localeCompare(b),
  );
  const fullSpecProducts = products.filter(isFullSpecs);
  const categories = uniqueSorted(products.map((p) => p.product_category.trim()));
  const coverage: TireSizeDataCoverage = {
    ...coverageBase,
    productsIndexed: products.length,
    // Keep shared unique-model / service-variant counts from exact-size coverage.
    uniqueModelCount: coverageBase.uniqueModelCount,
    serviceVariantCount: coverageBase.serviceVariantCount,
    fullSpecProducts: fullSpecProducts.length,
    sizeOnlyProducts: products.length - fullSpecProducts.length,
    brands,
    categories,
    heroDataLine: [
      formatUniqueModelCountLabel(coverageBase.uniqueModelCount),
      formatServiceVariantCountLabel(
        coverageBase.serviceVariantCount > 0
          ? coverageBase.serviceVariantCount
          : products.length,
      ),
      formatBrandCountLabel(
        coverageBase.uniqueModelCount > 0
          ? getExactSizeCoverage(size).brandCount
          : brands.length,
      ),
      fullSpecProducts.length > 0
        ? `${fullSpecProducts.length} full-spec row${fullSpecProducts.length === 1 ? '' : 's'}`
        : null,
    ]
      .filter(Boolean)
      .join(' · '),
  };

  const loadRanges = uniqueSorted(
    products.map((p) => (p.load_range || '').trim().toUpperCase()),
  );
  const speedRatings = uniqueSorted(
    products.map((p) => (p.speed_rating || '').trim().toUpperCase()),
  );

  const loadRangeValue = formatGlanceLoadRanges(loadRanges);
  const speedRatingValue = formatGlanceSpeedRatings(products);

  const glance: GlanceRow[] = [
    { label: 'Rim Diameter', value: `${specs.wheelDiameterIn}"`, provenance: 'calculated' },
    { label: 'Section Width', value: `${specs.widthMm} mm`, provenance: 'calculated' },
    { label: 'Aspect Ratio', value: `${specs.aspectRatio}%`, provenance: 'calculated' },
    {
      label: 'Load Range',
      value: loadRangeValue,
      provenance: loadRangeValue !== '—' ? 'manufacturer' : 'calculated',
    },
    {
      label: 'Speed Rating',
      value: speedRatingValue,
      provenance: speedRatingValue !== '—' ? 'manufacturer' : 'calculated',
    },
    { label: 'Construction', value: 'Radial', provenance: 'standard' },
  ];

  const overview = overviewForCategory(category, displaySize);

  const vehicles: GuideVehicle[] = getVehicleFitment(size)
    .slice(0, 6)
    .map((v) => ({
      manufacturer: v.manufacturer,
      model: v.model,
      trim: v.trim || undefined,
      yearRange: v.yearRange || undefined,
    }));

  const sorted = [...products].sort((a, b) => {
    const full = Number(isFullSpecs(b)) - Number(isFullSpecs(a));
    if (full) return full;
    const cat =
      categoryRankForSize(a.product_category, category) -
      categoryRankForSize(b.product_category, category);
    if (cat) return cat;
    return brandRank(a.brand) - brandRank(b.brand) || a.model.localeCompare(b.model);
  });
  const topProducts = selectTopGuideProducts(products, 6, category);

  const useCases = groupProductsByUseCase(sorted, 3)
    .filter((b) => b.products.length > 0)
    .map((b) => {
      const copy = USE_CASE_COPY[b.id] ?? {
        label: b.label,
        description: 'Matching products indexed for this size.',
      };
      return {
        ...b,
        label: copy.label,
        description: copy.description,
        products: b.products.slice(0, 3),
      };
    });

  const suggestions = getTireSizeSuggestions(size);

  const equivalents: SizeChip[] = suggestions.equivalents.map((e) => ({
    size: e.size,
    diameterDiffPercent: e.diameterDiffPercent,
    href: e.href,
  }));

  const upgrades: SizeChip[] = suggestions.upgrades.map((u) => ({
    size: u.size,
    diameterDiffPercent: u.diameterDiffPercent,
    href: u.href,
  }));

  const related: SizeChip[] = suggestions.related
    .filter((c) => c.size !== size)
    .slice(0, 5)
    .map((c) => ({
      size: c.size,
      diameterDiffPercent: c.diameterDiffPercent,
      href: c.href,
    }));

  const popularComparisons: PopularComparisonLink[] = buildPopularComparisonsForSize(size, 3)
    .map((link) => {
      const sizeKey = size.toUpperCase();
      const target =
        link.current.toUpperCase() === sizeKey ? link.new : link.current;
      return { size: target, href: link.href };
    });

  const nearbyCompareExamples = [
    ...upgrades.map((u) => u.size),
    ...equivalents.map((e) => e.size),
    ...popularComparisons.map((c) => c.size),
  ]
    .filter((s, i, arr) => arr.indexOf(s) === i && s !== size)
    .slice(0, 3);

  const compareTarget =
    nearbyCompareExamples[0] ??
    suggestions.related[0]?.size ??
    hub.quickComparisons[0]?.size ??
    null;

  const faq =
    buildExpertFaqsForTireSize({
      size,
      specs,
      loadRanges,
      brands,
      category,
      compareTarget,
      coverage,
    }) ?? [];

  const compareLink = preferredSizeCompareLink(size);

  return {
    size,
    displaySize,
    coverage,
    glance,
    bestFor: overview.bestFor,
    considerIf: overview.considerIf,
    realWorldImpact: overview.realWorldImpact,
    vehicles,
    products: topProducts,
    productTotal: products.length,
    useCases,
    equivalents,
    upgrades,
    related,
    popularComparisons,
    brands,
    faq,
    compareHref: compareLink.href,
    compareLabel: compareLink.label,
    calculatorHref: tireSizeCalculatorPath(size),
    loadRanges,
    speedRatings,
    fullSpecProducts,
    nearbyCompareExamples,
  };
}

/** Backward-compatible 275 entry point used by older imports/tests. */
export function buildGuide275Data(_specs?: TireSpecs): TireSizeGuideData {
  const hub = buildTireSizeHubData(GUIDE_275_SIZE);
  if (!hub) {
    throw new Error('Missing hub data for 275/70R18');
  }
  return buildTireSizeGuideData(hub);
}

export { formatCategoryLabel } from './tire-size-products';
export { CALCULATOR_PATHS } from './calculator-links';
export { hubPagePath } from './tire-size-url';
export { comparisonPagePath } from './tire-comparison-paths';
