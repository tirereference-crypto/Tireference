import { describe, expect, it } from 'vitest';
import {
  getTireSizeValidation,
  normalizeTireSizeInput,
  suggestTireSizes,
} from './tire-size-validation';

const EMPTY_FIELDS = { width: '', aspectRatio: '', wheelDiameter: '' };

describe('normalizeTireSizeInput', () => {
  it.each([
    ['2757018', '275/70R18'],
    ['275-70-18', '275/70R18'],
    ['275 70 r18', '275/70R18'],
    ['27570r18', '275/70R18'],
    ['275/70/18', '275/70R18'],
  ])('normalizes %s to %s', (input, expected) => {
    expect(normalizeTireSizeInput(input)).toBe(expected);
  });
});

describe('getTireSizeValidation', () => {
  it('marks common production sizes as green from product database coverage', () => {
    const result = getTireSizeValidation('275/70R18', EMPTY_FIELDS);
    expect(result.status).toBe('common');
    expect(result.tone).toBe('green');
    expect(result.badgeLabel).toBe('Common Production Tire Size');
    expect(result.showSuggestions).toBe(false);
  });

  it('marks thin product-database sizes as uncommon', () => {
    // 305/70R18 is in the hub catalog but has narrow master coverage
    const result = getTireSizeValidation('305/70R18', EMPTY_FIELDS);
    expect(result.status).toBe('uncommon');
    expect(result.tone).toBe('amber');
    expect(result.badgeLabel).toBe('Limited Availability');
  });

  it('treats broad passenger sizes as common when the master catalog supports them', () => {
    const result = getTireSizeValidation('225/45R17', EMPTY_FIELDS);
    expect(result.status).toBe('common');
    expect(result.tone).toBe('green');
    expect(result.badgeLabel).toBe('Common Production Tire Size');
  });

  it('suggests nearby sizes when no exact database match exists', () => {
    const result = getTireSizeValidation('275/71R18', EMPTY_FIELDS);
    expect(result.status).toBe('custom');
    expect(result.showSuggestions).toBe(true);
    expect(result.suggestions.length).toBeGreaterThan(0);
    expect(result.suggestions).toContain('275/70R18');
  });

  it('normalizes compact input before validating', () => {
    const result = getTireSizeValidation('2757018', EMPTY_FIELDS);
    expect(result.status).toBe('common');
    expect(result.canonicalSize).toBe('275/70R18');
  });
});

describe('suggestTireSizes', () => {
  it('returns three ranked suggestions', () => {
    const suggestions = suggestTireSizes('275/71R18', EMPTY_FIELDS);
    expect(suggestions).toHaveLength(3);
  });
});
