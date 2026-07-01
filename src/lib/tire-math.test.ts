import { describe, expect, it } from 'vitest';
import { compareTires, getTireSpecs } from './tire-math';

const TOLERANCE = 0.05;

function expectClose(
  actual: number,
  expected: number,
  tolerance = TOLERANCE,
) {
  expect(Math.abs(actual - expected)).toBeLessThanOrEqual(tolerance);
}

describe('getTireSpecs', () => {
  it('275/70R18 — overall diameter, section width, revs/mile', () => {
    const specs = getTireSpecs('275/70R18');
    expectClose(specs.overallDiameterIn, 33.16);
    expectClose(specs.sectionWidthIn, 10.83);
    // Reference is rounded to 608; exact formula yields ~608.25
    expect(specs.revsPerMile).toBeCloseTo(608, 0);
  });

  it('225/45R17 — overall diameter', () => {
    const specs = getTireSpecs('225/45R17');
    expectClose(specs.overallDiameterIn, 24.97);
  });

  it('235/40R18 — overall diameter', () => {
    const specs = getTireSpecs('235/40R18');
    expectClose(specs.overallDiameterIn, 25.4);
  });
});

describe('compareTires', () => {
  it('225/45R17 vs 235/40R18 — diameter change and speedometer at 60 mph', () => {
    const result = compareTires('225/45R17', '235/40R18', 60);
    expectClose(result.diameterDiffPercent, 1.7);
    expectClose(result.speedometer.trueSpeed, 61.0);
    expect(result.speedometer.indicatedSpeed).toBe(60);
  });
});
