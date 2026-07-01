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
  calculator:
    'Calculate tire dimensions, diameter, sidewall height, revs per mile and compare tire sizes instantly.',
  comparison:
    'Compare tire sizes side-by-side with detailed measurements and speedometer differences.',
  hub: 'Helpful guides covering tire sizing, wheel fitment, offsets, backspacing, gearing and more.',
} as const;

export const ROBOTS = {
  indexFollow: 'index,follow',
  noindexNofollow: 'noindex,nofollow',
  noindexFollow: 'noindex,follow',
} as const;
