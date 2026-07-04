import { describe, expect, it } from 'vitest';
import { buildComparisonInsights, isComparisonPublishable } from './tire-comparison-insights';
import { compareTires, getTireSpecs } from './tire-math';
import {
  applyComparisonQualityGate,
  buildAllowedPercentages,
  extractComparisonContentBlocks,
  regenerateComparisonProse,
  validateComparisonQuality,
} from './tire-comparison-quality-validator';
import { BANNED_COMPARISON_PHRASES } from './tire-comparison-quality-prompts';

function buildInsights(sizeA: string, sizeB: string) {
  return buildComparisonInsights(
    sizeA,
    sizeB,
    compareTires(sizeA, sizeB, 60),
    getTireSpecs(sizeA),
    getTireSpecs(sizeB),
  );
}

describe('validateComparisonQuality', () => {
  it('approves measurement-driven content for common comparison pairs', () => {
    const pairs: [string, string][] = [
      ['225/45R17', '235/40R18'],
      ['275/70R18', '285/75R18'],
      ['265/70R17', '245/70R16'],
    ];

    for (const [sizeA, sizeB] of pairs) {
      const insights = buildInsights(sizeA, sizeB);
      if (!insights.qualityValidation.approved) {
        expect.fail(
          `${sizeA} vs ${sizeB}: ${JSON.stringify(insights.qualityValidation)}`,
        );
      }
    }
  });

  it('rejects fabricated performance percentages', () => {
    const insights = buildInsights('225/45R17', '235/40R18');
    const corrupted = {
      ...insights,
      understandingDifference: `${insights.understandingDifference} This delivers 39% better handling.`,
    };

    const result = validateComparisonQuality(corrupted);
    expect(result.approved).toBe(false);
    if (!result.approved) {
      expect(result.failedChecks).toContain('fabricated-percentages');
      expect(result.suggestions.length).toBeGreaterThan(0);
    }
  });

  it('rejects banned marketing filler', () => {
    const insights = buildInsights('225/45R17', '235/40R18');
    const corrupted = {
      ...insights,
      seo: {
        ...insights.seo,
        isGoodUpgrade: {
          headline: 'Aggressive upgrade — verify fitment carefully',
          body: insights.seo.isGoodUpgrade.body,
        },
      },
    };

    const result = validateComparisonQuality(corrupted);
    expect(result.approved).toBe(false);
    if (!result.approved) {
      expect(result.failedChecks).toContain('generic-filler');
    }
  });

  it('rejects internal contradictions in pros/benefits', () => {
    const insights = buildInsights('275/70R18', '285/75R18');
    const corrupted = {
      ...insights,
      personality: {
        ...insights.personality,
        pros: ['Less ground clearance than the reference tire'],
      },
    };

    const result = validateComparisonQuality(corrupted);
    expect(result.approved).toBe(false);
    if (!result.approved) {
      expect(result.failedChecks).toContain('internal-contradictions');
    }
  });

  it('detects duplicate paragraphs', () => {
    const insights = buildInsights('225/45R17', '235/40R18');
    const duplicate = insights.understandingDifference;
    const corrupted = {
      ...insights,
      seo: {
        ...insights.seo,
        whatChanges: duplicate,
      },
    };

    const result = validateComparisonQuality(corrupted);
    expect(result.approved).toBe(false);
    if (!result.approved) {
      expect(result.failedChecks).toContain('duplicate-content');
    }
  });

  it('regenerates prose after a quality failure', () => {
    const insights = buildInsights('225/45R17', '235/40R18');
    const corrupted = {
      ...insights,
      understandingDifference: `${insights.understandingDifference} Ideal daily driver with improved handling.`,
    };

    const gated = applyComparisonQualityGate(corrupted);
    expect(gated.quality.approved).toBe(true);
    for (const phrase of BANNED_COMPARISON_PHRASES) {
      expect(gated.insights.understandingDifference.toLowerCase()).not.toContain(phrase);
    }
  });

  it('buildAllowedPercentages includes calculated deltas', () => {
    const insights = buildInsights('225/45R17', '235/40R18');
    const allowed = buildAllowedPercentages(insights.engineeringAnalysis);
    const { comparison } = insights.engineeringAnalysis.measurements;

    expect(allowed.some((v) => Math.abs(v - comparison.diameterDiffPercent) < 0.01)).toBe(true);
    expect(allowed.some((v) => Math.abs(v - comparison.speedometer.errorPercent) < 0.01)).toBe(true);
  });

  it('extractComparisonContentBlocks covers primary prose fields', () => {
    const insights = buildInsights('225/45R17', '235/40R18');
    const blocks = extractComparisonContentBlocks(insights);
    const ids = blocks.map((b) => b.id);

    expect(ids).toContain('understandingDifference');
    expect(ids).toContain('seo.whatChanges');
    expect(ids.some((id) => id.startsWith('faq.'))).toBe(true);
  });

  it('regenerateComparisonProse preserves fitment score and specs', () => {
    const insights = buildInsights('225/45R17', '235/40R18');
    const repaired = regenerateComparisonProse(insights);

    expect(repaired.fitmentScore).toBe(insights.fitmentScore);
    expect(repaired.kpiCards).toEqual(insights.kpiCards);
    expect(repaired.seo.isGoodUpgrade.headline).toMatch(/score|fit/i);
  });
});

describe('isComparisonPublishable', () => {
  it('matches buildComparisonInsights quality result', () => {
    const sizeA = '225/45R17';
    const sizeB = '235/40R18';
    const insights = buildInsights(sizeA, sizeB);
    expect(isComparisonPublishable(sizeA, sizeB)).toBe(insights.qualityValidation.approved);
  });
});
