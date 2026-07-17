import { describe, expect, it } from 'vitest';
import {
  formulaSourceLabel,
  isVehicleSpecificUnknown,
  resolveComparisonDataSources,
  vehicleUnknownStatusLabel,
} from './comparison-data-sources';
import type { TireProduct } from './tire-size-products';

function fakeProduct(size: string, diameterIn: number): TireProduct {
  return {
    brand: 'Test',
    model: 'Demo',
    display_size: size,
    tire_size: size,
    overall_diameter_in: diameterIn,
    section_width_in: 8.9,
    revs_per_mile: 820,
    load_range: 'XL',
    speed_rating: 'W',
    max_load_lb: null,
    weight_lb: null,
    tread_depth_32nds: null,
    source_url: 'https://example.com',
    product_category: 'Passenger',
    overall_width_in: null,
  } as unknown as TireProduct;
}

describe('comparison data sources', () => {
  it('defaults generic size comparisons to nominal formula headlines', () => {
    const summary = resolveComparisonDataSources({
      sizeA: '225/45R17',
      sizeB: '235/40R18',
    });
    expect(summary.mode).toBe('generic_vs_generic');
    expect(summary.headlineUses).toBe('formula_nominal');
    expect(summary.note).toMatch(/nominal dimensions calculated/i);
    expect(summary.canComparePublishedDiameters).toBe(false);
  });

  it('keeps provenance labels stable', () => {
    expect(formulaSourceLabel()).toMatch(/formula/i);
    expect(vehicleUnknownStatusLabel()).toMatch(/vehicle data/i);
  });

  it('flags clearance and rubbing as vehicle-specific unknowns', () => {
    expect(isVehicleSpecificUnknown('Fender Clearance')).toBe(true);
    expect(isVehicleSpecificUnknown('Suspension Clearance')).toBe(true);
    expect(isVehicleSpecificUnknown('Rubbing Risk')).toBe(true);
    expect(isVehicleSpecificUnknown('Diameter Change')).toBe(false);
  });

  it('uses Prompt 2 source notes for model and mixed modes', () => {
    const both = resolveComparisonDataSources({
      sizeA: '225/45R17',
      sizeB: '235/40R18',
      productA: fakeProduct('225/45R17', 25),
      productB: fakeProduct('235/40R18', 25.4),
    });
    expect(both.mode).toBe('model_vs_model');
    expect(both.note).toMatch(/Manufacturer-published specifications are available for both/i);
    expect(both.canComparePublishedDiameters).toBe(true);

    const mixed = resolveComparisonDataSources({
      sizeA: '225/45R17',
      sizeB: '235/40R18',
      productA: fakeProduct('225/45R17', 25),
    });
    expect(mixed.mode).toBe('mixed_source');
    expect(mixed.note).toMatch(/only one selected tire/i);
  });
});
