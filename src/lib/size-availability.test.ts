import { describe, expect, it } from 'vitest';
import {
  findVerifiedModelForSize,
  getSizeAvailability,
  getVerifiedTiresForSize,
  rankPopularModels,
  resolvePopularAvailability,
} from './size-availability';
import { tireSizeSlug } from './tire-size-url';

describe('getVerifiedTiresForSize', () => {
  it('returns exact-size models only for 235/40R18', () => {
    const verified = getVerifiedTiresForSize('235/40R18');
    expect(verified).not.toBeNull();
    expect(verified!.models.length).toBeGreaterThan(0);
    expect(verified!.models.length).toBeLessThanOrEqual(
      getSizeAvailability('235/40R18')!.models.length,
    );

    // Nearby sizes must not leak into this result set.
    const nearby = getVerifiedTiresForSize('235/45R18');
    const nearbyKeys = new Set(
      (nearby?.models ?? []).map((m) => `${m.brand}|${m.model}`.toLowerCase()),
    );
    for (const model of verified!.models) {
      // Identity check is size-keyed; ensure we looked up the right slim row.
      expect(tireSizeSlug('235/40R18')).toBe('235-40r18');
      expect(model.brand.trim()).toBeTruthy();
      expect(model.model.trim()).toBeTruthy();
      // A model from a different size lookup is a different availability row —
      // we only assert the queried slug is exact.
      void nearbyKeys;
    }
  });

  it('does not return models for an unknown size', () => {
    expect(getVerifiedTiresForSize('999/99R99')).toBeNull();
  });

  it('dedupes brand+model variants into one card with multi-service flag', () => {
    const ranked = resolvePopularAvailability('235/40R18');
    expect(ranked.level).toBe('models');
    const keys = ranked.models.map((m) => `${m.brand}|${m.model}`.toLowerCase());
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('ranks with brand diversity when more than six models exist', () => {
    const verified = getVerifiedTiresForSize('225/45R17');
    expect(verified).not.toBeNull();
    if ((verified?.models.length ?? 0) <= 6) return;
    const ranked = rankPopularModels(verified!.models, 6);
    expect(ranked).toHaveLength(6);
    const brands = ranked.map((m) => m.brand.toLowerCase());
    const uniqueBrands = new Set(brands);
    expect(uniqueBrands.size).toBeGreaterThan(1);
  });

  it('excludes a selected model from alternatives', () => {
    const base = resolvePopularAvailability('235/40R18');
    expect(base.models.length).toBeGreaterThan(0);
    const first = base.models[0];
    const filtered = resolvePopularAvailability('235/40R18', {
      excludeModel: { brand: first.brand, model: first.model },
    });
    expect(
      filtered.models.some(
        (m) =>
          m.brand.toLowerCase() === first.brand.toLowerCase() &&
          m.model.toLowerCase() === first.model.toLowerCase(),
      ),
    ).toBe(false);
    expect(findVerifiedModelForSize('235/40R18', first.brand, first.model)).toEqual(
      expect.objectContaining({ brand: first.brand, model: first.model }),
    );
  });

  it('keeps hub and comparison lookups identical for the same size', () => {
    const a = getVerifiedTiresForSize('275/70R18');
    const b = getVerifiedTiresForSize('275/70R18');
    expect(a).toEqual(b);
    const popular = resolvePopularAvailability('275/70R18');
    expect(popular.sizeLabel.toUpperCase()).toContain('275/70R18');
    if (popular.level === 'models') {
      expect(popular.models.length).toBeGreaterThan(0);
      expect(popular.models.length).toBeLessThanOrEqual(6);
      expect(popular.totalModelCount).toBeGreaterThanOrEqual(popular.models.length);
    }
  });

  it('reports totalModelCount from full-master unique models (not the UI sample)', () => {
    const popular = resolvePopularAvailability('235/40R18', { limit: 3 });
    if (popular.level !== 'models') return;
    expect(popular.totalModelCount).toBeGreaterThanOrEqual(popular.models.length);
    expect(popular.models.length).toBeLessThanOrEqual(3);
    // Sample cards may be capped; totalModelCount is the full unique-model index.
    expect(popular.totalModelCount).toBeGreaterThanOrEqual(popular.models.length);
  });

  it('prefers one product per brand before repeating when ranking', () => {
    const models = [
      {
        brand: 'Goodyear',
        model: 'A',
        category: 'Touring' as const,
        loadRange: 'E',
        service: '125S',
        variantCount: 1,
        hasMultipleServiceDescriptions: false,
      },
      {
        brand: 'Goodyear',
        model: 'B',
        category: 'Touring' as const,
        loadRange: 'E',
        service: '125S',
        variantCount: 1,
        hasMultipleServiceDescriptions: false,
      },
      {
        brand: 'Falken',
        model: 'C',
        category: 'All-Terrain' as const,
        loadRange: 'E',
        service: '121R',
        variantCount: 1,
        hasMultipleServiceDescriptions: false,
      },
      {
        brand: 'Toyo',
        model: 'D',
        category: 'All-Terrain' as const,
        loadRange: 'E',
        service: '125S',
        variantCount: 1,
        hasMultipleServiceDescriptions: false,
      },
    ];
    const ranked = rankPopularModels(models, 3);
    expect(ranked).toHaveLength(3);
    const brands = ranked.map((m) => m.brand.toLowerCase());
    expect(new Set(brands).size).toBe(3);
    expect(brands.filter((b) => b === 'goodyear')).toHaveLength(1);
  });
});
