import { SITE_URL } from '../seo/constants';
export const OG_IMAGE_DIMENSIONS = {
  width: 1200,
  height: 630,
} as const;

function absolute(pathOrUrl: string): string {
  return pathOrUrl.startsWith('http') ? pathOrUrl : `${SITE_URL}${pathOrUrl}`;
}

/** Dynamic OG endpoint — requires hybrid/server deploy (Vercel). */
export function tireOgImageUrl(size: string): string {
  const params = new URLSearchParams({ size });
  return absolute(`/og/tire.png?${params.toString()}`);
}

/** Dynamic OG endpoint — requires hybrid/server deploy (Vercel). */
export function compareOgImageUrl(from: string, to: string): string {
  const params = new URLSearchParams({ from, to });
  return absolute(`/og/compare.png?${params.toString()}`);
}

/** Static prebuilt PNG — works on pure static hosts after `npm run og:generate`. */
export function prebuiltTireOgImageUrl(slug: string): string {
  return absolute(`/og/prebuilt/tire/${slug}.png`);
}

/** Static prebuilt PNG — works on pure static hosts after `npm run og:generate`. */
export function prebuiltCompareOgImageUrl(slug: string): string {
  return absolute(`/og/prebuilt/compare/${slug}.png`);
}
