import { SITE_URL } from './constants';

function splitPathAndQuery(pathOrUrl: string): { pathname: string; search: string } {
  const queryIndex = pathOrUrl.indexOf('?');
  if (queryIndex === -1) {
    return { pathname: pathOrUrl, search: '' };
  }
  return {
    pathname: pathOrUrl.slice(0, queryIndex),
    search: pathOrUrl.slice(queryIndex),
  };
}

/** Normalize pathname — site uses trailingSlash: 'always'. */
function normalizePathname(pathname: string): string {
  if (pathname === '/' || pathname === '') return '/';

  const withLeading = pathname.startsWith('/') ? pathname : `/${pathname}`;
  const trimmed = withLeading.replace(/\/+$/, '').replace(/\/{2,}/g, '/') || '/';
  if (trimmed === '/') return '/';
  return `${trimmed}/`;
}

/** Build an absolute canonical URL from a pathname or relative path. */
export function resolveCanonical(pathOrUrl: string): string {
  if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) {
    return normalizeCanonicalUrl(pathOrUrl);
  }

  const path = pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`;
  const { pathname } = splitPathAndQuery(path);
  const normalizedPath = normalizePathname(pathname);

  // Canonicals never include calculator query state or tracking params.
  return `${SITE_URL}${normalizedPath}`;
}

export function normalizeCanonicalUrl(url: string): string {
  try {
    const parsed = new URL(url);
    const pathname = normalizePathname(parsed.pathname);
    // Always publish on the production origin; drop query/hash state.
    return `${SITE_URL}${pathname}`;
  } catch {
    return resolveCanonical(url);
  }
}

export function resolveCanonicalFromPathname(pathname: string): string {
  return resolveCanonical(pathname);
}
