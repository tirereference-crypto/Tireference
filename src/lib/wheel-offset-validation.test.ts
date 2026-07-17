import { describe, expect, it } from 'vitest';
import {
  normalizeWheelInput,
  validateWheelField,
  validateWheelSetup,
} from './wheel-offset-validation';

describe('wheel-offset-validation', () => {
  it('normalizes pasted values with units and spaces', () => {
    expect(normalizeWheelInput(' 8.5 in ')).toBe('8.5');
    expect(normalizeWheelInput('+35 mm')).toBe('+35');
  });

  it('validates width, diameter, and offset ranges', () => {
    expect(validateWheelField('widthIn', '7.5').valid).toBe(true);
    expect(validateWheelField('widthIn', '3').valid).toBe(false);
    expect(validateWheelField('offsetMm', '0').valid).toBe(true);
    expect(validateWheelField('offsetMm', '-12').valid).toBe(true);
    expect(validateWheelField('offsetMm', '150').valid).toBe(false);
  });

  it('does not show empty errors until touched', () => {
    const result = validateWheelSetup(
      { widthIn: '', diameterIn: '18', offsetMm: '35' },
      { widthIn: false },
    );
    expect(result.valid).toBe(false);
    expect(result.errors.widthIn).toBeUndefined();
  });
});
