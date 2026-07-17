export const prerender = false;

import { buildTireOgData, parseTireSizeSearchParam } from '../../lib/og/og-data';
import { renderFallbackOgImage, renderTireOgImage } from '../../lib/og/render-og-image';

export async function GET({ url }: { url: URL }) {
  const size = parseTireSizeSearchParam(url.searchParams);
  if (!size) {
    return renderFallbackOgImage('Tire Size Calculator');
  }

  const data = buildTireOgData(size);
  if (!data) {
    return renderFallbackOgImage('Tire Size Calculator');
  }

  return renderTireOgImage(data);
}
