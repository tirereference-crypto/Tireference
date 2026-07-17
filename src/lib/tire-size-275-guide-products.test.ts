import { describe, expect, it } from 'vitest';
import {
  buildGuide275Data,
  getGuideProductsForSize,
  selectTopGuideProducts,
} from './tire-size-275-guide';
import { getTireSpecs } from './tire-math';
import { isFullSpecs } from './tire-size-products';

const ALLOWED = new Set([
  'michelin',
  'goodyear',
  'bfgoodrich',
  'toyo',
  'falken',
]);

describe('275 Real Tires product strip', () => {
  it('uses only master-database allowed brands', () => {
    const products = getGuideProductsForSize('275/70R18', 'off-road');
    expect(products.length).toBeGreaterThan(0);
    for (const p of products) {
      expect(ALLOWED.has(p.brand.trim().toLowerCase())).toBe(true);
    }
  });

  it('selects at most 6 truck-relevant products', () => {
    const top = selectTopGuideProducts(getGuideProductsForSize('275/70R18', 'off-road'), 6, 'off-road');
    expect(top.length).toBeLessThanOrEqual(6);
    expect(top.length).toBeGreaterThan(0);
    expect(top.every(isFullSpecs) || top.some(isFullSpecs)).toBe(true);
    // Prefer AT / truck categories ahead of commercial van when available
    const firstCat = top[0].product_category.toLowerCase();
    expect(firstCat.includes('all_terrain') || firstCat.includes('truck')).toBe(true);
  });

  it('wires top products into guide data without duplicates of same brand+model', () => {
    const guide = buildGuide275Data(getTireSpecs('275/70R18'));
    expect(guide.products.length).toBeLessThanOrEqual(6);
    const keys = guide.products.map(
      (p) =>
        `${p.brand.toLowerCase()}|${p.model.toLowerCase().replace(/^bfgoodrich\s+/i, '')}`,
    );
    expect(new Set(keys).size).toBe(keys.length);
    for (const p of guide.products) {
      expect(ALLOWED.has(p.brand.trim().toLowerCase())).toBe(true);
    }
  });
});
