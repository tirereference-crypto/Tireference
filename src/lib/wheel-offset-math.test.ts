import { describe, expect, it } from 'vitest';
import {
  backspacingInches,
  compareWheelSetups,
  convertBackspacing,
  offsetFromBackspacing,
  outboardPositionMm,
  parseWheelSpec,
} from './wheel-offset-math';

describe('wheel-offset-math', () => {
  it('parses valid wheel setup fields', () => {
    expect(parseWheelSpec({ widthIn: '8', diameterIn: '18', offsetMm: '35' })).toEqual({
      widthIn: 8,
      diameterIn: 18,
      offsetMm: 35,
    });
  });

  it('rejects incomplete fields', () => {
    expect(parseWheelSpec({ widthIn: '8', diameterIn: '', offsetMm: '35' })).toBeNull();
  });

  it('calculates backspacing from width and offset', () => {
    expect(backspacingInches(8, 35)).toBeCloseTo(5.378, 2);
    expect(backspacingInches(9, 20)).toBeCloseTo(5.287, 2);
  });

  it('round-trips backspacing and offset', () => {
    const width = 8;
    const offset = 35;
    const bs = backspacingInches(width, offset);
    expect(offsetFromBackspacing(width, bs)).toBeCloseTo(offset, 4);
  });

  it('compares 18x8 +35 vs 18x9 +20', () => {
    const current = { widthIn: 8, diameterIn: 18, offsetMm: 35 };
    const newSetup = { widthIn: 9, diameterIn: 18, offsetMm: 20 };
    const result = compareWheelSetups(current, newSetup);

    expect(result.offsetDifferenceMm).toBe(-15);
    expect(result.backspacingDifferenceIn).toBeCloseTo(-0.091, 2);
    expect(result.innerClearanceChangeMm).toBeCloseTo(-2.3, 0);
    expect(result.outerPositionChangeMm).toBeGreaterThan(20);
    expect(result.trackWidthChangeMm).toBeCloseTo(result.outerPositionChangeMm * 2, 4);
  });

  it('converts offset to backspacing', () => {
    const result = convertBackspacing(8, 35, 'offset-to-backspacing');
    expect(result?.backspacingIn).toBeCloseTo(5.378, 2);
  });

  it('converts backspacing to offset', () => {
    const result = convertBackspacing(8, 5.378, 'backspacing-to-offset');
    expect(result?.offsetMm).toBeCloseTo(35, 0);
  });

  it('outboard position increases with width and decreases with offset', () => {
    const narrow = outboardPositionMm(8, 35);
    const wide = outboardPositionMm(9, 35);
    const lowerOffset = outboardPositionMm(8, 20);
    expect(wide).toBeGreaterThan(narrow);
    expect(lowerOffset).toBeGreaterThan(narrow);
  });
});
