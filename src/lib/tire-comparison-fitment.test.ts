import { describe, expect, it } from 'vitest';
import {
  FITMENT_SCORE,
  fitmentLabelFromScore,
  fitmentVerdictFromScore,
  overallFitStatusFromScore,
  recommendationFromScore,
  upgradeHeadlineFromScore,
  verdictLabelFromScore,
} from './tire-comparison-fitment';
import { buildComparisonInsights } from './tire-comparison-insights';
import { compareTires, getTireSpecs } from './tire-math';

describe('tire-comparison-fitment', () => {
  it('uses unified three-tier score bands', () => {
    expect(FITMENT_SCORE.GOOD).toBe(8);
    expect(FITMENT_SCORE.WORKABLE).toBe(5);

    expect(fitmentVerdictFromScore(8.5).headline).toBe(
      'Very close dimensional match — vehicle checks still apply',
    );
    expect(fitmentVerdictFromScore(7).headline).toBe(
      'Moderate dimensional change — vehicle checks required',
    );
    expect(fitmentVerdictFromScore(4.5).headline).toBe(
      'Significant dimensional change — vehicle checks required',
    );

    expect(fitmentLabelFromScore(8).tone).toBe('green');
    expect(recommendationFromScore(7).label).toBe('Moderate change — vehicle checks required');
    expect(verdictLabelFromScore(4).tone).toBe('red');
    expect(upgradeHeadlineFromScore(6)).toBe(
      'Moderate dimensional change — vehicle checks required — dimensional compatibility 6.0/10',
    );
    expect(overallFitStatusFromScore(6)).toBe('warning');
  });

  it('275/70R18 vs 305/70R18 aligns headline, quick verdict, and overall fit row', () => {
    const sizeA = '275/70R18';
    const sizeB = '305/70R18';
    const insights = buildComparisonInsights(
      sizeA,
      sizeB,
      compareTires(sizeA, sizeB, 60),
      getTireSpecs(sizeA),
      getTireSpecs(sizeB),
    );

    expect(insights.fitmentScore).toBe(6);
    expect(insights.seo.isGoodUpgrade.headline).toBe(
      'Moderate dimensional change — vehicle checks required — dimensional compatibility 6.0/10',
    );
    expect(insights.quickVerdict.label).toBe('Moderate change — vehicle checks required');
    expect(insights.quickVerdict.tone).toBe('yellow');
    expect(insights.willThisFitRows[0]).toMatchObject({
      id: 'overall',
      label: 'Overall Fitment',
      status: 'warning',
      statusLabel: 'Moderate change — vehicle checks required',
    });
    expect(insights.performanceCards.find((c) => c.id === 'handling')?.value).toMatch(
      /\+30 mm width · \+0\.83" sidewall/,
    );
  });
});
