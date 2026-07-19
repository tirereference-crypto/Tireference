import { describe, expect, it, vi } from 'vitest';
import { onRequest as handleComparisonCalculator } from '../../functions/calculators/tire-comparison-calculator';
import { onRequest as handleCleanComparison } from '../../functions/compare/[slug]';
import { getAllComparisonSlugs } from './tire-comparison-links';

function nextResponse() {
  return new Response('static page', { status: 200 });
}

describe('Cloudflare comparison redirects', () => {
  it('301s reversed clean URLs to the canonical clean URL', async () => {
    const next = vi.fn(async () => nextResponse());
    const response = await handleCleanComparison({
      request: new Request(
        'https://tirereference.com/compare/235-40-r18-vs-225-45-r17/',
      ),
      params: { slug: '235-40-r18-vs-225-45-r17' },
      next,
    });

    expect(response.status).toBe(301);
    expect(response.headers.get('Location')).toBe(
      'https://tirereference.com/compare/225-45-r17-vs-235-40-r18/',
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('serves canonical clean URLs without another redirect', async () => {
    const next = vi.fn(async () => nextResponse());
    const response = await handleCleanComparison({
      request: new Request(
        'https://tirereference.com/compare/225-45-r17-vs-235-40-r18/',
      ),
      params: { slug: '225-45-r17-vs-235-40-r18' },
      next,
    });

    expect(response.status).toBe(200);
    expect(next).toHaveBeenCalledOnce();
  });

  it('passes invalid comparison slugs through to the static 404 handling', async () => {
    const invalidSlugs = [
      'banana',
      '225-45-r17', // missing -vs- pair
      '225-45-r17-vs-225-45-r17', // same-size comparison stays blocked
      '225-45-17-vs-235-40-r18', // malformed size segment
    ];
    for (const slug of invalidSlugs) {
      const next = vi.fn(async () => nextResponse());
      const response = await handleCleanComparison({
        request: new Request(`https://tirereference.com/compare/${slug}/`),
        params: { slug },
        next,
      });
      expect(response.status, slug).toBe(200);
      expect(next, slug).toHaveBeenCalledOnce();
    }
  });

  it('every published pair: reversed slug 301s once, canonical never redirects (no loops)', async () => {
    for (const { slug } of getAllComparisonSlugs()) {
      const [a, b] = slug.split('-vs-');
      const reversedSlug = `${b}-vs-${a}`;

      const nextReversed = vi.fn(async () => nextResponse());
      const redirect = await handleCleanComparison({
        request: new Request(`https://tirereference.com/compare/${reversedSlug}/`),
        params: { slug: reversedSlug },
        next: nextReversed,
      });
      expect(redirect.status, reversedSlug).toBe(301);
      const location = redirect.headers.get('Location');
      expect(location, reversedSlug).toBe(
        `https://tirereference.com/compare/${slug}/`,
      );

      // Single hop: the redirect target itself must be served, not redirected.
      const nextCanonical = vi.fn(async () => nextResponse());
      const served = await handleCleanComparison({
        request: new Request(location!),
        params: { slug },
        next: nextCanonical,
      });
      expect(served.status, slug).toBe(200);
      expect(nextCanonical, slug).toHaveBeenCalledOnce();
    }
  });

  it('serves the calculator without query parameters (no redirect)', async () => {
    const next = vi.fn(async () => nextResponse());
    const response = await handleComparisonCalculator({
      request: new Request(
        'https://tirereference.com/calculators/tire-comparison-calculator/',
      ),
      next,
    });
    expect(response.status).toBe(200);
    expect(next).toHaveBeenCalledOnce();
  });

  it('passes unrelated query parameters through untouched', async () => {
    const next = vi.fn(async () => nextResponse());
    const response = await handleComparisonCalculator({
      request: new Request(
        'https://tirereference.com/calculators/tire-comparison-calculator/?utm_source=newsletter',
      ),
      next,
    });
    expect(response.status).toBe(200);
    expect(next).toHaveBeenCalledOnce();
  });

  it('redirects HEAD requests like GET and ignores POST', async () => {
    const legacyUrl =
      'https://tirereference.com/calculators/tire-comparison-calculator/?current=215%2F55R17&new=205%2F55R16';

    const head = await handleComparisonCalculator({
      request: new Request(legacyUrl, { method: 'HEAD' }),
      next: vi.fn(async () => nextResponse()),
    });
    expect(head.status).toBe(301);
    expect(head.headers.get('Location')).toBe(
      'https://tirereference.com/compare/205-55-r16-vs-215-55-r17/',
    );

    const postNext = vi.fn(async () => nextResponse());
    const post = await handleComparisonCalculator({
      request: new Request(legacyUrl, { method: 'POST' }),
      next: postNext,
    });
    expect(post.status).toBe(200);
    expect(postNext).toHaveBeenCalledOnce();
  });

  it('keeps the requesting hostname in Location (no extra hostname hop on previews)', async () => {
    const response = await handleComparisonCalculator({
      request: new Request(
        'https://preview-abc.tire-logic.pages.dev/calculators/tire-comparison-calculator/?current=215%2F55R17&new=205%2F55R16',
      ),
      next: vi.fn(async () => nextResponse()),
    });
    expect(response.status).toBe(301);
    expect(response.headers.get('Location')).toBe(
      'https://preview-abc.tire-logic.pages.dev/compare/205-55-r16-vs-215-55-r17/',
    );
  });

  it('accepts lowercase r, encoded slashes, and paddable whitespace at the edge', async () => {
    const expected =
      'https://tirereference.com/compare/205-55-r16-vs-215-55-r17/';
    const inputs = [
      '?current=215%2F55r17&new=205%2F55r16',
      '?current=215/55R17&new=205/55R16',
      '?current=%20215%2F55R17%20&new=%20205%2F55R16%20',
    ];
    for (const search of inputs) {
      const response = await handleComparisonCalculator({
        request: new Request(
          `https://tirereference.com/calculators/tire-comparison-calculator/${search}`,
        ),
        next: vi.fn(async () => nextResponse()),
      });
      expect(response.status, search).toBe(301);
      expect(response.headers.get('Location'), search).toBe(expected);
    }
  });

  it('sends invalid, same-size, or single-param legacy input to the calculator, never a default comparison', async () => {
    const cases: Array<[string, string]> = [
      [
        '?current=banana&new=205%2F55R16',
        'https://tirereference.com/calculators/tire-comparison-calculator/',
      ],
      [
        '?current=205%2F55R16&new=205%2F55R16',
        'https://tirereference.com/calculators/tire-comparison-calculator/',
      ],
      [
        '?current=205%2F55R16',
        'https://tirereference.com/calculators/tire-comparison-calculator/?from=205%2F55R16',
      ],
      [
        '?new=215%2F55R17',
        'https://tirereference.com/calculators/tire-comparison-calculator/?to=215%2F55R17',
      ],
    ];
    for (const [search, expected] of cases) {
      const response = await handleComparisonCalculator({
        request: new Request(
          `https://tirereference.com/calculators/tire-comparison-calculator/${search}`,
        ),
        next: vi.fn(async () => nextResponse()),
      });
      expect(response.status, search).toBe(301);
      expect(response.headers.get('Location'), search).toBe(expected);
      // Every Location must be single-hop: calculator targets never re-redirect.
      const [, query = ''] = (response.headers.get('Location') ?? '').split('?');
      const again = await handleComparisonCalculator({
        request: new Request(
          `https://tirereference.com/calculators/tire-comparison-calculator/?${query}`,
        ),
        next: vi.fn(async () => nextResponse()),
      });
      expect(again.status, search).toBe(200);
    }
  });

  it('Location headers always end with exactly one trailing slash before any query', async () => {
    const searches = [
      '?current=215%2F55R17&new=205%2F55R16',
      '?current=banana&new=205%2F55R16',
      '?current=205%2F55R16',
    ];
    for (const search of searches) {
      const response = await handleComparisonCalculator({
        request: new Request(
          `https://tirereference.com/calculators/tire-comparison-calculator/${search}`,
        ),
        next: vi.fn(async () => nextResponse()),
      });
      const location = response.headers.get('Location') ?? '';
      const { pathname } = new URL(location);
      expect(pathname.endsWith('/'), location).toBe(true);
      expect(pathname.includes('//'), location).toBe(false);
    }
  });

  it('canonicalizes either legacy query order to the same URL', async () => {
    const next = vi.fn(async () => nextResponse());
    const forward = await handleComparisonCalculator({
      request: new Request(
        'https://tirereference.com/calculators/tire-comparison-calculator/?current=225%2F45R17&new=235%2F40R18',
      ),
      next,
    });
    const reversed = await handleComparisonCalculator({
      request: new Request(
        'https://tirereference.com/calculators/tire-comparison-calculator/?current=235%2F40R18&new=225%2F45R17',
      ),
      next,
    });

    const expected =
      'https://tirereference.com/compare/225-45-r17-vs-235-40-r18/';
    expect(forward.status).toBe(301);
    expect(reversed.status).toBe(301);
    expect(forward.headers.get('Location')).toBe(expected);
    expect(reversed.headers.get('Location')).toBe(expected);
  });
});
