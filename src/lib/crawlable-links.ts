/**
 * Crawlable internal destinations for content navigation.
 * Prefer clean `/compare/…/` and `/tire-size/…/` URLs — never parameterized
 * comparison calculator links in indexable content.
 */

import { CALCULATOR_PATHS } from './calculator-links';
import { publishedComparePath } from './comparison-redirect';
import { buildPopularComparisonsForSize } from './tire-comparison-links';
import { isValidComparisonPair } from './tire-comparison-validation';
import { hubPagePath } from './tire-size-url';
import { hasTireSizeGuide } from './has-tire-size-guide';

/** True when an href uses comparison-calculator query params. */
export function isParameterizedComparisonUrl(href: string): boolean {
  try {
    const url = new URL(href, 'https://tirereference.com');
    if (!url.pathname.replace(/\/+$/, '').endsWith('/calculators/tire-comparison-calculator')) {
      return false;
    }
    return (
      url.searchParams.has('from') ||
      url.searchParams.has('to') ||
      url.searchParams.has('current') ||
      url.searchParams.has('new')
    );
  } catch {
    return /[?&](from|to|current|new)=/i.test(href);
  }
}

/**
 * Indexable comparison URL when a published `/compare/` page exists.
 * Never returns a parameterized calculator URL.
 */
export function crawlableComparisonPath(sizeA: string, sizeB: string): string | null {
  if (!isValidComparisonPair(sizeA, sizeB)) return null;
  return publishedComparePath(sizeA, sizeB);
}

export interface PreferredSizeCompareLink {
  href: string;
  label: string;
  /** True when href is a published pair page (not the blank calculator). */
  isPublishedPair: boolean;
}

/**
 * Best crawlable “compare this size” destination:
 * 1. First popular published comparison for the size
 * 2. Blank comparison calculator (no query params)
 */
export function preferredSizeCompareLink(size: string): PreferredSizeCompareLink {
  const popular = buildPopularComparisonsForSize(size, 1)[0];
  if (popular?.href && !isParameterizedComparisonUrl(popular.href)) {
    return {
      href: popular.href,
      label: popular.label,
      isPublishedPair: true,
    };
  }
  return {
    href: CALCULATOR_PATHS.tireComparison,
    label: `Compare ${size} with another size`,
    isPublishedPair: false,
  };
}

/** Crawlable tire-size hub when the guide page exists. */
export function crawlableTireSizeGuidePath(size: string): string | null {
  return hasTireSizeGuide(size) ? hubPagePath(size) : null;
}
