import { describe, expect, it } from 'vitest';
import { inferTireCategory } from '../data/tire-sizes';
import {
  buildDynamicQuickFacts,
  buildSpeedometerImpact,
  inferReferenceTireSize,
} from './tire-calculator-insights';
import { getTireSpecs } from './tire-math';

describe('tire-calculator-insights', () => {
  it('builds speedometer impact from calculated dimensions', () => {
    const specs = getTireSpecs('275/70R18');
    const category = inferTireCategory(specs.widthMm, specs.aspectRatio, specs.wheelDiameterIn);
    const impact = buildSpeedometerImpact(specs, '275/70R18', category);

    expect(impact.referenceSize).toBe('265/70R18');
    expect(impact.revsPerMile).toBe(specs.revsPerMile);
    expect(Math.abs(impact.errorPercent)).toBeGreaterThan(0);
    expect(impact.detail.length).toBeGreaterThan(20);
  });

  it('updates quick facts when tire size changes', () => {
    const specsA = getTireSpecs('275/70R18');
    const specsB = getTireSpecs('285/75R18');

    const factsA = buildDynamicQuickFacts(specsA, {
      categoryLabel: 'Off-Road',
      equivalentFlotation: '33x10.8R18',
      typicalBuild: 'All-terrain',
      popularVehicles: 'Tacoma',
    });
    const factsB = buildDynamicQuickFacts(specsB, {
      categoryLabel: 'Off-Road',
      equivalentFlotation: '34x11.2R18',
      typicalBuild: 'All-terrain',
      popularVehicles: 'Tacoma',
    });

    const diameterA = factsA.find((f) => f.label === 'Overall Diameter')!.value;
    const diameterB = factsB.find((f) => f.label === 'Overall Diameter')!.value;
    expect(diameterA).not.toBe(diameterB);
  });

  it('picks category-aware reference sizes', () => {
    const specs = getTireSpecs('245/40R18');
    const category = inferTireCategory(specs.widthMm, specs.aspectRatio, specs.wheelDiameterIn);
    expect(inferReferenceTireSize(specs, category)).toBe('225/45R18');
  });
});
