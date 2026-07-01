import { describe, expect, it } from 'vitest';
import { buildComparisonVerdict } from './format-tire-comparison';
import { compareTiresFromFields } from './tire-comparison-input';
import { getSpecsFromFields } from './tire-size-input';

describe('compareTiresFromFields', () => {
  it('225/45R17 vs 235/40R18 at 60 mph', () => {
    const result = compareTiresFromFields(
      { width: '225', aspectRatio: '45', wheelDiameter: '17' },
      { width: '235', aspectRatio: '40', wheelDiameter: '18' },
      '60',
    );

    expect(result).not.toBeNull();
    expect(result!.diameterDiffPercent).toBeCloseTo(1.7, 1);
    expect(Math.abs(result!.diameterDiffPercent - 1.7)).toBeLessThanOrEqual(
      0.05,
    );
    expect(result!.speedometer.trueSpeed).toBeCloseTo(61.0, 1);
    expect(Math.abs(result!.speedometer.trueSpeed - 61.0)).toBeLessThanOrEqual(
      0.05,
    );

    const specsA = getSpecsFromFields({
      width: '225',
      aspectRatio: '45',
      wheelDiameter: '17',
    });
    const specsB = getSpecsFromFields({
      width: '235',
      aspectRatio: '40',
      wheelDiameter: '18',
    });
    expect(buildComparisonVerdict(result!, specsA!, specsB!)).toBe(
      'New tire is 1.7% taller and 4.4% wider.',
    );
  });
});
