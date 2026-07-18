/**
 * Cloudflare Pages Function: permanently consolidate reversed clean
 * comparison URLs onto the one canonical pair ordering.
 */
import { publishedComparePath } from '../../src/lib/comparison-redirect';
import { parseComparisonSlug } from '../../src/lib/comparison-url';

interface PagesFunctionContext {
  request: Request;
  params: { slug?: string | string[] };
  next: () => Promise<Response>;
}

export async function onRequest(context: PagesFunctionContext): Promise<Response> {
  const { request } = context;
  if (request.method !== 'GET' && request.method !== 'HEAD') return context.next();

  const rawSlug = context.params.slug;
  const slug = Array.isArray(rawSlug) ? rawSlug.join('/') : rawSlug;
  if (!slug) return context.next();

  const parsed = parseComparisonSlug(slug);
  if (!parsed || parsed.isCanonical) return context.next();

  const canonicalPath = publishedComparePath(
    parsed.canonical.current,
    parsed.canonical.new,
  );
  if (!canonicalPath) return context.next();

  return new Response(null, {
    status: 301,
    headers: {
      Location: new URL(canonicalPath, request.url).toString(),
    },
  });
}
