import type { VerifiedTireCategory, VerifiedTireModel } from './size-availability';

/**
 * Brand logo paths under /public when available.
 * Wordmark fallback remains for brands without a logo asset.
 */
const BRAND_LOGO_SRC: Partial<Record<string, string>> = {
  Goodyear: '/images/brands/goodyear.svg',
  Michelin: '/images/brands/michelin.svg',
  BFGoodrich: '/images/brands/bfgoodrich.svg',
  'BF Goodrich': '/images/brands/bfgoodrich.svg',
  Toyo: '/images/brands/toyo.svg',
  Falken: '/images/brands/falken.svg',
};

const CATEGORY_TIRE_IMAGES: Record<VerifiedTireCategory, string> = {
  'All-Terrain': '/images/tires/tire-off-road.png',
  'Mud-Terrain': '/images/tires/tire-light-truck.png',
  'Highway Terrain': '/images/tires/tire-passenger.png',
  Touring: '/images/tires/tire-suv.png',
  Winter: '/images/tires/tire-suv.png',
  Performance: '/images/tires/tire-performance.png',
};

/** Extra tread photos used to avoid identical cards within a category row. */
const DIVERSE_TIRE_IMAGES = [
  '/images/tires/tire-off-road.png',
  '/images/tires/tire-light-truck.png',
  '/images/tires/tire-passenger.png',
  '/images/tires/tire-performance.png',
  '/images/tires/tire-suv.png',
  '/images/tires/tire-side-blue.png',
  '/images/tires/tire-side-orange.png',
] as const;

/** Neutral tread silhouette — not tied to a specific model name. */
export const NEUTRAL_TIRE_SILHOUETTE_SRC = '/images/tire-front.webp';

export type CategoryBadgeTone = 'at' | 'ht' | 'mt' | 'winter' | 'perf' | 'default';

export function getBrandLogoSrc(brand: string): string | null {
  const direct = BRAND_LOGO_SRC[brand];
  if (direct) return direct;
  const key = Object.keys(BRAND_LOGO_SRC).find(
    (k) => k.toLowerCase() === brand.trim().toLowerCase(),
  );
  return key ? (BRAND_LOGO_SRC[key] ?? null) : null;
}

/**
 * Canonical display brand for a product record.
 * Always use the `brand` field — never product_family, parent company,
 * distributor, image, or model-name parsing.
 */
export function canonicalProductBrand(product: {
  brand: string;
  product_family?: string;
}): string {
  return (product.brand || '').trim();
}

/** Single-record display identity — brand/logo/model/image from one source only. */
export interface NormalizedTireProductRecord {
  canonicalBrand: string;
  canonicalModel: string;
  normalizedSize: string;
  exactModelImage: string | null;
  brandLogo: string | null;
  serviceDescriptions: string[];
  category: string | null;
  sourceRecordId: string;
}

export type TireProductRecordInput = {
  brand: string;
  model: string;
  product_family?: string;
  tire_size?: string;
  display_size?: string;
  size_slug?: string;
  product_code?: string;
  service_description?: string;
  service?: string | null;
  product_category?: string;
  category?: VerifiedTireCategory | null;
  /** Exact model photo when the catalog provides one for this SKU. */
  exact_model_image?: string | null;
  image_url?: string | null;
};

/**
 * Normalize one catalog / verified product into a display record.
 * Never mixes brand, logo, or image from a different SKU or product_family.
 */
export function normalizeTireProductRecord(
  record: TireProductRecordInput,
  sizeFallback = '',
): NormalizedTireProductRecord {
  const canonicalBrand = canonicalProductBrand(record);
  const canonicalModel = (record.model || '').replace(/[®™]/g, '').trim();
  const normalizedSize = (
    record.display_size ||
    record.tire_size ||
    sizeFallback ||
    ''
  ).trim();
  const exactModelImage =
    record.exact_model_image?.trim() || record.image_url?.trim() || null;
  const service =
    record.service_description?.trim() || record.service?.trim() || '';
  const category =
    (record.category ?? null) ||
    (record.product_category?.trim() ? record.product_category.trim() : null);
  const sourceRecordId =
    record.product_code?.trim() ||
    `${canonicalBrand}|${canonicalModel}|${normalizedSize || record.size_slug || ''}`.toLowerCase();

  return {
    canonicalBrand,
    canonicalModel,
    normalizedSize,
    exactModelImage,
    brandLogo: getBrandLogoSrc(canonicalBrand),
    serviceDescriptions: service ? [service] : [],
    category,
    sourceRecordId,
  };
}

export function getCategoryTireImage(category: VerifiedTireCategory | null): string | null {
  if (!category) return null;
  return CATEGORY_TIRE_IMAGES[category] ?? null;
}

/**
 * Image fallback chain for one product identity.
 * Never borrows another model’s photo. Shared stock tread photos are only used
 * when an exact model image is missing — and only as a neutral silhouette last,
 * so cards do not look like branded product photography from the wrong SKU.
 *
 * Order: exact model image → optional tread for that SKU → neutral silhouette.
 * Category/diversity stock images are omitted unless `allowCategoryStock` is set
 * (legacy category-only rows with no brand/model).
 */
export function getProductImageCandidates(
  category: VerifiedTireCategory | null,
  exactImageSrc?: string | null,
  treadImageSrc?: string | null,
  brand?: string | null,
  model?: string | null,
  options?: { allowCategoryStock?: boolean },
): string[] {
  const candidates: string[] = [];
  if (exactImageSrc?.trim()) candidates.push(exactImageSrc.trim());
  if (treadImageSrc?.trim() && !candidates.includes(treadImageSrc.trim())) {
    candidates.push(treadImageSrc.trim());
  }

  const hasProductIdentity = Boolean(brand?.trim() && model?.trim());
  const allowCategoryStock = options?.allowCategoryStock === true || !hasProductIdentity;

  if (allowCategoryStock && !exactImageSrc?.trim()) {
    const categoryImage = getCategoryTireImage(category);
    if (categoryImage && !candidates.includes(categoryImage)) {
      candidates.push(categoryImage);
    }
    // Light diversification only for category-only rows (no brand+model card).
    if (!hasProductIdentity) {
      const seed = `${category ?? ''}`.toLowerCase();
      let hash = 0;
      for (let i = 0; i < seed.length; i += 1) {
        hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
      }
      const diversified = DIVERSE_TIRE_IMAGES[hash % DIVERSE_TIRE_IMAGES.length];
      if (diversified && !candidates.includes(diversified)) {
        candidates.push(diversified);
      }
    }
  }

  if (!candidates.includes(NEUTRAL_TIRE_SILHOUETTE_SRC)) {
    candidates.push(NEUTRAL_TIRE_SILHOUETTE_SRC);
  }
  return candidates;
}

export function getCategoryBadgeTone(
  category: VerifiedTireCategory | null,
): CategoryBadgeTone {
  switch (category) {
    case 'All-Terrain':
      return 'at';
    case 'Highway Terrain':
    case 'Touring':
      return 'ht';
    case 'Mud-Terrain':
      return 'mt';
    case 'Winter':
      return 'winter';
    case 'Performance':
      return 'perf';
    default:
      return 'default';
  }
}

export function formatLoadServiceSummary(
  loadRange: string | null,
  service: string | null,
): string | null {
  const parts = [
    loadRange ? `Load ${loadRange}` : null,
    service ? service.trim() : null,
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(' · ') : null;
}

/**
 * Parse a genuine service description into load index + speed rating when present.
 * Returns nulls when the string is not a recognized service pattern — never invents values.
 */
export function parseServiceLoadAndSpeed(service: string | null | undefined): {
  loadIndex: string | null;
  speedRating: string | null;
} {
  if (!service?.trim()) return { loadIndex: null, speedRating: null };
  const normalized = service.trim().toUpperCase().replace(/\s+/g, ' ');
  const match = normalized.match(/(?:XL\s+)?(\d{2,3}(?:\/\d{2,3})?)\s*([A-Z])/);
  if (!match) return { loadIndex: null, speedRating: null };
  return { loadIndex: match[1], speedRating: match[2] };
}

/** Exact size + service description line for product cards (omit empty fields). */
export function formatProductSizeServiceLine(
  sizeLabel: string,
  model: Pick<VerifiedTireModel, 'service' | 'loadRange'>,
): string | null {
  const parts: string[] = [];
  const size = sizeLabel.trim();
  if (size) parts.push(size);

  const service = model.service?.trim() || '';
  if (service) parts.push(service);

  const load = model.loadRange?.trim() || '';
  if (load) {
    const loadUpper = load.toUpperCase();
    const alreadyInService =
      Boolean(service) &&
      (service.toUpperCase().includes(loadUpper) ||
        (loadUpper === 'XL' && /\bXL\b/i.test(service)));
    if (!alreadyInService) {
      parts.push(
        /^(SL|XL|[C-F])$/i.test(load) ? `Load Range ${loadUpper}` : load,
      );
    }
  }

  if (parts.length === 0) return null;
  return parts.join(' · ');
}

export function isXlOrReinforced(
  model: Pick<VerifiedTireModel, 'loadRange' | 'service'>,
): boolean {
  const blob = `${model.loadRange ?? ''} ${model.service ?? ''}`.toUpperCase();
  return /\bXL\b/.test(blob) || /\bRF\b/.test(blob) || /REINFORCED/.test(blob);
}

export function isRunFlatModel(
  model: Pick<VerifiedTireModel, 'model' | 'service' | 'loadRange'>,
): boolean {
  const blob = `${model.model} ${model.service ?? ''} ${model.loadRange ?? ''}`.toUpperCase();
  return (
    /\bRFT\b/.test(blob) ||
    /\bZP\b/.test(blob) ||
    /\bSSR\b/.test(blob) ||
    /RUN[\s-]?FLAT/.test(blob)
  );
}

export function brandInitials(brand: string): string {
  const parts = brand.trim().split(/\s+/);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return brand.slice(0, 2).toUpperCase();
}

/** Map master-catalog product_category strings onto verified display categories. */
export function mapProductCategoryToVerified(
  raw: string | null | undefined,
): VerifiedTireCategory | null {
  const c = (raw ?? '').toLowerCase().replace(/[_-]+/g, ' ').trim();
  if (!c) return null;
  if (/\bmud\b/.test(c)) return 'Mud-Terrain';
  if (/\ball terrain\b/.test(c) || /\boff road\b/.test(c) || /\btrail\b/.test(c)) {
    return 'All-Terrain';
  }
  if (/\bhighway terrain\b/.test(c)) return 'Highway Terrain';
  if (/\bwinter\b/.test(c) || /\bstudd/.test(c)) return 'Winter';
  if (
    /\bperformance\b/.test(c) ||
    /\btrack\b/.test(c) ||
    /\bsummer\b/.test(c) ||
    /\bultra high\b/.test(c)
  ) {
    return 'Performance';
  }
  if (
    /\btouring\b/.test(c) ||
    /\bpassenger\b/.test(c) ||
    /\bhighway\b/.test(c) ||
    /\ball weather\b/.test(c) ||
    /\bcargo\b/.test(c) ||
    /\bcommercial\b/.test(c) ||
    /\btruck\b/.test(c) ||
    /\bsuv\b/.test(c)
  ) {
    return 'Touring';
  }
  return null;
}

/** Adapt a hub/master TireProduct row into the VerifiedProductCard model shape. */
export function tireProductToVerifiedModel(product: {
  brand: string;
  model: string;
  product_category?: string;
  load_range?: string;
  service_description?: string;
  speed_rating?: string;
}): VerifiedTireModel {
  const service =
    product.service_description?.trim() ||
    product.speed_rating?.trim() ||
    null;
  return {
    brand: product.brand,
    model: product.model,
    category: mapProductCategoryToVerified(product.product_category),
    loadRange: product.load_range?.trim() || null,
    service,
    variantCount: 1,
    hasMultipleServiceDescriptions: false,
  };
}
