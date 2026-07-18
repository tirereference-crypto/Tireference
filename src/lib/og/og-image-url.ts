import { SITE_URL } from '../seo/constants';
export const OG_IMAGE_DIMENSIONS = {
  width: 1200,
  height: 630,
} as const;

function absolute(pathOrUrl: string): string {
  return pathOrUrl.startsWith('http') ? pathOrUrl : `${SITE_URL}${pathOrUrl}`;
}

/** Static prebuilt PNG — works on pure static hosts after `npm run og:generate`. */
export function prebuiltTireOgImageUrl(slug: string): string {
  return absolute(`/og/prebuilt/tire/${slug}.png`);
}

/** Static prebuilt PNG — works on pure static hosts after `npm run og:generate`. */
export function prebuiltCompareOgImageUrl(slug: string): string {
  return absolute(`/og/prebuilt/compare/${slug}.png`);
}
