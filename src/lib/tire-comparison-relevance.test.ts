import { describe, expect, it } from 'vitest';
import { getTireSpecs } from './tire-math';
import { buildPopularComparisonsForSize, isValidComparisonPair } from './tire-comparison-links';
import {
  MIN_COMPARISON_RELEVANCE_SCORE,
  rankComparisonCandidates,
  scoreComparisonRelevance,
} from './tire-comparison-relevance';

describe('tire-comparison-relevance', () => {
  it('scores closer diameter and same wheel higher', () => {
    const base = '275/70R18';
    const close = '285/70R17';
    const far = '225/45R17';

    expect(isValidComparisonPair(base, close)).toBe(true);
    expect(isValidComparisonPair(base, far)).toBe(false);

    const closeScore = scoreComparisonRelevance(base, close, ['upgrade-up']);
    const closeNoSource = scoreComparisonRelevance(base, close);
    expect(closeScore).toBeGreaterThan(closeNoSource);
    expect(closeScore).toBeGreaterThan(MIN_COMPARISON_RELEVANCE_SCORE);
  });

  it('ranks upgrade and equivalent paths above unrelated same-category sizes', () => {
    const base = '275/70R18';
    const ranked = rankComparisonCandidates(
      base,
      [
        { target: '305/70R18', sources: ['upgrade-up'] },
        { target: '285/70R17', sources: ['equivalent'] },
        { target: '275/65R18', sources: ['dataset'] },
      ],
      3,
    );

    expect(ranked.length).toBeGreaterThan(0);
    expect(ranked[0].target).toBe('305/70R18');
    for (const item of ranked) {
      expect(isValidComparisonPair(base, item.target)).toBe(true);
      expect(item.score).toBeGreaterThanOrEqual(MIN_COMPARISON_RELEVANCE_SCORE);
    }
  });

  it('buildPopularComparisonsForSize returns relevance-ranked valid links', () => {
    const links = buildPopularComparisonsForSize('275/70R18');
    expect(links.length).toBeGreaterThan(0);
    expect(links.length).toBeLessThanOrEqual(6);
    expect(links.some((link) => link.new === '225/45R17')).toBe(false);

    const specsA = getTireSpecs('275/70R18');
    for (const link of links) {
      expect(isValidComparisonPair(link.current, link.new)).toBe(true);
      const specsB = getTireSpecs(link.new);
      const wheelDiff = Math.abs(specsB.wheelDiameterIn - specsA.wheelDiameterIn);
      expect(wheelDiff).toBeLessThanOrEqual(2);
    }
  });

  it('225/45R17 suggestions stay in performance class with similar wheel', () => {
    const links = buildPopularComparisonsForSize('225/45R17');
    expect(links.length).toBeGreaterThan(0);

    for (const link of links) {
      const specsA = getTireSpecs(link.current);
      const specsB = getTireSpecs(link.new);
      expect(Math.abs(specsB.wheelDiameterIn - specsA.wheelDiameterIn)).toBeLessThanOrEqual(2);
      expect(isValidComparisonPair(link.current, link.new)).toBe(true);
    }
  });
});
