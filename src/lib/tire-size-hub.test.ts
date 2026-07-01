import { describe, expect, it } from 'vitest';
import { buildTireSizeHubData } from './tire-size-hub';

describe('buildTireSizeHubData', () => {
  it('builds hub data for 275/70R18', () => {
    const hub = buildTireSizeHubData('275/70R18');
    expect(hub).not.toBeNull();
    expect(hub!.displaySize).toBe('275/70R18');
    expect(hub!.specs.overallDiameterIn).toBeCloseTo(33.16, 1);
    expect(hub!.imperialStats.length).toBeGreaterThan(0);
    expect(hub!.faq.length).toBeGreaterThanOrEqual(2);
  });

  it('builds hub data for 225/45R17', () => {
    const hub = buildTireSizeHubData('225/45R17');
    expect(hub).not.toBeNull();
    expect(hub!.specs.overallDiameterIn).toBeCloseTo(24.97, 1);
    expect(hub!.quickComparisons.length).toBeGreaterThan(0);
  });
});
