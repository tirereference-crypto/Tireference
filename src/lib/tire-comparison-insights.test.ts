import { describe, expect, it } from 'vitest';
import { buildComparisonInsights, buildComparisonPageIntro } from './tire-comparison-insights';
import { compareTires, getTireSpecs } from './tire-math';

describe('buildComparisonInsights', () => {
  it('225/45R17 vs 235/40R18 produces dynamic SEO and fitment data', () => {
    const sizeA = '225/45R17';
    const sizeB = '235/40R18';
    const specsA = getTireSpecs(sizeA);
    const specsB = getTireSpecs(sizeB);
    const comparison = compareTires(sizeA, sizeB, 60);
    const insights = buildComparisonInsights(sizeA, sizeB, comparison, specsA, specsB);

    expect(insights.seo.h1).toBe('Tire Size Comparison Calculator');
    expect(insights.seo.title).toContain(sizeA);
    expect(insights.seo.title).toContain(sizeB);
    expect(insights.pageIntro.sentence).toContain(sizeA);
    expect(insights.pageIntro.sentence).toContain(sizeB);
    expect(insights.pageIntro.sentence.length).toBeLessThanOrEqual(160);
    expect(insights.summaryChips).toHaveLength(3);
    expect(insights.summaryChips[0].label).toBe('Diameter');
    expect(insights.personalityCards).toHaveLength(3);
    expect(insights.personalityCards.filter((card) => card.isPrimary)).toHaveLength(1);
    expect(insights.willThisFitRows).toHaveLength(6);
    expect(insights.willThisFitRows[0].label).toBe('Diameter Change');
    expect(insights.upgradePaths?.cards.length).toBeGreaterThanOrEqual(4);
    expect(insights.upgradePaths?.cards[0].tierLabel).toBe('Current Size');
    expect(insights.upgradePaths?.cards[1].href).toContain('/compare/');
    expect(insights.upgradePaths?.cards[1].href).toContain('-vs-');
    expect(insights.popularComparisons.length).toBeGreaterThan(0);
    expect(insights.popularComparisons.length).toBeLessThanOrEqual(6);
    expect(insights.popularComparisons[0].href).toMatch(/^\/compare\//);
    expect(insights.upgradePaths?.cards[1].fitmentDifficulty).toBeTruthy();
    expect(insights.quickVerdict.label).toBeTruthy();
    expect(insights.quickVerdict.score).toBe(insights.fitmentScore);
    expect(insights.quickVerdict.benefits.length).toBeGreaterThan(0);
    expect(insights.quickVerdict.bestFor.length).toBeGreaterThan(0);
    expect(insights.understandingDifference).toContain(sizeA);
    expect(insights.understandingDifference.split(/\s+/).length).toBeGreaterThanOrEqual(120);
    expect(insights.understandingDifference.split(/\s+/).length).toBeLessThanOrEqual(200);
    expect(insights.seo.whatChanges).toContain(sizeA);
    expect(insights.seo.whatChanges).toContain(sizeB);
    expect(insights.kpiCards).toHaveLength(6);
    expect(insights.performanceCards).toHaveLength(6);
    expect(insights.fitmentChecks).toHaveLength(6);
    expect(insights.fitmentScore).toBeGreaterThan(0);
    expect(insights.starRating).toBeGreaterThan(0);
    expect(insights.thingsToConsider.length).toBeGreaterThan(0);
    expect(insights.seo.faqs.length).toBeGreaterThanOrEqual(6);
  });

  it('buildComparisonPageIntro uses natural comparison language', () => {
    const intro = buildComparisonPageIntro('225/45R17', '235/40R18');
    expect(intro.sentence).toContain('225/45R17');
    expect(intro.sentence).toContain('235/40R18');
    expect(intro.sentence).toContain('vs');
    expect(intro.sentence.length).toBeLessThanOrEqual(160);
  });

  it('quick verdict uses score-based labels', () => {
    const sizeA = '225/45R17';
    const sizeB = '235/40R18';
    const insights = buildComparisonInsights(
      sizeA,
      sizeB,
      compareTires(sizeA, sizeB, 60),
      getTireSpecs(sizeA),
      getTireSpecs(sizeB),
    );

    expect(['Excellent Upgrade', 'Good Upgrade', 'Consider Carefully', 'Not Recommended']).toContain(
      insights.quickVerdict.label,
    );
    expect(insights.quickVerdict.tone).toMatch(/green|yellow|orange|red/);
  });

  it('different size pairs produce different FAQ answers', () => {
    const a = buildComparisonInsights(
      '225/45R17',
      '235/40R18',
      compareTires('225/45R17', '235/40R18', 60),
      getTireSpecs('225/45R17'),
      getTireSpecs('235/40R18'),
    );
    const b = buildComparisonInsights(
      '275/70R18',
      '285/75R18',
      compareTires('275/70R18', '285/75R18', 60),
      getTireSpecs('275/70R18'),
      getTireSpecs('285/75R18'),
    );

    expect(a.seo.whatChanges).not.toBe(b.seo.whatChanges);
    expect(a.seo.faqs[0].answer).not.toBe(b.seo.faqs[0].answer);
  });

  it('pros/cons never contradict the computed dimensional direction', () => {
    const pairs: [string, string][] = [
      ['225/45R17', '235/40R18'], // taller + wider
      ['235/40R18', '225/45R17'], // shorter + narrower
      ['275/70R18', '285/75R18'], // truck, taller
      ['265/70R17', '245/70R16'], // smaller diameter
    ];

    for (const [a, b] of pairs) {
      const specsA = getTireSpecs(a);
      const specsB = getTireSpecs(b);
      const insights = buildComparisonInsights(a, b, compareTires(a, b, 60), specsA, specsB);
      const pros = insights.personality.pros.join(' | ');
      const cons = insights.personality.cons.join(' | ');

      const larger = specsB.overallDiameterIn > specsA.overallDiameterIn + 0.05;
      const smaller = specsB.overallDiameterIn < specsA.overallDiameterIn - 0.05;
      const wider = specsB.widthMm > specsA.widthMm + 3;
      const narrower = specsB.widthMm < specsA.widthMm - 3;

      if (larger) expect(cons).not.toContain('Less ground clearance');
      if (smaller) expect(pros).not.toContain('More ground clearance');
      if (wider) expect(cons).not.toContain('Smaller contact patch');
      if (narrower) expect(pros).not.toContain('Larger contact patch');
    }
  });

  it('does not recommend overlanding or off-road for performance-class tires', () => {
    const a = '205/40R17';
    const b = '225/45R18';
    const insights = buildComparisonInsights(
      a,
      b,
      compareTires(a, b, 60),
      getTireSpecs(a),
      getTireSpecs(b),
    );

    expect(insights.quickVerdict.bestFor).not.toContain('Overlanding');
    expect(insights.quickVerdict.bestFor).not.toContain('Off-Road Builds');
    expect(insights.quickVerdict.bestFor).not.toContain('Towing');
  });

  it('verdict label and recommendation label agree and follow score bands', () => {
    const a = '225/45R17';
    const b = '235/40R18';
    const insights = buildComparisonInsights(
      a,
      b,
      compareTires(a, b, 60),
      getTireSpecs(a),
      getTireSpecs(b),
    );

    const s = insights.fitmentScore;
    const expected =
      s >= 9.5
        ? 'Excellent Upgrade'
        : s >= 8
          ? 'Good Upgrade'
          : s >= 6
            ? 'Consider Carefully'
            : 'Not Recommended';

    expect(insights.quickVerdict.label).toBe(expected);
    expect(insights.recommendationLabel).toBe(expected);
  });
});
