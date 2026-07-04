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
    if (insights.upgradePaths?.cards) {
      expect(insights.upgradePaths.cards.length).toBeGreaterThanOrEqual(4);
      expect(insights.upgradePaths.cards[0].tierLabel).toBe('Current Size');
      expect(insights.upgradePaths.cards[1].href).toContain('/compare/');
      expect(insights.upgradePaths.cards[1].href).toContain('-vs-');
      expect(insights.upgradePaths.cards[1].fitmentDifficulty).toBeTruthy();
    }
    expect(insights.quickVerdict.label).toBeTruthy();
    expect(insights.quickVerdict.score).toBe(insights.fitmentScore);
    expect(insights.quickVerdict.benefits.length).toBeGreaterThan(0);
    expect(insights.quickVerdict.bestFor.length).toBeGreaterThan(0);
    expect(insights.understandingDifference).toContain(sizeA);
    expect(insights.understandingDifference.split(/\s+/).length).toBeGreaterThanOrEqual(120);
    expect(insights.engineeringAnalysis.sections).toHaveLength(9);
    expect(insights.engineeringAnalysis.byId['ride-quality'].title).toBe('Ride Quality');
    expect(insights.qualityValidation.approved).toBe(true);
    expect(insights.seo.isGoodUpgrade.headline).not.toMatch(/aggressive upgrade/i);
    expect(insights.performanceCards.find((c) => c.id === 'handling')?.value).not.toBe('Improved');
    expect(insights.performanceCards.find((c) => c.id === 'handling')?.explanation).toMatch(/\d/);
    expect(insights.performanceCards.find((c) => c.id === 'clearance')?.explanation).toMatch(
      /diameter|clearance|in/i,
    );
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

    expect(['Excellent Upgrade', 'Good Upgrade', 'Not Recommended']).toContain(
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
      ['225/45R17', '235/40R18'],
      ['235/40R18', '225/45R17'],
      ['275/70R18', '285/75R18'],
      ['265/70R17', '245/70R16'],
    ];

    for (const [a, b] of pairs) {
      const specsA = getTireSpecs(a);
      const specsB = getTireSpecs(b);
      const insights = buildComparisonInsights(a, b, compareTires(a, b, 60), specsA, specsB);
      const pros = insights.personality.pros.join(' | ').toLowerCase();
      const cons = insights.personality.cons.join(' | ').toLowerCase();

      const larger = specsB.overallDiameterIn > specsA.overallDiameterIn + 0.05;
      const smaller = specsB.overallDiameterIn < specsA.overallDiameterIn - 0.05;
      const wider = specsB.widthMm > specsA.widthMm + 3;
      const narrower = specsB.widthMm < specsA.widthMm - 3;

      if (larger) expect(cons).not.toMatch(/\breduced underbelly clearance\b|\blower clearance\b/);
      if (smaller) expect(pros).not.toMatch(/\btaller diameter\b|\bclearance gain\b/);
      if (wider) expect(cons).not.toMatch(/\bnarrower section\b|\bnarrower footprint\b/);
      if (narrower) expect(pros).not.toMatch(/\bwider section\b|\blarger contact patch\b/);
    }
  });

  it('narrative sections avoid repeating spec-table measurements', () => {
    const sizeA = '225/45R17';
    const sizeB = '235/40R18';
    const insights = buildComparisonInsights(
      sizeA,
      sizeB,
      compareTires(sizeA, sizeB, 60),
      getTireSpecs(sizeA),
      getTireSpecs(sizeB),
    );

    expect(insights.understandingDifference).toContain('spec table');
    expect(insights.understandingDifference).not.toMatch(/\d+\.\d{2}%/);
    expect(insights.seo.whatChanges).not.toMatch(/\d+\.\d{2}%/);
    expect(insights.seo.whoShouldChoose).not.toMatch(/\d+\.\d{2}%/);
    expect(insights.seo.isGoodUpgrade.body).toContain('Fitment score');
    expect(insights.seo.faqs[0].question).toMatch(/mock-fit/i);
    expect(insights.seo.faqs.find((f) => f.question.includes('fuel economy'))!.answer).not.toMatch(
      /revs\/mi.*revs\/mi/i,
    );
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
      s >= 8.5
        ? 'Excellent Upgrade'
        : s >= 6.5
          ? 'Good Upgrade'
          : 'Not Recommended';

    expect(insights.quickVerdict.label).toBe(expected);
    expect(insights.recommendationLabel).toBe(expected);
  });

  it('FAQ fuel answer cites RPM without invented MPG percentages', () => {
    const sizeA = '275/70R18';
    const sizeB = '285/75R18';
    const insights = buildComparisonInsights(
      sizeA,
      sizeB,
      compareTires(sizeA, sizeB, 60),
      getTireSpecs(sizeA),
      getTireSpecs(sizeB),
    );

    const fuelFaq = insights.seo.faqs.find((f) => f.question.includes('fuel economy'));
    expect(fuelFaq).toBeTruthy();
    expect(fuelFaq!.answer).toMatch(/RPM|revs/i);
    expect(fuelFaq!.answer).not.toMatch(/1–3%|0–2%/);
  });
});
