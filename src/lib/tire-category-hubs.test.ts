import { describe, expect, it } from 'vitest';
import { HOME_BROWSE_CATEGORIES } from './home-sections';
import {
  TIRE_CATEGORY_HUBS,
  TIRE_HUB_CATEGORY_SLUGS,
  buildTireCategoryHubData,
  getTireSizeHubCategories,
  productSupportsTireHubCategory,
  tireCategoryHubPath,
} from './tire-category-hubs';
import { getProductsForTireSize } from './tire-size-products';
import { TIRE_SIZES } from '../data/tire-sizes';

describe('tire category hubs', () => {
  it('defines substantial, indexable content for every public category', () => {
    for (const slug of TIRE_HUB_CATEGORY_SLUGS) {
      const hub = buildTireCategoryHubData(slug);
      expect(hub.path).toBe(`/tire-sizes/${slug}/`);
      expect(hub.h1).toMatch(/Tire Sizes$/);
      expect(hub.description.length).toBeGreaterThan(80);
      expect(hub.introduction.length).toBeGreaterThan(150);
      expect(hub.considerations.length).toBeGreaterThanOrEqual(4);
      expect(hub.sizes.length).toBeGreaterThan(0);
      expect(hub.comparisons.length).toBeGreaterThan(0);
      expect(hub.calculators.length).toBeGreaterThanOrEqual(3);
      expect(hub.guides.length).toBeGreaterThanOrEqual(3);
    }
  });

  it('uses explicit exact-product metadata for winter, EV, and touring membership', () => {
    for (const slug of ['winter', 'ev', 'touring'] as const) {
      const hub = buildTireCategoryHubData(slug);
      for (const row of hub.sizes) {
        const products = getProductsForTireSize(row.entry.size);
        expect(
          products.some((product) => productSupportsTireHubCategory(product, slug)),
          `${row.entry.size} has no ${slug} product signal`,
        ).toBe(true);
      }
    }
  });

  it('supports multiple categories when exact-size data supports them', () => {
    const entry = TIRE_SIZES.find((row) => row.size === '215/55R17');
    expect(entry).toBeTruthy();
    const memberships = getTireSizeHubCategories(entry!);
    expect(memberships).toContain('passenger');
    expect(memberships).toContain('ev');
    expect(memberships).toContain('winter');
    expect(memberships).toContain('touring');
  });

  it('only features products whose exact product-size row supports the hub', () => {
    for (const slug of TIRE_HUB_CATEGORY_SLUGS) {
      const hub = buildTireCategoryHubData(slug);
      for (const featured of hub.products) {
        const exactRows = getProductsForTireSize(featured.size);
        expect(
          exactRows.some(
            (product) =>
              product.brand.trim() === featured.brand &&
              product.model.replace(/[®™]/g, '').trim() === featured.model &&
              productSupportsTireHubCategory(product, slug),
          ),
        ).toBe(true);
      }
    }
  });

  it('points every homepage category card at its category hub', () => {
    expect(HOME_BROWSE_CATEGORIES).toHaveLength(TIRE_HUB_CATEGORY_SLUGS.length);
    for (const card of HOME_BROWSE_CATEGORIES) {
      expect(card.href).toBe(tireCategoryHubPath(card.slug));
      expect(card.href).not.toMatch(/^\/tire-size\//);
      expect(TIRE_CATEGORY_HUBS[card.slug]).toBeTruthy();
    }
  });
});
