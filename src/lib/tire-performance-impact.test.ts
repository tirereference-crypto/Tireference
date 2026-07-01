import { describe, expect, it } from 'vitest';
import { buildPerformanceImpactCards, buildPerformanceImpactSummary } from './tire-performance-impact';
import { getTireSpecs } from './tire-math';

describe('buildPerformanceImpactCards', () => {
  it('returns six impact cards with ratings and badges', () => {
    const specs = getTireSpecs('275/70R18');
    const cards = buildPerformanceImpactCards(specs);

    expect(cards).toHaveLength(7);
    expect(cards.map((card) => card.id)).toEqual([
      'comfort',
      'handling',
      'fuel',
      'clearance',
      'offroad',
      'towing',
      'snow',
    ]);

    for (const card of cards) {
      expect(card.rating).toBeGreaterThanOrEqual(1);
      expect(card.rating).toBeLessThanOrEqual(5);
      expect(['BETTER', 'MODERATE', 'NEUTRAL', 'TRADEOFF']).toContain(card.impact);
      expect(card.copy.length).toBeGreaterThan(0);
    }
  });

  it('builds an editorial summary from strengths and tradeoffs', () => {
    const specs = getTireSpecs('275/70R18');
    const cards = buildPerformanceImpactCards(specs);
    const summary = buildPerformanceImpactSummary(cards);

    expect(summary.length).toBeGreaterThan(20);
    expect(summary.endsWith('.')).toBe(true);
  });
});
