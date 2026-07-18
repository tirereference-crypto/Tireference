/**
 * Redirect resolution for legacy parameterized comparison URLs.
 *
 * `/calculators/tire-comparison-calculator/?current=A&new=B` is a legacy URL
 * shape that duplicates the indexable `/compare/a-vs-b/` pages. When both
 * sizes are valid and the pair has a published `/compare/` page, the request
 * must 301 to that clean URL. Invalid or partial legacy params must never
 * silently render the default comparison — they redirect to the blank
 * calculator (or a prefilled one when a single valid size is provided).
 *
 * Consumed by the Cloudflare Pages Function (edge 301s), light client islands,
 * and the calculator island as a client-side fallback for dev and
 * non-Cloudflare hosting. Published pages come from a build-time allowlist
 * (see scripts/generate-comparison-slugs.ts) so this module never imports the
 * heavy hub/insights chain.
 *
 * Loop safety: redirect targets only ever use the canonical `from`/`to`
 * params (or no params at all), and valid `from`/`to` never trigger a
 * redirect, so a redirected request can never redirect again.
 */
import publishedComparisonSlugs from '../data/generated/comparison-slug-allowlist.json';
import {
  canonicalComparisonPath,
  comparisonSlugFromSizes,
} from './comparison-url';
import { normalizeTireSize } from './tire-size-primitives';

/** Blank interactive comparison calculator (trailing slash, no query). */
export const COMPARISON_CALCULATOR_PATH =
  '/calculators/tire-comparison-calculator/';

/**
 * Build non-indexable interactive calculator state for pairs without a clean
 * page. Uses canonical `from`/`to`/`third` query keys — never `current`/`new`.
 */
export function comparisonCalculatorPath(
  from?: string | null,
  to?: string | null,
  third?: string | null,
): string {
  const params = new URLSearchParams();
  const normalizedFrom = normalizeTireSize(from);
  const normalizedTo = normalizeTireSize(to);
  const normalizedThird = normalizeTireSize(third);
  if (normalizedFrom) params.set('from', normalizedFrom);
  if (normalizedTo) params.set('to', normalizedTo);
  if (normalizedThird) params.set('third', normalizedThird);
  const search = params.toString();
  return search ? `${COMPARISON_CALCULATOR_PATH}?${search}` : COMPARISON_CALCULATOR_PATH;
}

const PUBLISHED_COMPARISON_SLUGS = new Set<string>(publishedComparisonSlugs);

export type ComparisonRedirect =
  | { type: 'none' }
  | { type: 'redirect'; location: string };

/**
 * Normalize a raw query-param tire size: trims, uppercases (lowercase `r`),
 * collapses spaces/dashes. URL-decoded input is expected (URLSearchParams
 * already decodes `%2F`). Returns null for malformed sizes.
 *
 * @deprecated Prefer normalizeTireSize from tire-size-primitives — this
 * wrapper only exists for existing redirect call sites.
 */
export function normalizeComparisonSizeParam(raw: string | null | undefined): string | null {
  return normalizeTireSize(raw);
}

/** Clean `/compare/…/` path when the pair has a published page, else null. */
export function publishedComparePath(sizeA: string, sizeB: string): string | null {
  const slug = comparisonSlugFromSizes(sizeA, sizeB);
  return PUBLISHED_COMPARISON_SLUGS.has(slug)
    ? canonicalComparisonPath(sizeA, sizeB)
    : null;
}

function blankCalculator(): ComparisonRedirect {
  return { type: 'redirect', location: COMPARISON_CALCULATOR_PATH };
}

/**
 * Decide whether a request to the comparison calculator must be redirected.
 *
 * - `?current=A&new=B` with a published pair → `/compare/a-vs-b/`
 * - `?current=A&new=B` valid but unpublished pair → calculator `?from=A&to=B`
 * - same-size, malformed, or empty legacy params → blank calculator
 * - a single valid legacy param → calculator prefilled with that size
 * - malformed `from`/`to` params → blank calculator (no silent defaults)
 * - no params, or valid `from`/`to` state → no redirect
 */
export function resolveComparisonRedirect(
  search: string | URLSearchParams,
): ComparisonRedirect {
  const params = typeof search === 'string' ? new URLSearchParams(search) : search;

  const currentRaw = params.get('current');
  const newRaw = params.get('new');

  if (currentRaw != null || newRaw != null) {
    const current = normalizeComparisonSizeParam(currentRaw);
    const next = normalizeComparisonSizeParam(newRaw);

    // Any provided-but-malformed legacy param → blank calculator.
    if ((currentRaw != null && !current) || (newRaw != null && !next)) {
      return blankCalculator();
    }

    if (current && next) {
      // Same-size comparisons have no page and nothing to compare.
      if (current === next) {
        return blankCalculator();
      }
      const published = publishedComparePath(current, next);
      if (published) return { type: 'redirect', location: published };
      // Valid sizes without a published page keep the interactive calculator,
      // prefilled via the canonical from/to params (never re-redirected).
      return {
        type: 'redirect',
        location: comparisonCalculatorPath(current, next),
      };
    }

    const single = current ?? next;
    if (single) {
      const key = current ? 'from' : 'to';
      return {
        type: 'redirect',
        location:
          key === 'from'
            ? comparisonCalculatorPath(single)
            : comparisonCalculatorPath(null, single),
      };
    }
    return blankCalculator();
  }

  // Live from/to params are the calculator's own state; only strip them when
  // malformed so bad shared links never silently render the default comparison.
  const fromRaw = params.get('from');
  const toRaw = params.get('to');
  const fromInvalid = fromRaw != null && !normalizeComparisonSizeParam(fromRaw);
  const toInvalid = toRaw != null && !normalizeComparisonSizeParam(toRaw);
  if (fromInvalid || toInvalid) return blankCalculator();

  return { type: 'none' };
}
