/**
 * Layer 2: pure comparison URL primitives.
 *
 * Responsible only for canonical pair ordering, comparison slug create/parse,
 * path creation with trailing-slash normalization, absolute URL creation when
 * an origin is supplied, and reversed-pair detection.
 *
 * May import only Layer 1 (`tire-size-primitives`). Must not import content,
 * links, insights, or page modules.
 *
 * Published path convention: `/compare/205-55-r16-vs-215-55-r17/`
 */

import {
  parseSizeSlug,
  parseTireSize,
  type ParsedTireSize,
} from './tire-size-primitives';

export type {
  ComparisonTireSizeType,
  ParsedComparisonTireSize,
  ParsedTireSize,
} from './tire-size-primitives';

export {
  formatComparisonTireSize,
  formatDisplaySize,
  formatSizeSlug,
  isValidComparisonTireSize,
  isValidTireSize,
  normalizeComparisonTireSize,
  normalizeTireSize,
  parseComparisonTireSize,
  parseSizeSlug,
  parseTireSize,
  parseTireSizeComparisonSlug,
  tireSizeComparisonSlug,
} from './tire-size-primitives';

export interface OrderedComparisonPair {
  current: string;
  new: string;
}

export interface ParsedComparisonSlug {
  requested: OrderedComparisonPair;
  canonical: OrderedComparisonPair;
  canonicalSlug: string;
  canonicalPath: string;
  isCanonical: boolean;
}

export interface CanonicalComparisonPair {
  /** Canonical first size (normalized display value, e.g. `225/45R17`). */
  current: string;
  /** Canonical second size. */
  new: string;
  /** Canonical comparison slug, e.g. `225-45-r17-vs-235-40-r18`. */
  slug: string;
  /** Canonical site-relative path with the required trailing slash. */
  path: string;
  /**
   * Absolute URL when an origin was supplied to the builder; otherwise empty.
   * Prefer `canonicalComparisonUrl(a, b, origin)` for absolute URLs.
   */
  url: string;
  /** True when the caller's input order was reversed to become canonical. */
  wasReversed: boolean;
}

const COMPARE_PREFIX = '/compare/';
const VS_MARKER = '-vs-';

function compareParsedSizes(first: ParsedTireSize, second: ParsedTireSize): number {
  const dimensions = [
    first.overallDiameterIn - second.overallDiameterIn,
    first.widthMm - second.widthMm,
    first.wheelDiameterIn - second.wheelDiameterIn,
    first.aspectRatio - second.aspectRatio,
  ];
  const materialDifference = dimensions.find((difference) => Math.abs(difference) > 1e-9);
  return materialDifference ?? first.slug.localeCompare(second.slug);
}

/**
 * Normalize a site-relative comparison path to lowercase with exactly one
 * trailing slash and no duplicate slashes. Returns null when the path is not
 * under `/compare/`.
 */
export function normalizeComparisonPath(path: string): string | null {
  const trimmed = path.trim();
  if (!trimmed) return null;

  let pathname = trimmed;
  try {
    if (/^https?:\/\//i.test(trimmed)) {
      pathname = new URL(trimmed).pathname;
    }
  } catch {
    return null;
  }

  const cleaned = pathname.replace(/\/{2,}/g, '/').toLowerCase();
  if (!cleaned.startsWith(COMPARE_PREFIX)) return null;

  const withSlash = cleaned.endsWith('/') ? cleaned : `${cleaned}/`;
  const slug = withSlash.slice(COMPARE_PREFIX.length, -1);
  if (!slug || slug.includes('/')) return null;
  return `${COMPARE_PREFIX}${slug}/`;
}

/**
 * The single shared source of truth for canonical comparison ordering.
 *
 * Normalizes both sizes, orders them deterministically (smaller overall
 * diameter first, then width, wheel, aspect ratio, and finally slug
 * comparison as a stable tie-breaker), and returns every canonical identity
 * a producer needs. Static routes, sitemap entries, canonical tags,
 * breadcrumbs, structured data, internal links, and edge redirects must all
 * flow through this function (directly or via the wrappers below).
 *
 * @param origin When supplied, `url` is the absolute canonical URL on that origin.
 */
export function getCanonicalComparisonPair(
  sizeA: string,
  sizeB: string,
  origin?: string,
): CanonicalComparisonPair {
  const first = parseTireSize(sizeA);
  const second = parseTireSize(sizeB);
  if (!first || !second) {
    throw new Error(`Invalid comparison tire sizes: "${sizeA}" and "${sizeB}"`);
  }

  const wasReversed = compareParsedSizes(first, second) > 0;
  const current = wasReversed ? second : first;
  const next = wasReversed ? first : second;
  const slug = `${current.slug}${VS_MARKER}${next.slug}`;
  const path = `${COMPARE_PREFIX}${slug}/`;

  return {
    current: current.normalized,
    new: next.normalized,
    slug,
    path,
    url: origin ? new URL(path, origin).toString() : '',
    wasReversed,
  };
}

/**
 * Preferred direction for one indexable comparison:
 * smaller overall diameter first, then width, wheel, aspect ratio, and slug.
 */
export function orderComparisonSizes(sizeA: string, sizeB: string): OrderedComparisonPair {
  const pair = getCanonicalComparisonPair(sizeA, sizeB);
  return { current: pair.current, new: pair.new };
}

export function comparisonSlugFromSizes(sizeA: string, sizeB: string): string {
  return getCanonicalComparisonPair(sizeA, sizeB).slug;
}

export function canonicalComparisonPath(sizeA: string, sizeB: string): string {
  return getCanonicalComparisonPair(sizeA, sizeB).path;
}

/**
 * Absolute canonical comparison URL on the supplied origin.
 * Defaults to the production site origin for existing schema/canonical callers.
 */
export function canonicalComparisonUrl(
  sizeA: string,
  sizeB: string,
  origin = 'https://tirereference.com',
): string {
  return getCanonicalComparisonPair(sizeA, sizeB, origin).url;
}

/** Parse a comparison slug and report whether its order is canonical. */
export function parseComparisonSlug(slug: string): ParsedComparisonSlug | null {
  const normalizedSlug = slug.trim().replace(/^\/+|\/+$/g, '').toLowerCase();
  const markerIndex = normalizedSlug.indexOf(VS_MARKER);
  if (
    markerIndex <= 0 ||
    normalizedSlug.indexOf(VS_MARKER, markerIndex + VS_MARKER.length) !== -1
  ) {
    return null;
  }

  const first = parseSizeSlug(normalizedSlug.slice(0, markerIndex));
  const second = parseSizeSlug(normalizedSlug.slice(markerIndex + VS_MARKER.length));
  if (!first || !second || first.normalized === second.normalized) return null;

  const pair = getCanonicalComparisonPair(first.normalized, second.normalized);

  return {
    requested: { current: first.normalized, new: second.normalized },
    canonical: { current: pair.current, new: pair.new },
    canonicalSlug: pair.slug,
    canonicalPath: pair.path,
    isCanonical: normalizedSlug === pair.slug,
  };
}

/** True when the input path/slug is a reversed (non-canonical) comparison pair. */
export function isReversedComparisonSlug(slugOrPath: string): boolean {
  const slug = slugOrPath
    .trim()
    .replace(/^\/+|\/+$/g, '')
    .replace(/^compare\//i, '')
    .toLowerCase();
  const parsed = parseComparisonSlug(slug);
  return Boolean(parsed && !parsed.isCanonical);
}
