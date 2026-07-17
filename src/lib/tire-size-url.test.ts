import { describe, expect, it } from 'vitest';
import { TIRE_SIZES } from '../data/tire-sizes';
import {
  hubPagePath,
  isValidTireSizePath,
  sizeToSlug,
  slugToSize,
  tireSizeCalculatorPath,
  tireSizePath,
  tireSizeSlug,
} from './tire-size-url';

describe('tireSizeSlug / tireSizePath', () => {
  it('normalizes common size formats to lowercase slugs', () => {
    expect(tireSizeSlug('275/70R18')).toBe('275-70r18');
    expect(tireSizeSlug('275-70R18')).toBe('275-70r18');
    expect(tireSizeSlug('275 70 R18')).toBe('275-70r18');
    expect(tireSizeSlug('275-70-r18')).toBe('275-70r18');
    expect(tireSizeSlug('225/65R17')).toBe('225-65r17');
    expect(sizeToSlug('275/70R18')).toBe('275-70r18');
  });

  it('handles LT prefix when present', () => {
    expect(tireSizeSlug('LT265/75R16')).toBe('lt265-75r16');
    expect(tireSizeSlug('lt265-75r16')).toBe('lt265-75r16');
    expect(slugToSize('lt265-75r16')).toBe('LT265/75R16');
  });

  it('always builds singular /tire-size/ paths with trailing slash', () => {
    expect(tireSizePath('275/70R18')).toBe('/tire-size/275-70r18/');
    expect(hubPagePath('275/70R18')).toBe('/tire-size/275-70r18/');
    expect(tireSizePath('225/65R17')).toBe('/tire-size/225-65r17/');
    expect(tireSizePath('LT265/75R16')).toBe('/tire-size/lt265-75r16/');
  });

  it('validates canonical tire-size path format', () => {
    expect(isValidTireSizePath('/tire-size/275-70r18/')).toBe(true);
    expect(isValidTireSizePath('/tire-size/lt265-75r16/')).toBe(true);
    expect(isValidTireSizePath('/tire-size/275-70r18')).toBe(false);
    expect(isValidTireSizePath('/tire-sizes/275-70r18/')).toBe(false);
    expect(isValidTireSizePath('/tire-size/275/70R18/')).toBe(false);
    expect(isValidTireSizePath('/tire-size/275-70R18/')).toBe(false);
    expect(isValidTireSizePath('/tire-size/275-70-r18/')).toBe(false);
  });

  it('emits valid paths for every catalog tire size', () => {
    for (const entry of TIRE_SIZES) {
      const path = tireSizePath(entry.size);
      expect(isValidTireSizePath(path), path).toBe(true);
      expect(path).not.toMatch(/R\d/);
      expect(path.startsWith('/tire-size/')).toBe(true);
      expect(path.endsWith('/')).toBe(true);
      expect(path).not.toContain('/tire-sizes/');
    }
  });

  it('converts slug back to display size', () => {
    expect(slugToSize('275-70r18')).toBe('275/70R18');
  });

  it('builds tire size calculator path with prefilled size', () => {
    expect(tireSizeCalculatorPath('275/70R18')).toBe(
      '/calculators/tire-size-calculator/?size=275%2F70R18',
    );
  });
});
