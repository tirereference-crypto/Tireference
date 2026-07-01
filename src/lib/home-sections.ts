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
  'LT265/75R16',
  '275/65R18',
] as const;

function sizeHasHubPage(size: string): boolean {
  const key = normalizeSizeKey(size);
  if (hubSizeSet.has(key)) return true;
  const withoutLt = key.startsWith('LT') ? key.slice(2) : null;
  return Boolean(withoutLt && hubSizeSet.has(withoutLt));
}

export type HomeCategorySlug =
  | 'suv'
  | 'truck'
  | 'off-road'
  | 'passenger'
  | 'performance';

export interface HomeCategoryCard {
  title: string;
  description: string;
  slug: HomeCategorySlug;
  /** Placeholder until dedicated category pages ship. */
  href: string;
  icon: HomeCategorySlug;
}

export const HOME_BROWSE_CATEGORIES: readonly HomeCategoryCard[] = [
  {
    title: 'SUV Tires',
    description: 'Crossover and SUV fitments with taller sidewalls and load ratings.',
    slug: 'suv',
    href: '/tire-sizes#SUV',
    icon: 'suv',
  },
  {
    title: 'Truck Tires',
    description: 'Light-truck sizes for towing, payload, and daily driving.',
    slug: 'truck',
    href: '/tire-sizes#light-truck',
    icon: 'truck',
  },
  {
    title: 'Off-Road Tires',
    description: 'All-terrain and mud sizes for trail and overland builds.',
    slug: 'off-road',
    href: '/tire-sizes#off-road',
    icon: 'off-road',
  },
  {
    title: 'Passenger Cars',
    description: 'OEM and plus-size options for sedans, hatchbacks, and coupes.',
    slug: 'passenger',
    href: '/tire-sizes#passenger',
    icon: 'passenger',
  },
  {
    title: 'Performance Cars',
    description: 'Low-profile fitments focused on grip, response, and stance.',
    slug: 'performance',
    href: '/tire-sizes#performance',
    icon: 'performance',
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

export function buildPopularComparisonCards(): PopularComparisonCard[] {
  return buildCuratedPopularComparisons(8).map(({ label, href }) => ({ label, href }));
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

export const HOME_TRUST_CARDS: readonly HomeTrustCard[] = [
  {
    title: 'Accurate & Verified',
    description: 'Calculations use standard tire math with specs cross-checked against our size library.',
    icon: 'verified',
  },
  {
    title: 'Real World Fitment',
    description: 'OEM fitment data connects factory tire sizes to the vehicles that actually use them.',
    icon: 'fitment',
  },
  {
    title: 'Fast Calculations',
    description: 'Get diameter, comparison, and gearing answers instantly — no waiting on page loads.',
    icon: 'fast',
  },
  {
    title: '100% Free',
    description: 'Every calculator and size guide on Tire Reference is free to use with no paywalls.',
    icon: 'free',
  },
  {
    title: 'Privacy First',
    description: 'Your searches stay in the browser. We do not sell vehicle or tire lookup data.',
    icon: 'privacy',
  },
  {
    title: 'No Signup Required',
    description: 'Open a calculator and start typing. No account, email, or install required.',
    icon: 'signup',
  },
] as const;
