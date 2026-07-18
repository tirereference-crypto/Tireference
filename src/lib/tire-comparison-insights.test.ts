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

    expect(insights.seo.h1).toBe('225/45R17 vs 235/40R18 Tire Size Comparison');
    expect(insights.seo.title).toContain(sizeA);
    expect(insights.seo.title).toContain(sizeB);
    expect(insights.pageIntro.sentence).toContain(sizeA);
    expect(insights.pageIntro.sentence).toContain(sizeB);
    expect(insights.pageIntro.sentence).toMatch(/overall diameter/i);
    expect(insights.pageIntro.sentence).toMatch(/speedometer impact/i);
    expect(insights.pageIntro.sentence).toMatch(/dimensional calculations only/i);
    expect(insights.summaryChips).toHaveLength(3);
    expect(insights.summaryChips[0].label).toBe('Diameter difference');
    expect(['within', 'caution', 'neutral']).toContain(insights.summaryChips[0].tone);
    expect(insights.kpiCards).toHaveLength(6);
    expect(insights.kpiCards[0].originalValue).toBeTruthy();
    expect(insights.kpiCards[0].newValue).toBeTruthy();
    expect(insights.kpiCards[0].icon).toBe('diameter');
    expect(insights.kpiCards.every((card) => card.tone === 'neutral')).toBe(true);
    expect(insights.kpiCards[2].label).toBe('Sidewall Height');
    expect(insights.kpiCards[4].label).toBe('Speedometer Difference');
    expect(insights.personalityCards).toHaveLength(3);
    expect(insights.willThisFitRows).toHaveLength(7);
    expect(insights.willThisFitRows[0].label).toBe('Overall Fitment');
    if (insights.upgradePaths?.cards) {
      expect(insights.upgradePaths.cards.length).toBeGreaterThanOrEqual(4);
      expect(insights.upgradePaths.cards[0].tierLabel).toBe('Current Size');
      const linked = insights.upgradePaths.cards.find((card) => Boolean(card.href));
      expect(linked?.href).toContain('/compare/');
    }
    expect(insights.quickVerdict.label).toBeTruthy();
    expect(insights.quickVerdict.score).toBe(insights.fitmentScore);
    expect(insights.quickVerdict.benefits.length).toBeGreaterThan(0);
    expect(insights.whatThisChangeMeans).toContain(sizeA);
    expect(insights.whatThisChangeMeans).toContain(sizeB);
    expect(insights.whatThisChangeMeans.split(/\s+/).length).toBeGreaterThanOrEqual(120);
    expect(insights.engineeringAnalysis.sections).toHaveLength(9);
    expect(insights.qualityValidation.approved).toBe(true);
    expect(insights.seo.isGoodUpgrade.headline).not.toMatch(/aggressive upgrade/i);
    expect(insights.performanceCards.find((c) => c.id === 'handling')?.value).not.toBe('Improved');
    expect(insights.kpiCards).toHaveLength(6);
    expect(insights.performanceCards).toHaveLength(6);
    expect(insights.fitmentScore).toBeGreaterThan(0);
    expect(insights.thingsToConsider.length).toBeGreaterThan(0);
    expect(insights.seo.faqs.length).toBeGreaterThanOrEqual(1);
  });

  it('buildComparisonPageIntro keeps fixed dashboard copy for the blank calculator', () => {
    const intro = buildComparisonPageIntro('225/45R17', '235/40R18');
    expect(intro.sentence).toMatch(/Compare two tire sizes side by side/i);
    expect(intro.sentence).toMatch(/wheel requirements/i);
    expect(intro.sentence).not.toContain('225/45R17');
  });

  it('pair insights pageIntro is pair-specific calculated answer copy', () => {
    const insights = buildComparisonInsights(
      '275/70R18',
      '285/70R18',
      compareTires('275/70R18', '285/70R18', 60),
      getTireSpecs('275/70R18'),
      getTireSpecs('285/70R18'),
    );
    expect(insights.seo.h1).toBe('275/70R18 vs 285/70R18 Tire Size Comparison');
    expect(insights.pageIntro.sentence).toContain('same 18" wheel diameter');
    expect(insights.seo.metaDescription).toContain('Same 18" wheel');
    expect(insights.seo.metaDescription).not.toMatch(/fitment score/i);
  });

  it('builds stable KPI cards for 275/70R18 vs 285/70R18 and same-size', () => {
    const run = (a: string, b: string) => {
      const insights = buildComparisonInsights(
        a,
        b,
        compareTires(a, b, 60),
        getTireSpecs(a),
        getTireSpecs(b),
      );
      expect(insights.kpiCards).toHaveLength(6);
      expect(insights.kpiCards[1].label).toBe('Section Width');
      expect(insights.kpiCards[5].label).toMatch(/Rev/i);
      return insights;
    };

    const wider = run('275/70R18', '285/70R18');
    expect(wider.kpiCards[1].diffAmount).toMatch(/\+/);

    const same = run('225/45R17', '225/45R17');
    expect(same.summaryChips.every((chip) => chip.tone === 'within')).toBe(true);
    expect(same.kpiCards[0].diffAmount).toMatch(/0\.00/);
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

    expect([
      'Very close dimensional match',
      'Moderate change — vehicle checks required',
      'Significant dimensional change',
    ]).toContain(insights.quickVerdict.label);
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

    expect(a.whatThisChangeMeans).not.toBe(b.whatThisChangeMeans);
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

  it('merged narrative avoids repeating spec-table measurements', () => {
    const sizeA = '225/45R17';
    const sizeB = '235/40R18';
    const insights = buildComparisonInsights(
      sizeA,
      sizeB,
      compareTires(sizeA, sizeB, 60),
      getTireSpecs(sizeA),
      getTireSpecs(sizeB),
    );

    expect(insights.whatThisChangeMeans).toContain('spec table');
    expect(insights.whatThisChangeMeans).not.toMatch(/\d+\.\d{2}%/);
    expect(insights.seo.isGoodUpgrade.body).toContain('Fitment score');
    expect(insights.seo.faqs.length).toBeGreaterThanOrEqual(1);
    expect(insights.seo.faqs[0].question).toMatch(/vehicle fitment/i);
    expect(insights.seo.faqs.some((f) => f.question.includes('vehicle fitment'))).toBe(true);
    for (const faq of insights.seo.faqs) {
      expect(faq.answer).toMatch(/\d/);
      expect(faq.answer.toLowerCase()).not.toMatch(
        /it depends on your priorities|both sizes have advantages|depends on driving style/,
      );
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
      s >= 8
        ? 'Very close dimensional match'
        : s >= 5
          ? 'Moderate change — vehicle checks required'
          : 'Significant dimensional change';

    expect(insights.quickVerdict.label).toBe(expected);
    expect(insights.recommendationLabel).toBe(expected);
  });
});
