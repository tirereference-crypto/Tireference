import { describe, expect, it } from 'vitest';
import {
  COMPARISON_VALIDATION_RULES,
  INCOMPATIBLE_CATEGORY_PAIRS,
  isValidComparison,
} from './tire-comparison-validation';

describe('isValidComparison', () => {
  it('accepts realistic same-category upgrade pairs', () => {
    const result = isValidComparison('265/70R17', '285/70R17');
    expect(result.valid).toBe(true);
    expect(result.reason).toBe('');
  });

  it('accepts performance plus-size pairs within wheel limits', () => {
    const result = isValidComparison('225/45R17', '235/40R18');
    expect(result.valid).toBe(true);
  });

  it('rejects identical sizes', () => {
    const result = isValidComparison('275/70R18', '275/70R18');
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('itself');
  });

  it('rejects cross-category passenger vs off-road pairs', () => {
    const result = isValidComparison('225/55R17', '285/70R17');
    expect(result.valid).toBe(false);
    expect(result.reason).toMatch(/category|Incompatible/i);
  });

  it('rejects passenger vs SUV pairs', () => {
    const result = isValidComparison('205/55R16', '235/55R18');
    expect(result.valid).toBe(false);
    expect(result.reason).toMatch(/category|Incompatible/i);
  });

  it('rejects off-road vs light-truck pairs', () => {
    const result = isValidComparison('285/70R17', '285/75R16');
    expect(result.valid).toBe(false);
    expect(result.reason).toMatch(/category|Incompatible/i);
  });

  it('rejects wheel diameter differences above the limit', () => {
    const result = isValidComparison('295/35R21', '235/45R18');
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('Wheel diameter differs');
  });

  it('rejects overall diameter differences above the limit', () => {
    const result = isValidComparison('225/45R17', '315/70R17');
    expect(result.valid).toBe(false);
    expect(result.reason).toMatch(/Overall diameter|category|Incompatible/i);
  });

  it('rejects width differences above the limit', () => {
    const result = isValidComparison('295/35R21', '235/40R18');
    expect(result.valid).toBe(false);
    expect(result.reason).toMatch(/Section width|Wheel diameter/i);
  });

  it('rejects aspect-ratio differences above the limit', () => {
    const result = isValidComparison('225/45R17', '225/65R17');
    expect(result.valid).toBe(false);
    expect(result.reason).toMatch(/Aspect ratio|category|Incompatible/i);
  });

  it('rejects sizes without hub pages', () => {
    const result = isValidComparison('225/45R17', '999/99R99');
    expect(result.valid).toBe(false);
    expect(result.reason).toMatch(/hub page|dataset|production|normalize/i);
  });

  it('uses configurable rule constants', () => {
    expect(COMPARISON_VALIDATION_RULES.maxWheelDiameterDiffIn).toBe(2);
    expect(COMPARISON_VALIDATION_RULES.maxOverallDiameterDiffPct).toBe(8);
    expect(COMPARISON_VALIDATION_RULES.maxWidthDiffMm).toBe(50);
    expect(COMPARISON_VALIDATION_RULES.maxAspectRatioDiff).toBe(20);
    expect(INCOMPATIBLE_CATEGORY_PAIRS.length).toBeGreaterThan(0);
  });
});
