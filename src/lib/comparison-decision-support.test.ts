import { describe, expect, it } from 'vitest';
import { resolveComparisonDataSources } from './comparison-data-sources';
import {
  buildDimensionalDecisionSupport,
  computeDimensionalCompatibilityScore,
  DIMENSIONAL_COMPATIBILITY,
  rimRangesCompatible,
} from './comparison-decision-support';
import { compareTires, getTireSpecs } from './tire-math';
import type { TireProduct } from './tire-size-products';

function fakeProduct(size: string, opts: Partial<TireProduct> = {}): TireProduct {
  return {
    brand: 'Test',
    model: 'Demo',
    product_family: '',
    product_category: 'Passenger',
    season: '',
    tire_size: size,
    size_slug: size.toLowerCase(),
    display_size: size,
    product_code: 'X',
    load_range: 'XL',
    service_description: '95W',
    speed_rating: 'W',
    overall_diameter_in: 25,
    section_width_in: 8.9,
    overall_width_in: null,
    tread_depth_32nds: null,
    weight_lb: null,
    max_load_lb: null,
    max_pressure_psi: null,
    revs_per_mile: 820,
    utqg: '',
    specs_loaded: 'yes',
    data_quality_status: 'full_specs',
    source_url: 'https://example.com',
    ...opts,
  } as TireProduct;
}

describe('comparison decision support', () => {
  it('documents and applies diameter thresholds for same-wheel close match', () => {
    expect(DIMENSIONAL_COMPATIBILITY.diameterPassPct).toBe(3);
    const a = '225/45R17';
    const b = '225/45R17';
    const decision = buildDimensionalDecisionSupport({
      comparison: compareTires(a, b, 60),
      specsA: getTireSpecs(a),
      specsB: getTireSpecs(b),
      dataSources: resolveComparisonDataSources({ sizeA: a, sizeB: b }),
    });
    expect(decision.heading).toMatch(/Very close dimensional match/i);
    expect(decision.scoreTitle).toBe('Dimensional Compatibility Score');
    expect(decision.scoreDisclaimer).toMatch(/not confirmed vehicle fitment/i);
    expect(decision.fitmentRows.find((r) => r.id === 'wheel')?.statusLabel).toBe(
      'Within comparison threshold',
    );
    expect(decision.fitmentRows.find((r) => r.id === 'fender')?.statusLabel).toBe('Check required');
    expect(decision.fitmentRows.find((r) => r.id === 'hub')?.label).toBe('Hub compatibility');
    expect(decision.fitmentRows.find((r) => r.id === 'rubbing')?.status).toBe('unknown');
    expect(decision.bullets.length).toBeLessThanOrEqual(4);
  });

  it('flags different wheel required', () => {
    const a = '225/45R17';
    const b = '235/40R18';
    const decision = buildDimensionalDecisionSupport({
      comparison: compareTires(a, b, 60),
      specsA: getTireSpecs(a),
      specsB: getTireSpecs(b),
      dataSources: resolveComparisonDataSources({ sizeA: a, sizeB: b }),
    });
    expect(decision.heading).toMatch(/Different wheel required/i);
    expect(decision.fitmentRows.find((r) => r.id === 'wheel')?.statusLabel).toBe(
      'Different wheel required',
    );
  });

  it('classifies diameter change under and over threshold', () => {
    const under = buildDimensionalDecisionSupport({
      comparison: compareTires('275/70R18', '285/70R18', 60),
      specsA: getTireSpecs('275/70R18'),
      specsB: getTireSpecs('285/70R18'),
      dataSources: resolveComparisonDataSources({ sizeA: '275/70R18', sizeB: '285/70R18' }),
    });
    const diam = under.fitmentRows.find((r) => r.id === 'diameter')!;
    expect(['Within comparison threshold', 'Moderate change', 'Significant change']).toContain(
      diam.statusLabel,
    );

    const over = buildDimensionalDecisionSupport({
      comparison: compareTires('225/45R17', '265/70R17', 60),
      specsA: getTireSpecs('225/45R17'),
      specsB: getTireSpecs('265/70R17'),
      dataSources: resolveComparisonDataSources({ sizeA: '225/45R17', sizeB: '265/70R17' }),
    });
    expect(over.heading).toMatch(/Significant dimensional change|Different wheel/i);
    expect(over.fitmentRows.find((r) => r.id === 'diameter')?.statusLabel).toBe('Significant change');
  });

  it('flags lower published load index and speed rating', () => {
    const a = '225/45R17';
    const b = '225/45R17';
    const decision = buildDimensionalDecisionSupport({
      comparison: compareTires(a, b, 60),
      specsA: getTireSpecs(a),
      specsB: getTireSpecs(b),
      dataSources: resolveComparisonDataSources({
        sizeA: a,
        sizeB: b,
        productA: fakeProduct(a, { service_description: '95W', speed_rating: 'W' }),
        productB: fakeProduct(b, { service_description: '91H', speed_rating: 'H' }),
      }),
    });
    expect(decision.heading).toMatch(/load and speed ratings lower|load rating lower/i);
    expect(decision.fitmentRows.find((r) => r.id === 'load')?.statusLabel).toBe('Lower than original');
    expect(decision.fitmentRows.find((r) => r.id === 'speed-rating')?.statusLabel).toBe(
      'Lower than original',
    );
    const withPublished = computeDimensionalCompatibilityScore({
      comparison: compareTires(a, b, 60),
      specsA: getTireSpecs(a),
      specsB: getTireSpecs(b),
      publishedA: resolveComparisonDataSources({
        sizeA: a,
        sizeB: b,
        productA: fakeProduct(a),
        productB: fakeProduct(b, { service_description: '91H', speed_rating: 'H' }),
      }).publishedA,
      publishedB: resolveComparisonDataSources({
        sizeA: a,
        sizeB: b,
        productA: fakeProduct(a),
        productB: fakeProduct(b, { service_description: '91H', speed_rating: 'H' }),
      }).publishedB,
    });
    const baseline = computeDimensionalCompatibilityScore({
      comparison: compareTires(a, b, 60),
      specsA: getTireSpecs(a),
      specsB: getTireSpecs(b),
    });
    expect(withPublished).toBeLessThan(baseline);
  });

  it('handles missing published specifications without inventing safe claims', () => {
    const decision = buildDimensionalDecisionSupport({
      comparison: compareTires('225/45R17', '235/45R17', 60),
      specsA: getTireSpecs('225/45R17'),
      specsB: getTireSpecs('235/45R17'),
      dataSources: resolveComparisonDataSources({ sizeA: '225/45R17', sizeB: '235/45R17' }),
    });
    expect(decision.fitmentRows.find((r) => r.id === 'load')?.statusLabel).toBe('Data unavailable');
    expect(decision.fitmentRows.find((r) => r.id === 'rim')?.statusLabel).toBe('Data unavailable');
    expect(decision.fitmentRows.every((r) => r.statusLabel !== 'Unknown without vehicle data')).toBe(
      true,
    );
    expect(
      decision.feelItems.every(
        (item) => !/\b(guaranteed|exact mpg|will not rub|safe fit)\b/i.test(item.body),
      ),
    ).toBe(true);
    expect(decision.feelItems.some((item) => /better grip/i.test(item.body))).toBe(true); // denial phrasing OK
  });

  it('parses rim range overlap when published', () => {
    expect(rimRangesCompatible('7.0-8.5', '8.0-9.0')).toBe(true);
    expect(rimRangesCompatible('7.0-7.5', '8.5-9.5')).toBe(false);
    expect(rimRangesCompatible(null, '8.0')).toBe(null);
  });
});
