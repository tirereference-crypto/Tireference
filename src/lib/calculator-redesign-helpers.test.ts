import { describe, expect, it } from 'vitest';
import { buildSizeSnapshotCards, getProductionStatusLabel } from './calculator-size-snapshot';
import { getCalculatorRelatedSizes } from './calculator-related-sizes';
import { resolvePopularAvailability } from './size-availability';
import { getTireSpecs } from './tire-math';

describe('size snapshot', () => {
  it('keeps calculated facts compact and avoids fabricated speedo %', () => {
    const specs = getTireSpecs('275/70R18');
    const cards = buildSizeSnapshotCards('275/70R18', specs);

    expect(cards.map((c) => c.id)).toEqual([
      'sidewall',
      'diameter',
      'speedometer',
      'vehicle-type',
      'tire-categories',
      'production',
    ]);
    expect(cards.some((c) => c.id === 'example-vehicles')).toBe(false);

    const sidewall = cards.find((c) => c.id === 'sidewall');
    expect(sidewall?.title).toBe('Sidewall Profile');
    expect(sidewall?.value).toMatch(/in sidewall$/);
    expect(sidewall?.detail).toMatch(/tall|mid|low/i);
    expect(sidewall?.detail.length).toBeLessThan(40);

    const speedo = cards.find((c) => c.id === 'speedometer');
    expect(speedo?.value).toBe('Depends on original size');
    expect(speedo?.detail).toMatch(/factory tire/i);
    expect(speedo?.detail).not.toMatch(/%/);

    const diameter = cards.find((c) => c.id === 'diameter');
    expect(diameter?.detail).toBe('Nominal calculated diameter');

    const vehicle = cards.find((c) => c.id === 'vehicle-type');
    expect(vehicle?.detail).toMatch(/indicative|not confirmed fitment/i);

    expect(cards.find((c) => c.id === 'production')?.source).toBe('dataset');
    expect(cards.find((c) => c.id === 'production')?.statusTone).toBe('positive');
    expect(getProductionStatusLabel('275/70R18')).toBe('Common production size');
  });

  it('omits vehicle-type and categories when dataset support is missing', () => {
    const size = '215/50R17';
    const specs = getTireSpecs(size);
    const cards = buildSizeSnapshotCards(size, specs);
    expect(cards.some((c) => c.id === 'vehicle-type')).toBe(false);
    expect(cards.some((c) => c.id === 'example-vehicles')).toBe(false);
  });

  it('uses master product coverage for production status', () => {
    expect(getProductionStatusLabel('275/70R18')).toBe('Common production size');
    expect(getProductionStatusLabel('305/70R18')).toBe('Limited production size');
  });

  it('shows speedo comparison only when a valid baseline is provided', () => {
    const specs = getTireSpecs('275/70R18');
    const cards = buildSizeSnapshotCards('275/70R18', specs, {
      baselineSize: '265/70R17',
    });
    const speedo = cards.find((c) => c.id === 'speedometer');
    expect(speedo?.value).toMatch(/%/);
    expect(speedo?.detail).toContain('265/70R17');

    const diameter = cards.find((c) => c.id === 'diameter');
    expect(diameter?.detail).toMatch(/265\/70R17/);
  });
});

describe('popular availability hierarchy', () => {
  it('returns verified models for sizes with exact product coverage', () => {
    const result = resolvePopularAvailability('275/70R18');
    expect(result.level).toBe('models');
    expect(result.models.length).toBeGreaterThan(0);
    expect(result.models.length).toBeLessThanOrEqual(6);
    expect(result.models[0].brand).toBeTruthy();
    expect(result.models[0].model).toBeTruthy();
    const brands = new Set(result.models.map((m) => m.brand));
    expect(brands.size).toBeGreaterThan(1);
  });

  it('passenger sizes keep category data grounded in products', () => {
    const result = resolvePopularAvailability('225/45R17');
    expect(['models', 'brands', 'categories']).toContain(result.level);
    if (result.level === 'models') {
      expect(result.models.every((m) => m.brand && m.model)).toBe(true);
    }
  });
});

describe('related tire sizes', () => {
  it('prioritizes same-wheel alternatives and builds compare links', () => {
    const related = getCalculatorRelatedSizes('275/70R18', 6);
    expect(related.length).toBeGreaterThan(0);
    expect(related.every((row) => row.size !== '275/70R18')).toBe(true);
    expect(related.some((row) => row.sameWheel)).toBe(true);
    // Published pairs link to /compare/; unpublished pairs omit compareHref.
    expect(
      related[0].compareHref === null ||
        /^\/compare\/[a-z0-9-]+-vs-[a-z0-9-]+\//.test(related[0].compareHref),
    ).toBe(true);
    expect(related[0].href).toMatch(/tire-size|tire-size-calculator/);
  });

  it('labels different-wheel options explicitly', () => {
    const related = getCalculatorRelatedSizes('265/70R17', 8);
    const different = related.filter((row) => !row.sameWheel);
    for (const row of different) {
      expect(row.tag).toBe('different_wheel');
      expect(row.role).toBe('different_wheel');
    }
  });
});
