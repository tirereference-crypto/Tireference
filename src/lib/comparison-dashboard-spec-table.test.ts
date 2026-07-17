import { describe, expect, it } from 'vitest';
import { resolveComparisonDataSources } from './comparison-data-sources';
import { buildComparisonDashboardSpecRows } from './comparison-dashboard-spec-table';
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
    overall_diameter_in: 25.0,
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

describe('comparison dashboard spec table', () => {
  it('includes required nominal rows for generic sizes', () => {
    const a = '225/45R17';
    const b = '235/40R18';
    const rows = buildComparisonDashboardSpecRows({
      specsA: getTireSpecs(a),
      specsB: getTireSpecs(b),
      comparison: compareTires(a, b, 60),
      unitSystem: 'imperial',
      dataSources: resolveComparisonDataSources({ sizeA: a, sizeB: b }),
    });

    const labels = rows.map((r) => r.label);
    expect(labels).toEqual([
      'Overall diameter',
      'Section width',
      'Sidewall height',
      'Circumference',
      'Revolutions per mile',
      'Speedometer reading',
      'Wheel diameter',
    ]);
    expect(rows.every((r) => r.source === 'nominal_calculation')).toBe(true);
    expect(rows.find((r) => r.label === 'Wheel diameter')?.difference).toMatch(/different wheel/i);
  });

  it('adds published rows when available and omits empty rim range', () => {
    const a = '225/45R17';
    const b = '235/40R18';
    const rows = buildComparisonDashboardSpecRows({
      specsA: getTireSpecs(a),
      specsB: getTireSpecs(b),
      comparison: compareTires(a, b, 60),
      unitSystem: 'imperial',
      dataSources: resolveComparisonDataSources({
        sizeA: a,
        sizeB: b,
        productA: fakeProduct(a, { overall_diameter_in: 24.97, section_width_in: 8.9 }),
        productB: fakeProduct(b, {
          overall_diameter_in: 25.4,
          section_width_in: 9.3,
          load_range: '',
          service_description: '91Y',
          speed_rating: 'Y',
        }),
      }),
    });

    expect(rows.some((r) => r.label === 'Published diameter')).toBe(true);
    expect(rows.some((r) => r.label === 'Published section width')).toBe(true);
    expect(rows.some((r) => r.label === 'Load index')).toBe(true);
    expect(rows.some((r) => r.label === 'Speed rating')).toBe(true);
    expect(rows.some((r) => r.label === 'Approved rim-width range')).toBe(false);
    expect(rows.find((r) => r.label === 'Published diameter')?.differenceWithheld).toBeFalsy();
  });

  it('does not compare published diameter to nominal in mixed source', () => {
    const a = '225/45R17';
    const b = '235/40R18';
    const rows = buildComparisonDashboardSpecRows({
      specsA: getTireSpecs(a),
      specsB: getTireSpecs(b),
      comparison: compareTires(a, b, 60),
      unitSystem: 'imperial',
      dataSources: resolveComparisonDataSources({
        sizeA: a,
        sizeB: b,
        productA: fakeProduct(a),
      }),
    });

    const published = rows.find((r) => r.label === 'Published diameter');
    expect(published?.differenceWithheld).toBe(true);
    expect(published?.difference).toMatch(/mixed source/i);
    expect(published?.newTire).toBe('—');
    expect(rows[0].source).toBe('nominal_calculation');
  });

  it('handles partial published section width', () => {
    const a = '275/70R18';
    const b = '285/70R18';
    const rows = buildComparisonDashboardSpecRows({
      specsA: getTireSpecs(a),
      specsB: getTireSpecs(b),
      comparison: compareTires(a, b, 65),
      unitSystem: 'imperial',
      dataSources: resolveComparisonDataSources({
        sizeA: a,
        sizeB: b,
        productA: fakeProduct(a, { section_width_in: null, overall_width_in: null }),
        productB: fakeProduct(b, { section_width_in: 11.2 }),
      }),
    });

    const widthRow = rows.find((r) => r.label === 'Published section width');
    expect(widthRow?.current).toBe('—');
    expect(widthRow?.newTire).not.toBe('—');
    expect(widthRow?.differenceWithheld).toBe(true);
  });
});
