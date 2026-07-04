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

/** Normalize pathname — preserve a single trailing slash when the input had one. */
function normalizePathname(pathname: string): string {
  if (pathname === '/') return '/';

  const withLeading = pathname.startsWith('/') ? pathname : `/${pathname}`;
  const endsWithSlash = withLeading.endsWith('/');
  const trimmed = withLeading.replace(/\/+$/, '').replace(/\/{2,}/g, '/') || '/';

  if (endsWithSlash && trimmed !== '/') {
    return `${trimmed}/`;
  }

  return trimmed;
}

/** Build an absolute canonical URL from a pathname or relative path. */
export function resolveCanonical(pathOrUrl: string): string {
  if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) {
    return normalizeCanonicalUrl(pathOrUrl);
  }

  const path = pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`;
  const { pathname, search } = splitPathAndQuery(path);
  const normalizedPath = normalizePathname(pathname);

  return `${SITE_URL}${normalizedPath}${search}`;
}

export function normalizeCanonicalUrl(url: string): string {
  try {
    const parsed = new URL(url);
    const pathname = normalizePathname(parsed.pathname);
    const origin = parsed.origin === SITE_URL ? SITE_URL : SITE_URL;
    const path =
      parsed.origin !== SITE_URL
        ? pathname
        : pathname;
    return `${origin}${path}${parsed.search}`;
  } catch {
    return resolveCanonical(url);
  }
}

export function resolveCanonicalFromPathname(pathname: string): string {
  return resolveCanonical(pathname);
}
