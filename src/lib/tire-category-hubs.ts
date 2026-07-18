import { TIRE_SIZES, type TireCategory, type TireSizeEntry } from '../data/tire-sizes';
import { CALCULATOR_PATHS, type CalculatorLink } from './calculator-links';
import { buildPopularComparisonsForSize } from './tire-comparison-links';
import { getTireSpecs } from './tire-math';
import {
  getProductsForTireSize,
  isFullSpecs,
  type TireProduct,
} from './tire-size-products';
import { hubPagePath } from './tire-size-url';

/**
 * Public category-hub taxonomy. Membership is based on the explicit editorial
 * category and/or exact-size product metadata, never dimensions alone.
 */
export const TIRE_HUB_CATEGORY_SLUGS = [
  'passenger',
  'suv',
  'truck',
  'off-road',
  'performance',
  'winter',
  'ev',
  'touring',
] as const;

export type TireHubCategorySlug = (typeof TIRE_HUB_CATEGORY_SLUGS)[number];

export interface TireCategoryConsideration {
  title: string;
  detail: string;
}

export interface TireCategoryGuideLink {
  label: string;
  description: string;
  href: string;
}

export interface TireCategoryHubDefinition {
  slug: TireHubCategorySlug;
  label: string;
  h1: string;
  title: string;
  description: string;
  introduction: string;
  considerations: TireCategoryConsideration[];
  calculatorIds: Array<keyof typeof CALCULATOR_PATHS>;
  guides: TireCategoryGuideLink[];
}

export interface TireCategorySizeRow {
  entry: TireSizeEntry;
  href: string;
  diameterIn: number;
  productCount: number;
  matchingProductCount: number;
}

export interface TireCategoryProductRow {
  brand: string;
  model: string;
  size: string;
  href: string;
  productCategory: string;
  season: string;
  fullSpecs: boolean;
  sourceUrl: string | null;
}

export interface TireCategoryComparisonRow {
  label: string;
  href: string;
}

export interface TireCategoryHubData extends TireCategoryHubDefinition {
  path: string;
  sizes: TireCategorySizeRow[];
  products: TireCategoryProductRow[];
  comparisons: TireCategoryComparisonRow[];
  calculators: CalculatorLink[];
}

const COMMON_GUIDES: TireCategoryGuideLink[] = [
  {
    label: 'How tire-size calculations work',
    description: 'Review nominal diameter, sidewall, circumference, and source methodology.',
    href: '/data-standards/',
  },
  {
    label: 'Browse every indexed tire size',
    description: 'Move across the complete tire-size library and its primary categories.',
    href: '/tire-sizes/',
  },
  {
    label: 'Fitment and safety limitations',
    description: 'Understand why size math does not replace vehicle-specific fitment checks.',
    href: '/disclaimer/',
  },
];

export const TIRE_CATEGORY_HUBS: Record<TireHubCategorySlug, TireCategoryHubDefinition> = {
  passenger: {
    slug: 'passenger',
    label: 'Passenger',
    h1: 'Passenger Tire Sizes',
    title: 'Passenger Tire Sizes — Common Sizes, Products & Comparisons',
    description:
      'Browse passenger tire sizes for sedans and hatchbacks, with selection guidance, exact-size products, comparisons, and calculators.',
    introduction:
      'Passenger tires prioritize predictable road manners, wet braking, comfort, and replacement availability for everyday cars. Start with the door-placard size, then match the load index and speed rating before comparing tread life, seasonal grip, and ride quality.',
    considerations: [
      { title: 'Placard compatibility', detail: 'Keep the required load index and speed rating at or above the vehicle manufacturer’s specification.' },
      { title: 'Wet braking', detail: 'Compare independent test results and tread design rather than relying on mileage warranty alone.' },
      { title: 'Ride and noise', detail: 'Touring constructions usually emphasize isolation; performance constructions trade some comfort for response.' },
      { title: 'Season', detail: 'Choose all-season, all-weather, summer, or winter tires for the actual temperatures and roads you drive.' },
    ],
    calculatorIds: ['tireSize', 'tireComparison', 'tireDiameter'],
    guides: COMMON_GUIDES,
  },
  suv: {
    slug: 'suv',
    label: 'SUV',
    h1: 'SUV Tire Sizes',
    title: 'SUV Tire Sizes — Crossover Fitment, Products & Comparisons',
    description:
      'Explore SUV and crossover tire sizes with load, comfort, all-weather, fitment, product, and comparison guidance.',
    introduction:
      'SUV and crossover tires balance passenger-car comfort with higher vehicle mass, cargo loads, and mixed weather. The same nominal size may be sold in touring, all-weather, highway, or all-terrain constructions, so verify the exact service description and intended use.',
    considerations: [
      { title: 'Load capacity', detail: 'Match load index and inflation guidance to the placard, especially when carrying passengers, cargo, or towing.' },
      { title: 'Road versus trail use', detail: 'Highway and touring patterns are quieter; all-terrain patterns add loose-surface traction and usually more weight.' },
      { title: 'AWD matching', detail: 'Keep circumference and tread-depth differences within the vehicle manufacturer’s limits across driven axles.' },
      { title: 'Clearance', detail: 'Check full-lock steering, suspension compression, wheel offset, and spare-tire storage before upsizing.' },
    ],
    calculatorIds: ['tireComparison', 'tireSize', 'wheelOffset'],
    guides: COMMON_GUIDES,
  },
  truck: {
    slug: 'truck',
    label: 'Truck',
    h1: 'Truck Tire Sizes',
    title: 'Truck Tire Sizes — Load Range, Towing & Exact-Size Products',
    description:
      'Browse truck tire sizes with load-range, towing, highway, all-terrain, fitment, product, and comparison guidance.',
    introduction:
      'Truck tire selection starts with capacity, not appearance. LT construction, load range, load index, inflation tables, tread type, and actual axle loads all matter; a larger size does not automatically carry more weight or suit towing better.',
    considerations: [
      { title: 'Capacity and pressure', detail: 'Use the exact tire’s load-and-inflation table and stay within axle, wheel, and vehicle ratings.' },
      { title: 'Towing stability', detail: 'Construction stiffness and correct pressure matter alongside tread pattern and nominal size.' },
      { title: 'Unsprung mass', detail: 'Heavier LT and off-road tires can reduce acceleration, braking response, and fuel economy.' },
      { title: 'Gearing', detail: 'A taller diameter changes effective axle ratio, engine rpm, speedometer reading, and low-speed response.' },
    ],
    calculatorIds: ['gearRatio', 'tireComparison', 'wheelOffset'],
    guides: COMMON_GUIDES,
  },
  'off-road': {
    slug: 'off-road',
    label: 'Off-Road',
    h1: 'Off-Road Tire Sizes',
    title: 'Off-Road Tire Sizes — All-Terrain, Mud-Terrain & Fitment',
    description:
      'Explore off-road tire sizes with all-terrain and mud-terrain products, clearance guidance, comparisons, and calculators.',
    introduction:
      'Off-road tire sizes need enough sidewall and clearance for the terrain without compromising steering, braking, gearing, or driveline operation. Product membership here requires explicit all-terrain, rugged-terrain, mud-terrain, or related catalog data, not dimensions alone.',
    considerations: [
      { title: 'Clearance under articulation', detail: 'Test compression and steering clearance; static parking-lot clearance is not enough.' },
      { title: 'Tread for the terrain', detail: 'All-terrain suits mixed mileage, while mud-terrain favors loose surfaces and accepts more noise and weight.' },
      { title: 'Airing down', detail: 'Use appropriate wheels, pressures, and load limits; never apply trail pressure to highway driving.' },
      { title: 'Driveline impact', detail: 'Large diameter and mass changes affect gearing, braking, wheel bearings, and spare-tire strategy.' },
    ],
    calculatorIds: ['tireDiameter', 'wheelOffset', 'gearRatio'],
    guides: COMMON_GUIDES,
  },
  performance: {
    slug: 'performance',
    label: 'Performance',
    h1: 'Performance Tire Sizes',
    title: 'Performance Tire Sizes — Grip, Fitment & Comparisons',
    description:
      'Browse performance tire sizes with summer and UHP products, speed-rating guidance, comparisons, and fitment calculators.',
    introduction:
      'Performance tires emphasize steering response, braking, and temperature-specific grip. Confirm wheel width, load index, speed rating, and axle pairing; a wider or lower-profile size is not automatically faster and may reduce wet or cold-weather capability.',
    considerations: [
      { title: 'Temperature range', detail: 'Summer compounds can lose flexibility in cold conditions; use winter-capable tires when temperatures demand it.' },
      { title: 'Wheel width', detail: 'The approved rim-width range controls sidewall shape, response, and whether the tire can be mounted safely.' },
      { title: 'Staggered fitment', detail: 'Keep front/rear diameter relationships compatible with ABS, AWD, and traction-control requirements.' },
      { title: 'Real test data', detail: 'Compare braking, wet handling, heat tolerance, and wear—not only treadwear labels or category names.' },
    ],
    calculatorIds: ['tireComparison', 'wheelOffset', 'tireSize'],
    guides: COMMON_GUIDES,
  },
  winter: {
    slug: 'winter',
    label: 'Winter',
    h1: 'Winter Tire Sizes',
    title: 'Winter Tire Sizes — Snow, Ice & Cold-Weather Fitment',
    description:
      'Find tire sizes with confirmed winter products, plus cold-weather selection advice, comparisons, and calculators.',
    introduction:
      'This hub includes sizes with exact catalog rows identified as winter, studdable winter, or winter light-truck products. A winter tire is defined by its compound and tread design—not by its dimensions—so size choice must still follow the vehicle placard and approved fitment.',
    considerations: [
      { title: 'Four-tire sets', detail: 'Use matching winter tires on all wheel positions to preserve predictable braking and handling.' },
      { title: 'Cold-weather compound', detail: 'Winter capability comes from rubber and tread design; all-season labeling alone is not equivalent.' },
      { title: 'Downsizing', detail: 'A smaller winter wheel can add sidewall, but brake clearance, load rating, and diameter must remain compatible.' },
      { title: 'Stud rules', detail: 'Stud legality, dates, and road restrictions vary by jurisdiction; verify local requirements.' },
    ],
    calculatorIds: ['tireComparison', 'tireSize', 'tireDiameter'],
    guides: COMMON_GUIDES,
  },
  ev: {
    slug: 'ev',
    label: 'EV',
    h1: 'EV Tire Sizes',
    title: 'EV Tire Sizes — Load, Efficiency & Exact-Size Products',
    description:
      'Browse tire sizes with explicitly identified EV products, including load, efficiency, noise, fitment, and comparison guidance.',
    introduction:
      'This hub uses exact product rows explicitly categorized for EV use; it does not assume a tire is EV-specific from its dimensions. Electric vehicles often combine high curb weight and immediate torque with range and cabin-noise priorities, but the vehicle placard remains the authority.',
    considerations: [
      { title: 'Load index', detail: 'Meet the placard requirement for the vehicle’s actual axle loads; EV branding does not override capacity limits.' },
      { title: 'Efficiency', detail: 'Rolling resistance can affect range, but wet braking and seasonal grip remain safety-critical.' },
      { title: 'Noise', detail: 'Low powertrain noise makes tread noise more noticeable; compare acoustic design and independent road tests.' },
      { title: 'Torque and wear', detail: 'Alignment, pressure, rotation strategy, and driving style strongly affect tread life on high-torque vehicles.' },
    ],
    calculatorIds: ['tireComparison', 'tireSize', 'wheelOffset'],
    guides: COMMON_GUIDES,
  },
  touring: {
    slug: 'touring',
    label: 'Touring',
    h1: 'Touring Tire Sizes',
    title: 'Touring Tire Sizes — Comfort, Tread Life & Products',
    description:
      'Explore tire sizes with confirmed touring and highway products, including comfort, tread-life, comparison, and fitment guidance.',
    introduction:
      'Touring tires are designed around road comfort, predictable all-season manners, noise control, and tread life. Membership here comes from exact touring or highway product categories, so one size can also appear in passenger, SUV, winter, EV, or performance hubs when its catalog supports those uses.',
    considerations: [
      { title: 'Comfort versus response', detail: 'Softer road manners may trade some immediate steering response compared with UHP constructions.' },
      { title: 'Wet performance', detail: 'Treat tread-life warranty and wet braking as separate criteria; neither guarantees the other.' },
      { title: 'Mileage warranty', detail: 'Review rotation, alignment, and staggered-fitment exclusions before comparing warranty figures.' },
      { title: 'All-weather needs', detail: 'For frequent snow, compare severe-snow-rated all-weather or dedicated winter options.' },
    ],
    calculatorIds: ['tireSize', 'tireComparison', 'tireDiameter'],
    guides: COMMON_GUIDES,
  },
};

const PRIMARY_CATEGORY_HUB: Record<TireCategory, TireHubCategorySlug> = {
  passenger: 'passenger',
  performance: 'performance',
  SUV: 'suv',
  'light-truck': 'truck',
  'off-road': 'off-road',
};

export function tireCategoryHubPath(slug: TireHubCategorySlug): string {
  return `/tire-sizes/${slug}/`;
}

function productSearchText(product: TireProduct): string {
  return `${product.product_category} ${product.season}`.trim().toLowerCase();
}

/** Exact catalog signal for whether a product belongs in a public category. */
export function productSupportsTireHubCategory(
  product: TireProduct,
  slug: TireHubCategorySlug,
): boolean {
  const text = productSearchText(product);
  const category = (product.product_category || '').toLowerCase();

  switch (slug) {
    case 'passenger':
      return category === 'passenger' || /(^|_)passenger_touring(_|$)/.test(category);
    case 'suv':
      return /suv_crossover|sport_truck_suv|(^|_)truck_suv(_|$)/.test(category);
    case 'truck':
      return /light_truck|commercial_|(^|_)truck_suv(_|$)|all_terrain_truck_suv/.test(category);
    case 'off-road':
      return /all_terrain|all-terrain|rugged_terrain|mud_terrain|crossover_all_terrain|commercial_all_terrain/.test(category);
    case 'performance':
      return /performance|ultra_high|track_|sport_truck_suv/.test(category) || /\bsummer\b/.test(text);
    case 'winter':
      return /winter|studdable|snow|ice/.test(text);
    case 'ev':
      return /(^|_)(ev|efficiency)(_|$)/.test(category);
    case 'touring':
      return /touring|highway_terrain/.test(category);
  }
}

export function getTireSizeHubCategories(entry: TireSizeEntry): TireHubCategorySlug[] {
  const categories = new Set<TireHubCategorySlug>([PRIMARY_CATEGORY_HUB[entry.category]]);
  for (const product of getProductsForTireSize(entry.size)) {
    for (const slug of TIRE_HUB_CATEGORY_SLUGS) {
      if (productSupportsTireHubCategory(product, slug)) categories.add(slug);
    }
  }
  return TIRE_HUB_CATEGORY_SLUGS.filter((slug) => categories.has(slug));
}

export function getPrimaryTireSizeHubCategory(entry: TireSizeEntry): TireHubCategorySlug {
  return PRIMARY_CATEGORY_HUB[entry.category];
}

function getCategoryCalculators(definition: TireCategoryHubDefinition): CalculatorLink[] {
  const labels: Record<keyof typeof CALCULATOR_PATHS, string> = {
    tireSize: 'Tire Size Calculator',
    tireComparison: 'Tire Comparison Calculator',
    tireDiameter: 'Tire Diameter Calculator',
    wheelOffset: 'Wheel Offset Calculator',
    gearRatio: 'Gear Ratio Calculator',
  };
  const descriptions: Record<keyof typeof CALCULATOR_PATHS, string> = {
    tireSize: 'Calculate nominal width, sidewall, diameter, circumference, and revs per mile.',
    tireComparison: 'Compare two sizes for diameter, speedometer, and clearance changes.',
    tireDiameter: 'Find indexed sizes near a target overall tire diameter.',
    wheelOffset: 'Check wheel poke, inset, backspacing, and suspension-side clearance.',
    gearRatio: 'Estimate effective gearing after a tire-diameter change.',
  };
  const icons: Record<keyof typeof CALCULATOR_PATHS, CalculatorLink['icon']> = {
    tireSize: 'size',
    tireComparison: 'compare',
    tireDiameter: 'diameter',
    wheelOffset: 'offset',
    gearRatio: 'gear',
  };
  return definition.calculatorIds.map((id) => ({
    label: labels[id],
    description: descriptions[id],
    href: CALCULATOR_PATHS[id],
    icon: icons[id],
  }));
}

function getCategoryProducts(
  slug: TireHubCategorySlug,
  sizes: TireCategorySizeRow[],
  limit = 8,
): TireCategoryProductRow[] {
  const rows: TireCategoryProductRow[] = [];
  const seen = new Set<string>();

  for (const sizeRow of sizes) {
    const matches = getProductsForTireSize(sizeRow.entry.size)
      .filter((product) => productSupportsTireHubCategory(product, slug))
      .sort((a, b) => Number(isFullSpecs(b)) - Number(isFullSpecs(a)));

    for (const product of matches) {
      const key = `${product.brand}|${product.model}|${sizeRow.entry.size}`.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      rows.push({
        brand: product.brand.trim(),
        model: product.model.replace(/[®™]/g, '').trim(),
        size: sizeRow.entry.size,
        href: hubPagePath(sizeRow.entry.size),
        productCategory: product.product_category,
        season: product.season,
        fullSpecs: isFullSpecs(product),
        sourceUrl: product.source_url?.trim() || null,
      });
      break;
    }
    if (rows.length >= limit) break;
  }

  return rows;
}

function getCategoryComparisons(
  sizes: TireCategorySizeRow[],
  limit = 6,
): TireCategoryComparisonRow[] {
  const rows: TireCategoryComparisonRow[] = [];
  const seen = new Set<string>();

  for (const size of sizes.slice(0, 8)) {
    for (const comparison of buildPopularComparisonsForSize(size.entry.size, 2)) {
      if (seen.has(comparison.href)) continue;
      seen.add(comparison.href);
      rows.push({ label: comparison.label, href: comparison.href });
      if (rows.length >= limit) return rows;
    }
  }
  return rows;
}

export function buildTireCategoryHubData(slug: TireHubCategorySlug): TireCategoryHubData {
  const definition = TIRE_CATEGORY_HUBS[slug];
  const sizes = TIRE_SIZES
    .filter((entry) => getTireSizeHubCategories(entry).includes(slug))
    .map((entry) => {
      const products = getProductsForTireSize(entry.size);
      return {
        entry,
        href: hubPagePath(entry.size),
        diameterIn: getTireSpecs(entry.size).overallDiameterIn,
        productCount: products.length,
        matchingProductCount: products.filter((product) =>
          productSupportsTireHubCategory(product, slug),
        ).length,
      };
    })
    .sort(
      (a, b) =>
        b.matchingProductCount - a.matchingProductCount ||
        b.productCount - a.productCount ||
        a.diameterIn - b.diameterIn,
    );

  return {
    ...definition,
    path: tireCategoryHubPath(slug),
    sizes,
    products: getCategoryProducts(slug, sizes),
    comparisons: getCategoryComparisons(sizes),
    calculators: getCategoryCalculators(definition),
  };
}

export function isTireHubCategorySlug(value: string): value is TireHubCategorySlug {
  return TIRE_HUB_CATEGORY_SLUGS.includes(value as TireHubCategorySlug);
}
