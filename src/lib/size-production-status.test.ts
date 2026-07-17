import { describe, expect, it } from 'vitest';
import {
  getSizeProductStats,
  isCommonProductionSize,
  isInProductDatabase,
} from './size-production-status';

describe('size production status from master product database', () => {
  it('loads brand and model counts for known catalog sizes', () => {
    const stats = getSizeProductStats('275/70R18');
    expect(stats).not.toBeNull();
    expect(stats!.brandCount).toBeGreaterThanOrEqual(3);
    expect(stats!.modelCount).toBeGreaterThanOrEqual(12);
    expect(stats!.productCount).toBeGreaterThan(0);
  });

  it('marks broad coverage sizes as common production', () => {
    expect(isCommonProductionSize('275/70R18')).toBe(true);
    expect(isCommonProductionSize('205/55R16')).toBe(true);
    expect(isCommonProductionSize('225/45R17')).toBe(true);
  });

  it('marks thin coverage sizes as not common', () => {
    expect(isInProductDatabase('305/70R18')).toBe(true);
    expect(isCommonProductionSize('305/70R18')).toBe(false);
  });

  it('returns null stats for sizes absent from the product database', () => {
    expect(getSizeProductStats('999/99R99')).toBeNull();
    expect(isInProductDatabase('999/99R99')).toBe(false);
    expect(isCommonProductionSize('999/99R99')).toBe(false);
  });
});
