import { describe, expect, it } from 'vitest';
import {
  buildAlternativeComparisonPaths,
  buildCloserSameWheelAlternatives,
} from './comparison-alternative-paths';
import { getTireSpecs } from './tire-math';

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
      // Clean published /compare/ page, or crawlable size guide fallback.
      expect(card.compareHref).toMatch(
        /^(\/compare\/[a-z0-9-]+-vs-[a-z0-9-]+\/|\/tire-size\/|\/calculators\/tire-size-calculator\/)/,
      );
      expect(card.diameterDiff).not.toMatch(/NaN|undefined/);
      expect(card.widthDiff).not.toMatch(/NaN|undefined/);
    }
  });

  it('returns empty for invalid size', () => {
    expect(buildAlternativeComparisonPaths('not-a-size')).toEqual([]);
  });

  it('excludes the currently compared size when excludeSize is provided', () => {
    const withoutExclusion = buildAlternativeComparisonPaths('225/45R17', 'imperial', 8);
    expect(withoutExclusion.length).toBeGreaterThan(0);

    for (const card of withoutExclusion) {
      const filtered = buildAlternativeComparisonPaths('225/45R17', 'imperial', 8, card.size);
      expect(filtered.map((c) => c.size)).not.toContain(card.size);
    }
  });

  it('returns only same-wheel alternatives closer than the compared size', () => {
    const base = '275/70R18';
    const compared = '305/70R18';
    const baseSpecs = getTireSpecs(base);
    const targetDiff = Math.abs(
      ((getTireSpecs(compared).overallDiameterIn - baseSpecs.overallDiameterIn) /
        baseSpecs.overallDiameterIn) *
        100,
    );
    const cards = buildCloserSameWheelAlternatives(base, compared, 'imperial', 4);

    expect(cards.length).toBeGreaterThan(0);
    for (const card of cards) {
      expect(card.wheelBadge).toBe('Same Wheel');
      expect(card.size).not.toBe(compared);
      const diff = Math.abs(
        ((getTireSpecs(card.size).overallDiameterIn - baseSpecs.overallDiameterIn) /
          baseSpecs.overallDiameterIn) *
          100,
      );
      expect(diff).toBeLessThan(targetDiff);
    }
  });

  it('hides closer alternatives when the compared diameter already matches', () => {
    expect(
      buildCloserSameWheelAlternatives('225/45R17', '225/45R17', 'imperial', 4),
    ).toEqual([]);
  });
});
