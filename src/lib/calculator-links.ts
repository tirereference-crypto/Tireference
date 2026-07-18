/** Canonical registry of calculator tools that exist on Tire Reference. */

export type CalculatorIcon = 'size' | 'compare' | 'diameter' | 'offset' | 'gear' | 'speedometer';

export type CalculatorPublicationStatus = 'published' | 'hidden' | 'deprecated';

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

export interface CalculatorRegistryEntry extends CalculatorLink {
  id: CalculatorPathKey;
  status: CalculatorPublicationStatus;
  /**
   * Related-tool priority when recommending calculators on other tool pages.
   * Lower number = higher priority. Only published tools with a priority appear.
   */
  relatedPriority: number | null;
}

export type RelatedCalculatorItem = Pick<CalculatorLink, 'label' | 'description' | 'href'>;

/**
 * Single source of truth for implemented calculator routes.
 * Do not list tools that lack a real page. Mark unused tools hidden/deprecated
 * instead of inventing dead links in UI components.
 */
export const CALCULATOR_REGISTRY: readonly CalculatorRegistryEntry[] = [
  {
    id: 'tireSize',
    label: 'Tire Size Calculator',
    description: 'Convert metric tire size into diameter, width, and revolutions per mile',
    href: CALCULATOR_PATHS.tireSize,
    icon: 'size',
    status: 'published',
    relatedPriority: 1,
  },
  {
    id: 'tireComparison',
    label: 'Tire Comparison Calculator',
    description: 'Compare two tire sizes with fitment score and diameter change',
    href: CALCULATOR_PATHS.tireComparison,
    icon: 'compare',
    status: 'published',
    relatedPriority: 2,
  },
  {
    id: 'tireDiameter',
    label: 'Tire Diameter Calculator',
    description: 'Reverse-search tire sizes by target overall diameter',
    href: CALCULATOR_PATHS.tireDiameter,
    icon: 'diameter',
    status: 'published',
    relatedPriority: 3,
  },
  {
    id: 'wheelOffset',
    label: 'Wheel Offset Calculator',
    description: 'Compare offset, poke, and clearance before buying wheels',
    href: CALCULATOR_PATHS.wheelOffset,
    icon: 'offset',
    status: 'published',
    relatedPriority: 5,
  },
  {
    id: 'gearRatio',
    label: 'Gear Ratio Calculator',
    description: 'Find ideal differential gears after changing tire size',
    href: CALCULATOR_PATHS.gearRatio,
    icon: 'gear',
    status: 'published',
    relatedPriority: 6,
  },
] as const;

/** @deprecated Prefer getPublishedCalculators() — kept for existing imports. */
export const SITE_CALCULATORS: readonly CalculatorLink[] = CALCULATOR_REGISTRY.filter(
  (calc) => calc.status === 'published',
).map(({ label, description, href, icon }) => ({ label, description, href, icon }));

/** Published, non-deprecated calculators with real routes. */
export function getPublishedCalculators(): CalculatorRegistryEntry[] {
  return CALCULATOR_REGISTRY.filter((calc) => calc.status === 'published');
}

/** Full calculator registry (including hidden/deprecated entries, if any). */
export function getCalculatorRegistry(): readonly CalculatorRegistryEntry[] {
  return CALCULATOR_REGISTRY;
}

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

export interface RelatedCalculatorOptions {
  /** Max cards to return (default 6). */
  limit?: number;
}

function relatedFromRegistry(
  excludeHref: string | undefined,
  options?: RelatedCalculatorOptions,
): CalculatorRegistryEntry[] {
  const normalizedExclude = excludeHref ? normalizeCalculatorHref(excludeHref) : undefined;
  const limit = options?.limit ?? 6;

  return getPublishedCalculators()
    .filter((calc) => calc.href !== normalizedExclude)
    .filter((calc) => calc.relatedPriority != null)
    .sort((a, b) => (a.relatedPriority ?? 99) - (b.relatedPriority ?? 99))
    .slice(0, limit);
}

/** Related calculators for a page, excluding the current tool. */
export function getRelatedCalculators(
  excludeHref?: string,
  options?: RelatedCalculatorOptions,
): RelatedCalculatorItem[] {
  return relatedFromRegistry(excludeHref, options).map(({ label, description, href }) => ({
    label,
    description,
    href,
  }));
}

/** Full calculator metadata (includes icons) for related-tool sidebars. */
export function getRelatedCalculatorLinks(
  excludeHref?: string,
  options?: RelatedCalculatorOptions,
): CalculatorLink[] {
  return relatedFromRegistry(excludeHref, options).map(
    ({ label, description, href, icon }) => ({ label, description, href, icon }),
  );
}
