import { describe, expect, it } from 'vitest';
import {
  compareDiameterMatches,
  filterMatchesWithinTolerance,
  getMatchStatusLabels,
  rankDiameterMatches,
} from './tire-diameter-ranking';
import { searchTiresByDiameter, type TireDiameterMatch } from './tire-diameter-search';
import { getTireSpecs } from './tire-math';

function fakeMatch(
  size: string,
  target: number,
  overrides: Partial<TireDiameterMatch> = {},
): TireDiameterMatch {
  const specs = getTireSpecs(size);
  const diameterIn = overrides.diameterIn ?? specs.overallDiameterIn;
  const diameterDiffIn = diameterIn - target;
  return {
    size,
    category: 'SUV',
    specs,
    diameterIn,
    diameterDiffIn,
    diameterDiffPercent: target > 0 ? (diameterDiffIn / target) * 100 : 0,
    wheelDiameterIn: specs.wheelDiameterIn,
    categoryBadge: 'Daily Driving',
    hubHref: `/tire-size/${size.toLowerCase().replace('/', '-')}/`,
    popularity: 0,
    ...overrides,
  };
}

describe('tire-diameter-ranking', () => {
  it('ranks primarily by absolute nominal diameter difference', () => {
    const target = 33;
    const a = fakeMatch('275/70R18', target);
    const b = fakeMatch('265/70R18', target);
    const ranked = rankDiameterMatches([b, a], 18);
    expect(Math.abs(ranked[0].diameterDiffIn)).toBeLessThanOrEqual(
      Math.abs(ranked[1].diameterDiffIn) + 1e-9,
    );
  });

  it('keeps ranking stable and diameter-primary for equal diffs', () => {
    const target = 33;
    const a = fakeMatch('265/70R18', target, {
      diameterIn: 33,
      diameterDiffIn: 0,
      diameterDiffPercent: 0,
    });
    const b = fakeMatch('275/70R18', target, {
      diameterIn: 33,
      diameterDiffIn: 0,
      diameterDiffPercent: 0,
    });
    const rankedOnce = rankDiameterMatches([b, a], 18);
    const rankedTwice = rankDiameterMatches([a, b], 18);
    expect(rankedOnce.map((m) => m.size)).toEqual(rankedTwice.map((m) => m.size));
    expect(compareDiameterMatches(rankedOnce[0], rankedOnce[1], 18)).toBeLessThanOrEqual(0);
  });

  it('filters to selected maximum diameter difference', () => {
    const result = searchTiresByDiameter({
      targetDiameterIn: 33,
      wheelDiameterIn: 18,
      toleranceIn: 0.5,
    });
    const within = filterMatchesWithinTolerance(result.matches, 0.5);
    within.forEach((m) => {
      expect(Math.abs(m.diameterDiffIn)).toBeLessThanOrEqual(0.5 + 1e-9);
    });
  });

  it('preserves formula-calculated nominal diameter on closest 33"/18" match', () => {
    const result = searchTiresByDiameter({
      targetDiameterIn: 33,
      wheelDiameterIn: 18,
      toleranceIn: 1,
    });
    const ranked = rankDiameterMatches(
      filterMatchesWithinTolerance(result.matches, 1),
      18,
    );
    expect(ranked.length).toBeGreaterThan(0);
    const closest = ranked[0];
    const specs = getTireSpecs(closest.size);
    expect(closest.diameterIn).toBeCloseTo(specs.overallDiameterIn, 6);
    expect(closest.specs.sectionWidthIn).toBeCloseTo(specs.sectionWidthIn, 6);
    expect(closest.specs.sidewallIn).toBeCloseTo(specs.sidewallIn, 6);
    expect(closest.specs.circumferenceIn).toBeCloseTo(specs.circumferenceIn, 6);
    expect(closest.specs.revsPerMile).toBeCloseTo(specs.revsPerMile, 6);
  });

  it('labels at most one relationship badge plus optional production', () => {
    const match = fakeMatch('275/70R18', 33);
    const labels = getMatchStatusLabels(match, 33, 0, 1);
    expect(labels[0]).toBe('Closest');
    expect(labels.filter((l) => l !== 'Common production size')).toHaveLength(1);
    expect(labels).not.toContain('Perfect match' as never);
    expect(labels).not.toContain('Within 1%' as never);
    expect(labels).not.toContain('Within selected tolerance' as never);
    expect(labels.length).toBeLessThanOrEqual(2);
  });

  it('uses Exact when nominal delta is zero', () => {
    const match = fakeMatch('275/70R18', 33, {
      diameterIn: 33,
      diameterDiffIn: 0,
      diameterDiffPercent: 0,
    });
    const labels = getMatchStatusLabels(match, 33, 0, 1);
    expect(labels[0]).toBe('Exact');
  });

  it('omits relationship badge for non-closest near matches', () => {
    const match = fakeMatch('275/65R18', 33, {
      diameterDiffIn: 0.2,
      diameterDiffPercent: 0.6,
    });
    const labels = getMatchStatusLabels(match, 33, 1, 1);
    expect(labels).not.toContain('Closest');
    expect(labels).not.toContain('Exact');
  });
});
