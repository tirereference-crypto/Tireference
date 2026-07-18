/** Canonical URL helpers for tire-size hub detail pages. */

import { CALCULATOR_PATHS, calculatorPathWithQuery } from './calculator-links';
import { comparisonCalculatorPath } from './comparison-redirect';

/**
 * Valid detail path: `/tire-size/275-70r18/` or `/tire-size/lt265-75r16/`
 */
export const TIRE_SIZE_PATH_RE =
  /^\/tire-size\/(?:lt)?[0-9]+-[0-9]+r[0-9]+(?:\.[0-9]+)?\/$/;

/**
 * Normalize any common tire-size string to the canonical lowercase slug.
 *
 * Examples:
 * - "275/70R18" → "275-70r18"
 * - "275-70R18" → "275-70r18"
 * - "275 70 R18" → "275-70r18"
 * - "275-70-r18" → "275-70r18"
 * - "LT275/70R18" → "lt275-70r18"
 */
export function tireSizeSlug(size: string): string {
  const raw = size.trim().toLowerCase();

  const flexible = raw.match(
    /^(?:(lt|p)[\s-]*)?(\d+)\s*[/\-\s]\s*(\d+)\s*-?\s*r\s*(\d+(?:\.\d+)?)/i,
  );
  if (flexible) {
    const [, prefix, width, aspect, wheel] = flexible;
    return `${(prefix ?? '').toLowerCase()}${width}-${aspect}r${wheel}`;
  }

  // Already-slugged / slash-normalized inputs
  let cleaned = raw.replace(/\s+/g, '').replace(/\//g, '-').replace(/_+/g, '-');
  cleaned = cleaned.replace(/-r(\d)/g, 'r$1');
  cleaned = cleaned.replace(/-+/g, '-');

  const slugMatch = cleaned.match(
    /^(?:(lt|p))?(\d+)-(\d+)r(\d+(?:\.\d+)?)/i,
  );
  if (slugMatch) {
    const [, prefix, width, aspect, wheel] = slugMatch;
    return `${(prefix ?? '').toLowerCase()}${width}-${aspect}r${wheel}`;
  }

  return cleaned;
}

/**
 * Canonical tire-size detail path — always singular `/tire-size/`, lowercase
 * slug, and trailing slash.
 *
 * Example: tireSizePath("275/70R18") → "/tire-size/275-70r18/"
 */
export function tireSizePath(size: string): string {
  return `/tire-size/${tireSizeSlug(size)}/`;
}

/** @deprecated Prefer tireSizeSlug — kept for existing imports. */
export function sizeToSlug(size: string): string {
  return tireSizeSlug(size);
}

/**
 * Canonical hub detail path (alias of tireSizePath).
 * Always returns `/tire-size/{slug}/` with trailing slash.
 */
export function hubPagePath(size: string): string {
  return tireSizePath(size);
}

/** Tire-sizes index (listing) path — not an individual size page. */
export const TIRE_SIZES_INDEX_PATH = '/tire-sizes/';

export function isValidTireSizePath(path: string): boolean {
  return TIRE_SIZE_PATH_RE.test(path);
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

/** Open comparison with both sizes prefilled (no hub validation — always builds URL). */
export function comparisonPagePathUnchecked(sizeA: string, sizeB: string): string {
  return comparisonCalculatorPath(sizeA, sizeB);
}

/** Open comparison with the selected size as the current tire. */
export function comparisonPagePathCurrent(size: string): string {
  return comparisonCalculatorPath(size);
}

/** Open tire size calculator with the size pre-filled. */
export function tireSizeCalculatorPath(size: string): string {
  return calculatorPathWithQuery(CALCULATOR_PATHS.tireSize, { size });
}
