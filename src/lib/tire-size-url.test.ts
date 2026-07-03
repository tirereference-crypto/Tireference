import { describe, expect, it } from 'vitest';
import { hubPagePath, sizeToSlug, slugToSize, tireSizeCalculatorPath } from './tire-size-url';

describe('tire-size-url', () => {
  it('converts size to slug and back', () => {
    expect(sizeToSlug('275/70R18')).toBe('275-70r18');
    expect(slugToSize('275-70r18')).toBe('275/70R18');
    expect(hubPagePath('275/70R18')).toBe('/tire-size/275-70r18');
  });

  it('handles LT prefix', () => {
    expect(sizeToSlug('LT265/75R16')).toBe('lt265-75r16');
    expect(slugToSize('lt265-75r16')).toBe('LT265/75R16');
  });

  it('builds tire size calculator path with prefilled size', () => {
    expect(tireSizeCalculatorPath('275/70R18')).toBe(
      '/calculators/tire-size-calculator?size=275%2F70R18',
    );
  });
});
