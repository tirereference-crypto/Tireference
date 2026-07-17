import { describe, expect, it } from 'vitest';
import {
  isSidewallRideUnchanged,
  sidewallPctFromSpecs,
  sidewallRideTier,
} from './tire-comparison-format';
import { getTireSpecs } from './tire-math';

describe('sidewall ride tiers', () => {
  it('uses percent bands aligned with comparison measurements', () => {
    expect(sidewallRideTier(2.9)).toBe('unchanged');
    expect(sidewallRideTier(-2.9)).toBe('unchanged');
    expect(sidewallRideTier(3)).toBe('noticeable');
    expect(sidewallRideTier(-7.16)).toBe('noticeable');
    expect(sidewallRideTier(10)).toBe('noticeable');
    expect(sidewallRideTier(-10.1)).toBe('significant');
    expect(isSidewallRideUnchanged(-7.16)).toBe(false);
  });

  it('225/45R17 vs 235/40R18 sidewall pct matches spec table', () => {
    const specsA = getTireSpecs('225/45R17');
    const specsB = getTireSpecs('235/40R18');
    const pct = sidewallPctFromSpecs(specsA, specsB);
    expect(pct).toBeLessThan(-6);
    expect(pct).toBeGreaterThan(-8);
    expect(sidewallRideTier(pct)).toBe('noticeable');
  });
});
