import { TIRE_SIZES } from '../data/tire-sizes';
import { hubPagePath, tireSizeCalculatorPath } from './tire-size-url';

export interface NavCalculatorItem {
  emoji: string;
  label: string;
  description: string;
  href: string;
}

export const NAV_CALCULATORS: readonly NavCalculatorItem[] = [
  {
    emoji: '🧮',
    label: 'Tire Size Calculator',
    description: 'Convert metric tire sizes into diameter, width and circumference.',
    href: '/calculators/tire-size-calculator',
  },
  {
    emoji: '⚖️',
    label: 'Tire Comparison Calculator',
    description: 'Compare two tire sizes side-by-side.',
    href: '/calculators/tire-comparison-calculator',
  },
  {
    emoji: '📏',
    label: 'Tire Diameter Calculator',
    description: 'Find overall tire diameter and matching tire sizes.',
    href: '/calculators/tire-diameter-calculator',
  },
  {
    emoji: '⚙️',
    label: 'Gear Ratio Calculator',
    description: 'Calculate ideal axle gearing after changing tire sizes.',
    href: '/calculators/gear-ratio-calculator',
  },
  {
    emoji: '🛞',
    label: 'Wheel Offset Calculator',
    description: 'Visualize wheel position and fitment.',
    href: '/calculators/wheel-offset-calculator',
  },
] as const;

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
    href: '/calculators/wheel-offset-calculator',
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
  href: '/calculators/tire-comparison-calculator',
} as const;

export const NAV_ABOUT = {
  label: 'About',
  href: '/about',
} as const;

export const NAV_CONTACT = {
  label: 'Contact',
  href: '/contact',
} as const;

export const NAV_ALL_TIRE_SIZES_HREF = '/tire-sizes';

/** Determine which primary nav item is active for a pathname. */
export function getActiveNavItem(pathname: string): string | null {
  if (pathname === NAV_ABOUT.href) {
    return 'about';
  }
  if (pathname === NAV_CONTACT.href) {
    return 'contact';
  }
  if (pathname.startsWith('/compare/') || pathname === '/calculators/tire-comparison-calculator') {
    return 'compare';
  }
  if (pathname === '/calculators/wheel-offset-calculator') {
    return 'fitment';
  }
  if (
    pathname.includes('calculator') ||
    pathname.startsWith('/calculators/')
  ) {
    return 'calculators';
  }
  if (pathname.startsWith('/tire-size/') || pathname === '/tire-sizes') {
    return 'tire-sizes';
  }
  return null;
}
