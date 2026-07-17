import { TIRE_SIZES } from '../data/tire-sizes';
import { buildCuratedPopularComparisons } from './tire-comparison-links';
import { hubPagePath, tireSizeCalculatorPath } from './tire-size-url';

export const HOME_POPULAR_TIRE_SIZES = [
  '275/70R18',
  '285/75R16',
  '265/70R17',
  '285/70R17',
  '315/70R17',
  '305/70R18',
  '275/65R18',
  '225/45R17',
] as const;

function sizeHasHubPage(size: string): boolean {
  const key = normalizeSizeKey(size);
  if (hubSizeSet.has(key)) return true;
  const withoutLt = key.startsWith('LT') ? key.slice(2) : null;
  return Boolean(withoutLt && hubSizeSet.has(withoutLt));
}

export type HomeCategorySlug =
  | 'passenger'
  | 'suv'
  | 'truck'
  | 'off-road'
  | 'performance'
  | 'winter'
  | 'ev'
  | 'touring';

/**
 * Representative hub size for a homepage browse card.
 * Must exist in TIRE_SIZES so hubPagePath resolves to a real page.
 */
const HOME_CATEGORY_HUB_SIZES = {
  passenger: '205/55R16',
  suv: '235/65R17',
  truck: '285/75R16',
  'off-road': '275/70R18',
  performance: '225/45R17',
  /** Closest catalog sizes — no dedicated winter/EV/touring categories. */
  winter: '195/65R15',
  ev: '255/55R19',
  touring: '215/55R17',
} as const satisfies Record<HomeCategorySlug, string>;

export type HomeCategoryAccent = 'purple' | 'blue' | 'orange' | 'green' | 'pink' | 'cyan';

export interface HomeCategoryCard {
  title: string;
  description: string;
  slug: HomeCategorySlug;
  /** Individual tire-size hub page for a representative size in the category. */
  href: string;
  icon: HomeCategorySlug;
  accent: HomeCategoryAccent;
  imageSrc: string;
  imageAlt: string;
  imageWidth: number;
  imageHeight: number;
}

/**
 * Eight discovery cards. Each opens a real tire-size hub page for a
 * representative size from that category (never calculators or index anchors).
 */
export const HOME_BROWSE_CATEGORIES: readonly HomeCategoryCard[] = [
  {
    title: 'Passenger',
    description: 'Comfort and everyday driving',
    slug: 'passenger',
    href: hubPagePath(HOME_CATEGORY_HUB_SIZES.passenger),
    icon: 'passenger',
    accent: 'blue',
    imageSrc: '/images/home/categories/passenger.jpg',
    imageAlt: 'Everyday sedan parked on a quiet street',
    imageWidth: 960,
    imageHeight: 640,
  },
  {
    title: 'SUV',
    description: 'All-road confidence and versatility',
    slug: 'suv',
    href: hubPagePath(HOME_CATEGORY_HUB_SIZES.suv),
    icon: 'suv',
    accent: 'green',
    imageSrc: '/images/home/categories/suv.jpg',
    imageAlt: 'Modern SUV suited to all-road driving',
    imageWidth: 960,
    imageHeight: 640,
  },
  {
    title: 'Truck',
    description: 'Towing, hauling and work',
    slug: 'truck',
    href: hubPagePath(HOME_CATEGORY_HUB_SIZES.truck),
    icon: 'truck',
    accent: 'orange',
    imageSrc: '/images/home/categories/truck.jpg',
    imageAlt: 'Pickup truck for towing and work use',
    imageWidth: 960,
    imageHeight: 640,
  },
  {
    title: 'Off-Road',
    description: 'Trails, rocks and rough terrain',
    slug: 'off-road',
    href: hubPagePath(HOME_CATEGORY_HUB_SIZES['off-road']),
    icon: 'off-road',
    accent: 'purple',
    imageSrc: '/images/home/categories/off-road.jpg',
    imageAlt: 'Lifted trail vehicle for off-road driving',
    imageWidth: 960,
    imageHeight: 640,
  },
  {
    title: 'Performance',
    description: 'Grip, precision and speed',
    slug: 'performance',
    href: hubPagePath(HOME_CATEGORY_HUB_SIZES.performance),
    icon: 'performance',
    accent: 'pink',
    imageSrc: '/images/home/categories/performance.jpg',
    imageAlt: 'Sports coupe on a winding road',
    imageWidth: 960,
    imageHeight: 640,
  },
  {
    title: 'Winter',
    description: 'Snow and cold-weather control',
    slug: 'winter',
    href: hubPagePath(HOME_CATEGORY_HUB_SIZES.winter),
    icon: 'winter',
    accent: 'cyan',
    imageSrc: '/images/home/categories/winter.jpg',
    imageAlt: 'Vehicle driving on a snowy winter road',
    imageWidth: 960,
    imageHeight: 640,
  },
  {
    title: 'EV',
    description: 'Efficiency, load and quiet driving',
    slug: 'ev',
    href: hubPagePath(HOME_CATEGORY_HUB_SIZES.ev),
    icon: 'ev',
    accent: 'blue',
    imageSrc: '/images/home/categories/ev.jpg',
    imageAlt: 'Modern electric vehicle at a charging station',
    imageWidth: 960,
    imageHeight: 640,
  },
  {
    title: 'Touring',
    description: 'Long-distance comfort',
    slug: 'touring',
    href: hubPagePath(HOME_CATEGORY_HUB_SIZES.touring),
    icon: 'touring',
    accent: 'purple',
    imageSrc: '/images/home/categories/touring.jpg',
    imageAlt: 'Car on a long scenic highway',
    imageWidth: 960,
    imageHeight: 640,
  },
] as const;

const hubSizeSet = new Set(TIRE_SIZES.map((entry) => entry.size.toUpperCase()));

function normalizeSizeKey(size: string): string {
  return size.trim().toUpperCase();
}

/** Resolve a homepage popular size to its best destination. */
export function popularTireSizeHref(size: string): string {
  const key = normalizeSizeKey(size);
  if (hubSizeSet.has(key)) return hubPagePath(size);

  const withoutLt = key.startsWith('LT') ? key.slice(2) : null;
  if (withoutLt && hubSizeSet.has(withoutLt)) return hubPagePath(withoutLt);

  return tireSizeCalculatorPath(size);
}

export interface PopularTireSizeCard {
  size: string;
  href: string;
}

export function buildPopularTireSizeCards(): PopularTireSizeCard[] {
  return HOME_POPULAR_TIRE_SIZES.filter(sizeHasHubPage).map((size) => ({
    size,
    href: popularTireSizeHref(size),
  }));
}

export interface PopularComparisonCard {
  label: string;
  href: string;
}

export function buildPopularComparisonCards(limit = 5): PopularComparisonCard[] {
  return buildCuratedPopularComparisons(limit).map(({ label, href }) => ({ label, href }));
}

export type HomeTrustIconName =
  | 'verified'
  | 'fitment'
  | 'fast'
  | 'free'
  | 'privacy'
  | 'signup';

export interface HomeTrustCard {
  title: string;
  description: string;
  icon: HomeTrustIconName;
}

/** Slim trust points for the homepage trust panel (no OEM fitment claims). */
export const HOME_TRUST_PANEL: readonly HomeTrustCard[] = [
  {
    title: 'Accurate Formulas',
    description: 'Clear calculations based on established tire and wheel geometry.',
    icon: 'verified',
  },
  {
    title: 'No Signup Required',
    description: 'Use every calculator instantly without creating an account.',
    icon: 'signup',
  },
  {
    title: 'Built for Real-World Decisions',
    description: 'Practical comparisons for everyday drivers and enthusiasts.',
    icon: 'fast',
  },
] as const;

/** @deprecated Prefer HOME_TRUST_PANEL on the redesigned homepage. */
export const HOME_TRUST_CARDS = HOME_TRUST_PANEL;
