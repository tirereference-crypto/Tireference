/** URL slug helpers for tire size hub pages. */

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
  const params = new URLSearchParams({
    current: sizeA,
    new: sizeB,
  });
  return `/calculators/tire-comparison-calculator?${params.toString()}`;
}

/** Open comparison with the selected size as the current tire. */
export function comparisonPagePathCurrent(size: string): string {
  const params = new URLSearchParams({ current: size });
  return `/calculators/tire-comparison-calculator?${params.toString()}`;
}

/** Open tire size calculator with the size pre-filled. */
export function tireSizeCalculatorPath(size: string): string {
  const params = new URLSearchParams({ size });
  return `/calculators/tire-size-calculator?${params.toString()}`;
}
