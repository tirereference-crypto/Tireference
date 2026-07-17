/**
 * Master tire product helpers for /tire-size/[size] pages.
 *
 * Data files live in src/data/generated/ — regenerate with:
 *   python3 scripts/generate-master-tire-data.py
 *
 * If files are missing, place them from master_tire_database.xlsx
 * (Downloads) into src/data/generated/ before building.
 */

import sizeToProducts from '../data/generated/master_size_to_products.json';
import {
  formatBrandCountLabel,
  formatServiceVariantCountLabel,
  formatUniqueModelCountLabel,
  getExactSizeCoverage,
} from './exact-size-coverage';

export type DataQualityStatus = 'full_specs' | 'size_only' | 'partial_specs' | string;

export interface TireProduct {
  brand: string;
  model: string;
  product_family: string;
  product_category: string;
  season: string;
  tire_size: string;
  size_slug: string;
  display_size: string;
  product_code: string;
  load_range: string;
  service_description: string;
  speed_rating: string;
  overall_diameter_in: string | number | null;
  section_width_in: string | number | null;
  overall_width_in: string | number | null;
  tread_depth_32nds: string | number | null;
  weight_lb: string | number | null;
  max_load_lb: string | number | null;
  max_pressure_psi: string | number | null;
  revs_per_mile: string | number | null;
  utqg: string;
  specs_loaded: string;
  data_quality_status: DataQualityStatus;
  source_url: string;
}

export interface TireSizeDataCoverage {
  productsIndexed: number;
  /** Unique marketed models (brand+model) for the exact size — shared with calculator. */
  uniqueModelCount: number;
  /** Exact-size product/SKU rows — same as service variants in exact-size coverage. */
  serviceVariantCount: number;
  fullSpecProducts: number;
  sizeOnlyProducts: number;
  brands: string[];
  categories: string[];
  seasons: string[];
  hasAllTerrain: boolean;
  hasTouring: boolean;
  hasPerformance: boolean;
  hasWinter: boolean;
  /**
   * Compact coverage line using shared exact-size definitions, e.g.
   * "24 unique tire models · 25 service variants · 3 brands indexed"
   */
  heroDataLine: string;
}

export type UseCaseBucketId =
  | 'all_terrain'
  | 'highway_touring'
  | 'performance'
  | 'winter';

export interface UseCaseBucket {
  id: UseCaseBucketId;
  label: string;
  products: TireProduct[];
}

const KNOWN_BRANDS = [
  'Michelin',
  'Goodyear',
  'BFGoodrich',
  'Toyo',
  'Falken',
] as const;

const PRODUCT_INDEX = sizeToProducts as Record<string, TireProduct[]>;

/** Normalize any tire-size input to a lowercase size_slug key. */
export function normalizeTireSize(input: string): string {
  let s = input.trim().toLowerCase().replace(/\s+/g, '');
  s = s.replace(/_/g, '-');
  // 275/70R18, LT275/70R18/E, 275-70r18, lt275-70r18-e
  s = s.replace(/\//g, '-');
  // collapse accidental double separators
  s = s.replace(/-+/g, '-');
  return s;
}

/**
 * Candidate slugs for lookup. Prefer exact match first; then strip trailing
 * load-range suffix (e.g. -e); never merge LT ↔ non-LT blindly.
 */
export function tireSizeLookupCandidates(input: string): string[] {
  const exact = normalizeTireSize(input);
  const candidates = [exact];

  // Strip trailing load-range letter after rim: lt275-70r18-e → lt275-70r18
  const withoutLoad = exact.replace(/-([a-z])$/i, '');
  if (withoutLoad !== exact) candidates.push(withoutLoad);

  // Also try with /→- already done; if input had R vs r already normalized.

  return [...new Set(candidates)];
}

function resolveProducts(input: string): TireProduct[] {
  const map = PRODUCT_INDEX;
  for (const key of tireSizeLookupCandidates(input)) {
    const rows = map[key];
    if (rows?.length) return rows;
  }
  return [];
}

export function isFullSpecs(p: TireProduct): boolean {
  return (p.data_quality_status || '').toLowerCase() === 'full_specs';
}

function brandRank(brand: string): number {
  const i = KNOWN_BRANDS.findIndex(
    (b) => b.toLowerCase() === brand.trim().toLowerCase(),
  );
  return i === -1 ? KNOWN_BRANDS.length + 1 : i;
}

function categoryPriority(cat: string): number {
  const c = cat.toLowerCase();
  if (c.includes('all_terrain') || c.includes('all-terrain')) return 0;
  if (c.includes('touring') || c.includes('highway')) return 1;
  if (c.includes('performance') || c.includes('ultra_high')) return 2;
  if (c.includes('winter')) return 3;
  if (c.includes('mud')) return 4;
  return 5;
}

function productDedupeKey(p: TireProduct): string {
  return [
    p.brand.trim().toLowerCase(),
    p.model.trim().toLowerCase(),
    (p.load_range || '').trim().toLowerCase(),
    (p.service_description || '').trim().toLowerCase(),
  ].join('|');
}

/** Prefer full_specs; keep distinct load/service variants. */
export function dedupeProducts(products: TireProduct[]): TireProduct[] {
  const byKey = new Map<string, TireProduct>();
  for (const p of products) {
    const key = productDedupeKey(p);
    const existing = byKey.get(key);
    if (!existing) {
      byKey.set(key, p);
      continue;
    }
    if (!isFullSpecs(existing) && isFullSpecs(p)) {
      byKey.set(key, p);
    }
  }
  return [...byKey.values()];
}

function sortProducts(products: TireProduct[]): TireProduct[] {
  return [...products].sort((a, b) => {
    const full = Number(isFullSpecs(b)) - Number(isFullSpecs(a));
    if (full) return full;
    const brand = brandRank(a.brand) - brandRank(b.brand);
    if (brand) return brand;
    const cat =
      categoryPriority(a.product_category) - categoryPriority(b.product_category);
    if (cat) return cat;
    return a.model.localeCompare(b.model);
  });
}

export function getProductsForTireSize(size: string): TireProduct[] {
  return dedupeProducts(resolveProducts(size));
}

export function getFullSpecProductsForTireSize(size: string): TireProduct[] {
  return sortProducts(getProductsForTireSize(size).filter(isFullSpecs));
}

export function getBrandCoverageForTireSize(size: string): string[] {
  const brands = new Set(
    getProductsForTireSize(size)
      .map((p) => p.brand.trim())
      .filter(Boolean),
  );
  return [...brands].sort(
    (a, b) => brandRank(a) - brandRank(b) || a.localeCompare(b),
  );
}

export function getCategoryCoverageForTireSize(size: string): string[] {
  const cats = new Set(
    getProductsForTireSize(size)
      .map((p) => p.product_category.trim())
      .filter(Boolean),
  );
  return [...cats].sort();
}

export function getTopProductsForTireSize(
  size: string,
  limit = 12,
): TireProduct[] {
  return sortProducts(getProductsForTireSize(size)).slice(0, limit);
}

function isAllTerrainProduct(p: TireProduct): boolean {
  const c = `${p.product_category} ${p.model}`.toLowerCase();
  return (
    c.includes('all_terrain') ||
    c.includes('all-terrain') ||
    c.includes('a/t') ||
    c.includes('at ') ||
    c.includes('rugged') ||
    c.includes('mud_terrain') ||
    c.includes('mud-terrain') ||
    c.includes('m/t')
  );
}

function isTouringProduct(p: TireProduct): boolean {
  const c = `${p.product_category} ${p.model}`.toLowerCase();
  return (
    c.includes('touring') ||
    c.includes('highway') ||
    c.includes('h/t') ||
    c.includes('ht ') ||
    c.includes('passenger_truck') ||
    c.includes('suv_crossover') ||
    (c.includes('truck_suv') && !isAllTerrainProduct(p) && !isWinterProduct(p))
  );
}

function isPerformanceProduct(p: TireProduct): boolean {
  const c = `${p.product_category} ${p.season} ${p.model}`.toLowerCase();
  return (
    c.includes('performance') ||
    c.includes('ultra_high') ||
    c.includes('summer') ||
    c.includes('sport')
  );
}

function isWinterProduct(p: TireProduct): boolean {
  const c = `${p.product_category} ${p.season} ${p.model}`.toLowerCase();
  return c.includes('winter') || c.includes('snow') || c.includes('ice');
}

export function groupProductsByUseCase(
  products: TireProduct[],
  perBucket = 4,
): UseCaseBucket[] {
  const sorted = sortProducts(products);
  const buckets: UseCaseBucket[] = [
    {
      id: 'all_terrain',
      label: 'Best all-terrain options',
      products: sorted.filter(isAllTerrainProduct).slice(0, perBucket),
    },
    {
      id: 'highway_touring',
      label: 'Best highway/touring options',
      products: sorted.filter(isTouringProduct).slice(0, perBucket),
    },
    {
      id: 'performance',
      label: 'Best performance options',
      products: sorted.filter(isPerformanceProduct).slice(0, perBucket),
    },
    {
      id: 'winter',
      label: 'Best winter options',
      products: sorted.filter(isWinterProduct).slice(0, perBucket),
    },
  ];
  return buckets.filter((b) => b.products.length > 0);
}

export function getTireSizeDataCoverage(size: string): TireSizeDataCoverage {
  const products = getProductsForTireSize(size);
  const fullSpecProducts = products.filter(isFullSpecs).length;
  const sizeOnlyProducts = products.length - fullSpecProducts;
  const brands = getBrandCoverageForTireSize(size);
  const categories = getCategoryCoverageForTireSize(size);
  const seasons = [
    ...new Set(products.map((p) => p.season.trim()).filter(Boolean)),
  ].sort();

  const productsIndexed = products.length;
  const exact = getExactSizeCoverage(size);
  const uniqueModelCount = exact.uniqueModelCount;
  const serviceVariantCount =
    exact.serviceVariantCount > 0 ? exact.serviceVariantCount : productsIndexed;
  const brandCount = exact.brandCount > 0 ? exact.brandCount : brands.length;

  const heroParts =
    uniqueModelCount > 0 || serviceVariantCount > 0 || brandCount > 0
      ? [
          formatUniqueModelCountLabel(uniqueModelCount),
          formatServiceVariantCountLabel(serviceVariantCount),
          formatBrandCountLabel(brandCount),
        ]
      : ['No unique tire models indexed'];
  if (fullSpecProducts > 0) {
    heroParts.push(
      `${fullSpecProducts} full-spec row${fullSpecProducts === 1 ? '' : 's'}`,
    );
  }

  return {
    productsIndexed,
    uniqueModelCount,
    serviceVariantCount,
    fullSpecProducts,
    sizeOnlyProducts,
    brands,
    categories,
    seasons,
    hasAllTerrain: products.some(isAllTerrainProduct),
    hasTouring: products.some(isTouringProduct),
    hasPerformance: products.some(isPerformanceProduct),
    hasWinter: products.some(isWinterProduct),
    heroDataLine: heroParts.join(' · '),
  };
}

export function formatCategoryLabel(category: string): string {
  if (!category) return '—';
  return category
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function formatSeasonLabel(season: string): string {
  if (!season) return '—';
  return season
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function formatNum(
  value: string | number | null | undefined,
  digits = 1,
): string | null {
  if (value === null || value === undefined || value === '') return null;
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return null;
  return Number.isInteger(n) && digits === 0
    ? String(n)
    : n.toFixed(digits).replace(/\.0$/, '');
}

export function specsStatusLabel(p: TireProduct): 'Full specs' | 'Size only' {
  return isFullSpecs(p) ? 'Full specs' : 'Size only';
}

/** Build concise product-data FAQs (0–4 items) from coverage. */
export function buildProductDataFaqs(
  displaySize: string,
  coverage: TireSizeDataCoverage,
): Array<{ question: string; answer: string }> {
  if (coverage.productsIndexed === 0) return [];

  const faqs: Array<{ question: string; answer: string }> = [];
  const brands = coverage.brands;

  faqs.push({
    question: `Which brands make ${displaySize} tires?`,
    answer:
      brands.length > 0
        ? `Our index currently lists ${brands.join(', ')} in ${displaySize} (${coverage.productsIndexed} product row${coverage.productsIndexed === 1 ? '' : 's'}). Availability varies by load range and season — confirm the exact service description on the sidewall before purchase.`
        : `We index manufacturer listings for ${displaySize}; brand coverage can change as new models are added.`,
  });

  if (coverage.hasAllTerrain) {
    faqs.push({
      question: `Are there all-terrain tires available in ${displaySize}?`,
      answer: `Yes — this size includes all-terrain (and related rugged) models in the master database. Compare tread depth, load range, and weight in the product table above when choosing between highway and aggressive patterns.`,
    });
  }

  const loadRanges = [
    ...new Set(
      getProductsForTireSize(displaySize)
        .map((p) => (p.load_range || '').trim().toUpperCase())
        .filter(Boolean),
    ),
  ].sort();
  if (loadRanges.length > 0) {
    faqs.push({
      question: `What load ranges are common for ${displaySize}?`,
      answer: `Indexed products in this size commonly use load range${loadRanges.length === 1 ? '' : 's'} ${loadRanges.join(', ')}. Match load range and load index to your vehicle placard and expected payload — especially for LT constructions.`,
    });
  }

  if (coverage.fullSpecProducts > 0) {
    faqs.push({
      question: `Which ${displaySize} tires have full specs indexed?`,
      answer: `${coverage.fullSpecProducts} of ${coverage.productsIndexed} indexed row${coverage.productsIndexed === 1 ? '' : 's'} include full technical specs (diameter, tread depth, max load, pressure, and related fields where the manufacturer publishes them). Size-only rows show availability without a complete measurement set.`,
    });
  }

  return faqs.slice(0, 4);
}
