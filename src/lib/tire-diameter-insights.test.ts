import { describe, expect, it } from 'vitest';
import {
  buildPopularComparisonsForDiameterSearch,
  buildPopularSizesNearDiameter,
  tireMatchesDiameterSearch,
} from './tire-diameter-insights';

describe('buildPopularSizesNearDiameter', () => {
  it('returns closest popular sizes by overall diameter', () => {
    const cards = buildPopularSizesNearDiameter(33, 4);
    expect(cards.length).toBe(4);
    expect(cards[0].size).toBeTruthy();
    expect(cards[0].diameterIn).toBeGreaterThan(0);
    expect(cards[0].hubHref).toMatch(/^\/tire-size\//);
  });
});

describe('buildPopularComparisonsForDiameterSearch', () => {
  const params33x18 = {
    targetDiameterIn: 33,
    wheelDiameterIn: 18 as const,
    toleranceIn: 1,
  };

  it('only includes pairs with at least one tire matching diameter, wheel, and tolerance', () => {
    const links = buildPopularComparisonsForDiameterSearch(params33x18, 6);

    expect(links.length).toBeGreaterThan(0);
    for (const link of links) {
      const [sizeA, sizeB] = link.label.split(' vs ');
      const aMatch = tireMatchesDiameterSearch(sizeA, params33x18);
      const bMatch = tireMatchesDiameterSearch(sizeB, params33x18);
      expect(aMatch || bMatch).toBe(true);
    }
  });

  it('excludes unrelated passenger sizes for a 33 inch 18 inch search', () => {
    const links = buildPopularComparisonsForDiameterSearch(params33x18, 6);
    const labels = links.map((link) => link.label);

    expect(labels).not.toContain('225/45R17 vs 235/40R18');
    expect(labels).not.toContain('205/55R16 vs 215/55R17');
    expect(labels).not.toContain('285/70R17 vs 285/75R16');
  });

  it('prioritizes pairs where both tires match the active search', () => {
    const links = buildPopularComparisonsForDiameterSearch(
      {
        targetDiameterIn: 33,
        wheelDiameterIn: 18,
        toleranceIn: 2,
      },
      6,
    );

    const bothMatch = links.filter((link) => {
      const [sizeA, sizeB] = link.label.split(' vs ');
      return (
        tireMatchesDiameterSearch(sizeA, {
          targetDiameterIn: 33,
          wheelDiameterIn: 18,
          toleranceIn: 2,
        }) &&
        tireMatchesDiameterSearch(sizeB, {
          targetDiameterIn: 33,
          wheelDiameterIn: 18,
          toleranceIn: 2,
        })
      );
    });

    if (bothMatch.length > 1) {
      expect(links.indexOf(bothMatch[0])).toBeLessThan(
        links.findIndex((link) => !bothMatch.includes(link)),
      );
    }
  });
});
