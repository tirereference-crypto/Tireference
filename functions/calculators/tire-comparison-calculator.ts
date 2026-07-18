/**
 * Cloudflare Pages Function: edge 301s for legacy parameterized comparison URLs.
 *
 * `?current=A&new=B` → `/compare/a-vs-b/` (or the blank calculator when the
 * params are invalid). Requests without legacy params fall through to the
 * static prerendered calculator page. See src/lib/comparison-redirect.ts for
 * the shared decision logic and loop-safety notes.
 */
import { resolveComparisonRedirect } from '../../src/lib/comparison-redirect';

interface PagesFunctionContext {
  request: Request;
  next: () => Promise<Response>;
}

export async function onRequest(context: PagesFunctionContext): Promise<Response> {
  const { request } = context;
  if (request.method !== 'GET' && request.method !== 'HEAD') return context.next();

  const url = new URL(request.url);
  if (!url.search) return context.next();

  const decision = resolveComparisonRedirect(url.searchParams);
  if (decision.type === 'redirect') {
    return new Response(null, {
      status: 301,
      headers: { Location: new URL(decision.location, url.origin).toString() },
    });
  }
  return context.next();
}
