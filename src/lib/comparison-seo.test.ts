import { describe, expect, it } from 'vitest';
import { compareTires, getTireSpecs } from './tire-math';
import {
  buildComparisonAnswerSummary,
  buildComparisonMetaDescription,
  buildComparisonMetaTitle,
  buildComparisonPageHeading,
  buildComparisonSeoBundle,
  buildComparisonSeoFacts,
  COMPARISON_CALCULATOR_HEADING,
} from './comparison-seo';

function bundleFor(sizeA: string, sizeB: string) {
  const specsA = getTireSpecs(sizeA);
  const specsB = getTireSpecs(sizeB);
  const comparison = compareTires(sizeA, sizeB, 60);
  return {
    specsA,
    specsB,
    comparison,
    facts: buildComparisonSeoFacts(sizeA, sizeB, comparison, specsA, specsB),
    seo: buildComparisonSeoBundle(sizeA, sizeB, comparison, specsA, specsB),
  };
}

describe('comparison-seo', () => {
  it('builds a pair-specific heading and meta title with normalized sizes', () => {
    const heading = buildComparisonPageHeading('225/45R17', '235/40R18');
    expect(heading).toBe('225/45R17 vs 235/40R18 Tire Size Comparison');
    expect(buildComparisonMetaTitle('225/45R17', '235/40R18')).toBe(heading);
  });

  it('different-wheel pair answer uses calculated deltas and wheel requirement', () => {
    const { facts, seo, specsA, specsB } = bundleFor('225/45R17', '235/40R18');

    expect(facts.requiresDifferentWheel).toBe(true);
    expect(facts.wheelA).toBe(17);
    expect(facts.wheelB).toBe(18);
    expect(specsA.wheelDiameterIn).not.toBe(specsB.wheelDiameterIn);

    expect(seo.h1).toBe('225/45R17 vs 235/40R18 Tire Size Comparison');
    expect(seo.calculatorHeading).toBe(COMPARISON_CALCULATOR_HEADING);
    expect(seo.title).toBe(seo.h1);

    const answer = buildComparisonAnswerSummary(facts);
    expect(answer).toContain('225/45R17 vs 235/40R18');
    expect(answer).toContain('overall diameter changes by');
    expect(answer).toContain('section width changes by');
    expect(answer).toContain('sidewall height changes by');
    expect(answer).toContain('static ground clearance shifts by about');
    expect(answer).toContain('Speedometer impact is about');
    expect(answer).toContain('requires a different wheel diameter (17" → 18")');
    expect(answer.toLowerCase()).toContain('dimensional calculations only');
    expect(answer.toLowerCase()).toContain('do not confirm vehicle fitment');
    expect(answer.toLowerCase()).not.toContain('side by side to see differences');

    const meta = buildComparisonMetaDescription(facts);
    expect(meta).toContain('225/45R17');
    expect(meta).toContain('235/40R18');
    expect(meta).toContain('Requires 17"→18" wheels');
    expect(meta.toLowerCase()).toContain('dimensional math only');
    expect(meta.toLowerCase()).not.toContain('fitment score');
  });

  it('same-wheel pair answer reports unchanged wheel diameter', () => {
    const { facts, seo } = bundleFor('275/70R18', '285/70R18');

    expect(facts.requiresDifferentWheel).toBe(false);
    expect(facts.wheelA).toBe(18);
    expect(facts.wheelB).toBe(18);

    expect(seo.h1).toBe('275/70R18 vs 285/70R18 Tire Size Comparison');

    const answer = buildComparisonAnswerSummary(facts);
    expect(answer).toContain('Both sizes use the same 18" wheel diameter.');
    expect(answer).not.toContain('requires a different wheel diameter');
    expect(answer).toContain('section width changes by +10 mm');
    expect(answer.toLowerCase()).toContain('dimensional calculations only');

    const meta = buildComparisonMetaDescription(facts);
    expect(meta).toContain('Same 18" wheel');
    expect(meta).toContain('+10 mm width');
  });

  it('keeps title, h1, and answer sizes aligned for each pair', () => {
    for (const [a, b] of [
      ['225/45R17', '235/40R18'],
      ['275/70R18', '285/70R18'],
    ] as const) {
      const { seo } = bundleFor(a, b);
      expect(seo.title).toBe(seo.h1);
      expect(seo.h1).toContain(a);
      expect(seo.h1).toContain(b);
      expect(seo.answer).toContain(a);
      expect(seo.answer).toContain(b);
      expect(seo.metaDescription).toContain(a);
      expect(seo.metaDescription).toContain(b);
    }
  });
});
