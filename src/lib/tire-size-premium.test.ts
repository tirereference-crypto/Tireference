import { describe, expect, it } from 'vitest';
import { TIRE_SIZES } from '../data/tire-sizes';
import { buildTireSizeHubData } from './tire-size-hub';
import { buildQuickTakeForSize, buildHeroUseSummary } from './tire-size-quick-take';
import { buildSearchableFaq } from './tire-size-searchable-faq';

describe('premium hub content for all sizes', () => {
  it('generates quick take for every tire size', () => {
    for (const entry of TIRE_SIZES) {
      const hub = buildTireSizeHubData(entry.size)!;
      const quickTake = buildQuickTakeForSize(hub);
      expect(quickTake.bestFor.length).toBeGreaterThanOrEqual(3);
      expect(quickTake.considerAnotherSizeIf.length).toBeGreaterThanOrEqual(3);

      const heroSummary = buildHeroUseSummary(hub);
      expect(heroSummary.typicalUses.length).toBeGreaterThanOrEqual(4);
      expect(heroSummary.bestFor.length).toBe(3);
      expect(heroSummary.considerIf.length).toBe(2);
    }
  });

  it('generates searchable FAQ for every tire size', () => {
    for (const entry of TIRE_SIZES) {
      const hub = buildTireSizeHubData(entry.size)!;
      expect(hub.faq.length).toBeGreaterThanOrEqual(1);
      expect(hub.faq.length).toBeLessThanOrEqual(6);
      const questions = hub.faq.map((q) => q.question.toLowerCase()).join(' ');
      expect(questions).not.toContain('what is the diameter');
      expect(questions).not.toContain('revs per mile');
    }
  });

  it('leads 275/70R18 FAQ with product-data questions when indexed', () => {
    const hub = buildTireSizeHubData('275/70R18')!;
    expect(hub.faq[0].question).toMatch(/Which brands make 275\/70R18/i);
  });

  it('varies FAQ questions by category', () => {
    const offRoad = buildSearchableFaq(buildTireSizeHubData('275/70R18')!);
    const perf = buildSearchableFaq(buildTireSizeHubData('225/45R17')!);
    expect(offRoad.some((q) => q.question.includes('overlanders'))).toBe(true);
    expect(perf.some((q) => q.question.toLowerCase().includes('handling'))).toBe(true);
  });
});
