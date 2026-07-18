import { describe, expect, it } from 'vitest';
import { buildPopularComparisonCards } from './home-sections';
import {
  publishedComparePath,
  resolveComparisonRedirect,
} from './comparison-redirect';
import { canonicalComparisonPath } from './comparison-url';
import {
  buildCuratedPopularComparisons,
  comparisonSlugPath,
  getAllComparisonSlugs,
  publishedComparisonSlugPath,
} from './tire-comparison-links';
import { comparisonPagePath } from './tire-comparison-paths';
import { comparisonBreadcrumbs } from './seo/page-schemas';

describe('comparison URL producers', () => {
  const sizeA = '225/45R17';
  const sizeB = '235/40R18';
  const canonical = '/compare/225-45-r17-vs-235-40-r18/';

  it('all direct URL producers return the shared canonical path', () => {
    const produced = [
      canonicalComparisonPath(sizeA, sizeB),
      canonicalComparisonPath(sizeB, sizeA),
      comparisonSlugPath(sizeA, sizeB),
      comparisonSlugPath(sizeB, sizeA),
      publishedComparisonSlugPath(sizeA, sizeB),
      publishedComparisonSlugPath(sizeB, sizeA),
      publishedComparePath(sizeA, sizeB),
      publishedComparePath(sizeB, sizeA),
      comparisonPagePath(sizeA, sizeB),
      comparisonPagePath(sizeB, sizeA),
    ];

    expect(produced).toEqual(Array(produced.length).fill(canonical));
  });

  it('legacy query redirects use the same canonical URL in either order', () => {
    expect(resolveComparisonRedirect(`current=${sizeA}&new=${sizeB}`)).toEqual({
      type: 'redirect',
      location: canonical,
    });
    expect(resolveComparisonRedirect(`current=${sizeB}&new=${sizeA}`)).toEqual({
      type: 'redirect',
      location: canonical,
    });
  });

  it('homepage, popular comparisons, breadcrumbs, and static routes agree', () => {
    const curated = buildCuratedPopularComparisons(10).find(
      ({ current, new: next }) => current === sizeA && next === sizeB,
    );
    const homepage = buildPopularComparisonCards(10).find(
      ({ label }) => label === `${sizeA} vs ${sizeB}`,
    );
    const breadcrumb = comparisonBreadcrumbs(sizeB, sizeA).at(-1);
    const staticRoute = getAllComparisonSlugs().find(
      ({ current, new: next }) => current === sizeA && next === sizeB,
    );

    expect(curated?.href).toBe(canonical);
    expect(homepage?.href).toBe(canonical);
    expect(breadcrumb?.item).toBe(canonical);
    expect(
      staticRoute
        ? canonicalComparisonPath(staticRoute.current, staticRoute.new)
        : null,
    ).toBe(canonical);
  });

  it('every generated comparison route is canonical and unique by unordered pair', () => {
    const routes = getAllComparisonSlugs();
    const paths = routes.map(({ current, new: next, slug }) => {
      const path = canonicalComparisonPath(current, next);
      expect(path).toBe(`/compare/${slug}/`);
      expect(canonicalComparisonPath(next, current)).toBe(path);
      return path;
    });

    expect(new Set(paths).size).toBe(paths.length);
  });

  it('edge redirects and static producers emit identical URLs for every published pair', async () => {
    const { onRequest: handleCleanComparison } = await import(
      '../../functions/compare/[slug]'
    );
    const { onRequest: handleComparisonCalculator } = await import(
      '../../functions/calculators/tire-comparison-calculator'
    );

    for (const { current, new: next, slug } of getAllComparisonSlugs()) {
      const path = canonicalComparisonPath(current, next);
      expect(path).toBe(`/compare/${slug}/`);
      expect(publishedComparePath(current, next)).toBe(path);
      expect(publishedComparePath(next, current)).toBe(path);
      expect(publishedComparisonSlugPath(current, next)).toBe(path);
      expect(publishedComparisonSlugPath(next, current)).toBe(path);
      expect(comparisonPagePath(current, next)).toBe(path);
      expect(comparisonPagePath(next, current)).toBe(path);

      const [a, b] = slug.split('-vs-');
      const reversedSlug = `${b}-vs-${a}`;
      const nextFn = async () => new Response('ok', { status: 200 });

      const reversed = await handleCleanComparison({
        request: new Request(`https://tirereference.com/compare/${reversedSlug}/`),
        params: { slug: reversedSlug },
        next: nextFn,
      });
      expect(reversed.status).toBe(301);
      expect(reversed.headers.get('Location')).toBe(
        `https://tirereference.com${path}`,
      );

      const forwardQuery = await handleComparisonCalculator({
        request: new Request(
          `https://tirereference.com/calculators/tire-comparison-calculator/?current=${encodeURIComponent(current)}&new=${encodeURIComponent(next)}`,
        ),
        next: nextFn,
      });
      const reversedQuery = await handleComparisonCalculator({
        request: new Request(
          `https://tirereference.com/calculators/tire-comparison-calculator/?current=${encodeURIComponent(next)}&new=${encodeURIComponent(current)}`,
        ),
        next: nextFn,
      });
      expect(forwardQuery.headers.get('Location')).toBe(
        `https://tirereference.com${path}`,
      );
      expect(reversedQuery.headers.get('Location')).toBe(
        `https://tirereference.com${path}`,
      );
    }
  });
});
