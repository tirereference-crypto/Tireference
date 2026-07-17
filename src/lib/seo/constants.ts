import { SITE_NAME } from '../site-brand';

/** Production site origin — always use for canonicals and absolute URLs. */
export const SITE_URL = 'https://tirereference.com';

export const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.png`;
export const ORGANIZATION_LOGO_URL = `${SITE_URL}/logo.png`;

/** Optional Twitter @handle — omit tag when empty. */
export const TWITTER_SITE = '';

export const SEO_TITLE_SUFFIX = ` | ${SITE_NAME}`;
export const SEO_TITLE_MAX_LENGTH = 60;
export const SEO_DESCRIPTION_MAX_LENGTH = 160;

export const SEO_TITLES = {
  homepage:
    'Tire Reference | Tire Size Calculators, Wheel Fitment & Comparison Tools',
} as const;

export const SEO_DESCRIPTIONS = {
  homepage:
    'Professional tire size calculators, wheel fitment tools, tire comparison calculators and expert guides to help you choose the right tires.',
  /** Generic calculator fallback (kept for backward compatibility). */
  calculator:
    'Calculate tire dimensions, diameter, sidewall height, revs per mile and compare tire sizes instantly.',
  tireSizeCalculator:
    'Calculate tire diameter, section width, sidewall height, circumference and revs per mile for any tire size, then compare metric and inch sizes instantly.',
  diameterCalculator:
    'Find tire sizes by target overall diameter. Enter a diameter and wheel size to see every matching tire with sidewall, width and revs-per-mile specs.',
  gearRatioCalculator:
    'Compare tire diameter changes with axle ratio to see effective gearing, stock-like targets, and how engine RPM and low-speed multiplication shift.',
  wheelOffsetCalculator:
    'Calculate wheel offset and backspacing, convert between them, and see how offset changes affect fitment, clearance and stance for your vehicle.',
  comparison:
    'Compare two tire sizes side by side with overall diameter, width, sidewall, circumference, revs per mile and speedometer error to see how they differ.',
  tireSizesIndex:
    'Browse popular tire sizes with full specs — overall diameter, section width, sidewall, circumference and revs per mile — plus equivalents and fitment.',
  hub: 'Helpful guides covering tire sizing, wheel fitment, offsets, backspacing, gearing and more.',
} as const;

export const ROBOTS = {
  indexFollow: 'index,follow',
  noindexNofollow: 'noindex,nofollow',
  noindexFollow: 'noindex,follow',
} as const;
