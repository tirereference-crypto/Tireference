import { describe, expect, it } from 'vitest';
import {
  buildDiameterFaqs,
  buildDiameterVsWheelExample,
  buildPopularComparisonsForDiameterSearch,
  buildPopularSizesNearDiameter,
  countIndexedSizesNearDiameter,
  DIAMETER_FAQ_PRIMARY_COUNT,
  tireMatchesDiameterSearch,
} from './tire-diameter-insights';
import { buildFaqPageSchema } from './seo/schema';
import { getRelatedCalculatorLinks, CALCULATOR_PATHS } from './calculator-links';

describe('buildPopularSizesNearDiameter', () => {
  it('returns closest popular sizes by overall diameter', () => {
    const cards = buildPopularSizesNearDiameter(33, 4);
    expect(cards.length).toBe(4);
    expect(cards[0].size).toBeTruthy();
    expect(cards[0].diameterIn).toBeGreaterThan(0);
    expect(cards[0].hubHref).toMatch(/^\/tire-size\//);
  });
});

describe('countIndexedSizesNearDiameter', () => {
  it('returns real catalog counts for nearest-inch diameter classes', () => {
    const near33 = countIndexedSizesNearDiameter(33);
    expect(near33).toBeGreaterThan(0);
  });

  it('uses nearest-inch rounding without overlapping ±1 bands', () => {
    const c31 = countIndexedSizesNearDiameter(31);
    const c33 = countIndexedSizesNearDiameter(33);
    // Counts are independent nearest-inch buckets, so they need not sum to a ±1 band.
    expect(c31).toBeGreaterThanOrEqual(0);
    expect(c33).toBeGreaterThanOrEqual(0);
  });

  it('gates popular diameter CTAs on indexed counts', () => {
    for (const d of [31, 33, 35]) {
      expect(countIndexedSizesNearDiameter(d)).toBeGreaterThanOrEqual(0);
    }
    expect(countIndexedSizesNearDiameter(33)).toBeGreaterThan(0);
  });
});

describe('buildDiameterVsWheelExample', () => {
  it('uses preferred closest size even when wheel filter differs', () => {
    const example = buildDiameterVsWheelExample(18, {
      preferredSize: '275/70R18',
      targetDiameterIn: 33,
    });
    expect(example.exampleSize).toBe('275/70R18');
    expect(example.overallDiameterIn).toBeCloseTo(33.16, 1);
    expect(example.sidewallIn).toBeGreaterThan(0);
    expect(example.wheelIn).toBe(18);
  });
});

describe('buildPopularComparisonsForDiameterSearch', () => {
  const params33x18 = {
    targetDiameterIn: 33,
    wheelDiameterIn: 18 as const,
    toleranceIn: 1,
  };

  it('only includes pairs with at least one tire matching diameter, wheel, and tolerance', () => {
    const links = buildPopularComparisonsForDiameterSearch(params33x18, 6);

    expect(links.length).toBeGreaterThan(0);
    for (const link of links) {
      const [sizeA, sizeB] = link.label.split(' vs ');
      const aMatch = tireMatchesDiameterSearch(sizeA, params33x18);
      const bMatch = tireMatchesDiameterSearch(sizeB, params33x18);
      expect(aMatch || bMatch).toBe(true);
    }
  });

  it('excludes unrelated passenger sizes for a 33 inch 18 inch search', () => {
    const links = buildPopularComparisonsForDiameterSearch(params33x18, 6);
    const labels = links.map((link) => link.label);

    expect(labels).not.toContain('225/45R17 vs 235/40R18');
    expect(labels).not.toContain('205/55R16 vs 215/55R17');
    expect(labels).not.toContain('285/70R17 vs 285/75R16');
  });

  it('prioritizes pairs where both tires match the active search', () => {
    const links = buildPopularComparisonsForDiameterSearch(
      {
        targetDiameterIn: 33,
        wheelDiameterIn: 18,
        toleranceIn: 2,
      },
      6,
    );

    const bothMatch = links.filter((link) => {
      const [sizeA, sizeB] = link.label.split(' vs ');
      return (
        tireMatchesDiameterSearch(sizeA, {
          targetDiameterIn: 33,
          wheelDiameterIn: 18,
          toleranceIn: 2,
        }) &&
        tireMatchesDiameterSearch(sizeB, {
          targetDiameterIn: 33,
          wheelDiameterIn: 18,
          toleranceIn: 2,
        })
      );
    });

    if (bothMatch.length > 1) {
      expect(links.indexOf(bothMatch[0])).toBeLessThan(
        links.findIndex((link) => !bothMatch.includes(link)),
      );
    }
  });
});

describe('buildDiameterFaqs', () => {
  it('builds twelve FAQs with dynamic target and closest match', () => {
    const faqs = buildDiameterFaqs({
      targetDiameterIn: 33,
      wheelDiameterIn: 18,
      closestSize: '275/70R18',
      closestDiameterIn: 33.16,
      toleranceIn: 1,
    });
    expect(faqs).toHaveLength(12);
    expect(faqs[0].question).toContain('33.0 inches');
    expect(faqs[0].answer).toContain('275/70R18');
    expect(faqs.some((f) => f.question.includes('speedometer'))).toBe(true);
    expect(
      faqs.find((f) => f.question.includes('acceptable'))?.answer,
    ).toContain('common screening guideline, not a guarantee');
  });

  it('limits FAQ schema to primary rendered questions', () => {
    const faqs = buildDiameterFaqs({
      targetDiameterIn: 35,
      wheelDiameterIn: 'any',
      closestSize: null,
      closestDiameterIn: null,
      toleranceIn: 2,
    });
    const primary = faqs.slice(0, DIAMETER_FAQ_PRIMARY_COUNT);
    const schema = buildFaqPageSchema(primary);
    expect(schema?.mainEntity).toHaveLength(DIAMETER_FAQ_PRIMARY_COUNT);
    expect(primary[0].question).toContain('35.0 inches');
  });
});

describe('diameter related calculators registry', () => {
  it('excludes the current diameter calculator and nonexistent tools', () => {
    const related = getRelatedCalculatorLinks(CALCULATOR_PATHS.tireDiameter, { limit: 6 });
    expect(related.every((card) => card.href !== CALCULATOR_PATHS.tireDiameter)).toBe(true);
    expect(related.some((card) => /aspect ratio/i.test(card.label))).toBe(false);
    expect(related.some((card) => card.href === CALCULATOR_PATHS.wheelOffset)).toBe(true);
    for (const card of related) {
      expect(card.href).toMatch(/^\/calculators\/.+\/$/);
    }
  });
});
