import { c as parseTireSizeSearchParam, r as renderFallbackOgImage, d as buildTireOgData, e as renderTireOgImage } from './render-og-image_CeerUyq8.mjs';

const prerender = false;
async function GET({ url }) {
  const size = parseTireSizeSearchParam(url.searchParams);
  if (!size) {
    return renderFallbackOgImage("Tire Size Calculator");
  }
  const data = buildTireOgData(size);
  if (!data) {
    return renderFallbackOgImage("Tire Size Calculator");
  }
  return renderTireOgImage(data);
}

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  GET,
  prerender
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
