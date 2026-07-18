import { TIRE_SIZES } from '../data/tire-sizes';
import { CALCULATOR_PATHS, SITE_CALCULATORS } from './calculator-links';
import { hubPagePath, tireSizeCalculatorPath } from './tire-size-url';

export interface NavCalculatorItem {
  emoji: string;
  label: string;
  description: string;
  href: string;
}

const NAV_CALCULATOR_META: readonly Omit<NavCalculatorItem, 'href'>[] = [
  {
    emoji: '🧮',
    label: 'Tire Size Calculator',
    description: 'Convert metric tire sizes into diameter, width and circumference.',
  },
  {
    emoji: '⚖️',
    label: 'Tire Comparison Calculator',
    description: 'Compare two tire sizes side-by-side.',
  },
  {
    emoji: '📏',
    label: 'Tire Diameter Calculator',
    description: 'Find overall tire diameter and matching tire sizes.',
  },
  {
    emoji: '🛞',
    label: 'Wheel Offset Calculator',
    description: 'Visualize wheel position and fitment.',
  },
  {
    emoji: '⚙️',
    label: 'Gear Ratio Calculator',
    description: 'Calculate ideal axle gearing after changing tire sizes.',
  },
] as const;

export const NAV_CALCULATORS: readonly NavCalculatorItem[] = SITE_CALCULATORS.map((calc, index) => {
  const meta = NAV_CALCULATOR_META[index];
  if (!meta || meta.label !== calc.label) {
    throw new Error(
      `NAV_CALCULATOR_META order must match SITE_CALCULATORS (mismatch at index ${index}: expected "${calc.label}", got "${meta?.label ?? 'undefined'}").`,
    );
  }
  return {
    ...meta,
    href: calc.href,
  };
});

export const NAV_POPULAR_TIRE_SIZE_LABELS = [
  '275/70R18',
  '285/70R17',
  '285/75R16',
  '265/70R17',
  '33x12.50R17',
  '35x12.50R20',
] as const;

const hubSizeSet = new Set(TIRE_SIZES.map((entry) => entry.size.toUpperCase()));

function navTireSizeHref(size: string): string {
  const key = size.trim().toUpperCase();
  if (hubSizeSet.has(key)) return hubPagePath(size);

  const withoutLt = key.startsWith('LT') ? key.slice(2) : null;
  if (withoutLt && hubSizeSet.has(withoutLt)) return hubPagePath(withoutLt);

  return tireSizeCalculatorPath(size);
}

export function buildNavPopularTireSizes() {
  return NAV_POPULAR_TIRE_SIZE_LABELS.map((size) => ({
    size,
    href: navTireSizeHref(size),
  }));
}

export const NAV_FITMENT_ITEMS = [
  {
    label: 'Wheel Offset Calculator',
    description: 'Visualize wheel position and fitment.',
    href: CALCULATOR_PATHS.wheelOffset,
  },
] as const;

export interface NavSearchExample {
  label: string;
  query: string;
}

export const NAV_SEARCH_EXAMPLES: readonly NavSearchExample[] = [
  { label: '275/70R18', query: '275/70R18' },
  { label: '285/75R16', query: '285/75R16' },
  { label: 'Wheel Offset', query: 'wheel offset' },
  { label: 'Gear Ratio', query: 'gear ratio' },
  { label: 'Tire Comparison', query: 'tire comparison' },
] as const;

export const NAV_COMPARE = {
  label: 'Compare Sizes',
  href: CALCULATOR_PATHS.tireComparison,
} as const;

export const NAV_ABOUT = {
  label: 'About',
  href: '/about/',
} as const;

export const NAV_CONTACT = {
  label: 'Contact',
  href: '/contact/',
} as const;

export const NAV_ALL_TIRE_SIZES_HREF = '/tire-sizes/';

/** Strip trailing slashes and query strings for nav path comparison. */
export function normalizeNavPathname(pathname: string): string {
  const base = pathname.split('?')[0].replace(/\/+$/, '') || '/';
  return base;
}

function navPathMatches(pathname: string, target: string): boolean {
  return normalizeNavPathname(pathname) === normalizeNavPathname(target);
}

/** Determine which primary nav item is active for a pathname. */
export function getActiveNavItem(pathname: string): string | null {
  if (navPathMatches(pathname, NAV_ABOUT.href)) {
    return 'about';
  }
  if (navPathMatches(pathname, NAV_CONTACT.href)) {
    return 'contact';
  }
  if (pathname.startsWith('/compare/') || navPathMatches(pathname, CALCULATOR_PATHS.tireComparison)) {
    return 'compare';
  }
  if (navPathMatches(pathname, CALCULATOR_PATHS.wheelOffset)) {
    return 'fitment';
  }
  if (
    pathname.includes('calculator') ||
    pathname.startsWith('/calculators/')
  ) {
    return 'calculators';
  }
  if (
    pathname.startsWith('/tire-size/') ||
    pathname.startsWith('/tire-sizes/') ||
    navPathMatches(pathname, NAV_ALL_TIRE_SIZES_HREF)
  ) {
    return 'tire-sizes';
  }
  return null;
}
