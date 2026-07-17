import { describe, expect, it } from 'vitest';
import {
  closestCommonAxleRatio,
  commonAxleRatiosAround,
  computeGearRatio,
  formatAxleRatio,
  parseGearRatioInput,
  type GearRatioFields,
} from './gear-ratio-math';
import { DEFAULT_GEAR_FIELDS } from './gear-ratio-insights';

function fields(partial: Partial<GearRatioFields>): GearRatioFields {
  return { ...DEFAULT_GEAR_FIELDS, ...partial };
}

describe('formatAxleRatio', () => {
  it('always keeps two decimal places for common gear ratios', () => {
    expect(formatAxleRatio(3.73)).toBe('3.73');
    expect(formatAxleRatio(4.1)).toBe('4.10');
    expect(formatAxleRatio('4.1')).toBe('4.10');
    expect(formatAxleRatio(4.11)).toBe('4.11');
    expect(formatAxleRatio(4)).toBe('4.00');
    expect(formatAxleRatio(3.9)).toBe('3.90');
  });
});

describe('gear ratio math', () => {
  it('Test A: 31 → 35 on 3.73', () => {
    const input = parseGearRatioInput(
      fields({
        currentDiameterIn: '31',
        newDiameterIn: '35',
        stockGearRatio: '3.73',
      }),
    );
    expect(input).not.toBeNull();
    const result = computeGearRatio(input!);
    expect(result.effectiveRatio).toBeCloseTo(3.3037, 3);
    expect(result.stockLikeTarget).toBeCloseTo(4.2113, 3);
    expect(result.effectiveChangePercent).toBeCloseTo(-11.4286, 2);
    expect(result.gearingLossPct).toBeCloseTo(11.4286, 2);
  });

  it('Test B: identical diameters keep ratio and 0% change', () => {
    const input = parseGearRatioInput(
      fields({
        currentDiameterIn: '33',
        newDiameterIn: '33',
        stockGearRatio: '4.10',
      }),
    );
    const result = computeGearRatio(input!);
    expect(result.effectiveRatio).toBeCloseTo(4.1, 5);
    expect(result.stockLikeTarget).toBeCloseTo(4.1, 5);
    expect(result.effectiveChangePercent).toBeCloseTo(0, 5);
  });

  it('Test D shared advanced state yields RPM and crawl', () => {
    const result = computeGearRatio(
      parseGearRatioInput(
        fields({
          currentDiameterIn: '31',
          newDiameterIn: '35',
          stockGearRatio: '3.73',
          speed: '65',
          speedUnit: 'mph',
          transTopGear: '0.75',
          firstGearRatio: '4.71',
          transferLowRatio: '2.72',
          lowSpeedBiasPercent: '5',
        }),
      )!,
    );
    expect(result.rpmReady).toBe(true);
    expect(result.crawlReady).toBe(true);
    expect(result.estimatedRpm?.newTiresCurrentGears).toBeCloseTo(
      (65 * 3.73 * 0.75 * 336) / 35,
      0,
    );
    expect(result.crawlRatios?.currentAxle).toBeCloseTo(4.71 * 2.72 * 3.73, 3);
  });

  it('Test E: incomplete advanced inputs hide RPM and crawl', () => {
    const topOnly = computeGearRatio(
      parseGearRatioInput(
        fields({
          currentDiameterIn: '31',
          newDiameterIn: '35',
          stockGearRatio: '3.73',
          transTopGear: '0.75',
        }),
      )!,
    );
    expect(topOnly.rpmReady).toBe(false);
    expect(topOnly.estimatedRpm).toBeNull();

    const lowOnly = computeGearRatio(
      parseGearRatioInput(
        fields({
          currentDiameterIn: '31',
          newDiameterIn: '35',
          stockGearRatio: '3.73',
          transferLowRatio: '2.72',
        }),
      )!,
    );
    expect(lowOnly.crawlReady).toBe(false);
    expect(lowOnly.crawlRatios).toBeNull();
  });
  it('Test C: smaller new tire makes current gears deeper and lowers stock-like target', () => {
    const input = parseGearRatioInput(
      fields({
        currentDiameterIn: '35',
        newDiameterIn: '33',
        stockGearRatio: '4.10',
      }),
    );
    const result = computeGearRatio(input!);
    expect(result.effectiveRatio).toBeGreaterThan(4.1);
    expect(result.stockLikeTarget).toBeLessThan(4.1);
    expect(result.effectiveChangePercent).toBeGreaterThan(0);
  });

  it('Test D: low-speed bias changes deeper target only', () => {
    const base = parseGearRatioInput(
      fields({
        currentDiameterIn: '31',
        newDiameterIn: '35',
        stockGearRatio: '3.73',
        lowSpeedBiasPercent: '0',
      }),
    )!;
    const biased = parseGearRatioInput(
      fields({
        currentDiameterIn: '31',
        newDiameterIn: '35',
        stockGearRatio: '3.73',
        lowSpeedBiasPercent: '5',
      }),
    )!;
    const withoutBias = computeGearRatio(base);
    const withBias = computeGearRatio(biased);
    expect(withBias.stockLikeTarget).toBeCloseTo(withoutBias.stockLikeTarget, 6);
    expect(withBias.deeperTarget).toBeCloseTo(withoutBias.stockLikeTarget * 1.05, 6);
    expect(withBias.deeperTarget).not.toBeCloseTo(withoutBias.deeperTarget, 3);
  });

  it('does not apply squat or alter only the new tire diameter', () => {
    const result = computeGearRatio(
      parseGearRatioInput(
        fields({
          currentDiameterIn: '31',
          newDiameterIn: '35',
          stockGearRatio: '3.73',
        }),
      )!,
    );
    expect(result.newDiameterIn).toBe(35);
    expect(result.effectiveNewDiameterIn).toBe(35);
    expect(result.currentDiameterIn).toBe(31);
  });

  it('only computes RPM when speed and top gear are valid', () => {
    const without = computeGearRatio(
      parseGearRatioInput(
        fields({
          currentDiameterIn: '31',
          newDiameterIn: '35',
          stockGearRatio: '3.73',
        }),
      )!,
    );
    expect(without.rpmReady).toBe(false);
    expect(without.estimatedRpm).toBeNull();

    const withRpm = computeGearRatio(
      parseGearRatioInput(
        fields({
          currentDiameterIn: '31',
          newDiameterIn: '35',
          stockGearRatio: '3.73',
          speed: '65',
          speedUnit: 'mph',
          transTopGear: '1.00',
        }),
      )!,
    );
    expect(withRpm.rpmReady).toBe(true);
    expect(withRpm.estimatedRpm?.originalSetup).toBeCloseTo(
      (65 * 3.73 * 1 * 336) / 31,
      0,
    );
  });

  it('only computes crawl when first gear and transfer low are valid', () => {
    const without = computeGearRatio(
      parseGearRatioInput(
        fields({
          currentDiameterIn: '31',
          newDiameterIn: '35',
          stockGearRatio: '3.73',
        }),
      )!,
    );
    expect(without.crawlReady).toBe(false);

    const withCrawl = computeGearRatio(
      parseGearRatioInput(
        fields({
          currentDiameterIn: '31',
          newDiameterIn: '35',
          stockGearRatio: '3.73',
          firstGearRatio: '4.00',
          transferLowRatio: '2.72',
        }),
      )!,
    );
    expect(withCrawl.crawlReady).toBe(true);
    expect(withCrawl.crawlRatios?.currentAxle).toBeCloseTo(4 * 2.72 * 3.73, 4);
  });

  it('finds a nearby common axle ratio example without claiming availability', () => {
    expect(closestCommonAxleRatio(4.2113)).toBe(4.3);
  });

  it('finds common axle ratios below and above a target', () => {
    expect(commonAxleRatiosAround(4.2113)).toEqual({ below: 4.11, above: 4.3 });
    expect(commonAxleRatiosAround(4.1)).toEqual({ below: 3.9, above: 4.11 });
  });
});
