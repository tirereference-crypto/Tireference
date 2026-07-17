import { describe, expect, it } from 'vitest';
import { buildCompareOgData, buildTireOgData } from './og-data';
import { compareOgImageUrl, prebuiltCompareOgImageUrl, prebuiltTireOgImageUrl, tireOgImageUrl } from './og-image-url';

describe('og-image-url', () => {
  it('builds dynamic tire OG URLs', () => {
    expect(tireOgImageUrl('275/70R18')).toBe(
      'https://tirereference.com/og/tire.png?size=275%2F70R18',
    );
  });

  it('builds dynamic compare OG URLs', () => {
    expect(compareOgImageUrl('225/45R17', '235/40R18')).toBe(
      'https://tirereference.com/og/compare.png?from=225%2F45R17&to=235%2F40R18',
    );
  });

  it('builds prebuilt tire OG URLs', () => {
    expect(prebuiltTireOgImageUrl('275-70r18')).toBe(
      'https://tirereference.com/og/prebuilt/tire/275-70r18.png',
    );
  });

  it('builds prebuilt compare OG URLs', () => {
    expect(prebuiltCompareOgImageUrl('225-45-r17-vs-235-40-r18')).toBe(
      'https://tirereference.com/og/prebuilt/compare/225-45-r17-vs-235-40-r18.png',
    );
  });
});

describe('og-data', () => {
  it('builds tire OG data from a valid size', () => {
    const data = buildTireOgData('275/70R18');
    expect(data?.size).toBe('275/70R18');
    expect(data?.diameterIn).toBeGreaterThan(30);
    expect(data?.revsPerMile).toBeGreaterThan(500);
  });

  it('builds comparison OG data from a valid pair', () => {
    const data = buildCompareOgData('265/70R17', '285/70R17');
    expect(data?.from).toBe('265/70R17');
    expect(data?.to).toBe('285/70R17');
    expect(data?.fitmentScore).toBeGreaterThan(0);
  });

  it('returns null for invalid sizes', () => {
    expect(buildTireOgData('not-a-size')).toBeNull();
    expect(buildCompareOgData('225/45R17', 'invalid')).toBeNull();
  });
});
