import { describe, expect, it } from 'vitest';
import { compareWheelSetups } from './wheel-offset-math';
import {
  buildWheelPositionSummary,
  formatMmDisplay,
  getPositionChangeMagnitude,
} from './wheel-offset-insights';

describe('formatMmDisplay', () => {
  it('omits unnecessary .0 decimals', () => {
    expect(formatMmDisplay(20)).toBe('20');
    expect(formatMmDisplay(20.04)).toBe('20');
    expect(formatMmDisplay(2.3)).toBe('2.3');
  });
});

describe('wheel position summary cases', () => {
  it('Case A: same wheel → minimal, zero changes', () => {
    const comparison = compareWheelSetups(
      { widthIn: 8, diameterIn: 18, offsetMm: 35 },
      { widthIn: 8, diameterIn: 18, offsetMm: 35 },
    );
    expect(comparison.innerClearanceChangeMm).toBeCloseTo(0, 6);
    expect(comparison.outerPositionChangeMm).toBeCloseTo(0, 6);
    expect(comparison.trackWidthChangeMm).toBeCloseTo(0, 6);
    const summary = buildWheelPositionSummary(comparison);
    expect(summary.magnitude).toBe('Minimal');
    expect(summary.heading).toBe('Minimal Position Change');
    expect(summary.rows.find((r) => r.id === 'vehicle')?.detail).toBe('Not evaluated');
  });

  it('Case B: lower offset, same width → ~20 mm outward and more inner clearance', () => {
    const comparison = compareWheelSetups(
      { widthIn: 8, diameterIn: 18, offsetMm: 35 },
      { widthIn: 8, diameterIn: 18, offsetMm: 15 },
    );
    expect(comparison.outerPositionChangeMm).toBeCloseTo(20, 4);
    expect(comparison.innerClearanceChangeMm).toBeCloseTo(-20, 4);
    expect(comparison.trackWidthChangeMm).toBeCloseTo(40, 4);
    const summary = buildWheelPositionSummary(comparison);
    expect(summary.magnitude).toBe('Moderate');
    expect(summary.summary).toMatch(/farther outward/);
    expect(summary.summary).toMatch(/more inner clearance/);
  });

  it('Case C: wider wheel, same offset → ~25.4 mm both sides, not “safe” via offset alone', () => {
    const comparison = compareWheelSetups(
      { widthIn: 8, diameterIn: 18, offsetMm: 35 },
      { widthIn: 10, diameterIn: 18, offsetMm: 35 },
    );
    expect(comparison.offsetDifferenceMm).toBe(0);
    expect(comparison.innerClearanceChangeMm).toBeCloseTo(25.4, 4);
    expect(comparison.outerPositionChangeMm).toBeCloseTo(25.4, 4);
    const summary = buildWheelPositionSummary(comparison);
    expect(summary.magnitude).toBe('Large');
    expect(summary.heading).not.toMatch(/Safe|Fitment Failed|Flush/i);
    expect(getPositionChangeMagnitude(25.4, 25.4)).toBe('Large');
  });

  it('Case D: wider wheel with higher offset reflects both width and offset', () => {
    const comparison = compareWheelSetups(
      { widthIn: 8, diameterIn: 18, offsetMm: 35 },
      { widthIn: 9, diameterIn: 18, offsetMm: 45 },
    );
    // Half width (+12.7) + offset (+10 inward on outer / more backspacing on inner)
    // outer: +12.7 - 10 = +2.7
    // inner (backspacing Δ): +12.7 + 10 = +22.7 closer to suspension
    expect(comparison.outerPositionChangeMm).toBeCloseTo(2.7, 1);
    expect(comparison.innerClearanceChangeMm).toBeCloseTo(22.7, 1);
    expect(comparison.trackWidthChangeMm).toBeCloseTo(5.4, 1);
    const summary = buildWheelPositionSummary(comparison);
    expect(summary.magnitude).toBe('Large');
  });

  it('Case E: narrower wheel with lower offset combines width and offset', () => {
    const comparison = compareWheelSetups(
      { widthIn: 9, diameterIn: 18, offsetMm: 35 },
      { widthIn: 8, diameterIn: 18, offsetMm: 15 },
    );
    expect(comparison.offsetDifferenceMm).toBe(-20);
    expect(comparison.innerClearanceChangeMm).toBeCloseTo(-32.7, 1);
    expect(comparison.outerPositionChangeMm).toBeCloseTo(7.3, 1);
    expect(comparison.trackWidthChangeMm).toBeCloseTo(14.6, 1);
    const summary = buildWheelPositionSummary(comparison);
    expect(summary.magnitude).toBe('Very Large');
    expect(summary.summary).toMatch(/more inner clearance/);
    expect(summary.summary).toMatch(/farther outward/);
  });
});
