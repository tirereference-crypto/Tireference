import { describe, expect, it } from 'vitest';
import {
  normalizeTireSize,
  tireSizeLookupCandidates,
  getProductsForTireSize,
  getFullSpecProductsForTireSize,
  getBrandCoverageForTireSize,
  getTopProductsForTireSize,
  groupProductsByUseCase,
  getTireSizeDataCoverage,
  buildProductDataFaqs,
} from './tire-size-products';

describe('normalizeTireSize', () => {
  it('normalizes slash, dash, and case variants', () => {
    expect(normalizeTireSize('275/70R18')).toBe('275-70r18');
    expect(normalizeTireSize('275-70r18')).toBe('275-70r18');
    expect(normalizeTireSize('LT275/70R18')).toBe('lt275-70r18');
    expect(normalizeTireSize('LT275/70R18/E')).toBe('lt275-70r18-e');
  });
});

describe('tireSizeLookupCandidates', () => {
  it('prefers exact then strips load suffix', () => {
    expect(tireSizeLookupCandidates('LT275/70R18/E')).toEqual([
      'lt275-70r18-e',
      'lt275-70r18',
    ]);
  });

  it('does not invent LT from passenger sizes', () => {
    expect(tireSizeLookupCandidates('275/70R18')).toEqual(['275-70r18']);
  });
});

describe('products for 275/70R18', () => {
  it('returns real products from the master database', () => {
    const products = getProductsForTireSize('275/70R18');
    expect(products.length).toBeGreaterThan(0);
    expect(products.some((p) => p.brand === 'Goodyear')).toBe(true);
  });

  it('does not merge LT and non-LT when exact exists', () => {
    const passenger = getProductsForTireSize('275/70R18');
    const lt = getProductsForTireSize('LT275/70R18');
    expect(passenger.every((p) => !p.tire_size.toUpperCase().startsWith('LT'))).toBe(
      true,
    );
    expect(lt.every((p) => p.tire_size.toUpperCase().startsWith('LT'))).toBe(true);
  });

  it('prioritizes full_specs in top products', () => {
    const top = getTopProductsForTireSize('275/70R18', 12);
    expect(top.length).toBeGreaterThan(0);
    expect(top.length).toBeLessThanOrEqual(12);
    const firstFull = top.findIndex(
      (p) => p.data_quality_status === 'full_specs',
    );
    expect(firstFull).toBe(0);
  });

  it('returns full-spec products only for comparison table', () => {
    const full = getFullSpecProductsForTireSize('275/70R18');
    expect(full.length).toBeGreaterThan(0);
    expect(full.every((p) => p.data_quality_status === 'full_specs')).toBe(true);
  });

  it('builds brand coverage and data line', () => {
    const brands = getBrandCoverageForTireSize('275/70R18');
    expect(brands.length).toBeGreaterThan(0);
    const coverage = getTireSizeDataCoverage('275/70R18');
    expect(coverage.productsIndexed).toBeGreaterThan(0);
    expect(coverage.uniqueModelCount).toBeGreaterThan(0);
    expect(coverage.heroDataLine).toMatch(/unique tire model/);
    expect(coverage.heroDataLine).toMatch(/service variant/);
    expect(coverage.heroDataLine).toMatch(/brand/);
  });

  it('groups use-case buckets only when products exist', () => {
    const products = getTopProductsForTireSize('275/70R18', 12);
    const buckets = groupProductsByUseCase(products, 4);
    expect(buckets.every((b) => b.products.length > 0)).toBe(true);
    expect(buckets.every((b) => b.products.length <= 4)).toBe(true);
  });

  it('builds product FAQs from coverage', () => {
    const coverage = getTireSizeDataCoverage('275/70R18');
    const faqs = buildProductDataFaqs('275/70R18', coverage);
    expect(faqs.length).toBeGreaterThan(0);
    expect(faqs[0].question).toContain('Which brands make');
  });
});
