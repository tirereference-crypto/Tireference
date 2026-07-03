import { describe, expect, it } from 'vitest';
import { comparisonPagePathCurrent } from './tire-size-url';
import {
  getTireDiameterCatalog,
  searchTiresByDiameter,
  getDiameterSearchCategoryBadge,
} from './tire-diameter-search';
import { getTireSpecs } from './tire-math';

describe('getTireDiameterCatalog', () => {
  it('includes every production tire size with specs', () => {
    const catalog = getTireDiameterCatalog();
    expect(catalog.length).toBeGreaterThan(30);
    expect(catalog.every((entry) => entry.specs.overallDiameterIn > 0)).toBe(true);
  });
});

describe('searchTiresByDiameter', () => {
  it('33" + 18" wheel returns 275/70R18 among matches', () => {
    const result = searchTiresByDiameter({
      targetDiameterIn: 33,
      wheelDiameterIn: 18,
      toleranceIn: 1,
    });

    expect(result.matches.length).toBeGreaterThan(0);
    const sizes = result.matches.map((m) => m.size);
    expect(sizes).toContain('275/70R18');

    const match = result.matches.find((m) => m.size === '275/70R18')!;
    expect(match.diameterIn).toBeCloseTo(33.16, 1);
    expect(match.hubHref).toBe('/tire-size/275-70r18');
  });

  it('35" + 18" wheel returns valid dataset sizes', () => {
    const result = searchTiresByDiameter({
      targetDiameterIn: 35,
      wheelDiameterIn: 18,
      toleranceIn: 1,
    });

    expect(result.matches.length).toBeGreaterThan(0);
    result.matches.forEach((match) => {
      expect(match.specs.wheelDiameterIn).toBe(18);
      expect(Math.abs(match.diameterDiffIn)).toBeLessThanOrEqual(
        result.effectiveToleranceIn + 0.01,
      );
    });
  });

  it('never returns empty when wheel sizes exist in catalog', () => {
    const result = searchTiresByDiameter({
      targetDiameterIn: 99,
      wheelDiameterIn: 18,
      toleranceIn: 0.5,
    });

    expect(result.matches.length).toBeGreaterThan(0);
    expect(result.widenedTolerance).toBe(true);
  });

  it('sorts closest diameter first', () => {
    const result = searchTiresByDiameter({
      targetDiameterIn: 33,
      wheelDiameterIn: 18,
      toleranceIn: 2,
    });

    const diffs = result.matches.map((m) => Math.abs(m.diameterDiffIn));
    for (let i = 1; i < diffs.length; i++) {
      expect(diffs[i]).toBeGreaterThanOrEqual(diffs[i - 1] - 0.001);
    }
  });

  it('275/70R18 forward diameter matches tire-math engine', () => {
    const specs = getTireSpecs('275/70R18');
    expect(specs.overallDiameterIn).toBeCloseTo(33.16, 1);
  });
});

describe('comparisonPagePathCurrent', () => {
  it('prefills current tire size only', () => {
    expect(comparisonPagePathCurrent('275/70R18')).toBe(
      '/calculators/tire-comparison-calculator?current=275%2F70R18',
    );
  });
});

describe('getDiameterSearchCategoryBadge', () => {
  it('labels off-road sizes as All Terrain or Off Road', () => {
    const specs = getTireSpecs('275/70R18');
    const badge = getDiameterSearchCategoryBadge('off-road', specs);
    expect(['All Terrain', 'Off Road']).toContain(badge);
  });

  it('labels performance sizes as Performance', () => {
    const specs = getTireSpecs('225/45R17');
    const badge = getDiameterSearchCategoryBadge('performance', specs);
    expect(badge).toBe('Performance');
  });
});
