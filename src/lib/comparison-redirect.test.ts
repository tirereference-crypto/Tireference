import { describe, expect, it } from 'vitest';
import publishedComparisonSlugs from '../data/generated/comparison-slug-allowlist.json';
import {
  COMPARISON_CALCULATOR_PATH,
  normalizeComparisonSizeParam,
  publishedComparePath,
  resolveComparisonRedirect,
} from './comparison-redirect';
import { getAllComparisonSlugs } from './tire-comparison-links';

const CALC = COMPARISON_CALCULATOR_PATH;

function resolve(search: string) {
  return resolveComparisonRedirect(search);
}

describe('normalizeComparisonSizeParam', () => {
  it('accepts canonical sizes', () => {
    expect(normalizeComparisonSizeParam('225/45R17')).toBe('225/45R17');
  });

  it('accepts lowercase r and uppercases it', () => {
    expect(normalizeComparisonSizeParam('225/45r17')).toBe('225/45R17');
  });

  it('trims surrounding spaces', () => {
    expect(normalizeComparisonSizeParam('  225/45R17  ')).toBe('225/45R17');
  });

  it('rejects malformed sizes', () => {
    expect(normalizeComparisonSizeParam('banana')).toBeNull();
    expect(normalizeComparisonSizeParam('225/45')).toBeNull();
    expect(normalizeComparisonSizeParam('225/45R')).toBeNull();
    expect(normalizeComparisonSizeParam('R17')).toBeNull();
    expect(normalizeComparisonSizeParam('999')).toBeNull();
    expect(normalizeComparisonSizeParam('')).toBeNull();
  });
});

describe('resolveComparisonRedirect — valid legacy parameters', () => {
  it('redirects valid current/new to the clean /compare/ URL', () => {
    expect(resolve('current=225/45R17&new=235/40R18')).toEqual({
      type: 'redirect',
      location: '/compare/225-45-r17-vs-235-40-r18/',
    });
  });

  it('handles URL-encoded slashes', () => {
    expect(resolve('current=225%2F45R17&new=235%2F40R18')).toEqual({
      type: 'redirect',
      location: '/compare/225-45-r17-vs-235-40-r18/',
    });
  });

  it('handles lowercase tire sizes', () => {
    expect(resolve('current=225/45r17&new=235/40r18')).toEqual({
      type: 'redirect',
      location: '/compare/225-45-r17-vs-235-40-r18/',
    });
  });

  it('trims spaces inside parameters', () => {
    expect(resolve('current=%20225/45R17%20&new=%20235/40R18')).toEqual({
      type: 'redirect',
      location: '/compare/225-45-r17-vs-235-40-r18/',
    });
  });

  it('canonicalizes reversed comparisons to the preferred order', () => {
    expect(resolve('current=235/40R18&new=225/45R17')).toEqual({
      type: 'redirect',
      location: '/compare/225-45-r17-vs-235-40-r18/',
    });
  });
});

describe('resolveComparisonRedirect — invalid and partial parameters', () => {
  it('redirects invalid tire sizes to the blank calculator', () => {
    expect(resolve('current=banana&new=235/40R18')).toEqual({
      type: 'redirect',
      location: CALC,
    });
    expect(resolve('current=225/45R17&new=999')).toEqual({
      type: 'redirect',
      location: CALC,
    });
  });

  it('redirects empty legacy params to the blank calculator', () => {
    expect(resolve('current=&new=')).toEqual({ type: 'redirect', location: CALC });
  });

  it('redirects same-size comparisons to the blank calculator', () => {
    expect(resolve('current=225/45R17&new=225/45R17')).toEqual({
      type: 'redirect',
      location: CALC,
    });
    expect(resolve('current=225/45r17&new=225%2F45R17')).toEqual({
      type: 'redirect',
      location: CALC,
    });
  });

  it('redirects a single valid legacy param to a from/to prefill', () => {
    expect(resolve('current=225/45R17')).toEqual({
      type: 'redirect',
      location: `${CALC}?from=225%2F45R17`,
    });
    expect(resolve('new=235/40R18')).toEqual({
      type: 'redirect',
      location: `${CALC}?to=235%2F40R18`,
    });
  });

  it('redirects valid sizes without a published compare page to a from/to prefill', () => {
    // Cross-category pair: valid sizes, no /compare/ page.
    const result = resolve('current=225/45R17&new=305/70R18');
    expect(result.type).toBe('redirect');
    if (result.type === 'redirect') {
      expect(result.location).toBe(`${CALC}?from=225%2F45R17&to=305%2F70R18`);
    }
  });

  it('redirects malformed from/to params to the blank calculator (no silent defaults)', () => {
    expect(resolve('from=banana&to=235/40R18')).toEqual({
      type: 'redirect',
      location: CALC,
    });
  });
});

describe('resolveComparisonRedirect — no redirect cases', () => {
  it('does nothing when there are no query parameters', () => {
    expect(resolve('')).toEqual({ type: 'none' });
  });

  it('does nothing for unrelated query parameters', () => {
    expect(resolve('utm_source=x')).toEqual({ type: 'none' });
  });

  it('preserves the interactive calculator for valid from/to params', () => {
    expect(resolve('from=225/45R17&to=235/40R18')).toEqual({ type: 'none' });
  });
});

describe('resolveComparisonRedirect — redirect-loop prevention', () => {
  it('never emits a target that itself redirects', () => {
    const searches = [
      'current=225/45R17&new=235/40R18',
      'current=225/45r17&new=235/40r18',
      'current=banana&new=235/40R18',
      'current=225/45R17&new=225/45R17',
      'current=225/45R17',
      'current=225/45R17&new=305/70R18',
      'from=banana&to=1',
    ];
    for (const search of searches) {
      const first = resolveComparisonRedirect(search);
      expect(first.type).toBe('redirect');
      if (first.type !== 'redirect') continue;

      const [, query = ''] = first.location.split('?');
      // /compare/ pages have no redirect handling at all; only re-check
      // calculator targets.
      if (first.location.startsWith(CALC)) {
        expect(resolveComparisonRedirect(query)).toEqual({ type: 'none' });
      } else {
        expect(first.location).toMatch(/^\/compare\/[a-z0-9-]+-vs-[a-z0-9-]+\/$/);
        expect(query).toBe('');
      }
    }
  });
});

describe('published comparison slug allowlist', () => {
  it('matches the slugs generated for /compare/ static paths', () => {
    const expected = getAllComparisonSlugs()
      .map(({ slug }) => slug)
      .sort();
    // Regenerate with `npm run data:comparison-slugs` when this fails.
    expect(publishedComparisonSlugs).toEqual(expected);
  });

  it('publishedComparePath returns clean paths only for published pairs', () => {
    expect(publishedComparePath('225/45R17', '235/40R18')).toBe(
      '/compare/225-45-r17-vs-235-40-r18/',
    );
    expect(publishedComparePath('235/40R18', '225/45R17')).toBe(
      '/compare/225-45-r17-vs-235-40-r18/',
    );
    expect(publishedComparePath('225/45R17', '305/70R18')).toBeNull();
  });
});
