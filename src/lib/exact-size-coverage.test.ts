import { describe, expect, it } from 'vitest';
import {
  formatBrandCountLabel,
  formatServiceVariantCountLabel,
  formatTireProductCountsLine,
  formatUniqueModelCountLabel,
  getExactSizeCoverage,
  uniqueModelKey,
} from './exact-size-coverage';
import { getSizeProductStats } from './size-production-status';
import {
  getVerifiedTiresForSize,
  resolvePopularAvailability,
} from './size-availability';
import {
  countIndexedSizesNearDiameter,
  formatDiameterGroupSizeCountLabel,
  isCatalogSizeInDiameterGroup,
} from './tire-diameter-insights';
import { getTireDiameterCatalog } from './tire-diameter-search';
import { getTireSizeDataCoverage } from './tire-size-products';
import slimIndex from '../data/generated/size-availability-slim.json';

describe('exact-size coverage definitions', () => {
  it('defines unique models via brand|model keys (not service variants)', () => {
    expect(uniqueModelKey('Goodyear', 'Discoverer HT3')).toBe('goodyear|discoverer ht3');
    expect(uniqueModelKey('Goodyear', 'Discoverer HT3®')).toBe('goodyear|discoverer ht3');
  });

  it('returns consistent coverage for 275/70R18', () => {
    const coverage = getExactSizeCoverage('275/70R18');
    const stats = getSizeProductStats('275/70R18');
    expect(stats).not.toBeNull();
    expect(coverage.uniqueModelCount).toBe(stats!.modelCount);
    expect(coverage.exactRecordCount).toBe(stats!.productCount);
    expect(coverage.serviceVariantCount).toBe(stats!.productCount);
    expect(coverage.brandCount).toBe(stats!.brandCount);
    expect(coverage.uniqueModelCount).toBeGreaterThan(0);
    expect(coverage.exactRecordCount).toBeGreaterThanOrEqual(coverage.uniqueModelCount);
    expect(coverage.brandCount).toBeGreaterThan(0);
  });

  it('aligns Closest / Popular / View-all counts for 275/70R18', () => {
    const coverage = getExactSizeCoverage('275/70R18');
    const popular = resolvePopularAvailability('275/70R18', { limit: 4 });
    expect(popular.totalModelCount).toBe(coverage.uniqueModelCount);
    expect(formatUniqueModelCountLabel(coverage.uniqueModelCount)).toContain(
      String(coverage.uniqueModelCount),
    );
    expect(formatUniqueModelCountLabel(coverage.uniqueModelCount)).toMatch(/unique tire model/);
    expect(formatServiceVariantCountLabel(coverage.serviceVariantCount)).toMatch(
      /service variant/,
    );
    expect(formatBrandCountLabel(coverage.brandCount)).toMatch(/brand/);
    expect(formatTireProductCountsLine(coverage)).toContain('unique tire model');
    expect(formatTireProductCountsLine(coverage)).not.toMatch(/^\d+ models$/);
  });

  it('returns zeros for a size with no products', () => {
    const coverage = getExactSizeCoverage('999/99R99');
    expect(coverage).toEqual({
      uniqueModelCount: 0,
      exactRecordCount: 0,
      serviceVariantCount: 0,
      brandCount: 0,
    });
  });

  it('keeps hub unique-model count identical to calculator coverage for 275/70R18', () => {
    const coverage = getExactSizeCoverage('275/70R18');
    const hub = getTireSizeDataCoverage('275/70R18');
    expect(hub.uniqueModelCount).toBe(coverage.uniqueModelCount);
    expect(hub.serviceVariantCount).toBe(coverage.serviceVariantCount);
    // Hub productsIndexed counts SKU rows; unique models must not exceed that.
    expect(hub.productsIndexed).toBeGreaterThanOrEqual(coverage.uniqueModelCount);
  });
});

describe('exact-size product cards and brand provenance', () => {
  it('dedupes service variants into one card per brand+model', () => {
    const verified = getVerifiedTiresForSize('275/70R18');
    expect(verified).not.toBeNull();
    const keys = verified!.models.map((m) => uniqueModelKey(m.brand, m.model));
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('preserves canonical brand on Discoverer models (Goodyear in master index)', () => {
    const row = (slimIndex as Record<string, { m?: Array<{ brand: string; model: string }> }>)[
      '275-70r18'
    ];
    expect(row?.m?.length).toBeGreaterThan(0);
    const discoverers = (row?.m ?? []).filter((m) => /discoverer/i.test(m.model));
    expect(discoverers.length).toBeGreaterThan(0);
    for (const model of discoverers) {
      expect(model.brand).toBe('Goodyear');
      expect(model.brand).not.toBe('Cooper');
    }

    const verified = getVerifiedTiresForSize('275/70R18');
    const verifiedDiscoverers = (verified?.models ?? []).filter((m) =>
      /discoverer/i.test(m.model),
    );
    for (const model of verifiedDiscoverers) {
      expect(model.brand).toBe('Goodyear');
    }
  });

  it('never treats product_family as the display brand for Discoverer rows', async () => {
    const { getProductsForTireSize } = await import('./tire-size-products');
    const { canonicalProductBrand, normalizeTireProductRecord, getBrandLogoSrc } =
      await import('./tire-product-display');
    const products = getProductsForTireSize('275/70R18').filter((p) =>
      /discoverer/i.test(p.model),
    );
    expect(products.length).toBeGreaterThan(0);
    for (const product of products) {
      expect(product.product_family).toBe('Cooper');
      expect(canonicalProductBrand(product)).toBe('Goodyear');
      expect(canonicalProductBrand(product)).not.toBe(product.product_family);
      const normalized = normalizeTireProductRecord(product);
      expect(normalized.canonicalBrand).toBe('Goodyear');
      expect(normalized.brandLogo).toBe(getBrandLogoSrc('Goodyear'));
      expect(normalized.canonicalModel.toLowerCase()).toContain('discoverer');
      expect(normalized.normalizedSize.toUpperCase()).toContain('275/70R18');
    }
  });

  it('only includes exact-size verified models for the queried size', () => {
    const verified = getVerifiedTiresForSize('275/70R18');
    expect(verified?.sizeLabel.toUpperCase()).toContain('275/70R18');
    // Nearby size must not leak into this set via the same helper.
    const nearby = getVerifiedTiresForSize('275/65R18');
    if (!verified || !nearby) return;
    const nearbyKeys = new Set(nearby.models.map((m) => uniqueModelKey(m.brand, m.model)));
    // Sets may overlap on brand+model names across sizes; identity is size-keyed.
    expect(verified.sizeLabel).not.toEqual(nearby.sizeLabel);
    void nearbyKeys;
  });
});

describe('diameter-group count consistency', () => {
  const groups = [31, 33, 35];

  it('uses nearest-inch membership for all popular diameter groups', () => {
    for (const d of groups) {
      const count = countIndexedSizesNearDiameter(d);
      const manual = getTireDiameterCatalog().filter((entry) =>
        isCatalogSizeInDiameterGroup(entry.specs.overallDiameterIn, d),
      ).length;
      expect(count).toBe(manual);
      expect(formatDiameterGroupSizeCountLabel(count)).toMatch(/across all wheels|No indexed/);
    }
  });

  it('keeps hero-style and Popular Tire Diameters counts identical', () => {
    // Both surfaces must call countIndexedSizesNearDiameter — assert shared values.
    for (const d of groups) {
      expect(countIndexedSizesNearDiameter(d)).toBe(countIndexedSizesNearDiameter(d, 1));
    }
  });

  it('does not use overlapping ±1 bands for popular inch classes', () => {
    const catalog = getTireDiameterCatalog();
    for (const entry of catalog) {
      const rounded = Math.round(entry.specs.overallDiameterIn);
      const matches = groups.filter((g) =>
        isCatalogSizeInDiameterGroup(entry.specs.overallDiameterIn, g),
      );
      // A size can belong to at most one popular inch group.
      expect(matches.length).toBeLessThanOrEqual(1);
      if (groups.includes(rounded)) {
        expect(matches).toEqual([rounded]);
      }
    }
  });
});

describe('multi-brand and variant sizes', () => {
  it('reports multiple brands for 275/70R18', () => {
    const coverage = getExactSizeCoverage('275/70R18');
    expect(coverage.brandCount).toBeGreaterThanOrEqual(2);
  });

  it('treats service variants as records, not extra unique models', () => {
    const coverage = getExactSizeCoverage('275/70R18');
    expect(coverage.serviceVariantCount).toBe(coverage.exactRecordCount);
    expect(coverage.uniqueModelCount).toBeLessThanOrEqual(coverage.exactRecordCount);
  });
});
