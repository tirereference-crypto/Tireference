import { describe, expect, it } from 'vitest';
import {
  canonicalComparisonPath,
  canonicalComparisonUrl,
  comparisonSlugFromSizes,
  formatComparisonTireSize,
  getCanonicalComparisonPair,
  isReversedComparisonSlug,
  isValidComparisonTireSize,
  normalizeComparisonPath,
  normalizeComparisonTireSize,
  orderComparisonSizes,
  parseComparisonSlug,
  parseComparisonTireSize,
  parseTireSizeComparisonSlug,
  tireSizeComparisonSlug,
} from './comparison-url';

describe('comparison-url shared source of truth', () => {
  it('parses, validates, normalizes, and formats metric sizes', () => {
    const parsed = parseComparisonTireSize(' 225%2F45r17 ');
    expect(parsed).toMatchObject({
      type: 'metric',
      normalized: '225/45R17',
      display: '225/45R17',
      slug: '225-45-r17',
      widthMm: 225,
      aspectRatio: 45,
      wheelDiameterIn: 17,
    });
    expect(isValidComparisonTireSize('225/45R17')).toBe(true);
    expect(normalizeComparisonTireSize(' 225/45r17 ')).toBe('225/45R17');
    expect(formatComparisonTireSize('225/45r17')).toBe('225/45R17');
  });

  it('supports LT metric and flotation identities', () => {
    expect(tireSizeComparisonSlug('LT265/75R16')).toBe('lt-265-75-r16');
    expect(parseTireSizeComparisonSlug('lt-265-75-r16')?.normalized).toBe(
      'LT265/75R16',
    );

    const flotation = parseComparisonTireSize('33x12.50r17');
    expect(flotation?.normalized).toBe('33x12.50R17');
    expect(flotation?.slug).toBe('33-x-12.50-r17');
    expect(parseTireSizeComparisonSlug('33-x-12.50-r17')?.normalized).toBe(
      '33x12.50R17',
    );
  });

  it('strictly rejects malformed tire sizes and slugs', () => {
    for (const invalid of ['', '225/45', '225/45R', '225/4R5', 'banana']) {
      expect(parseComparisonTireSize(invalid)).toBeNull();
      expect(isValidComparisonTireSize(invalid)).toBe(false);
    }
    expect(parseTireSizeComparisonSlug('225-45-17')).toBeNull();
    expect(parseComparisonSlug('225-45-r17')).toBeNull();
  });

  it('getCanonicalComparisonPair returns every canonical identity for either order', () => {
    const forward = getCanonicalComparisonPair(
      '225/45R17',
      '235/40R18',
      'https://tirereference.com',
    );
    expect(forward).toEqual({
      current: '225/45R17',
      new: '235/40R18',
      slug: '225-45-r17-vs-235-40-r18',
      path: '/compare/225-45-r17-vs-235-40-r18/',
      url: 'https://tirereference.com/compare/225-45-r17-vs-235-40-r18/',
      wasReversed: false,
    });

    const reversed = getCanonicalComparisonPair(
      '235/40R18',
      '225/45R17',
      'https://tirereference.com',
    );
    expect(reversed).toEqual({ ...forward, wasReversed: true });

    // Without an origin, absolute url stays empty (relative path only).
    expect(getCanonicalComparisonPair('225/45R17', '235/40R18').url).toBe('');

    // Normalizes messy input before ordering.
    const messy = getCanonicalComparisonPair(
      ' 235/40r18 ',
      '225%2F45R17',
      'https://tirereference.com',
    );
    expect(messy).toEqual({ ...forward, wasReversed: true });

    // Idempotent: feeding the canonical order back reports no reversal.
    const again = getCanonicalComparisonPair(forward.current, forward.new);
    expect(again.wasReversed).toBe(false);
    expect(again.slug).toBe(forward.slug);

    expect(() => getCanonicalComparisonPair('banana', '225/45R17')).toThrow();
  });

  it('orders pairs by overall diameter and uses stable tie-breakers', () => {
    expect(orderComparisonSizes('235/40R18', '225/45R17')).toEqual({
      current: '225/45R17',
      new: '235/40R18',
    });
    expect(orderComparisonSizes('305/70R18', '275/70R18')).toEqual({
      current: '275/70R18',
      new: '305/70R18',
    });
  });

  it('returns one slug, path, and absolute URL for either input order', () => {
    const expectedSlug = '225-45-r17-vs-235-40-r18';
    const expectedPath = `/compare/${expectedSlug}/`;
    const expectedUrl = `https://tirereference.com${expectedPath}`;

    expect(comparisonSlugFromSizes('225/45R17', '235/40R18')).toBe(expectedSlug);
    expect(comparisonSlugFromSizes('235/40R18', '225/45R17')).toBe(expectedSlug);
    expect(canonicalComparisonPath('225/45R17', '235/40R18')).toBe(expectedPath);
    expect(canonicalComparisonPath('235/40R18', '225/45R17')).toBe(expectedPath);
    expect(canonicalComparisonUrl('225/45R17', '235/40R18')).toBe(expectedUrl);
    expect(canonicalComparisonUrl('235/40R18', '225/45R17')).toBe(expectedUrl);
  });

  it('parses reversed slugs and reports their canonical target', () => {
    const canonical = parseComparisonSlug('225-45-r17-vs-235-40-r18');
    expect(canonical).toMatchObject({
      canonical: { current: '225/45R17', new: '235/40R18' },
      canonicalSlug: '225-45-r17-vs-235-40-r18',
      canonicalPath: '/compare/225-45-r17-vs-235-40-r18/',
      isCanonical: true,
    });

    const reversed = parseComparisonSlug('235-40-r18-vs-225-45-r17');
    expect(reversed).toMatchObject({
      requested: { current: '235/40R18', new: '225/45R17' },
      canonical: { current: '225/45R17', new: '235/40R18' },
      canonicalSlug: '225-45-r17-vs-235-40-r18',
      canonicalPath: '/compare/225-45-r17-vs-235-40-r18/',
      isCanonical: false,
    });
  });

  it('rejects same-size comparison slugs', () => {
    expect(parseComparisonSlug('225-45-r17-vs-225-45-r17')).toBeNull();
  });

  it('normalizes trailing slashes and rejects non-compare paths', () => {
    expect(normalizeComparisonPath('/compare/225-45-r17-vs-235-40-r18')).toBe(
      '/compare/225-45-r17-vs-235-40-r18/',
    );
    expect(normalizeComparisonPath('/compare/225-45-r17-vs-235-40-r18/')).toBe(
      '/compare/225-45-r17-vs-235-40-r18/',
    );
    expect(
      normalizeComparisonPath('https://tirereference.com/compare/225-45-r17-vs-235-40-r18'),
    ).toBe('/compare/225-45-r17-vs-235-40-r18/');
    expect(normalizeComparisonPath('/tire-size/225-45r17/')).toBeNull();
  });

  it('detects reversed comparison slugs and supports absolute vs relative URLs', () => {
    expect(isReversedComparisonSlug('235-40-r18-vs-225-45-r17')).toBe(true);
    expect(isReversedComparisonSlug('/compare/225-45-r17-vs-235-40-r18/')).toBe(false);

    const relative = canonicalComparisonPath('225/45R17', '235/40R18');
    expect(relative).toBe('/compare/225-45-r17-vs-235-40-r18/');
    expect(canonicalComparisonUrl('225/45R17', '235/40R18')).toBe(
      `https://tirereference.com${relative}`,
    );
    expect(
      canonicalComparisonUrl('225/45R17', '235/40R18', 'https://example.test'),
    ).toBe(`https://example.test${relative}`);
  });
});
