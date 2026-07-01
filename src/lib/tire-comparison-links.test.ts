import { describe, expect, it } from 'vitest';
import {
  buildCuratedPopularComparisons,
  buildPopularComparisonsForSize,
  buildUpgradePathsFromDatabase,
  comparisonSlugFromSizes,
  comparisonSlugPath,
  isFieldBackedTireSize,
  isValidComparisonPair,
  MOST_SEARCHED_COMPARISON_PAIRS,
  parseComparisonSlug,
} from './tire-comparison-links';

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

  it('builds upgrade paths from database hub tiers only', () => {
    const paths = buildUpgradePathsFromDatabase('225/45R17');
    expect(paths).not.toBeNull();

    for (const card of paths!.cards) {
      if (card.id === 'current') continue;
      expect(isValidComparisonPair('225/45R17', card.size)).toBe(true);
      expect(card.href).toMatch(/^\/compare\//);
    }
  });

  it('round-trips comparison slugs for valid pairs', () => {
    const current = '265/70R17';
    const newSize = '285/70R17';
    const slug = comparisonSlugFromSizes(current, newSize);
    expect(slug).toBe('265-70-r17-vs-285-70-r17');
    expect(comparisonSlugPath(current, newSize)).toBe(`/compare/${slug}`);
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
    for (const [sizeA, sizeB] of MOST_SEARCHED_COMPARISON_PAIRS) {
      expect(isValidComparisonPair(sizeA, sizeB)).toBe(true);
    }

    const links = buildCuratedPopularComparisons(6);
    expect(links).toHaveLength(6);
    for (const link of links) {
      expect(isValidComparisonPair(link.current, link.new)).toBe(true);
      expect(parseComparisonSlug(link.href.replace('/compare/', ''))).toEqual({
        current: link.current,
        new: link.new,
      });
    }
  });
});
