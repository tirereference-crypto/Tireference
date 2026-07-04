/** Canonical list of calculator tools that exist on TireLogic. */

export type CalculatorIcon = 'size' | 'compare' | 'diameter' | 'offset' | 'gear';

/** Canonical calculator paths — always /calculators/{slug}/ with trailing slash. */
export const CALCULATOR_PATHS = {
  tireSize: '/calculators/tire-size-calculator/',
  tireComparison: '/calculators/tire-comparison-calculator/',
  tireDiameter: '/calculators/tire-diameter-calculator/',
  wheelOffset: '/calculators/wheel-offset-calculator/',
  gearRatio: '/calculators/gear-ratio-calculator/',
} as const;

export type CalculatorPathKey = keyof typeof CALCULATOR_PATHS;

export interface CalculatorLink {
  label: string;
  description: string;
  href: string;
  icon: CalculatorIcon;
}

export type RelatedCalculatorItem = Pick<CalculatorLink, 'label' | 'description' | 'href'>;

export const SITE_CALCULATORS: readonly CalculatorLink[] = [
  {
    label: 'Tire Size Calculator',
    description: 'Convert metric tire size into diameter, width, and revolutions per mile',
    href: CALCULATOR_PATHS.tireSize,
    icon: 'size',
  },
  {
    label: 'Tire Comparison Calculator',
    description: 'Compare two tire sizes with fitment score and diameter change',
    href: CALCULATOR_PATHS.tireComparison,
    icon: 'compare',
  },
  {
    label: 'Tire Diameter Calculator',
    description: 'Reverse-search tire sizes by target overall diameter',
    href: CALCULATOR_PATHS.tireDiameter,
    icon: 'diameter',
  },
  {
    label: 'Wheel Offset Calculator',
    description: 'Compare offset, poke, and clearance before buying wheels',
    href: CALCULATOR_PATHS.wheelOffset,
    icon: 'offset',
  },
  {
    label: 'Gear Ratio Calculator',
    description: 'Find ideal differential gears after changing tire size',
    href: CALCULATOR_PATHS.gearRatio,
    icon: 'gear',
  },
] as const;

/** Ensure a calculator href uses the canonical trailing-slash form. */
export function normalizeCalculatorHref(href: string): string {
  const [pathname, ...queryParts] = href.split('?');
  const base = pathname.endsWith('/') ? pathname : `${pathname}/`;
  const query = queryParts.length ? `?${queryParts.join('?')}` : '';
  return `${base}${query}`;
}

/** Build a calculator URL with query params after the trailing slash. */
export function calculatorPathWithQuery(
  basePath: string,
  params: Record<string, string> | URLSearchParams,
): string {
  const path = basePath.endsWith('/') ? basePath : `${basePath}/`;
  const search =
    params instanceof URLSearchParams ? params.toString() : new URLSearchParams(params).toString();
  return search ? `${path}?${search}` : path;
}

/** Related calculators for a page, excluding the current tool. */
export function getRelatedCalculators(excludeHref?: string): RelatedCalculatorItem[] {
  const normalizedExclude = excludeHref ? normalizeCalculatorHref(excludeHref) : undefined;
  return SITE_CALCULATORS.filter((calc) => calc.href !== normalizedExclude).map(
    ({ label, description, href }) => ({ label, description, href }),
  );
}

/** Full calculator metadata (includes icons) for a page sidebar. */
export function getRelatedCalculatorLinks(excludeHref?: string): CalculatorLink[] {
  const normalizedExclude = excludeHref ? normalizeCalculatorHref(excludeHref) : undefined;
  return SITE_CALCULATORS.filter((calc) => calc.href !== normalizedExclude);
}
