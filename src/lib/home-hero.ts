import { TIRE_SIZES } from '../data/tire-sizes';
import { CALCULATOR_PATHS, SITE_CALCULATORS } from './calculator-links';
import { compareTires, getTireSpecs, parseTireSize } from './tire-math';
import { hubPagePath, sizeToSlug, tireSizeCalculatorPath } from './tire-size-url';
import { normalizeTireSizeInput } from './tire-size-validation';

export const HOME_HERO_DEMO_SIZE = '275/70R18';
export const HOME_HERO_REFERENCE_SIZE = '265/70R17';

const KNOWN_HUB_SLUGS = new Set(TIRE_SIZES.map((entry) => sizeToSlug(entry.size)));

const HOME_POPULAR_CANDIDATES = [
  '275/70R18',
  '285/75R16',
  '265/70R17',
  '285/70R17',
] as const;

export function tireSizeHasHubPage(size: string): boolean {
  try {
    const canonical = normalizeTireSizeInput(size);
    parseTireSize(canonical);
    return KNOWN_HUB_SLUGS.has(sizeToSlug(canonical));
  } catch {
    return false;
  }
}

/** Hero “Popular examples” — only sizes with a tire-size hub page. */
export const HOME_POPULAR_SEARCHES = HOME_POPULAR_CANDIDATES.filter(tireSizeHasHubPage);

export interface HomeHeroStats {
  diameter: string;
  width: string;
  revsPerMile: string;
  speedometerError: string;
}

export function buildHomeHeroStats(size: string = HOME_HERO_DEMO_SIZE): HomeHeroStats {
  const specs = getTireSpecs(size);
  const comparison = compareTires(HOME_HERO_REFERENCE_SIZE, size);
  const error = comparison.speedometer.errorPercent;
  const sign = error > 0 ? '+' : '';

  return {
    diameter: `${specs.overallDiameterIn.toFixed(2)} in`,
    width: `${specs.sectionWidthIn.toFixed(2)} in`,
    revsPerMile: specs.revsPerMile.toFixed(1),
    speedometerError: `${sign}${error.toFixed(2)}%`,
  };
}

/** Route calculator/guide queries; returns null when input should be handled as a tire size. */
export function resolveNonTireHomeSearch(query: string): string | null {
  const trimmed = query.trim();
  if (!trimmed) return CALCULATOR_PATHS.tireSize;

  const normalized = trimmed.toLowerCase();

  const calculator = SITE_CALCULATORS.find((calc) => {
    const label = calc.label.toLowerCase();
    const slug = label.replace(/\s+calculator/g, '');
    return (
      label === normalized ||
      label.includes(normalized) ||
      normalized.includes(slug) ||
      normalized.includes(label)
    );
  });
  if (calculator) return calculator.href;

  if (/guide|tire sizes|sizes/i.test(normalized)) return '/tire-sizes';

  try {
    const canonical = normalizeTireSizeInput(trimmed);
    parseTireSize(canonical);
    return null;
  } catch {
    return null;
  }
}

function resolveTireSizeSearch(size: string): string {
  const canonical = normalizeTireSizeInput(size);
  parseTireSize(canonical);
  const slug = sizeToSlug(canonical);
  if (KNOWN_HUB_SLUGS.has(slug)) {
    return hubPagePath(canonical);
  }
  return tireSizeCalculatorPath(canonical);
}

/** Route a homepage search query to the best matching destination. */
export function resolveHomeSearch(query: string): string {
  const trimmed = query.trim();
  if (!trimmed) return CALCULATOR_PATHS.tireSize;

  const nonTire = resolveNonTireHomeSearch(trimmed);
  if (nonTire) return nonTire;

  try {
    return resolveTireSizeSearch(trimmed);
  } catch {
    return tireSizeCalculatorPath(trimmed);
  }
}

export function popularSearchHref(size: string): string {
  if (tireSizeHasHubPage(size)) {
    return hubPagePath(normalizeTireSizeInput(size));
  }
  return tireSizeCalculatorPath(size);
}

export const HOME_QUICK_ACTIONS = [
  {
    title: 'Size Calculator',
    description: 'Convert tire size into diameter, width, and revs per mile',
    href: CALCULATOR_PATHS.tireSize,
    icon: 'size' as const,
  },
  {
    title: 'Comparison',
    description: 'Compare two tire sizes side by side',
    href: CALCULATOR_PATHS.tireComparison,
    icon: 'compare' as const,
  },
  {
    title: 'Diameter Calculator',
    description: 'Calculate diameter, circumference and revolutions per mile',
    href: CALCULATOR_PATHS.tireDiameter,
    icon: 'diameter' as const,
  },
  {
    title: 'Wheel Offset',
    description: 'Calculate offset, backspacing and clearance',
    href: CALCULATOR_PATHS.wheelOffset,
    icon: 'offset' as const,
  },
  {
    title: 'Gear Ratio Calculator',
    description: 'Find the ideal gear ratio after changing tire size',
    href: CALCULATOR_PATHS.gearRatio,
    icon: 'gear' as const,
  },
] as const;
