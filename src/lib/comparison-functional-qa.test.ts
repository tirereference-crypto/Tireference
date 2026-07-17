/**
 * Functional QA smoke for comparison calculator scenarios.
 * Does not alter formulas — asserts outputs stay finite and structurally complete.
 */
import { describe, expect, it } from 'vitest';
import { buildAlternativeComparisonPaths } from './comparison-alternative-paths';
import { buildDimensionalDecisionSupport } from './comparison-decision-support';
import { resolveComparisonDataSources } from './comparison-data-sources';
import { buildDashboardImpactCards, buildDashboardWhatChangesContent } from './comparison-dashboard-impact';
import { buildComparisonInsights } from './tire-comparison-insights';
import { compareTires, getTireSpecs, parseTireSize } from './tire-math';
import { getTireSizeValidation } from './tire-size-validation';
import { parseFullSizeToFields } from './tire-size-input';

function assertFiniteTree(value: unknown, path = 'root'): void {
  if (typeof value === 'number') {
    expect(Number.isFinite(value), `${path} should be finite`).toBe(true);
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, i) => assertFiniteTree(item, `${path}[${i}]`));
    return;
  }
  if (value && typeof value === 'object') {
    for (const [key, child] of Object.entries(value)) {
      if (key === 'suggestions' || key === 'faqs') continue;
      assertFiniteTree(child, `${path}.${key}`);
    }
  }
}

function runPair(a: string, b: string, speed = 60) {
  const comparison = compareTires(a, b, speed);
  const specsA = getTireSpecs(a);
  const specsB = getTireSpecs(b);
  const insights = buildComparisonInsights(a, b, comparison, specsA, specsB);
  const dataSources = resolveComparisonDataSources({ sizeA: a, sizeB: b });
  const decision = buildDimensionalDecisionSupport({
    comparison,
    specsA,
    specsB,
    dataSources,
  });
  const impact = buildDashboardImpactCards({
    comparison,
    specsA,
    specsB,
    unitSystem: 'imperial',
  });
  const whatChanges = buildDashboardWhatChangesContent(a, b, comparison, specsA, specsB);
  return { comparison, specsA, specsB, insights, dataSources, decision, impact, whatChanges };
}

describe('comparison calculator functional QA', () => {
  it('generic vs generic sizes', () => {
    const result = runPair('225/45R17', '235/40R18');
    expect(result.decision.heading.length).toBeGreaterThan(0);
    expect(result.impact).toHaveLength(6);
    expect(result.whatChanges.insights).toHaveLength(4);
    expect(result.dataSources.mode).toBe('generic_vs_generic');
    assertFiniteTree(result.comparison);
    assertFiniteTree(result.decision.score);
  });

  it('same wheel and different wheel pairs', () => {
    const same = runPair('275/70R18', '285/70R18');
    expect(same.specsA.wheelDiameterIn).toBe(same.specsB.wheelDiameterIn);
    const different = runPair('225/45R17', '235/40R18');
    expect(different.specsA.wheelDiameterIn).not.toBe(different.specsB.wheelDiameterIn);
    assertFiniteTree(same.comparison);
    assertFiniteTree(different.comparison);
  });

  it('same size comparison stays stable', () => {
    const result = runPair('225/45R17', '225/45R17');
    expect(Math.abs(result.comparison.diameterDiffPercent)).toBeLessThan(0.001);
    expect(result.impact.every((card) => !/NaN|undefined/i.test(`${card.value} ${card.detail}`))).toBe(
      true,
    );
  });

  it('invalid size validation does not throw', () => {
    const fields = parseFullSizeToFields('999/99R99') ?? {
      width: '999',
      aspectRatio: '99',
      wheelDiameter: '99',
    };
    const validation = getTireSizeValidation('not-a-tire', fields);
    expect(['invalid', 'custom', 'uncommon', 'common', 'empty']).toContain(validation.status);
    expect(() => parseTireSize('not-a-tire')).toThrow(/Invalid tire size/i);
  });

  it('data-source note remains present for generic pairs', () => {
    const result = runPair('225/45R17', '235/40R18');
    expect(result.dataSources.note.length).toBeGreaterThan(0);
    expect(['generic_vs_generic', 'model_vs_model', 'mixed_source']).toContain(result.dataSources.mode);
  });

  it('swap-equivalent pair flips diameter percent direction', () => {
    const forward = runPair('225/45R17', '235/40R18');
    const swapped = runPair('235/40R18', '225/45R17');
    expect(Math.sign(forward.comparison.diameterDiffPercent)).toBe(
      -Math.sign(swapped.comparison.diameterDiffPercent),
    );
    expect(forward.comparison.diameterDiffIn).toBeCloseTo(swapped.comparison.diameterDiffIn, 5);
  });

  it('alternative paths stay finite for popular bases', () => {
    for (const size of ['225/45R17', '275/70R18', '265/70R17']) {
      const paths = buildAlternativeComparisonPaths(size, 'imperial', 8);
      for (const card of paths) {
        expect(card.diameterDiff).not.toMatch(/NaN|undefined/i);
        expect(card.widthDiff).not.toMatch(/NaN|undefined/i);
        expect(card.compareHref).toContain('/calculators/tire-comparison-calculator/');
      }
    }
  });

  it('vehicle associations may be empty without crashing', () => {
    const result = runPair('225/45R17', '235/40R18');
    expect(Array.isArray(result.insights.vehicleCompatibility.current)).toBe(true);
    expect(Array.isArray(result.insights.vehicleCompatibility.newTire)).toBe(true);
  });

  it('flotation sizes compare without NaN', () => {
    const result = runPair('33x12.50R15', '35x12.50R17');
    assertFiniteTree(result.comparison);
    expect(result.impact).toHaveLength(6);
  });
});
