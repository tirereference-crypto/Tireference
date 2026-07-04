import { describe, expect, it } from 'vitest';
import { getTireSpecs } from './tire-math';
import { isValidComparisonPair } from './tire-comparison-links';
import { buildExploreFurtherData, hasExploreFurtherContent } from './tire-explore-further';

describe('buildExploreFurtherData', () => {
  it('builds upgrade paths and comparisons for a truck size', () => {
    const specs = getTireSpecs('275/70R18');
    const data = buildExploreFurtherData('275/70R18', specs);

    expect(hasExploreFurtherContent(data)).toBe(true);
    expect(data.upgradePaths.length).toBeGreaterThan(0);
    expect(data.upgradePaths.length).toBeLessThanOrEqual(3);
    expect(data.comparisons.length).toBe(data.upgradePaths.length);
    expect(data.popularTires.length).toBe(3);

    for (const path of data.upgradePaths) {
      expect(path.diameterChangeIn).toBeGreaterThan(0);
      expect(path.comparisonHref).toContain('current=275%2F70R18');
      expect(path.fitmentNote.length).toBeGreaterThan(0);
      expect(isValidComparisonPair('275/70R18', path.size)).toBe(true);
    }

    for (const comparison of data.comparisons) {
      expect(comparison.label).toContain('275/70R18 vs');
      expect(comparison.comparisonHref).toContain('tire-comparison-calculator');
      expect(isValidComparisonPair('275/70R18', comparison.targetSize)).toBe(true);
    }
  });

  it('updates when tire size changes', () => {
    const specsA = getTireSpecs('275/70R18');
    const specsB = getTireSpecs('265/70R17');
    const dataA = buildExploreFurtherData('275/70R18', specsA);
    const dataB = buildExploreFurtherData('265/70R17', specsB);

    expect(dataA.upgradePaths[0]?.size).not.toBe(dataB.upgradePaths[0]?.size);
  });
});
