import { describe, expect, it } from 'vitest';
import { TIRE_SIZES } from '../data/tire-sizes';
import { buildPopularComparisonCards } from './home-sections';
import {
  buildCuratedPopularComparisons,
  buildPopularComparisonsForSize,
  comparisonSlugFromSizes,
  comparisonSlugPath,
  filterValidComparisonLabels,
  getAllComparisonSlugs,
  getComparisonPairCounts,
  isFieldBackedTireSize,
  isValidComparisonPair,
  MOST_SEARCHED_COMPARISON_PAIRS,
  parseComparisonSlug,
} from './tire-comparison-links';
import { buildPopularComparisons } from './tire-size-premium';
import { buildTireSizeHubData } from './tire-size-hub';
import { isComparisonPublishable } from './tire-comparison-insights';
import {
  buildPopularComparisonsForDiameterSearch,
  POPULAR_COMPARISONS,
} from './tire-diameter-insights';
import { getTireSpecs } from './tire-math';
import { buildExploreFurtherData } from './tire-explore-further';

describe('tire-comparison-links', () => {
  it('only links production database sizes with hub pages', () => {
    const links = buildPopularComparisonsForSize('225/45R17');
    expect(links.length).toBeGreaterThan(0);
    expect(links.length).toBeLessThanOrEqual(6);

    for (const link of links) {
      expect(isValidComparisonPair(link.current, link.new)).toBe(true);
      expect(link.href).toMatch(/^\/compare\//);
      expect(link.href).toContain('-vs-');
    }
  });

  it('filters invalid pairs out of per-size popular comparisons', () => {
    const links = buildPopularComparisonsForSize('275/70R18');
    expect(links.length).toBeGreaterThan(0);

    for (const link of links) {
      expect(isValidComparisonPair(link.current, link.new)).toBe(true);
    }

    expect(links.some((link) => link.new === '225/45R17')).toBe(false);
  });

  it('ranks closer same-class sizes ahead of distant alternatives', () => {
    const links = buildPopularComparisonsForSize('265/70R17');
    expect(links.length).toBeGreaterThan(0);
    const otherSize =
      links[0].current === '265/70R17' ? links[0].new : links[0].current;
    expect(otherSize).toMatch(/285\/70R17|275\/70R18|265\/65R18/);
  });

  it('round-trips comparison slugs for valid pairs', () => {
    const current = '265/70R17';
    const newSize = '285/70R17';
    const slug = comparisonSlugFromSizes(current, newSize);
    expect(slug).toBe('265-70-r17-vs-285-70-r17');
    expect(comparisonSlugPath(current, newSize)).toBe(`/compare/${slug}/`);
    expect(parseComparisonSlug(slug)).toEqual({ current, new: newSize });
  });

  it('rejects invalid fabricated comparison pairs', () => {
    expect(isValidComparisonPair('225/45R17', '245/45R17')).toBe(false);
    expect(parseComparisonSlug('999-99-r99-vs-888-88-r88')).toBeNull();
  });

  it('rejects LT-only sizes that do not round-trip through calculator fields', () => {
    expect(isFieldBackedTireSize('LT265/75R16')).toBe(false);
    expect(isFieldBackedTireSize('285/75R16')).toBe(true);
    expect(isValidComparisonPair('285/75R16', 'LT265/75R16')).toBe(false);
  });

  it('only surfaces curated popular comparisons with field-backed database sizes', () => {
    const links = buildCuratedPopularComparisons(6);
    expect(links.length).toBeGreaterThan(0);
    expect(links.length).toBeLessThanOrEqual(6);

    for (const link of links) {
      expect(isValidComparisonPair(link.current, link.new)).toBe(true);
      expect(parseComparisonSlug(link.href.replace('/compare/', ''))).toEqual({
        current: link.current,
        new: link.new,
      });
    }

    const invalidCurated = MOST_SEARCHED_COMPARISON_PAIRS.filter(
      ([sizeA, sizeB]) => !isValidComparisonPair(sizeA, sizeB),
    );
    for (const [sizeA, sizeB] of invalidCurated) {
      expect(buildCuratedPopularComparisons(10).some((l) => l.current === sizeA && l.new === sizeB)).toBe(false);
    }
  });

  it('only generates publishable comparison slugs for static paths', () => {
    const slugs = getAllComparisonSlugs();
    expect(slugs.length).toBeGreaterThan(0);

    for (const entry of slugs) {
      expect(isValidComparisonPair(entry.current, entry.new)).toBe(true);
      expect(isComparisonPublishable(entry.current, entry.new)).toBe(true);
    }
  });

  it('generates fewer pairs after dimensional rules are applied', () => {
    const { legacy, full } = getComparisonPairCounts();
    expect(full).toBeLessThanOrEqual(legacy);
    expect(full).toBeGreaterThan(0);
    // eslint-disable-next-line no-console -- intentional build report
    console.info(`Comparison pairs: ${legacy} legacy-only → ${full} with dimensional rules`);
  });
});

describe('popular comparisons surfaces', () => {
  it('homepage cards only show valid comparisons', () => {
    for (const card of buildPopularComparisonCards()) {
      const [current, newSize] = card.label.split(' vs ');
      expect(isValidComparisonPair(current, newSize)).toBe(true);
    }
  });

  it('diameter POPULAR_COMPARISONS constant is fully valid', () => {
    expect(filterValidComparisonLabels(POPULAR_COMPARISONS)).toEqual(POPULAR_COMPARISONS);
  });

  it('hub popular comparison chips are valid for every hub size', () => {
    for (const entry of TIRE_SIZES) {
      const hub = buildTireSizeHubData(entry.size);
      if (!hub) continue;
      for (const { target } of buildPopularComparisons(hub)) {
        expect(isValidComparisonPair(hub.entry.size, target)).toBe(true);
      }
    }
  });

  it('explore-further comparison suggestions are valid pairs', () => {
    for (const entry of TIRE_SIZES) {
      let specs;
      try {
        specs = getTireSpecs(entry.size);
      } catch {
        continue;
      }
      const data = buildExploreFurtherData(entry.size, specs);
      for (const comparison of data.comparisons) {
        expect(isValidComparisonPair(entry.size, comparison.targetSize)).toBe(true);
      }
      for (const path of data.upgradePaths) {
        expect(isValidComparisonPair(entry.size, path.size)).toBe(true);
      }
    }
  });

  it('diameter search popular comparisons are valid', () => {
    for (const diameter of [31, 33, 35, 37]) {
      const links = buildPopularComparisonsForDiameterSearch({
        targetDiameterIn: diameter,
        wheelDiameterIn: 18,
        toleranceIn: 1,
      });
      expect(filterValidComparisonLabels(links)).toEqual(links);
    }
  });
});
