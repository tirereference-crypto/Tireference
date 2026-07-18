import { describe, expect, it } from 'vitest';
import {
  formatDisplaySize,
  formatSizeSlug,
  isValidTireSize,
  normalizeTireSize,
  parseSizeSlug,
  parseTireSize,
} from './tire-size-primitives';

describe('tire-size-primitives (Layer 1)', () => {
  it('accepts uppercase and lowercase slash-form metric sizes', () => {
    expect(normalizeTireSize('225/45R17')).toBe('225/45R17');
    expect(normalizeTireSize('225/45r17')).toBe('225/45R17');
    expect(formatDisplaySize('225/45R17')).toBe('225/45R17');
    expect(isValidTireSize('225/45R17')).toBe(true);
  });

  it('trims whitespace and decodes percent-encoded slashes', () => {
    const parsed = parseTireSize(' 225%2F45r17 ');
    expect(parsed).toMatchObject({
      normalized: '225/45R17',
      slug: '225-45-r17',
      widthMm: 225,
      aspectRatio: 45,
      wheelDiameterIn: 17,
    });
  });

  it('round-trips slash-form and slug-form for metric, LT, and flotation', () => {
    expect(formatSizeSlug('225/45R17')).toBe('225-45-r17');
    expect(parseSizeSlug('225-45-r17')?.normalized).toBe('225/45R17');

    expect(formatSizeSlug('LT265/75R16')).toBe('lt-265-75-r16');
    expect(parseSizeSlug('lt-265-75-r16')?.normalized).toBe('LT265/75R16');

    expect(formatSizeSlug('33x12.50R17')).toBe('33-x-12.50-r17');
    expect(parseSizeSlug('33-x-12.50-r17')?.normalized).toBe('33x12.50R17');
  });

  it('rejects invalid inputs', () => {
    for (const invalid of ['', '   ', '225/45', '225/45R', '225/4R5', 'banana', null, undefined]) {
      expect(parseTireSize(invalid)).toBeNull();
      expect(isValidTireSize(invalid)).toBe(false);
      expect(normalizeTireSize(invalid)).toBeNull();
      expect(formatSizeSlug(invalid)).toBeNull();
    }
    expect(parseSizeSlug('225-45-17')).toBeNull();
    expect(parseSizeSlug('')).toBeNull();
  });
});
