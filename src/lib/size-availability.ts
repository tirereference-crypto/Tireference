/**
 * Client-safe size availability lookup.
 * Sourced from a slim index of master products (allowed brands only).
 * Does NOT import master_size_to_products.json.
 *
 * Exact-size rule: rows are keyed by normalized size slug. Nearby sizes never
 * appear under a different size key.
 */
import slimIndex from '../data/generated/size-availability-slim.json';
import { getExactSizeCoverage, uniqueModelKey } from './exact-size-coverage';
import { tireSizeSlug } from './tire-size-url';
import { normalizeTireSizeInput } from './tire-size-validation';

export type VerifiedTireCategory =
  | 'Touring'
  | 'Highway Terrain'
  | 'All-Terrain'
  | 'Mud-Terrain'
  | 'Winter'
  | 'Performance';

export interface VerifiedTireModel {
  brand: string;
  model: string;
  category: VerifiedTireCategory | null;
  loadRange: string | null;
  /** Representative service description (load index + speed rating, etc.). */
  service: string | null;
  /** Number of exact-size SKUs collapsed into this brand+model card. */
  variantCount: number;
  /** True when more than one service description exists for the same brand/model/size. */
  hasMultipleServiceDescriptions: boolean;
}

function groupVerifiedModels(models: VerifiedTireModel[]): VerifiedTireModel[] {
  const grouped = new Map<
    string,
    VerifiedTireModel & { loads: Set<string>; services: Set<string>; variants: number }
  >();

  for (const model of models) {
    const key = uniqueModelKey(model.brand, model.model);
    const existing = grouped.get(key);
    if (!existing) {
      grouped.set(key, {
        ...model,
        loads: new Set(model.loadRange ? [model.loadRange] : []),
        services: new Set(model.service ? [model.service] : []),
        variants: Math.max(1, model.variantCount || 1),
      });
      continue;
    }
    existing.variants += Math.max(1, model.variantCount || 1);
    if (model.loadRange) existing.loads.add(model.loadRange);
    if (model.service) existing.services.add(model.service);
    if (!existing.category && model.category) existing.category = model.category;
  }

  return [...grouped.values()].map(({ loads, services, variants, ...model }) => {
    const serviceList = [...services];
    return {
      ...model,
      loadRange: [...loads].sort().join('/') || null,
      service: serviceList[0] ?? null,
      variantCount: variants,
      hasMultipleServiceDescriptions: serviceList.length > 1 || variants > 1,
    };
  });
}

function modelCompleteness(model: VerifiedTireModel): number {
  let score = 0;
  // Complete product data first (exact-size records already required upstream).
  if (model.category) score += 3;
  if (model.loadRange) score += 2;
  if (model.service) score += 2;
  if (model.hasMultipleServiceDescriptions) score += 1;
  // Category presence correlates with displayable category tire imagery.
  if (model.category) score += 1;
  return score;
}

/** Prefer brand diversity, then category diversity, then complete product data. */
export function rankPopularModels(
  models: VerifiedTireModel[],
  limit = 6,
): VerifiedTireModel[] {
  if (models.length === 0) return [];
  const cap = Math.max(1, limit);

  const byBrand = new Map<string, VerifiedTireModel[]>();
  for (const model of models) {
    const key = model.brand.trim().toLowerCase();
    const list = byBrand.get(key) ?? [];
    list.push(model);
    byBrand.set(key, list);
  }

  for (const list of byBrand.values()) {
    list.sort((a, b) => modelCompleteness(b) - modelCompleteness(a));
  }

  const brandOrder = [...byBrand.keys()].sort((a, b) => {
    const aBest = byBrand.get(a)![0];
    const bBest = byBrand.get(b)![0];
    return modelCompleteness(bBest) - modelCompleteness(aBest);
  });

  const selected: VerifiedTireModel[] = [];
  const usedCategories = new Set<string>();
  const brandIndex = new Map<string, number>();

  // Pass 1 — one model per brand before repeating any brand
  for (const brand of brandOrder) {
    if (selected.length >= cap) break;
    const list = byBrand.get(brand)!;
    const pick =
      list.find((m) => m.category && !usedCategories.has(m.category)) ?? list[0];
    selected.push(pick);
    brandIndex.set(brand, 1);
    if (pick.category) usedCategories.add(pick.category);
  }

  // Pass 2 — fill remaining slots only after every brand has had a first card
  let progressed = true;
  while (selected.length < cap && progressed) {
    progressed = false;
    for (const brand of brandOrder) {
      if (selected.length >= cap) break;
      const list = byBrand.get(brand)!;
      const nextIdx = brandIndex.get(brand) ?? 0;
      if (nextIdx >= list.length) continue;
      const pick = list[nextIdx];
      selected.push(pick);
      brandIndex.set(brand, nextIdx + 1);
      if (pick.category) usedCategories.add(pick.category);
      progressed = true;
    }
  }

  return selected;
}

export interface SizeAvailability {
  brands: string[];
  categories: VerifiedTireCategory[];
  models: VerifiedTireModel[];
}

export interface VerifiedTiresForSize {
  /** Normalized display size used for the lookup. */
  sizeLabel: string;
  /** Exact-size models after brand+model dedupe (unranked). */
  models: VerifiedTireModel[];
  brands: string[];
  categories: VerifiedTireCategory[];
}

type SlimRow = {
  b?: string[];
  c?: string[];
  m?: Array<{
    brand: string;
    model: string;
    category: string | null;
    loadRange: string | null;
    service: string | null;
  }>;
};

const INDEX = slimIndex as Record<string, SlimRow>;

function lookupKey(size: string): string {
  const normalized = normalizeTireSizeInput(size);
  try {
    return tireSizeSlug(normalized);
  } catch {
    return tireSizeSlug(size);
  }
}

function displaySizeLabel(size: string): string {
  try {
    return normalizeTireSizeInput(size);
  } catch {
    return size.trim();
  }
}

export function getSizeAvailability(size: string): SizeAvailability | null {
  const row = INDEX[lookupKey(size)];
  if (!row) return null;
  const brands = row.b ?? [];
  const categories = (row.c ?? []) as VerifiedTireCategory[];
  const models = (row.m ?? []).map((m) => ({
    brand: m.brand,
    model: m.model,
    category: (m.category as VerifiedTireCategory | null) ?? null,
    loadRange: m.loadRange,
    service: m.service,
    variantCount: 1,
    hasMultipleServiceDescriptions: false,
  }));
  if (brands.length === 0 && categories.length === 0 && models.length === 0) {
    return null;
  }
  return { brands, categories, models };
}

/**
 * Exact-size verified tire models for hub Popular Tires and comparison New Tire
 * product sections. Nearby sizes are never included.
 */
export function getVerifiedTiresForSize(normalizedSize: string): VerifiedTiresForSize | null {
  const sizeLabel = displaySizeLabel(normalizedSize);
  const availability = getSizeAvailability(sizeLabel);
  if (!availability) return null;

  const models = groupVerifiedModels(
    availability.models.filter((m) => m.brand?.trim() && m.model?.trim()),
  );

  if (
    models.length === 0 &&
    availability.brands.length === 0 &&
    availability.categories.length === 0
  ) {
    return null;
  }

  return {
    sizeLabel,
    models,
    brands: availability.brands,
    categories: availability.categories,
  };
}

export type PopularAvailabilityLevel =
  | 'models'
  | 'brands'
  | 'categories'
  | 'none';

export interface PopularAvailabilityResult {
  level: PopularAvailabilityLevel;
  sizeLabel: string;
  models: VerifiedTireModel[];
  brands: string[];
  categories: VerifiedTireCategory[];
  /**
   * Full-master unique tire models for this exact size (brand|model dedupe).
   * Same value as getExactSizeCoverage(size).uniqueModelCount — not the
   * displayed sample length.
   */
  totalModelCount: number;
}

export interface ResolvePopularAvailabilityOptions {
  /** Prefer 4–6 cards when enough exact-size models exist. */
  limit?: number;
  /** Exclude this brand+model from the ranked list (featured separately). */
  excludeModel?: { brand: string; model: string } | null;
}

/** Exact-availability hierarchy for the Popular Tires section. */
export function resolvePopularAvailability(
  sizeLabel: string,
  options: ResolvePopularAvailabilityOptions = {},
): PopularAvailabilityResult {
  const limit = options.limit ?? 6;
  const coverage = getExactSizeCoverage(sizeLabel);
  const uniqueModelCount = coverage.uniqueModelCount;
  const verified = getVerifiedTiresForSize(sizeLabel);
  if (!verified) {
    return {
      level: 'none',
      sizeLabel,
      models: [],
      brands: [],
      categories: [],
      totalModelCount: uniqueModelCount,
    };
  }

  let models = verified.models;
  if (options.excludeModel?.brand && options.excludeModel?.model) {
    const brandKey = options.excludeModel.brand.trim().toLowerCase();
    const modelKey = options.excludeModel.model.trim().toLowerCase();
    models = models.filter(
      (m) =>
        !(
          m.brand.trim().toLowerCase() === brandKey &&
          m.model.trim().toLowerCase() === modelKey
        ),
    );
  }

  const ranked = rankPopularModels(models, limit);
  if (ranked.length > 0) {
    return {
      level: 'models',
      sizeLabel: verified.sizeLabel || sizeLabel,
      models: ranked,
      brands: verified.brands,
      categories: verified.categories,
      totalModelCount: uniqueModelCount,
    };
  }

  if (verified.brands.length > 0 || coverage.brandCount > 0) {
    return {
      level: 'brands',
      sizeLabel: verified.sizeLabel || sizeLabel,
      models: [],
      brands: verified.brands.length > 0 ? verified.brands : [],
      categories: verified.categories,
      totalModelCount: uniqueModelCount,
    };
  }

  if (verified.categories.length > 0) {
    return {
      level: 'categories',
      sizeLabel: verified.sizeLabel || sizeLabel,
      models: [],
      brands: [],
      categories: verified.categories,
      totalModelCount: uniqueModelCount,
    };
  }

  return {
    level: 'none',
    sizeLabel: verified.sizeLabel || sizeLabel,
    models: [],
    brands: [],
    categories: [],
    totalModelCount: uniqueModelCount,
  };
}

/** Find an exact-size verified model matching brand + model (case-insensitive). */
export function findVerifiedModelForSize(
  sizeLabel: string,
  brand: string,
  model: string,
): VerifiedTireModel | null {
  const verified = getVerifiedTiresForSize(sizeLabel);
  if (!verified) return null;
  const brandKey = brand.trim().toLowerCase();
  const modelKey = model.trim().toLowerCase();
  return (
    verified.models.find(
      (m) =>
        m.brand.trim().toLowerCase() === brandKey &&
        m.model.trim().toLowerCase() === modelKey,
    ) ?? null
  );
}
