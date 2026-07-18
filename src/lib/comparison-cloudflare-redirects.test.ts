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
