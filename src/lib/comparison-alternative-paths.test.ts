import { describe, expect, it } from 'vitest';
import { buildAlternativeComparisonPaths } from './comparison-alternative-paths';

describe('buildAlternativeComparisonPaths', () => {
  it('returns unique cards with required fields for a common size', () => {
    const cards = buildAlternativeComparisonPaths('225/45R17', 'imperial', 8);
    expect(cards.length).toBeGreaterThan(0);
    expect(cards.length).toBeLessThanOrEqual(8);

    const sizes = new Set(cards.map((c) => c.size));
    expect(sizes.size).toBe(cards.length);

    for (const card of cards) {
      expect(card.roleLabel.length).toBeGreaterThan(0);
      expect(card.size).toMatch(/\d+\/\d+R\d+/);
      expect(card.diameterDiff).toMatch(/%/);
      expect(card.widthDiff.length).toBeGreaterThan(0);
      expect(card.wheelDiameter).toMatch(/"/);
      expect(['Same Wheel', 'Different Wheel']).toContain(card.wheelBadge);
      expect(card.compareHref).toContain('/calculators/tire-comparison-calculator/');
      expect(card.diameterDiff).not.toMatch(/NaN|undefined/);
      expect(card.widthDiff).not.toMatch(/NaN|undefined/);
    }
  });

  it('returns empty for invalid size', () => {
    expect(buildAlternativeComparisonPaths('not-a-size')).toEqual([]);
  });
});
