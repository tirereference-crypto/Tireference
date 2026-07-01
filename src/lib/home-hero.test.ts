import { describe, expect, it } from 'vitest';
import {
  HOME_POPULAR_SEARCHES,
  resolveHomeSearch,
  resolveNonTireHomeSearch,
  tireSizeHasHubPage,
} from './home-hero';
import { hubPagePath } from './tire-size-url';

describe('resolveHomeSearch', () => {
  it('routes metric tire sizes to their hub page', () => {
    expect(resolveHomeSearch('285/75R16')).toBe('/tire-size/285-75r16');
    expect(resolveHomeSearch('275/70R18')).toBe('/tire-size/275-70r18');
  });

  it('routes flotation tire sizes without hub pages to the calculator', () => {
    expect(resolveHomeSearch('33x12.50R17')).toBe('/tire-size-calculator?size=33X12.50R17');
    expect(resolveHomeSearch('35x12.50R20')).toBe('/tire-size-calculator?size=35X12.50R20');
  });

  it('does not misroute tire sizes to the bare calculator', () => {
    expect(resolveHomeSearch('265/70R17')).not.toBe('/tire-size-calculator');
    expect(resolveHomeSearch('285/75R16')).not.toBe('/tire-size-calculator');
  });

  it('routes calculator names to calculator pages', () => {
    expect(resolveHomeSearch('tire size')).toBe('/tire-size-calculator');
    expect(resolveHomeSearch('gear ratio')).toBe('/calculators/gear-ratio-calculator');
  });

  it('defers invalid tire-like input to validation flow', () => {
    expect(resolveNonTireHomeSearch('275/71R18')).toBeNull();
    expect(resolveNonTireHomeSearch('not a tire')).toBeNull();
  });
});

describe('HOME_POPULAR_SEARCHES', () => {
  it('only includes sizes with hub pages', () => {
    expect(HOME_POPULAR_SEARCHES.length).toBeGreaterThan(0);
    for (const size of HOME_POPULAR_SEARCHES) {
      expect(tireSizeHasHubPage(size)).toBe(true);
      expect(resolveHomeSearch(size)).toBe(hubPagePath(size));
    }
  });

  it('does not include flotation sizes without hub pages', () => {
    expect(HOME_POPULAR_SEARCHES).not.toContain('33x12.50R17');
    expect(HOME_POPULAR_SEARCHES).not.toContain('35x12.50R20');
  });
});
