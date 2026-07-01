import { SITE_URL } from './constants';

/** Build an absolute canonical URL from a pathname or relative path. */
export function resolveCanonical(pathOrUrl: string): string {
  if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) {
    return normalizeCanonicalUrl(pathOrUrl);
  }

  const path = pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`;
  const normalizedPath = path === '/' ? '/' : path.replace(/\/+$/, '');
  return `${SITE_URL}${normalizedPath}`;
}

export function normalizeCanonicalUrl(url: string): string {
  try {
    const parsed = new URL(url);
    if (parsed.origin !== SITE_URL) {
      const path = parsed.pathname === '/' ? '/' : parsed.pathname.replace(/\/+$/, '');
      const search = parsed.search;
      return `${SITE_URL}${path}${search}`;
    }
    const path = parsed.pathname === '/' ? '/' : parsed.pathname.replace(/\/+$/, '');
    return `${SITE_URL}${path}${parsed.search}`;
  } catch {
    return resolveCanonical(url);
  }
}

export function resolveCanonicalFromPathname(pathname: string): string {
  return resolveCanonical(pathname);
}
