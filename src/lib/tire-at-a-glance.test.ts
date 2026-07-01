import { describe, expect, it } from 'vitest';
import { getTireSpecs } from './tire-math';
import { buildAtAGlanceProfile } from './tire-at-a-glance';

const defaultContext = {
  sizeLabel: '275/70R18',
  categoryLabel: 'Off-Road / All-Terrain',
  equivalentFlotation: '33x10.8R18',
  popularVehicles: 'Toyota Tacoma, Ford Bronco',
};

describe('buildAtAGlanceProfile', () => {
  it('returns six ratings and three-column section fields', () => {
    const specs = getTireSpecs('275/70R18');
    expect(specs).not.toBeNull();

    const profile = buildAtAGlanceProfile(specs!, defaultContext);
    expect(profile.ratings).toHaveLength(6);
    expect(profile.bestFor.length).toBeGreaterThan(10);
    expect(profile.useCaseBadges.length).toBeGreaterThan(0);
    expect(profile.tradeoffBullets.length).toBeGreaterThan(0);
    expect(profile.quickFacts.category).toBe(defaultContext.categoryLabel);
  });

  it('scores tall sidewalls higher for comfort', () => {
    const tall = buildAtAGlanceProfile(getTireSpecs('275/70R18')!, defaultContext);
    const low = buildAtAGlanceProfile(getTireSpecs('275/40R18')!, {
      ...defaultContext,
      sizeLabel: '275/40R18',
    });

    const tallComfort = tall.ratings.find((r) => r.id === 'comfort')!.rating;
    const lowComfort = low.ratings.find((r) => r.id === 'comfort')!.rating;
    expect(tallComfort).toBeGreaterThan(lowComfort);
  });
});
