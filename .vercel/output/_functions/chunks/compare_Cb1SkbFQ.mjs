import { p as parseCompareSearchParams, r as renderFallbackOgImage, b as buildCompareOgData, a as renderCompareOgImage } from './render-og-image_CeerUyq8.mjs';

const prerender = false;
async function GET({ url }) {
  const pair = parseCompareSearchParams(url.searchParams);
  if (!pair) {
    return renderFallbackOgImage("Tire Size Comparison");
  }
  const data = buildCompareOgData(pair.from, pair.to);
  if (!data) {
    return renderFallbackOgImage("Tire Size Comparison");
  }
  return renderCompareOgImage(data);
}

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  GET,
  prerender
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
