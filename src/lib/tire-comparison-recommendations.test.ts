import { describe, expect, it } from 'vitest';
import { compareTires, getTireSpecs } from './tire-math';
import { buildEngineeringAnalysis } from './tire-comparison-engineering-analysis';
import { buildComparisonInsights } from './tire-comparison-insights';
import {
  buildCategoryUseCaseTags,
  buildRecommendationContext,
  resolveTireCategory,
} from './tire-comparison-recommendations';

function ctxFor(sizeA: string, sizeB: string) {
  const specsA = getTireSpecs(sizeA);
  const specsB = getTireSpecs(sizeB);
  const comparison = compareTires(sizeA, sizeB, 60);
  const analysis = buildEngineeringAnalysis(sizeA, sizeB, comparison, specsA, specsB);
  const m = analysis.measurements;
  return buildRecommendationContext(sizeA, sizeB, comparison, specsA, specsB, {
    fitmentScore: m.fitmentScore,
    ratingsA: m.ratingsA,
    ratingsB: m.ratingsB,
    rpmA: m.rpmA,
    rpmB: m.rpmB,
    rpmDelta: m.rpmDelta,
    widthPct: m.widthPct,
    sidewallPct: m.sidewallPct,
  });
}

describe('tire-comparison-recommendations', () => {
  it('uses dataset category for known sizes', () => {
    expect(resolveTireCategory('275/70R18', getTireSpecs('275/70R18'))).toBe('off-road');
    expect(resolveTireCategory('225/45R17', getTireSpecs('225/45R17'))).toBe('performance');
    expect(resolveTireCategory('285/75R16', getTireSpecs('285/75R16'))).toBe('light-truck');
  });

  it('never tags performance tires with off-road or towing use cases', () => {
    const ctx = ctxFor('225/45R17', '235/40R18');
    expect(resolveTireCategory(ctx.sizeB, ctx.specsB)).toBe('performance');
    const tags = buildCategoryUseCaseTags(ctx);
    expect(tags).not.toContain('Overlanding');
    expect(tags).not.toContain('Towing');
    expect(tags).not.toContain('Trail Driving');
    expect(tags).not.toContain('Off-Road Builds');
  });

  it('tags off-road sizes with trail and clearance language', () => {
    const ctx = ctxFor('275/70R18', '285/75R18');
    expect(resolveTireCategory(ctx.sizeB, ctx.specsB)).toMatch(/off-road|light-truck/);
    const tags = buildCategoryUseCaseTags(ctx);
    expect(tags.some((t) => /Trail|Clearance|Overlanding|Articulation/i.test(t))).toBe(true);
  });

  it('tags LT sizes with payload or towing when load index supports it', () => {
    const ctx = ctxFor('265/70R17', '285/75R16');
    const tags = buildCategoryUseCaseTags(ctx);
    expect(tags.some((t) => /Towing|Payload|Work|Durability/i.test(t))).toBe(true);
    expect(tags).not.toContain('Track Days');
    expect(tags).not.toContain('Spirited Driving');
  });

  it('recommendation body cites measurements for every category', () => {
    const pairs: [string, string][] = [
      ['225/45R17', '235/40R18'],
      ['275/70R18', '285/75R18'],
      ['265/70R17', '285/70R17'],
    ];

    for (const [a, b] of pairs) {
      const insights = buildComparisonInsights(
        a,
        b,
        compareTires(a, b, 60),
        getTireSpecs(a),
        getTireSpecs(b),
      );
      const rec = insights.engineeringAnalysis.byId.recommendation.body;
      expect(rec).toMatch(/Fitment score/);
      expect(rec).not.toMatch(/Diameter:|Width:|Sidewall:/);
      expect(rec).not.toMatch(/improved handling|better grip|save \d+%/i);
    }
  });

  it('upgrade recommendation body is category-specific, not generic daily/highway paste', () => {
    const perf = buildComparisonInsights(
      '225/45R17',
      '235/40R18',
      compareTires('225/45R17', '235/40R18', 60),
      getTireSpecs('225/45R17'),
      getTireSpecs('235/40R18'),
    );
    expect(perf.seo.isGoodUpgrade.body).toMatch(/performance|steering|paved|fitment score/i);
    expect(perf.quickVerdict.bestFor).not.toContain('Overlanding');
    expect(perf.quickVerdict.bestFor).not.toContain('Towing');

    const truck = buildComparisonInsights(
      '265/70R17',
      '285/75R16',
      compareTires('265/70R17', '285/75R16', 60),
      getTireSpecs('265/70R17'),
      getTireSpecs('285/75R16'),
    );
    expect(truck.seo.isGoodUpgrade.body).toMatch(/truck|load|payload|fitment score|placard/i);
  });

  it('off-road personality card bullets do not sell track use on LT sizes', () => {
    const insights = buildComparisonInsights(
      '265/70R17',
      '285/75R16',
      compareTires('265/70R17', '285/75R16', 60),
      getTireSpecs('265/70R17'),
      getTireSpecs('285/75R16'),
    );
    const sportBullets = insights.personalityCards.find((c) => c.id === 'sportier')!.bullets.join(' ');
    expect(sportBullets).not.toMatch(/\blap time|spirited driving\b/i);
    expect(sportBullets).toMatch(/loaded|stability/i);
  });
});
