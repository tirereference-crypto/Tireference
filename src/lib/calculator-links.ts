/** Canonical list of calculator tools that exist on TireLogic. */

export type CalculatorIcon = 'size' | 'compare' | 'diameter' | 'offset' | 'gear';

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
    href: '/tire-size-calculator',
    icon: 'size',
  },
  {
    label: 'Tire Comparison Calculator',
    description: 'Compare two tire sizes with fitment score and diameter change',
    href: '/tire-size-comparison',
    icon: 'compare',
  },
  {
    label: 'Tire Diameter Calculator',
    description: 'Reverse-search tire sizes by target overall diameter',
    href: '/tire-diameter-calculator',
    icon: 'diameter',
  },
  {
    label: 'Wheel Offset Calculator',
    description: 'Compare offset, poke, and clearance before buying wheels',
    href: '/wheel-offset-calculator',
    icon: 'offset',
  },
  {
    label: 'Gear Ratio Calculator',
    description: 'Find ideal differential gears after changing tire size',
    href: '/calculators/gear-ratio-calculator',
    icon: 'gear',
  },
] as const;

/** Related calculators for a page, excluding the current tool. */
export function getRelatedCalculators(excludeHref?: string): RelatedCalculatorItem[] {
  return SITE_CALCULATORS.filter((calc) => calc.href !== excludeHref).map(
    ({ label, description, href }) => ({ label, description, href }),
  );
}

/** Full calculator metadata (includes icons) for a page sidebar. */
export function getRelatedCalculatorLinks(excludeHref?: string): CalculatorLink[] {
  return SITE_CALCULATORS.filter((calc) => calc.href !== excludeHref);
}
