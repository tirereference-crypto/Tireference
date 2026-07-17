export const prerender = false;

import { buildCompareOgData, parseCompareSearchParams } from '../../lib/og/og-data';
import { renderCompareOgImage, renderFallbackOgImage } from '../../lib/og/render-og-image';

export async function GET({ url }: { url: URL }) {
  const pair = parseCompareSearchParams(url.searchParams);
  if (!pair) {
    return renderFallbackOgImage('Tire Size Comparison');
  }

  const data = buildCompareOgData(pair.from, pair.to);
  if (!data) {
    return renderFallbackOgImage('Tire Size Comparison');
  }

  return renderCompareOgImage(data);
}
