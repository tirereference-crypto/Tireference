/** URL slug helpers for tire size hub pages. */
import { CALCULATOR_PATHS, calculatorPathWithQuery } from './calculator-links';

/** "275/70R18" → "275-70r18" */
export function sizeToSlug(size: string): string {
  return size.trim().toLowerCase().replace(/\//g, '-');
}

/** "275-70r18" → "275/70R18" (normalized metric) */
export function slugToSize(slug: string): string | null {
  const match = slug
    .trim()
    .toLowerCase()
    .match(/^(?:(lt|p))?(\d+)-(\d+)r(\d+(?:\.\d+)?)$/);
  if (!match) return null;

  const [, prefix, width, aspect, wheel] = match;
  const p = prefix === 'lt' ? 'LT' : prefix === 'p' ? 'P' : '';
  return `${p}${width}/${aspect}R${wheel}`;
}

export function hubPagePath(size: string): string {
  return `/tire-size/${sizeToSlug(size)}`;
}

export function comparisonPagePath(sizeA: string, sizeB: string): string {
  return calculatorPathWithQuery(CALCULATOR_PATHS.tireComparison, {
    current: sizeA,
    new: sizeB,
  });
}

/** Open comparison with the selected size as the current tire. */
export function comparisonPagePathCurrent(size: string): string {
  return calculatorPathWithQuery(CALCULATOR_PATHS.tireComparison, { current: size });
}

/** Open tire size calculator with the size pre-filled. */
export function tireSizeCalculatorPath(size: string): string {
  return calculatorPathWithQuery(CALCULATOR_PATHS.tireSize, { size });
}
