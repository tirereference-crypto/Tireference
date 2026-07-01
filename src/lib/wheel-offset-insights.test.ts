import { describe, expect, it } from 'vitest';
import { compareWheelSetups } from './wheel-offset-math';
import { buildWheelFitmentVerdict } from './wheel-offset-insights';

describe('buildWheelFitmentVerdict', () => {
  it('returns safe fit for minimal offset change', () => {
    const comparison = compareWheelSetups(
      { widthIn: 8, diameterIn: 18, offsetMm: 35 },
      { widthIn: 8, diameterIn: 18, offsetMm: 32 },
    );
    const verdict = buildWheelFitmentVerdict(comparison);
    expect(verdict.label).toBe('SAFE FIT');
    expect(verdict.tone).toBe('green');
    expect(verdict.rows).toHaveLength(4);
  });

  it('flags aggressive 18x8 +35 to 18x9 +20 setup', () => {
    const comparison = compareWheelSetups(
      { widthIn: 8, diameterIn: 18, offsetMm: 35 },
      { widthIn: 9, diameterIn: 18, offsetMm: 20 },
    );
    const verdict = buildWheelFitmentVerdict(comparison);
    expect(['FLUSH FITMENT', 'MILDLY AGGRESSIVE', 'CHECK CLEARANCES']).toContain(verdict.label);
    expect(verdict.rows.some((row) => row.id === 'fender')).toBe(true);
  });
});
