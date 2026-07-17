import { describe, expect, it } from 'vitest';
import {
  formatProductSizeServiceLine,
  getBrandLogoSrc,
  getProductImageCandidates,
  isRunFlatModel,
  isXlOrReinforced,
  mapProductCategoryToVerified,
  normalizeTireProductRecord,
  parseServiceLoadAndSpeed,
  tireProductToVerifiedModel,
  NEUTRAL_TIRE_SILHOUETTE_SRC,
} from './tire-product-display';

describe('normalizeTireProductRecord', () => {
  it('uses marketed brand from the record, never product_family', () => {
    const normalized = normalizeTireProductRecord({
      brand: 'Goodyear',
      model: 'Discoverer® HT3™',
      product_family: 'Cooper',
      display_size: '275/70R18',
      service_description: '125/122S',
      product_code: '24488',
      product_category: 'all_terrain_truck_suv',
    });
    expect(normalized.canonicalBrand).toBe('Goodyear');
    expect(normalized.canonicalBrand).not.toBe('Cooper');
    expect(normalized.canonicalModel).toBe('Discoverer HT3');
    expect(normalized.normalizedSize).toBe('275/70R18');
    expect(normalized.serviceDescriptions).toEqual(['125/122S']);
    expect(normalized.sourceRecordId).toBe('24488');
    expect(normalized.brandLogo).toBe(getBrandLogoSrc('Goodyear'));
    expect(normalized.brandLogo).not.toBe(getBrandLogoSrc('Cooper'));
  });

  it('keeps logo keyed to canonical brand for Discoverer rows', () => {
    const normalized = normalizeTireProductRecord({
      brand: 'Goodyear',
      model: 'Discoverer Road+Trail AT',
      product_family: 'Cooper',
      tire_size: '275/70R18',
    });
    expect(normalized.brandLogo).toBe('/images/brands/goodyear.svg');
  });

  it('does not invent an exact model image from another SKU', () => {
    const normalized = normalizeTireProductRecord({
      brand: 'Michelin',
      model: 'Defender LTX M/S',
      display_size: '275/70R18',
    });
    expect(normalized.exactModelImage).toBeNull();
  });
});

describe('getProductImageCandidates provenance', () => {
  it('uses neutral silhouette for branded cards without an exact image', () => {
    const candidates = getProductImageCandidates(
      'All-Terrain',
      null,
      null,
      'Goodyear',
      'Discoverer HT3',
    );
    expect(candidates[0]).toBe(NEUTRAL_TIRE_SILHOUETTE_SRC);
    expect(candidates).not.toContain('/images/tires/tire-off-road.png');
  });

  it('prefers the exact model image when provided on the same record', () => {
    const candidates = getProductImageCandidates(
      'All-Terrain',
      '/images/products/example.png',
      null,
      'Goodyear',
      'Discoverer HT3',
    );
    expect(candidates[0]).toBe('/images/products/example.png');
  });
});

describe('mapProductCategoryToVerified', () => {
  it('maps master catalog categories onto verified display categories', () => {
    expect(mapProductCategoryToVerified('all_terrain_truck_suv')).toBe('All-Terrain');
    expect(mapProductCategoryToVerified('highway_terrain')).toBe('Highway Terrain');
    expect(mapProductCategoryToVerified('passenger_touring')).toBe('Touring');
    expect(mapProductCategoryToVerified('ultra_high_performance')).toBe('Performance');
    expect(mapProductCategoryToVerified('studdable_winter')).toBe('Winter');
  });
});

describe('tireProductToVerifiedModel', () => {
  it('adapts hub product rows for VerifiedProductCard', () => {
    const model = tireProductToVerifiedModel({
      brand: 'Goodyear',
      model: 'Discoverer HT3',
      product_category: 'all_terrain_truck_suv',
      load_range: 'E',
      service_description: '125S',
    });
    expect(model.brand).toBe('Goodyear');
    expect(model.category).toBe('All-Terrain');
    expect(model.loadRange).toBe('E');
    expect(model.service).toBe('125S');
    expect(model.variantCount).toBe(1);
  });
});

describe('tire-product-display product card fields', () => {
  it('formats size + service without empty labels', () => {
    expect(
      formatProductSizeServiceLine('235/40R18', {
        service: '95Y XL',
        loadRange: 'XL',
      }),
    ).toBe('235/40R18 · 95Y XL');

    expect(
      formatProductSizeServiceLine('275/70R18', {
        service: '125S',
        loadRange: 'E',
      }),
    ).toBe('275/70R18 · 125S · Load Range E');

    expect(
      formatProductSizeServiceLine('235/40R18', {
        service: null,
        loadRange: null,
      }),
    ).toBe('235/40R18');

    expect(
      formatProductSizeServiceLine('', {
        service: null,
        loadRange: null,
      }),
    ).toBeNull();
  });

  it('parses load index and speed rating from genuine service strings only', () => {
    expect(parseServiceLoadAndSpeed('112T')).toEqual({ loadIndex: '112', speedRating: 'T' });
    expect(parseServiceLoadAndSpeed('117/114Q')).toEqual({
      loadIndex: '117/114',
      speedRating: 'Q',
    });
    expect(parseServiceLoadAndSpeed('95Y XL')).toEqual({ loadIndex: '95', speedRating: 'Y' });
    expect(parseServiceLoadAndSpeed('not-a-service')).toEqual({
      loadIndex: null,
      speedRating: null,
    });
    expect(parseServiceLoadAndSpeed(null)).toEqual({ loadIndex: null, speedRating: null });
  });

  it('detects XL and run-flat markings only when present', () => {
    expect(isXlOrReinforced({ loadRange: 'XL', service: '95Y' })).toBe(true);
    expect(isXlOrReinforced({ loadRange: 'SL', service: '95H' })).toBe(false);
    expect(isRunFlatModel({ model: 'Pilot Sport 4 ZP', service: null, loadRange: null })).toBe(
      true,
    );
    expect(isRunFlatModel({ model: 'Pilot Sport 4', service: '95Y', loadRange: 'XL' })).toBe(
      false,
    );
  });
});
