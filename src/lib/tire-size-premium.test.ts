import { describe, expect, it } from 'vitest';
import { TIRE_SIZES } from '../data/tire-sizes';
import { buildTireSizeHubData } from './tire-size-hub';
import { buildQuickTakeForSize } from './tire-size-quick-take';
import { buildSearchableFaq } from './tire-size-searchable-faq';

describe('premium hub content for all sizes', () => {
  it('generates quick take for every tire size', () => {
    for (const entry of TIRE_SIZES) {
      const hub = buildTireSizeHubData(entry.size)!;
      const quickTake = buildQuickTakeForSize(hub);
      expect(quickTake.bestFor.length).toBeGreaterThanOrEqual(3);
      expect(quickTake.considerAnotherSizeIf.length).toBeGreaterThanOrEqual(3);
    }
  });

  it('generates searchable FAQ for every tire size', () => {
    for (const entry of TIRE_SIZES) {
      const hub = buildTireSizeHubData(entry.size)!;
      expect(hub.faq.length).toBe(6);
      const questions = hub.faq.map((q) => q.question.toLowerCase()).join(' ');
      expect(questions).not.toContain('what is the diameter');
      expect(questions).not.toContain('revs per mile');
    }
  });

  it('keeps 275/70R18 expert FAQ override', () => {
    const hub = buildTireSizeHubData('275/70R18')!;
    expect(hub.faq[0].question).toBe('Is 275/70R18 worth upgrading to?');
  });

  it('varies FAQ questions by category', () => {
    const offRoad = buildSearchableFaq(buildTireSizeHubData('275/70R18')!);
    const perf = buildSearchableFaq(buildTireSizeHubData('225/45R17')!);
    expect(offRoad[4].question).toContain('overlanders');
    expect(perf[1].question).toContain('handling');
  });
});
